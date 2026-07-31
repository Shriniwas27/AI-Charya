
import os
import io
import json
import time
import fitz  
import re
import requests
import tempfile
from PIL import Image
from dotenv import load_dotenv
import google.generativeai as genai
from pydantic import BaseModel


load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))


class PDFUrlRequest(BaseModel):
    pdf_url: str
response_schema = {
    "type": "object",
    "properties": {
        "important_points": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "List of important points extracted from the page in Marathi"
        },
        "exercise_answers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The question from swadhyay section"
                    },
                    "answer": {
                        "type": "string", 
                        "description": "The answer to the question"
                    }
                },
                "required": ["question", "answer"]
            },
            "description": "Questions and answers from swadhyay (exercise) section"
        },
        "image_descriptions": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "Descriptions of educational/meaningful images found on the page in Marathi"
        }
    },
    "required": ["important_points", "exercise_answers", "image_descriptions"]
}


model = genai.GenerativeModel(
    "models/gemini-2.5-pro",
    generation_config={
        "response_mime_type": "application/json",
        "response_schema": response_schema
    }
)

def get_chapter_title_from_filename(filename):
    """Extract chapter title from PDF filename"""
    
    name_without_ext = os.path.splitext(filename)[0]
    
    if name_without_ext.startswith('chapter_'):
        name_without_ext = name_without_ext[8:]  
    title = name_without_ext.replace('_', ' ').replace('-', ' ')
    
    title = ' '.join(title.split())
    
    return title

def get_pdf_files_from_folder(folder_path):
    """Get all PDF files from the specified folder"""
    if not os.path.exists(folder_path):
        print(f"Folder '{folder_path}' does not exist!")
        return []
    
    pdf_files = []
    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.pdf'):
            pdf_path = os.path.join(folder_path, filename)
            chapter_title = get_chapter_title_from_filename(filename)
            pdf_files.append({
                'filename': filename,
                'path': pdf_path,
                'title': chapter_title
            })
    
    pdf_files.sort(key=lambda x: x['filename'])
    return pdf_files

def extract_chapter_content(chapter_pdf, chapter_title):
    """Extract important points, exercise answers and image descriptions from each page"""
    doc = fitz.open(chapter_pdf)
    all_points = []
    all_exercise_answers = []
    all_image_descriptions = []
    
    total_pages = len(doc)
    

    for i in range(total_pages):
        try:
           
            page = doc.load_page(i)
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))

    
            prompt = f"""
                    You are an AI assistant for reading educational material in Marathi.

                    From this page of the chapter "{chapter_title}", extract the following information:

                    1. **Important Points**: Main educational concepts, key ideas, or facts that students should remember
                    - Skip examples, descriptions, or redundant information
                    - Each point should be concise and meaningful
                    - Write in Marathi language

                    2. **Exercise Answers (स्वाध्याय)**: CAREFULLY scan the entire page for ALL exercise questions and answers
                    - Look for numbered questions (१, २, ३, etc. or 1, 2, 3, etc.)
                    - Look for questions starting with words like: काय, कोण, कसे, कुठे, केव्हा, का, कशासाठी, etc.
                    - Extract BOTH the complete question and its complete answer
                    - If a question has multiple parts (अ), (आ), (इ), etc., include all parts
                    - If only questions are present without answers, skip them
                    - Include ALL questions found on the page, don't miss any
                    - Pay special attention to questions at the top, middle, and bottom of the page

                    3. **Image Descriptions**: Describe ONLY educational/meaningful images that add value to learning
                    - IGNORE decorative images like: cartoons, mascots, border decorations, simple icons, clipart
                    - INCLUDE educational images like: diagrams, charts, maps, scientific illustrations, real photographs, process flows
                    - Describe what the image shows and how it relates to the educational content
                    - Write descriptions in Marathi language
                    - Keep descriptions concise but informative

                    IMPORTANT: 
                    - Read the ENTIRE page carefully from top to bottom
                    - Don't skip any questions, even if they seem simple
                    - Only describe images that have educational value
                    - If any section has no content on this page, return empty array for that section
                    - Focus on educational content that is meaningful for learning
                    - Write all text in Marathi language
                    - Be accurate and complete

                    Return the information in the specified JSON format with three arrays: important_points, exercise_answers, and image_descriptions.
                """

            response = model.generate_content([prompt, image])
            
            parsed_response = json.loads(response.text)
            points = parsed_response.get("important_points", [])
            exercises = parsed_response.get("exercise_answers", [])
            images = parsed_response.get("image_descriptions", [])
            
            if points:
                all_points.extend(points)
            if exercises:
                all_exercise_answers.extend(exercises)
            if images:
                all_image_descriptions.extend(images)
                
            # Progress reporting
            content_summary = []
            if points:
                content_summary.append(f"{len(points)} points")
            if exercises:
                content_summary.append(f"{len(exercises)} exercises")
            if images:
                content_summary.append(f"{len(images)} image descriptions")
                
            if content_summary:
                print(f"Page {i+1}/{total_pages}: Extracted {', '.join(content_summary)}")
            else:
                print(f"Page {i+1}/{total_pages}: No content found")

        except json.JSONDecodeError as e:
            print(f"JSON parsing error on page {i+1}: {e}")
            print("Raw response:", response.text)
        except Exception as e:
            print(f"Error processing page {i+1}: {e}")

    doc.close()

    result = {
        "chapter_title": chapter_title,
        "total_pages": total_pages,
        "extraction_summary": {
            "important_points_count": len(all_points),
            "exercise_answers_count": len(all_exercise_answers),
            "image_descriptions_count": len(all_image_descriptions)
        },
        "important_points": all_points,
        "exercise_answers": all_exercise_answers,
        "image_descriptions": all_image_descriptions,
        "extraction_timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    return result

def process_pdf_from_gcs_url(pdf_url: str) -> dict:
    """Download PDF from GCS URL, extract content using existing logic, return JSON (do not save)"""

    pdf_filename = pdf_url.split("/")[-1]
    chapter_title = get_chapter_title_from_filename(pdf_filename)

    
    match = re.match(r"(?P<std>[^_]+)_(?P<subject>[^_]+)_chapter_0*(?P<chapter_no>\d+)", pdf_filename, re.IGNORECASE)

    std = match.group("std") if match else "Unknown"
    subject = match.group("subject") if match else "Unknown"
    chapter_no = match.group("chapter_no") if match else "Unknown"

    
    response = requests.get(pdf_url)
    if response.status_code != 200:
        raise Exception(f"Failed to download PDF from GCS. Status: {response.status_code}")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(response.content)
        tmp_file.flush()
        temp_pdf_path = tmp_file.name

    
    extracted_data = extract_chapter_content(temp_pdf_path, chapter_title)

    result = {
        "std": std,
        "subject": subject,
        "chapter_no": f"{chapter_no}",
        "chapter_title" : extracted_data["chapter_title"],
        "important_points": extracted_data["important_points"],
        "question_answers" : extracted_data["exercise_answers"]  
    }
    print(result)
    return result