from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from datetime import datetime
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


class StandardChapterMap(BaseModel):
    standard: int             
    chapter_number: int        


class TopicSchedule(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    teacher_id: str
    topic_name: str
    chapter_name: str
    chapter_mappings: List[StandardChapterMap]  
    classes: List[str]                          
    expected_completion_date: datetime
    status: Optional[str] = "Pending"
    ppt_link: Optional[str] = None
    is_completed: Optional[bool] = False

    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


# {
#   "teacher_id": "T123",
#   "topic_name": "Word Problems on Addition",
#   "chapter_name": "Addition and Subtraction",
#   "chapter_mappings": [
#     { "standard": 3, "chapter_number": 2 },
#     { "standard": 4, "chapter_number": 1 }
#   ],
#   "classes": [3,4],
#   "expected_completion_date": "2025-08-12T00:00:00",
#   "status": "Pending",
#   "ppt_link": "https://example.com/ppt/word_problems_addition.pptx",
#   "is_completed": false
# }



