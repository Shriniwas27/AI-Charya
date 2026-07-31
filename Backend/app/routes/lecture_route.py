from typing import Any, Dict, List
from fastapi import APIRouter, Query
from google.cloud import storage
import io
from app.core.config import settings
from app.services.guidelines import fetch_students_context_by_class, main
from app.services.image_gen import generate_image, get_students_context_by_class
from app.services.json_for_slides import generate_presentation_from_dict
from app.services.points_generator import process_pdf_from_gcs_url
from app.services.slide_gen import create_slides_from_json
from app.database.db_connection import mongodb

router = APIRouter()


async def update_homework_by_class_subject_chapter(
    class_name: str,
    subject_name: str,
    chapter_number: int,
    new_homework: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Updates homework for a specific class, subject, and chapter.
    
    Args:
        class_name: Name of the class (e.g., "5A")
        subject_name: Name of the subject (e.g., "Math")
        chapter_number: Chapter number (e.g., 1)
        new_homework: List of homework items with "question" and "answer" keys
    
    Returns:
        Dict with success status and message
    """
    try:
        
        
        # Validate homework format
        for hw in new_homework:
            if not isinstance(hw, dict) or "question" not in hw or "answer" not in hw:
                return {
                    "success": False,
                    "message": "Invalid homework format. Each item must have 'question' and 'answer' keys."
                }
        
        
        matching_doc = await mongodb.class_record_collection.find_one({
            "class_name": class_name,
            "subjects": {
                "$elemMatch": {
                    "subject_name": subject_name,
                    "chapters": {
                        "$elemMatch": {
                            "number": chapter_number
                        }
                    }
                }
            }
        })
        
        if not matching_doc:
            return {
                "success": False,
                "message": f"No matching record found for class '{class_name}', subject '{subject_name}', chapter {chapter_number}"
            }
        
        # Perform the update
        update_result = await mongodb.class_record_collection.update_one(
            {"class_name": class_name},
            {
                "$set": {
                    "subjects.$[s].chapters.$[c].completion_status.homework": new_homework
                }
            },
            array_filters=[
                {"s.subject_name": subject_name},
                {"c.number": chapter_number}
                
            ]
        )
        
        if update_result.modified_count > 0:
            return {
                "success": True,
                "message": f"Homework updated successfully for class '{class_name}', subject '{subject_name}', chapter {chapter_number}",
                "modified_count": update_result.modified_count
            }
        else:
            return {
                "success": False,
                "message": "No documents were modified. The homework might already be the same."
            }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Error updating homework: {str(e)}"
        }
    


def construct_gcs_pdf_url(std: str, subject: str, chapter_no: str) -> str:
    """
    Constructs a clean, newline-free GCS URL for a PDF using the naming convention:
    https://storage.googleapis.com/<bucket_name>/std_subject_chapter_chapterno.pdf
    """
    subject_clean = subject.strip().lower().replace(" ", "")
    std_clean = std.strip().lower().replace(" ", "")
    chapter_str = chapter_no.strip().zfill(2)

    object_name = f"{std_clean}_{subject_clean}_chapter_{chapter_str}.pdf".strip()
    bucket_name = settings.GCS_BUCKET_NAME.strip()

    url = f"https://storage.googleapis.com/{bucket_name}/{object_name}"
    return url.strip()


@router.get("/create_lecture_plate/")
async def create_lecture_plate(
    std: str=Query(..., description="Standard of the class (e.g., '3')"),
    subject: str= Query(..., description="Subject of the lecture (e.g., 'evs')"),
    chapter_no: str=Query(..., description="Chapter number (e.g., '6')")
):
    try:
        url = construct_gcs_pdf_url(std, subject, chapter_no)
        print(f"Constructed GCS URL: {url}")
        result = process_pdf_from_gcs_url(url)
        print(result)
        context_data = await get_students_context_by_class(result["std"])
        print("yess")
        context_list = await fetch_students_context_by_class(result["std"])
        print(context_list)
        ans = main(context_list, result["chapter_title"] , result["important_points"])
        
        generate_image(result, context_data, result["subject"], result["chapter_no"])
        print("Image generated successfully")

        print(chapter_no)
        await update_homework_by_class_subject_chapter(result["std"],result["subject"],chapter_no,result["question_answers"])
        print("updated in DB")

        chapter_data = {
        "important_points": result["important_points"],
        "chapter_title": f"Chapter {result['chapter_title']}"
        }

        slides = generate_presentation_from_dict(chapter_data, result["subject"],f"chapter{result['chapter_no']}")

        print("Generated slides:", slides)
        slides_url = create_slides_from_json("1O1_BLZ5NlW1IuDzP8XCBdVA-CtZOiqnW6WM10kyxtWg", slides)
        print("url generated:")
        print(slides_url) 
        
        await mongodb.class_record_collection.update_one(
    {"class_name": result["std"]},
    {
        "$set": {
            "subjects.$[subjectElem].chapters.$[chapterElem].ppt_link": slides_url,
            "subjects.$[subjectElem].chapters.$[chapterElem].guideline": ans  
        }
    },
    array_filters=[
        {"subjectElem.subject_name": result["subject"]},
        {"chapterElem.number": str(result["chapter_no"])} 
    ]
)

        lecture={
            "url":slides_url,
            "guidelines":ans,
            "subject":result["subject"],
            "grade":result["std"],
            "exercise_answers": result["question_answers"]
        }
        print(lecture)
        return {"slides_url": slides_url}
    
    except Exception as e:
        return {"error": str(e)}
    








