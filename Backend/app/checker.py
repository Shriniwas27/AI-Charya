# checker.py

from fastapi import HTTPException
import asyncio
import base64
import pyaudio
from google import genai
from google.genai import types
from app.database.db_connection import mongodb
import os

FORMAT = pyaudio.paInt16
CHANNELS = 1
SEND_SAMPLE_RATE = 16000
RECEIVE_SAMPLE_RATE = 24000
CHUNK_SIZE = 1024
MODEL = "models/gemini-2.0-flash-live-001"


client = genai.Client(
    http_options={"api_version": "v1beta"},
    api_key=os.getenv("GEMINI_API_KEY"),
)

async def update_chapter_exercise_score(
    roll_no: str,
    standard: str,
    subject_name: str,
    chapter_number: int,
    new_score: int
):
    student = await mongodb.student_collection.find_one({
        "roll_no": roll_no,
        "student_class": standard
    })

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    academic = student.get("academic")
    if not academic:
        raise HTTPException(status_code=404, detail="Academic data not found")

    subjects = academic.get("subjects", [])
    subject_index = next((i for i, subj in enumerate(subjects) if subj["name"] == subject_name), None)
    if subject_index is None:
        raise HTTPException(status_code=404, detail="Subject not found")

    chapters = subjects[subject_index].get("chapters", [])
    chapter_index = next((i for i, chap in enumerate(chapters) if chap.get("chapter_number") == chapter_number), None)
    if chapter_index is None:
        raise HTTPException(status_code=404, detail="Chapter not found")

    field_path = f"academic.subjects.{subject_index}.chapters.{chapter_index}.chapter_exercise_score"

    result = await mongodb.student_collection.update_one(
        {"roll_no": roll_no, "student_class": standard},
        {"$set": {field_path: new_score}}
    )

    return {
        "message": "Updated" if result.modified_count else "No update made"
    }



async def handle_function_call(function_call):
    if function_call.name == "scoreupdater":
        args = function_call.args

        roll_no = str(args.get('rollnumber'))
        grade = str(args.get('grade'))
        subject = str(args.get('subject'))
        chapter_number = args.get('chapternumber')  # Use correct param
        score = args.get('score')

        result = await update_chapter_exercise_score(roll_no, grade, subject, chapter_number, score)
        return {"success": True, "message": result}
    return {"success": False, "message": "Unknown function call"}


# add tools for function calling for llm 
tools = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="scoreupdater",
                description="Updates the score of a student for a specific chapter",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["grade", "subject", "chapternumber", "rollnumber", "score"],
                    properties={
                        "grade": types.Schema(type=types.Type.INTEGER),
                        "subject": types.Schema(type=types.Type.STRING),
                        "chapternumber": types.Schema(type=types.Type.INTEGER),
                        "chaptername": types.Schema(type=types.Type.STRING),  # optional
                        "rollnumber": types.Schema(type=types.Type.INTEGER),
                        "score": types.Schema(type=types.Type.INTEGER),
                    },
                ),
            )
        ]
    )
]


class AudioLoop:
    def __init__(self):
        self.media_in_queue = asyncio.Queue(maxsize=10)
        self.browser_out_queue = asyncio.Queue()
        self.session = None
        self.session_task = None

    async def send_to_gemini(self):
        while True:
            msg = await self.media_in_queue.get()
            if self.session:
                await self.session.send(input=msg)

    async def receive_from_gemini(self):
        while True:
            if not self.session:
                await asyncio.sleep(0.1)
                continue

            try:
                async for response in self.session.receive():
                    if data := response.data:
                        encoded_data = base64.b64encode(data).decode('utf-8')
                        await self.browser_out_queue.put({"type": "audio", "data": encoded_data})

                    if text := response.text:
                        print("Response from AI: " + text)
                        await self.browser_out_queue.put({"type": "text", "data": text})

                    if function_call := response.tool_call:
                        fc = function_call.function_calls[0]
                        print(f"Function Call Received: {fc.name} - {fc.args}")

                        result = await handle_function_call(fc)
                        print("Function result: " + str(result))

                        function_response = types.FunctionResponse(
                            name=fc.name,
                            response={"result": result},
                            id=fc.id,
                        )
                        await self.session.send_tool_response(function_response)


            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in receive_from_gemini: {e}")
                break

    async def run_session(self, config: types.LiveConnectConfig):
        try:
            async with client.aio.live.connect(model=MODEL, config=config) as session:
                self.session = session
                async with asyncio.TaskGroup() as tg:
                    tg.create_task(self.send_to_gemini())
                    tg.create_task(self.receive_from_gemini())
        except Exception as e:
            print(f"Session ended with error: {e}")
        finally:
            self.session = None

    def start(self, config: types.LiveConnectConfig):
        if not self.session_task or self.session_task.done():
            self.session_task = asyncio.create_task(self.run_session(config))

    def stop(self):
        if self.session_task and not self.session_task.done():
            self.session_task.cancel()
