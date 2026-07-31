from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.checker import AudioLoop, tools, types 
import base64
import asyncio
import uvicorn
from fastapi import FastAPI
import uvicorn
import io
from app.database.db_connection import connect_to_mongo, close_mongo_connection
from app.routes.student_routes import router as student_routes
from app.routes.record_routes import router as class_routes 
from app.routes.teacher_routes import router as teacher_routes
from app.routes.lecture_route import router as lecture_routes
from fastapi.middleware.cors import CORSMiddleware
from app.services.homework_giver import fetch_homework_by_class_subject_chapter

app = FastAPI(
    title="School Management API",
    description="API for managing student records, teacher profiles and academic records",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],  
    allow_headers=["*"],  
)

app.include_router(student_routes)
app.include_router(class_routes) 
app.include_router(teacher_routes)
app.include_router(lecture_routes)

# ------------------------------------------------------------------------------------------------------------------------------------------------
@app.websocket("/ws/{roll_number}/{student_name}/{grade}/{subject}/{chapter}")
async def websocket_endpoint(
    websocket: WebSocket, 
    roll_number: int, 
    student_name: str, 
    grade: str, 
    subject: str, 
    chapter: str
):
    """
    Handles a WebSocket connection, creating an isolated AI session 
    for each client with a personalized prompt.
    """
    await websocket.accept()
    
    audio_loop = AudioLoop()

    print("WebSocket client connected with details from URL path:")
    print(f"  - Roll Number: {roll_number}")
    print(f"  - Student Name: {student_name}")
    print(f"  - Grade: {grade}")
    print(f"  - Subject: {subject}")
    print(f"  - Chapter: {chapter}")
    
    homeworkanswers =await fetch_homework_by_class_subject_chapter(grade,subject,chapter)
    print(homeworkanswers)

    base_prompt = (
        "You are a helpful assistant teacher named EHR. You only check homework "
        "always reply to user query never be silent"
        "for the particular student, and if something is wrong, "
        "give them a suggestion or correct them. You do not waste time and speak you speak so few "
        "to the point. After the homework is completed, you update the score "
        "automatically using the provided tool. Talk in whatever language the user "
        "speaks. When you have all the details, correct them if needed and update "
        "Verify the homework according to qna given below. even if outside tell its correct."
        "tell the score and give suggestion.when checking say 1st question correct and 2question is quite incomplete"
    )
    student_details = (
        f"Student Details: Rollnumber: {roll_number}, Student Name: {student_name}, "
        f"Class: {grade}, Subject: {subject}, Chapter: {chapter}"
        
    )
    final_prompt = f"{base_prompt} {student_details}"

    
    session_config = types.LiveConnectConfig(
        temperature=0.1,
        response_modalities=["AUDIO"],
        media_resolution="MEDIA_RESOLUTION_MEDIUM",
        speech_config=types.SpeechConfig(
            language_code="mr-IN",
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Zephyr")
            )
        ),
        context_window_compression=types.ContextWindowCompressionConfig(
            trigger_tokens=25600,
            sliding_window=types.SlidingWindow(target_tokens=12800),
        ),
        tools=tools,
        system_instruction=types.Content(
            parts=[types.Part.from_text(text=final_prompt)],
            role="user"
        ),
    )
    
    
    audio_loop.start(config=session_config)
    
    async def receive_from_client():
        """Handle incoming messages from the WebSocket client."""
        try:
            while True:
                data = await websocket.receive_json()
                media_type = data.get("type")
                
                if media_type == "audio":
                    audio_data = base64.b64decode(data['data'])
                    await audio_loop.media_in_queue.put({"data": audio_data, "mime_type": "audio/pcm"})
                elif media_type == "video":
                    image_data = data['data'] 
                    await audio_loop.media_in_queue.put({"mime_type": "image/jpeg", "data": base64.b64decode(image_data)})
        except WebSocketDisconnect:
            print("Client disconnected (receive task).")

    async def send_to_client():
        """Handle sending messages from the AI to the WebSocket client."""
        try:
            while True:
                message = await audio_loop.browser_out_queue.get()
                await websocket.send_json(message)
        except WebSocketDisconnect:
            print("Client disconnected (send task).")

    
    receive_task = asyncio.create_task(receive_from_client())
    send_task = asyncio.create_task(send_to_client())

    
    done, pending = await asyncio.wait(
        [receive_task, send_task],
        return_when=asyncio.FIRST_COMPLETED,
    )

    
    for task in pending:
        task.cancel()
    audio_loop.stop()
    print(f"WebSocket connection for roll number {roll_number} closed and session stopped.")


# -----------------------------------------------------------------------------------------------------------------------------------------------
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

def main():
    print("Starting School Management API...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()

