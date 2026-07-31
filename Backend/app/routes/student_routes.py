from fastapi import APIRouter, UploadFile, File, Form, HTTPException,UploadFile,Request,HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Any, Dict, Optional, List
from datetime import datetime
from pydantic import BaseModel
import tempfile
import os
import shutil
from app.utils.gcs_uploader import upload_to_gcs
from ..facerecognition.register_student import register_student 
from ..facerecognition.recognize_student import recognize_student_from_image
from app.models.student_model import StudentProfile
from app.database.db_connection import mongodb
import json
from datetime import datetime
import os, json, shutil
from google import genai
from google.genai import types


router = APIRouter()


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------------------------------------------------------------------------------------
# This route is used to register a student with profile photo and other details 
# The Profile photo is uploaded to GCS and the student details are stored in MongoDB

class Address(BaseModel): 
    street: str
    city: str
    state: str
    zip: str

class ParentDetails(BaseModel):
    name: str
    occupation: str
    phone: str

class EmergencyContact(BaseModel):
    name: str
    relation: str
    phone: str

class HealthDetails(BaseModel):
    allergies: Optional[List[str]] = None
    medicalNotes: Optional[List[str]] = None

class StudentInput(BaseModel):
    roll_no: str
    name: str
    dob: str
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    student_class: str
    aadhar_number: Optional[str] = None
    blood_group: Optional[str] = None
    preferred_language: Optional[str] = None
    contact_number: Optional[str] = None
    motherDetails: Optional[ParentDetails] = None
    fatherDetails: Optional[ParentDetails] = None
    hobbies: Optional[List[str]] = None
    healthInfo: Optional[HealthDetails] = None
    academic_achievements: Optional[str] = None
    emergency_contact: Optional[EmergencyContact] = None
    mother_tongue: Optional[str] = None

    

