import os
import json
import requests
import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
if not GCS_BUCKET_NAME:
    raise EnvironmentError("GCS_BUCKET_NAME not set in .env file")


GROUPING_PROMPT_TEMPLATE = """
Group the following science concepts into 6 to 8 logical slide groups.

Each group should have:
- A clear and short slide title
- 3 to 6 related points (keep the original text)

Important Points:
{points}

Respond in this JSON format:
[
  {{
    "title": "Group Title 1",
    "content": ["point 1", "point 2", ...]
  }},
  ...
]
"""


def group_points_with_gemini(important_points):
    prompt = GROUPING_PROMPT_TEMPLATE.format(
        points=json.dumps(important_points, ensure_ascii=False, indent=2)
    )
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    try:
        data = json.loads(response.text)
        if not isinstance(data, list):
            raise ValueError("Invalid format")
        return data
    except Exception as e:
        print("Gemini failed to return valid JSON, falling back:", e)
        return manually_group_points(important_points)



def manually_group_points(important_points, min_group=6, max_group=8):
    if not isinstance(important_points, list):
        print("important_points is not a list:", type(important_points))
        important_points = list(important_points.values())  # Convert dict to list

    grouped, i, slide_num = [], 0, 1
    while i < len(important_points):
        group_size = min(max_group, len(important_points) - i) if (len(important_points) - i) <= max_group else min_group
        grouped.append({
            "title": f"Slide {slide_num}",
            "content": important_points[i:i + group_size]
        })
        i += group_size
        slide_num += 1
    return grouped


def url_exists(url):
    try:
        return requests.head(url, timeout=5).status_code == 200
    except:
        return False


def assign_images_to_slides(slides, subject, chapter_name):
    print("funvtion")
    print(slides)
    for i, slide in enumerate(slides):
        
        gcs_filename = f"{subject}_{chapter_name}_{i + 1}.png"
        gcs_url = f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{gcs_filename}"
        slide["image"] = gcs_url
        print(f"Assigned image to slide {i+1}: {gcs_url}")
    print("after funvtion")
    return slides



def generate_presentation_from_dict(chapter_data: dict, subject: str, chapter_name: str) -> dict:
    raw_points = chapter_data["important_points"]  

  
    important_points = raw_points if isinstance(raw_points, list) else list(raw_points.values())

    chapter_title = chapter_data["chapter_title"]

    grouped_slides = group_points_with_gemini(important_points)
    print("Grouped slides:", grouped_slides)
    slides_with_images = assign_images_to_slides(grouped_slides, subject, chapter_name)

    presentation_json = {
        "title": f"Chapter: {chapter_title}",
        "slides": slides_with_images
    }

    return presentation_json



