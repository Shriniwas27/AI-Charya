import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from typing import List
from dotenv import load_dotenv
from multiprocessing import cpu_count
from pydantic import BaseModel
from typing import List
import google.generativeai as genai
import re
import os
import io
from google.cloud import storage

pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

load_dotenv()

# ---------------------------------------------------------------------------------------------------------------
# Environment Configuration settings for this file
class Settings:
    GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")

settings = Settings()


genai.configure(api_key=settings.GOOGLE_API_KEY)

cutstart = 0

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.GOOGLE_APPLICATION_CREDENTIALS


def clean_name(name: str) -> str:
    return re.sub(r'\W+', '_', name.lower())

def convert_to_english_digits(marathi_str):
    digit_map = str.maketrans("०१२३४५६७८९", "0123456789")
    return marathi_str.translate(digit_map)
# --------------------------------------------------------------------------------------------------------------

# ---------------------------------------------------------------------------------------------------------------
# This function is used to upload the sliced pdf to GCS along with particular naming convention
from google.cloud import storage
import io


def upload_pdf_to_gcs(file_obj: io.BytesIO, std: str, subject: str, chapter_no: str) -> str:
    """
    Uploads a PDF to GCS under the 'Standards/' folder in format:
    Standards/std_subject_chapterno.pdf
    """

    subject_clean = subject.lower().replace(" ", "")
    chapter_str = chapter_no.zfill(2)
    std_clean = std.lower().replace(" ", "")

    object_name = f"{std_clean}_{subject_clean}_chapter_{chapter_str}.pdf"

    client = storage.Client()
    bucket = client.bucket(settings.GCS_BUCKET_NAME)
    blob = bucket.blob(object_name)

    file_obj.seek(0)
    blob.upload_from_file(file_obj, rewind=True, timeout = 300)


    # Return public link
    return f"https://storage.googleapis.com/{settings.GCS_BUCKET_NAME}/{object_name}"

# --------------------------------------------------------------------------------------------------------------
class ChapterInfo(BaseModel):
    chapter_no: str
    chapter_title: str
    page_no: str

class ChapterList(BaseModel):
    chapters: List[ChapterInfo]

    model_config = {
        "arbitrary_types_allowed": True
    }

model = genai.GenerativeModel(
    "models/gemini-2.5-pro",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=ChapterList  
    )
)
# --------------------------------------------------------------------------------------------------------------

# --------------------------------------------------------------------------------------------------------------
# This function extracts the index pages from the PDF
def extract_index_pages(pdf_path):
    global cutstart
    doc = fitz.open(pdf_path)
    index_images = []

    for i in range(3, min(len(doc), 25)):
        page = doc.load_page(i)
        pix = page.get_pixmap(dpi=200)
        image = Image.open(io.BytesIO(pix.tobytes("png")))
        text = pytesseract.image_to_string(image, lang='mar')
        if any(k in text.lower() for k in ["अनुक्रमणिका", "लेखक/कवी", "पाठाचे नाव", "धडा", "पृ. क्र.", "पृष्ठ क्र.", "अ.क्र"]):
            cutstart = i + 1
            index_images.append(image)

    doc.close()
    return index_images


def extract_index_with_gemini_structured(index_images):
    prompt = """
    You are an intelligent OCR assistant.

    Extract the chapter number, chapter title, and page number from the given Marathi images.

    Instructions:
    - Extract only the table of contents information
    - Avoid duplicates and unclear lines
    - Convert page numbers to English digits
    - Combine information from all images into one structured list
    - Return all chapters found in the images

    For each chapter, extract:
    - chapter_no: The chapter number as a string
    - chapter_title: The full chapter title in Marathi
    - page_no: The page number as a string (in English digits)
    """
    imgs = []
    for img in index_images:
        with io.BytesIO() as buf:
            img.save(buf, format="PNG")
            imgs.append(Image.open(io.BytesIO(buf.getvalue())))

    response = model.generate_content([prompt] + imgs)
    return response.text

# --------------------------------------------------------------------------------------------------------------
# This files completely uploads the sliced pdf to GCS
def slice_and_upload(args):
    
    pdf_path, current, next_chapter, total_pages, process_id, subject_name, std = args

    try:
        doc = fitz.open(pdf_path)
        start = current["page_no"] - 1
        end = next_chapter["page_no"] - 2 if next_chapter else total_pages - 1

        output_pdf = fitz.open()
        if end >= start:
            output_pdf.insert_pdf(doc, from_page=start, to_page=end)

        chapter_no_eng = convert_to_english_digits(current["chapter_no"])
        
        cleaned_chapter_no = re.sub(r'\D', '', chapter_no_eng)

    
        filename = f"{std.lower()}{subject_name.lower()}_chapter{int(cleaned_chapter_no):02}.pdf"

        pdf_bytes = output_pdf.write(deflate=True, clean=True)
        file_obj = io.BytesIO(pdf_bytes)  

        url = upload_pdf_to_gcs(file_obj, std, subject_name, cleaned_chapter_no)

        output_pdf.close()
        doc.close()

        print(f"[Process {process_id}] Uploaded: {filename}")
        return {
            "filename": filename,
            "url": url,
            "file_obj": file_obj  
        }

    except Exception as e:
        print(f"[Process {process_id}] Error: {e}")
        return None


def save_chapters_parallel(pdf_path, chapter_list, subject_name: str, std: str):
    import concurrent.futures

    
    for chapter in chapter_list:
        chapter["page_no"] = int(chapter["page_no"]) + cutstart


    chapter_list = sorted(chapter_list, key=lambda x: x["page_no"])
    total_pages = fitz.open(pdf_path).page_count
    num_workers = min(cpu_count(), len(chapter_list))

    tasks = []
    for i, chapter in enumerate(chapter_list):
        next_chapter = chapter_list[i + 1] if i + 1 < len(chapter_list) else None
        tasks.append((pdf_path, chapter, next_chapter, total_pages, i % num_workers, subject_name, std))

    results = []
    with concurrent.futures.ProcessPoolExecutor(max_workers=num_workers) as executor:
        future_to_task = {executor.submit(slice_and_upload, task): task for task in tasks}
        for future in concurrent.futures.as_completed(future_to_task):
            try:
                result = future.result()
                if result:
                    results.append(result)
            except Exception as e:
                print(f"Task failed: {e}")

    return results

# -------------------------------------------------------------------------------------------------------------
# This is final function
def extract_and_upload_chapters(pdf_path, subject_name: str, std: str):
    print("Extracting index pages...")
    index_images = extract_index_pages(pdf_path)

    if not index_images:
        raise ValueError("No index pages found")

    print("Running Gemini OCR on index...")
    structured_response = extract_index_with_gemini_structured(index_images)

    try:
        response_data = ChapterList.model_validate_json(structured_response)
        chapter_list = [chap.model_dump() for chap in response_data.chapters]

        chapter_list = [chap for chap in chapter_list if chap.get('chapter_no')]
        print(f"Extracted {len(chapter_list)} chapters.")
    except Exception as e:
        print(f"JSON Parsing Error: {e}")
        print("Raw Gemini Output:", structured_response)
        raise

    return save_chapters_parallel(pdf_path, chapter_list, subject_name, std)