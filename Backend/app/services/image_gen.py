import os
import json
import mimetypes
import asyncio
from dotenv import load_dotenv
from google import genai
from google.genai import types
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.points_generator import process_pdf_from_gcs_url
from google.cloud import storage

load_dotenv()
MONGO_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "agenticaihackathon")


def upload_to_gcs(local_file_path: str, object_name: str) -> str:
    """Uploads a local file to Google Cloud Storage and returns the public URL."""
    bucket_name = os.getenv("GCS_BUCKET_NAME")  

    if not bucket_name:
        raise ValueError("GCS_BUCKET_NAME not set in environment variables")


    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(object_name)

    blob.upload_from_filename(local_file_path)
    blob.make_public()  

    print(f"✅ Uploaded to GCS: {blob.public_url}")
    return blob.public_url

client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]
students_collection = db["students"]

async def get_students_context_by_class(student_class: str) -> list:
    cursor = students_collection.find({"student_class": student_class})
    students_data = await cursor.to_list(length=None)

    if not students_data:
        raise ValueError("No students found for this class")

    context_list = []
    for student in students_data:
        subject_scores = {}
        academic = student.get("academic")
        if academic:
            for subject in academic.get("subjects", []):
                total_score = sum(chap.get("score", 0) for chap in subject.get("chapters", []))
                chapter_count = len(subject.get("chapters", []))
                avg_score = total_score / chapter_count if chapter_count else 0
                subject_scores[subject.get("subject_name", "Unknown")] = avg_score

        context_list.append({
            "name": student.get("name"),
            "class": student_class,
            "subject_scores": subject_scores
        })

    return context_list



def create_personalized_educational_prompt(student_data, important_point, chapter_title):
    student_json = json.dumps(student_data, indent=2, ensure_ascii=False)
    return f"""
CRITICAL INSTRUCTION: Generate a beautiful animated-style educational illustration with ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO LABELS anywhere on the image surface. The image must be completely text-free.

ANIMATION STYLE REQUIREMENTS:
- Disney/Pixar 3D animation quality with vibrant, child-friendly colors
- Soft cinematic lighting and smooth gradients
- Professional animation studio quality with polished 3D rendering
- Big expressive eyes and friendly character design
- Bright, encouraging atmosphere that makes learning exciting

EDUCATIONAL CONTEXT:
Chapter: {chapter_title}
Important Concept: {important_point}

STUDENT PERSONALIZATION DATA:
{student_json}

PERSONALIZATION INSTRUCTIONS:
Using the student data above, create a highly personalized educational visualization:

1. CHARACTER DESIGN: Create an animated child character that reflects this student's personality and interests
2. INTERESTS INTEGRATION: Incorporate visual elements from their hobbies (drawing, cycling, singing, etc.)
3. CULTURAL CONTEXT: Add elements relevant to their location and family background
4. LEARNING STYLE: Adapt the visual complexity based on their academic performance
5. ACHIEVEMENT REFLECTION: Show confidence level matching their academic achievements
VISUAL STORYTELLING REQUIREMENTS:
- Main character: Animated child showing curiosity and wonder about the educational concept
- Educational focus: Clear visual demonstration of the important point through engaging imagery
- Personal touches: Elements that connect to the student's specific interests and hobbies
- Cultural relevance: Background elements reflecting their geographical/cultural context
- Learning engagement: Make the concept relatable to their world and experiences

COMPOSITION GUIDELINES:
- Character positioned to show active discovery and learning
- Background supporting both the educational concept and student's interests
- Dynamic lighting that creates positive, encouraging learning atmosphere
- Storytelling composition that makes the concept memorable and personally meaningful
- Environmental elements from their region when applicable

ABSOLUTELY CRITICAL REQUIREMENTS:
- ZERO text, labels, captions, letters, numbers, or symbols on the image
- Pure visual education through personalized imagery alone
- Make the educational concept clear and memorable through customized visual storytelling
- Ensure the image feels specifically created for this individual student

FINAL INSTRUCTION: Use ALL the student data to create an educational illustration that this specific student will find personally engaging, culturally relevant, and educationally meaningful. The concept should be clearly communicated through visual elements that resonate with their unique background and interests.
Do not include text in the image
"""



def generate_image(chapter_data: dict, students_context: list, subject: str, chapter_num: int):
    max_concepts = 4

    genai_client = genai.Client(api_key=os.getenv("GENAI_API_KEY"))
    model = "gemini-2.0-flash-preview-image-generation"

    chapter_title = chapter_data.get("chapter_title", "Unknown")
    important_points = chapter_data.get("important_points", [])[:max_concepts]

    image_counter = 1  # Start numbering from 1

    for student in students_context:
        for i, point in enumerate(important_points):
            prompt = create_personalized_educational_prompt(student, point, chapter_title)
            contents = [
                types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
            ]
            config = types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"], temperature=0.8)

            try:
                for chunk in genai_client.models.generate_content_stream(model=model, contents=contents, config=config):
                    if (
                        chunk.candidates and
                        chunk.candidates[0].content and
                        chunk.candidates[0].content.parts and
                        chunk.candidates[0].content.parts[0].inline_data
                    ):
                        data = chunk.candidates[0].content.parts[0].inline_data
                        ext = mimetypes.guess_extension(data.mime_type) or ".jpg"

                     
                        object_name = f"{subject}_chapter{chapter_num}_{image_counter}{ext}"

                        
                        temp_path = f"/tmp/{object_name}"
                        with open(temp_path, "wb") as f:
                            f.write(data.data)

                      
                        upload_to_gcs(temp_path, object_name)
                        

                        image_counter += 1

            except Exception as e:
                print(f" Failed to generate image for {student['name']} concept {i+1}: {e}")