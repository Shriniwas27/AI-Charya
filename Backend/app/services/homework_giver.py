from typing import List, Optional
from app.database.db_connection import mongodb

async def fetch_homework_by_class_subject_chapter(std: str, subject_name: str, chapter_number: str) -> Optional[List[dict]]:
    class_doc = await mongodb.class_record_collection.find_one({"class_name": std})

    if not class_doc:
        print(f"Class '{std}' not found.")
        return None

    for subject in class_doc.get("subjects", []):
        if subject.get("subject_name") == subject_name:  
            for chapter in subject.get("chapters", []):
                if chapter.get("number") == chapter_number:
                    return chapter.get("completion_status", {}).get("homework", [])

    print(f"Subject '{subject_name}' or Chapter '{chapter_number}' not found in class '{std}'.")
    return None


