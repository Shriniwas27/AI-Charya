from fastapi import APIRouter, HTTPException, status
from app.database.db_connection import mongodb
from app.models.record_model import ClassAcademicRecord  
from bson import ObjectId

router = APIRouter()

# -----------------------------------------------------------------------------------------
# This route is used to create an empty classroom
@router.post("/create_empty_classroom/", status_code=status.HTTP_201_CREATED)
async def create_empty_classroom(class_name: str):
    try:
        classroom_data = {
            "class_name": class_name,
            "student_count": 0,
            "boys": 0,
            "girls": 0,
            "roll_numbers": [],
            "subjects": [],
            "teacher_ids": []
        }

        result = await mongodb.class_record_collection.insert_one(classroom_data)

        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create classroom")

        classroom_data["_id"] = result.inserted_id
        return {
            "message": "Empty classroom created successfully",
            "data": ClassAcademicRecord(**classroom_data)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------------------------------------------

# ---------------------------------------------------------------------------------------
# This route is used to assign a class teacher to a classroom i.e add classteacher id to the class record

@router.put("/assign_class_teacher/", status_code=status.HTTP_200_OK)
async def assign_class_teacher(class_id: str, teacher_id: str):
    try:
        
        if not ObjectId.is_valid(class_id) or not ObjectId.is_valid(teacher_id):
            raise HTTPException(status_code=400, detail="Invalid class_id or teacher_id")

        class_oid = ObjectId(class_id)
        teacher_oid = ObjectId(teacher_id)

        class_record = await mongodb.class_record_collection.find_one({"_id": class_oid})
        if not class_record:
            raise HTTPException(status_code=404, detail="Class record not found")

        teacher_record = await mongodb.teacher_collection.find_one({"_id": teacher_oid})
        if not teacher_record:
            raise HTTPException(status_code=404, detail="Teacher not found")

        update_result = await mongodb.class_record_collection.update_one(
            {"_id": class_oid},
            {"$set": {"class_teacher_id": teacher_oid}}
        )

        if update_result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to assign class teacher")

        updated_record = await mongodb.class_record_collection.find_one({"_id": class_oid})

        return {
            "message": "Class teacher assigned successfully",
            "data": ClassAcademicRecord(**updated_record)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# --------------------------------------------------------------------------------------------------------------------------