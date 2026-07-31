from app.models.schedule import TopicSchedule
from google.cloud import storage
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import shutil
import re
from fastapi.responses import JSONResponse
import uuid
import json
from app.utils.matcher import generate
from fastapi import APIRouter, HTTPException,status,Query
from app.database.db_connection import mongodb
from app.models.teacher_model import TeacherProfile  
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional,List
from bson import ObjectId  
from app.utils.chapter_extract import extract_and_upload_chapters

import os

router = APIRouter()

# --------------------------------------------------------------------------------------------
# This route is used to create a teacher profile
class CreateTeacherRequest(BaseModel):
    teacher_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = None
    qualifications: Optional[str] = None
    experience_years: Optional[int] = None
    preferred_language: Optional[str] = None


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_teacher(payload: CreateTeacherRequest):
    try:
        teacher_data = {
            "teacher_id": payload.teacher_id,
            "name": payload.name,
            "email": payload.email,
            "phone": payload.phone,
            "gender": payload.gender,
            "qualifications": payload.qualifications,
            "experience_years": payload.experience_years,
            "preferred_language": payload.preferred_language,
            "assigned_classes": [],        
            "class_record_ids": []          
        }

        result = await mongodb.teacher_collection.insert_one(teacher_data)

        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create teacher")

        teacher_data["_id"] = result.inserted_id
        return {
            "message": "Teacher profile created successfully",
            "data": TeacherProfile(**teacher_data)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------------------------------------

# -----------------------------------------------------------------------------------------
# This route is used by frontend to get list of common topics
class ChapterMapOut(BaseModel):
    standard: int
    chapter_number: int

class TopicOut(BaseModel):
    topic_name: str
    chapter_name: str
    chapter_mappings: List[ChapterMapOut]
    classes: List[int]


@router.get("/match_chapters/")
async def match_chapters(
    standard1: str = Query(..., description="First standard/class (e.g. '5')"),
    standard2: str = Query(..., description="Second standard/class (e.g. '6')"),
    subject: str = Query(..., description="Subject name (e.g. 'Mathematics')")
):
    try:
        raw_output = generate(standard1, standard2, subject)

        
        # match = re.search(r"\[\s*{.*?}\s*]", raw_output, re.DOTALL)
        # if not match:
        #     raise HTTPException(status_code=500, detail="Gemini did not return valid JSON.")

        # cleaned_json = match.group(0)

        try:
            parsed = json.loads(raw_output)
            print("JSON TYPE :::::"+str(type(parsed))+"Data is "+str(parsed))
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"JSON parsing error: {str(e)}")

        return JSONResponse(content=parsed[:15])  # limit to 15 entries if needed

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    

# -----------------------------------------------------------------------------------------

# -----------------------------------------------------------------------------------------
# This route is used by teacher to schedule a lecture based on common topics sent earlier

class LectureInput(BaseModel):
    teacher_id: str
    topic_name: str
    chapter_name: str
    chapter_mappings: List[dict]  
    classes: List[str]            
    expected_completion_date: datetime
    std: int                     
    subject: str                  
    class_name: str   


@router.post("/schedule_lecture/")
async def schedule_lecture_only(data: LectureInput):
    try:
        
        lecture_data = TopicSchedule(
            teacher_id=data.teacher_id,
            topic_name=data.topic_name,
            chapter_name=data.chapter_name,
            chapter_mappings=data.chapter_mappings,
            classes=data.classes,
            expected_completion_date=data.expected_completion_date,
            ppt_link=None,
            is_completed=False
        )

        
        result = await mongodb.topic_schedule_collection.insert_one(lecture_data.model_dump(by_alias=True))
        lecture_data.id = result.inserted_id

        return {
            "message": "Lecture scheduled in database successfully",
            "lecture": lecture_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule lecture: {str(e)}")

    
# ---------------------------------------------------------------------------------------------

# -----------------------------------------------------------------------------------------
# This route is used by teacher to upload the pdf to the rag
# It is working and tested 

    
@router.post("/upload_chapter_pdf/")
async def upload_chapter_pdf(
    file: UploadFile = File(...),
    subject_name: str = Form(...),
    std: str = Form(...)
):
    
    file_ext = file.filename.split('.')[-1]
    temp_filename = f"temp_{uuid.uuid4()}.{file_ext}"
    file_path = f"/tmp/{temp_filename}"

    try:
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        
        result = extract_and_upload_chapters(file_path, subject_name, std)

        
        return {
            "message": "Chapters extracted and uploaded successfully",
            "result": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        
        if os.path.exists(file_path):
            os.remove(file_path)


# --------------------------------------------------------------------------------------------------------------------------------------------
