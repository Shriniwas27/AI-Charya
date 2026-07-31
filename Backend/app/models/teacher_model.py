from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from pydantic_core import core_schema
from pydantic.json_schema import JsonSchemaValue
from typing_extensions import Annotated


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema: JsonSchemaValue, handler) -> JsonSchemaValue:
        return {"type": "string"}


class AssignedClass(BaseModel):
    class_name: str
    subject: str
    section: Optional[str] = None


class TeacherProfile(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    teacher_id: str
    name: str
    email: EmailStr
    phone: Optional[str]
    gender: Optional[str]
    qualifications: Optional[str]
    experience_years: Optional[int]
    assigned_classes: List[AssignedClass] = []
    class_record_ids: Optional[List[PyObjectId]] = []
    preferred_language: Optional[str]

    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "populate_by_name": True,
    }




# structure:- {
#   "teacher_id": "T12345",
#   "name": "Shraddha Sharma",
#   "email": "shraddha.sharma@example.com",
#   "phone": "9876543210",
#   "gender": "Female",
#   "qualifications": "M.Sc, B.Ed",
#   "experience_years": 8,
#   "assigned_classes": [
#     {
#       "class_name": "10th Grade",
#       "subject": "Mathematics",
#       "section": "A"
#     },
#     {
#       "class_name": "9th Grade",
#       "subject": "Science"
#     }
#   ],
#   "class_record_ids": [
#     "64e4faadf79c6baf7e19bdf5",
#     "64e4fb9ef79c6baf7e19bdff"
#   ],
#   "preferred_language": "English"
# }
