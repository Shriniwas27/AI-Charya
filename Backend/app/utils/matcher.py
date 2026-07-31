from google import genai
from google.genai import types

def generate(standard1: str, standard2: str, subject: str):
    client = genai.Client(
        vertexai=True,
        project="inlaid-fire-466209-k3",
        location="global",
    )

    prompt_text = types.Part.from_text(text=f"""You are a smart teaching assistant helping a school optimize their teaching schedule. The goal is to save time for teachers by identifying similar or overlapping chapters between different class syllabuses so that they can be taught together instead of separately.

        Your task is to:

        Analyze the chapters of {standard1} and {standard2} and {subject}. Go into the RAG for this.

        Identify chapters that are either identical, very similar, or have overlapping concepts.

        Group such chapters together under the same serial number (sr) in the output.

        If a chapter is unique to one class, include it with "null" as the value for the other class.

        The output must be in structured JSON format only.

        Format for Output:
        [
        {{
            "sr": 1,
            "class1": "Chapter Name from Class 1",
            "class2": "Chapter Name from Class 2"
        }},
        ...
        ]

        Only include chapter names, no summaries or explanations.

        Do not skip any chapters; every chapter must appear either grouped or alone.

        Example Input:
        Class 1 Chapters:

        Chapter 1: Counting Numbers

        Chapter 2: Simple Addition

        Chapter 3: Shapes and Patterns

        Chapter 4: Introduction to Subtraction

        Class 2 Chapters:

        Chapter 1: Number Sense

        Chapter 2: Basic Addition and Subtraction

        Chapter 3: Geometry Basics

        Chapter 4: Subtraction for Beginners

        Expected Output Format:
        [
        {{
            "sr": 1,
            "class1": "Chapter 1: Counting Numbers",
            "class2": "Chapter 1: Number Sense"
        }},
        {{
            "sr": 2,
            "class1": "Chapter 2: Simple Addition",
            "class2": "Chapter 2: Basic Addition and Subtraction"
        }},
        {{
            "sr": 3,
            "class1": "Chapter 3: Shapes and Patterns",
            "class2": "Chapter 3: Geometry Basics"
        }},
        {{
            "sr": 4,
            "class1": "Chapter 4: Introduction to Subtraction",
            "class2": "Chapter 4: Subtraction for Beginners"
        }}
        ]

        Final Instruction:
        Only output the final JSON result — no explanation, no extra text, and no headings. So now like this make smart match for {standard1} and {standard2} and subject {subject}
        ALWAYS RETURN VALID JSON
        """)

    model = "gemini-2.5-flash-lite"
    contents = [
        types.Content(
            role="user",
            parts=[prompt_text]
        ),
    ]

    tools = [
        types.Tool(
            retrieval=types.Retrieval(
                vertex_rag_store=types.VertexRagStore(
                    rag_resources=[
                        types.VertexRagStoreRagResource(
                            rag_corpus="projects/inlaid-fire-466209-k3/locations/us-central1/ragCorpora/4172585054758764544"
                        )
                    ],
                )
            )
        )
    ]

    generate_content_config = types.GenerateContentConfig(
        temperature=1,
        top_p=0.95,
        max_output_tokens=65535,
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="OFF")
        ],
        tools=tools,
        thinking_config=types.ThinkingConfig(thinking_budget=0),
        response_mime_type="application/json",
        response_schema=genai.types.Schema(
            type=genai.types.Type.ARRAY,
            items=genai.types.Schema(
                type=genai.types.Type.OBJECT,
                required=["sr", "class1", "class2"],
                properties={
                    "sr": genai.types.Schema(type=genai.types.Type.NUMBER),
                    "class1": genai.types.Schema(type=genai.types.Type.STRING),
                    "class2": genai.types.Schema(type=genai.types.Type.STRING),
                },
            ),
        ),
    )

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config,
    )

    return response.text
