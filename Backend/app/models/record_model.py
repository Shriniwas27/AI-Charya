from typing import List, Optional, Any
from pydantic import BaseModel, Field, HttpUrl
from bson import ObjectId
from pydantic import GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core.core_schema import ValidationInfo



class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v: Any, info: ValidationInfo) -> ObjectId:
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema: JsonSchemaValue, handler: GetJsonSchemaHandler) -> JsonSchemaValue:
        return {"type": "string"}



class CompletionStatus(BaseModel):
    homework: List[dict]  
    oral: int = Field(..., ge=0, le=10)
    test: int = Field(..., ge=0, le=10)
    chapter_exercise: int = Field(..., ge=0, le=10)



class Chapter(BaseModel):
    number: str
    name: str
    completion_status: CompletionStatus
    ppt_link: Optional[HttpUrl] = None
    guideline : Optional[str]=None



class Subject(BaseModel):
    name: str
    chapters: List[Chapter]



class ClassAcademicRecord(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default_factory=PyObjectId)
    class_name: str
    student_count: int
    boys: int
    girls: int
    roll_numbers: List[int]
    subjects: List[Subject]
    teacher_ids: List[PyObjectId]

    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }



# structure:- 
# {
#   "class_name": "10",
#   "student_count": 30,
#   "boys": 18,
#   "girls": 12,
#   "roll_numbers": [int],
#   "subjects": [
#     {
#       "name": "Mathematics",
#       "chapters": [
#         { 
#           "number": "1",
#           "name": "Introduction to Algebra",
#           "completion_status": {
#             "homework": list[{"question":str, "answer":str}],
#             "oral": 9,
#             "test": 7,
#             "chapter_exercise": 10
#           },
#           "ppt_link": "https://example.com/algebra.pdf",
#          
#         }
#       ]
#     }
#   ],
#   "teacher_ids": ["64ab0f5e5e6c2c001f6b8a11"]
# }