@router.post("/register_student/")
async def register_student_route(
    request: Request,
    profilePhoto: UploadFile = File(...)
):
    try:
        form = await request.form()
        form_dict = dict(form)

        for key in ["motherDetails", "fatherDetails", "healthInfo", "emergency_contact", "hobbies"]:
            if key in form_dict and form_dict[key]:
                try:
                    form_dict[key] = json.loads(form_dict[key])
                except json.JSONDecodeError:
                    raise HTTPException(status_code=400, detail=f"Invalid JSON for field '{key}'")

        student_data = StudentInput(**form_dict)

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{student_data.roll_no}_{timestamp}_{profilePhoto.filename}"
        file_location = os.path.join(UPLOAD_FOLDER, filename)

        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(profilePhoto.file, buffer)

        # Register face and get back facial data or do GCS upload
        register_student(file_location, student_data.roll_no)

        # Static academic data
        academic_data = {
            "subjects": [
                {
                    "name": "marathi",
                    "chapters": [
                        {"chapter_number": 1, "name": "Numbers", "homework_score": 85, "test_score": 90, "chapter_exercise_score": 88},
                        {"chapter_number": 2, "name": "Addition", "homework_score": 80, "test_score": 87, "chapter_exercise_score": 82}
                    ]
                },
                {
                    "name": "Science",
                    "chapters": [
                        {"chapter_number": 1, "name": "Plants", "homework_score": 78, "test_score": 85, "chapter_exercise_score": 80},
                        {"chapter_number": 2, "name": "Animals", "homework_score": 82, "test_score": 88, "chapter_exercise_score": 84}
                    ]
                }
            ]
        }

        student_doc = StudentProfile(
            **student_data.dict(),
            academic=academic_data
            # profilePhoto=gcs_url
        )

        result = await mongodb.student_collection.insert_one(student_doc.model_dump(by_alias=True))

        return JSONResponse(
            content={
                "message": f"Student {student_data.roll_no} registered successfully.",
                # "image_url": gcs_url,
                "student_id": str(result.inserted_id)
            },
            status_code=200
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

    finally:
        if os.path.exists(file_location):
            os.remove(file_location)

# -------------------------------------------------------------------------------------------

# --------------------------------------------------------------------------------------------
# This route is used to recognize a student from an image during homework checker
@router.post("/recognize_student/")
async def recognize_route(image: UploadFile = File(...)):
    if image.content_type not in ["image/jpeg", "image/png","image/jpg"]:
        raise HTTPException(status_code=400, detail="Invalid image format. Use JPEG or PNG.")
    print(image)
    tmp_path = None 
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            contents = await image.read()
            tmp.write(contents)
            tmp_path = tmp.name

        results = recognize_student_from_image(tmp_path)
        print(results)
        
        if not results:
            raise HTTPException(status_code=404, detail="Could not recognize any student from the image.")

    
        recognized_roll_no = results[0] 
        print(recognized_roll_no)
        student = await mongodb.student_collection.find_one({"roll_no": recognized_roll_no})
        if not student:
            raise HTTPException(status_code=404, detail=f"Student with roll number {recognized_roll_no} not found in database.")

        return JSONResponse(
            content={
                "roll_no": recognized_roll_no,
                "name": student.get("name", "Unknown")
            },
            status_code=200
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# -----------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------
# This route is used to get all students in the database

@router.get("/students/", response_model=List[StudentProfile])
async def get_all_students():
    try:
        students_cursor = mongodb.student_collection.find()
        students = [StudentProfile(**student) async for student in students_cursor]
        return students
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------------------------------------------------------------------------
# ---------------------------------------------------------------------------------------------
# This code is used to fetch all chapters present in database. It uses record_model
@router.get("/fetch_chapters/")
async def fetch_chapters_by_class_and_subject(
    class_name: str = Query(..., description="Class name/standard like '6'"),
    subject: str = Query(..., description="Subject name like 'Mathematics'")
):
    class_doc = await mongodb.class_record_collection.find_one({"class_name": class_name})

    if not class_doc:
        raise HTTPException(status_code=404, detail=f"Class '{class_name}' not found.")

    for subj in class_doc.get("subjects", []):
        if subj.get("subject_name") == subject:
            chapters = []
            for chapter in subj.get("chapters", []):
                chapters.append({
                    "number": chapter.get("number"),
                    "name": chapter.get("name"),
                    "ppt_link": chapter.get("ppt_link"),
                    "guideline": chapter.get("guideline"),
                    "homework": chapter.get("completion_status", {}).get("homework", [])
                })
            return JSONResponse(content=chapters)

    raise HTTPException(status_code=404, detail=f"Subject '{subject}' not found in class '{class_name}'.")
# ---------------------------------------------------------------------------------------------------------------------------------------------

# -------------------------------------------------------------------------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str


@router.post("/general_chatbot/")
async def general_chatbot(
    request: Request,
):
    content_type = request.headers.get("content-type", "")
    user_query = ""

    if "application/json" in content_type:
        try:
            body = await request.json()
            user_query = body.get("message", "")
            if not user_query:
                raise HTTPException(status_code=422, detail="Message is required")
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid JSON format")

    elif content_type.startswith("multipart/form-data"):
        form = await request.form()
        message = form.get("message")
        audio: Optional[UploadFile] = form.get("audio")
        if audio:
            user_query = "Audio message received - processing not implemented yet"
        elif message:
            user_query = message
        else:
            raise HTTPException(status_code=422, detail="No message or audio provided")

    else:
        raise HTTPException(status_code=422, detail="Unsupported content type")

    if not user_query or not isinstance(user_query, str):
        raise HTTPException(status_code=422, detail="Valid message is required")

    try:
        client = genai.Client(
            api_key="", 
        )

        model = "gemini-2.5-pro"
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_query)],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=-1),
        )

        final_response = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            final_response += chunk.text or ""

        if not final_response:
            final_response = "I'm sorry, I couldn't generate a response. Please try again."

        return JSONResponse(content={"reply": final_response})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

  