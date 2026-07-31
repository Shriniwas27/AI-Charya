import google.generativeai as genai
import json
import os
import asyncio
from typing import List
from app.models.student_model import StudentProfile
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from app.database.db_connection import mongodb


load_dotenv()


genai.configure(api_key=os.getenv("apikey"))
model = genai.GenerativeModel("models/gemini-1.5-flash")


async def fetch_students_context_by_class(student_class: str) -> List[dict]:
    print("got it")
    cursor = mongodb.student_collection.find({"student_class": student_class})
    students_data = await cursor.to_list(length=1000)

    if not students_data:
        return []

    context_list = []

    for student_data in students_data:
        student = StudentProfile(**student_data)

        subject_scores = {}

        if student.academic:
            for subject in student.academic.subjects:
                total_score = 0
                chapter_count = 0

                for chapter in subject.chapters:
                    avg_chapter_score = (
                        chapter.homework_score +
                        chapter.test_score +
                        chapter.chapter_exercise_score
                    ) / 3
                    total_score += avg_chapter_score
                    chapter_count += 1

                if chapter_count > 0:
                    subject_avg = round(total_score / chapter_count, 2)
                    subject_scores[subject.name] = subject_avg

        context = {
            "student_id": str(student.id),
            "roll_no": student.roll_no,
            "name": student.name,
            "preferred_language": student.preferred_language,
            "mother_occupation": student.motherDetails.occupation if student.motherDetails else None,
            "father_occupation": student.fatherDetails.occupation if student.fatherDetails else None,
            "address": student.address,
            "academic_achievements": student.academic_achievements,
            "hobbies": student.hobbies,
            "scores": subject_scores
        }

        context_list.append(context)
        print(context_list)

    return context_list



def find_relevant_students_and_generate_guidelines(students_list, chapter_title, important_points):
    """
    Find students who have relevant context matching the chapter content 
    and generate targeted teaching guidelines for them.
    """
    points_formatted = "\n".join(f"- {pt}" for pt in important_points)
    
    prompt = f"""
            You are an educational consultant helping a teacher identify and connect with students who have relevant background for a specific chapter.

            Chapter: "{chapter_title}"
            Important points to be covered:
            {points_formatted}

            All students in class:
            {json.dumps(students_list, indent=2)}

            Your task:
            1. **IDENTIFY RELEVANT STUDENTS**: Look through all students and find those who have any connection to the chapter content through:
            - Hobbies that relate to the subject
            - Parents' occupations that connect to the topic
            - Academic achievements in related areas
            - Any personal interests or experiences that could tie to the chapter

            2. **CREATE TARGETED GUIDELINES**: For each relevant student, provide specific teaching guidelines.

            FORMAT YOUR RESPONSE AS:

            **RELEVANT STUDENTS FOR "{chapter_title}":**

            **Student: [Name] - [Roll No]**
            **Why Relevant:** [Specific connection - hobby, family background, achievement, etc.]
            **Teaching Guidelines:**
            - **Connection Points:** [How to use their specific background/interest as examples]
            - **Engagement Strategy:** [How to leverage their experience during lessons]
            - **Special Approach:** [Any specific teaching methods that would work best]

            [Repeat for each relevant student]

            **STUDENTS WITH NO DIRECT CONNECTION:**
            [List names of students who don't have obvious connections to this chapter topic]

            **GENERAL CLASS NOTES:**
            [Any overall observations about how to teach this chapter to the class]

            IMPORTANT: Only include students as "relevant" if they have a clear, meaningful connection to the chapter content. Don't force connections that don't exist.
            """
    
    response = model.generate_content(prompt)
    return response.text


def generate_class_overview(students_list, chapter_title, important_points):
    points_formatted = "\n".join(f"- {pt}" for pt in important_points)

    prompt = f"""
            You are an educational consultant providing a CLASS OVERVIEW for a teacher.

            Chapter: "{chapter_title}"
            Number of students: {len(students_list)}

            Important points to be covered:
            {points_formatted}

            Student profiles:
            {json.dumps(students_list, indent=2)}

            Create a TEACHING STRATEGY OVERVIEW that helps the teacher understand:
            1. **Class Demographics** – Age range, backgrounds, common interests
            2. **Learning Style Mix** – Different learning preferences in the class
            3. **Engagement Opportunities** – Common interests that can be used for examples
            4. **Differentiation Needs** – Students who might need different approaches
            5. **Class Management Tips** – Based on the mix of personalities
            6. **Concept Connection Ideas** – How to tie the above important points to students' interests and learning styles
            7. Identify the students with low score in that subject and mention regarding them in the guidelines to pay special attention

            FORMAT AS:
            **Class 3B Teaching Context Overview**

            **Class Profile:**
            [Brief overview of the group]

            **Important Chapter Concepts:**
            - [Key points to emphasize while teaching, based on chapter highlights and student context]

            **Common Connection Points:**
            - [Interests/hobbies that multiple students share]
            - [Examples that would resonate with most students]

            **Learning Style Distribution:**
            - [Mix of learning preferences in the class]

            **Differentiation Opportunities:**
            - [Students who might benefit from visual examples]
            - [Students who prefer hands-on activities]
            - [Students who respond well to storytelling]

            **Special Considerations for the Class:**
            - [Any health considerations, language preferences, family backgrounds]

            Keep it practical and focused on helping the teacher connect the chapter's important points with student needs.
            """
    response = model.generate_content(prompt)
    return response.text


def main(students: list, chapter_title: str, important_points: list):
   
    relevant_student_guidelines = find_relevant_students_and_generate_guidelines(
        students, chapter_title, important_points
    )
    
  
    class_overview = generate_class_overview(students, chapter_title, important_points)

    output_data = {
        "chapter_title": chapter_title,
        "important_points": important_points,
        "class_overview": class_overview.strip(),
        "relevant_students_guidelines": relevant_student_guidelines.strip(),
        "generated_date": "2025-07-25",
        "total_students": len(students)
    }
    return output_data["relevant_students_guidelines"]