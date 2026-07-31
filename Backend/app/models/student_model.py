from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from pydantic_core.core_schema import ValidationInfo
from pydantic import GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info: ValidationInfo = None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema: JsonSchemaValue, handler: GetJsonSchemaHandler) -> JsonSchemaValue:
        return {"type": "string"}


class ChapterProgress(BaseModel):
    chapter_number: Optional[int]=None
    name: str
    homework_score: int = Field(..., ge=0, le=100)
    test_score: int = Field(..., ge=0, le=100)
    chapter_exercise_score: int = Field(..., ge=0, le=100)
    remarks: Optional[str] = None


class SubjectProgress(BaseModel):
    name: str
    chapters: List[ChapterProgress]


class AcademicProfile(BaseModel):
    subjects: List[SubjectProgress]


class ParentDetails(BaseModel):
    name: str
    occupation: str
    phone: str


class HealthDetails(BaseModel):
    allergies: Optional[List[str]] = None
    medicalNotes: Optional[List[str]] = None


class EmergencyContact(BaseModel):
    name: str
    relation: str
    phone: str


class StudentProfile(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    roll_no: str
    name: str
    dob: str
    age: Optional[int] = None
    address: Optional[str] = None
    gender: Optional[str] = None
    aadhar_number: Optional[str] = None
    student_class: str
    class_record_id: Optional[PyObjectId] = None
    blood_group: Optional[str] = None
    preferred_language: Optional[str] = None
    contact_number: Optional[str] = None
    motherDetails: Optional[ParentDetails] = None
    fatherDetails: Optional[ParentDetails] = None
    hobbies: Optional[List[str]] = None
    academic_achievements: Optional[str] = None
    academic: Optional[AcademicProfile] = None
    healthInfo: Optional[HealthDetails] = None
    emergency_contact: Optional[EmergencyContact] = None
    mother_tongue: Optional[str] = None

    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }



# structure:- {
#   "student_id": "S1234",
#   "name": "Ashwin Patil",
#   "dob": "2008-06-15",
#   "gender": "Male",
#   "aadhar_number": "123456789012",
#   "student_class": "8",
#   "class_record_id": "60e6c4aaf19a4f3d9b5d9b7e",
#   "blood_group": "B+",
#   "preferred_language": "English",
#   "contact_number": "9876543210",
#   "parent_contact_number": "9876543211",
#   "hobbies": ["Reading", "Chess", "Drawing"],
#   "academic_achievements": "Topper in 7th grade",
#   "family_occupation": "Engineer",
#   "academic": {
#     "subjects": [
#       {
#         "name": "Mathematics",
#         "chapters": [
#           {
#             chapter_no: 1,
#             "name": "Algebra",
#             "homework_score": 85,
#             "test_score": 90,
#             "chapter_exercise_score": 80,
#             "remarks": "Good understanding"
#           },
#           {
#             "name": "Geometry",
#             "homework_score": 75,
#             "test_score": 70,
#             "chapter_exercise_score": 78,
#             "remarks": "Needs improvement in proofs"
#           }
#         ]
#       },
#       {
#         "name": "Science",
#         "chapters": [
#           {
#             "name": "Physics",
#             "homework_score": 88,
#             "test_score": 84,
#             "chapter_exercise_score": 85,
#             "remarks": "Very curious student"
#           }
#         ]
#       }
#     ]
#   }
# }
