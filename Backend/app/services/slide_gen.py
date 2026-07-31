import json
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
import os
from dotenv import load_dotenv



load_dotenv()


credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")


def _get_slides_service():
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not credentials_path:
        raise ValueError("Missing GOOGLE_APPLICATION_CREDENTIALS env variable")

    credentials = service_account.Credentials.from_service_account_file(
        credentials_path,
        scopes=["https://www.googleapis.com/auth/presentations"]
    )
    return build("slides", "v1", credentials=credentials)


def _clear_all_slides(presentation_id, service):
    presentation = service.presentations().get(presentationId=presentation_id).execute()
    slides = presentation.get('slides', [])
    requests = [{'deleteObject': {'objectId': slide['objectId']}} for slide in slides]
    if requests:
        service.presentations().batchUpdate(
            presentationId=presentation_id, body={'requests': requests}
        ).execute()


def _create_slide_requests(slide_id, title, content_points, image_url):
    title_box_id = f'{slide_id}_title'
    content_box_id = f'{slide_id}_content'
    image_id = f'{slide_id}_image'
    background_shape_id = f'{slide_id}_bg'
    title_bg_id = f'{slide_id}_title_bg'

    requests = []

    requests.append({
        'createSlide': {
            'objectId': slide_id,
            'slideLayoutReference': {'predefinedLayout': 'BLANK'}
        }
    })

    requests.append({
        'createShape': {
            'objectId': background_shape_id,
            'shapeType': 'RECTANGLE',
            'elementProperties': {
                'pageObjectId': slide_id,
                'size': {'height': {'magnitude': 540, 'unit': 'PT'}, 'width': {'magnitude': 720, 'unit': 'PT'}},
                'transform': {'scaleX': 1, 'scaleY': 1, 'translateX': 0, 'translateY': 0, 'unit': 'PT'}
            }
        }
    })

    requests.append({
        'updateShapeProperties': {
            'objectId': background_shape_id,
            'shapeProperties': {
                'shapeBackgroundFill': {
                    'solidFill': {
                        'color': {
                            'rgbColor': {'red': 0.95, 'green': 0.97, 'blue': 1.0}
                        }
                    }
                },
                'outline': {'outlineFill': {'solidFill': {'color': {'rgbColor': {'red': 0.8, 'green': 0.85, 'blue': 0.95}}}}}
            },
            'fields': 'shapeBackgroundFill,outline'
        }
    })

    requests.append({
        'createShape': {
            'objectId': title_bg_id,
            'shapeType': 'RECTANGLE',
            'elementProperties': {
                'pageObjectId': slide_id,
                'size': {'height': {'magnitude': 80, 'unit': 'PT'}, 'width': {'magnitude': 620, 'unit': 'PT'}},
                'transform': {'scaleX': 1, 'scaleY': 1, 'translateX': 50, 'translateY': 10, 'unit': 'PT'}
            }
        }
    })

    requests.append({
        'updateShapeProperties': {
            'objectId': title_bg_id,
            'shapeProperties': {
                'shapeBackgroundFill': {
                    'solidFill': {
                        'color': {
                            'rgbColor': {'red': 0.2, 'green': 0.4, 'blue': 0.8}
                        }
                    }
                }
            },
            'fields': 'shapeBackgroundFill'
        }
    })

    requests.append({
        'createShape': {
            'objectId': title_box_id,
            'shapeType': 'TEXT_BOX',
            'elementProperties': {
                'pageObjectId': slide_id,
                'size': {'height': {'magnitude': 80, 'unit': 'PT'}, 'width': {'magnitude': 620, 'unit': 'PT'}},
                'transform': {'scaleX': 1, 'scaleY': 1, 'translateX': 50, 'translateY': 10, 'unit': 'PT'}
            }
        }
    })

    requests.append({
        'insertText': {'objectId': title_box_id, 'insertionIndex': 0, 'text': title}
    })

    requests.append({
        'updateTextStyle': {
            'objectId': title_box_id,
            'textRange': {'type': 'ALL'},
            'style': {
                'bold': True,
                'fontSize': {'magnitude': 32, 'unit': 'PT'},
                'foregroundColor': {
                    'opaqueColor': {'rgbColor': {'red': 1.0, 'green': 1.0, 'blue': 1.0}}
                }
            },
            'fields': 'bold,fontSize,foregroundColor'
        }
    })

    requests.append({
        'updateParagraphStyle': {
            'objectId': title_box_id,
            'textRange': {'type': 'ALL'},
            'style': {'alignment': 'CENTER'},
            'fields': 'alignment'
        }
    })

    if image_url:
        content_width = 360
        content_x = 50
    else:
        content_width = 620
        content_x = 50

    # Create content box
    requests.append({
        'createShape': {
            'objectId': content_box_id,
            'shapeType': 'TEXT_BOX',
            'elementProperties': {
                'pageObjectId': slide_id,
                'size': {'height': {'magnitude': 350, 'unit': 'PT'}, 'width': {'magnitude': content_width, 'unit': 'PT'}},
                'transform': {'scaleX': 1, 'scaleY': 1, 'translateX': content_x, 'translateY': 110, 'unit': 'PT'}
            }
        }
    })

    # Add content text
    requests.append({
        'insertText': {
            'objectId': content_box_id,
            'insertionIndex': 0,
            'text': '\n'.join(f"🔹 {pt}" for pt in content_points)
        }
    })

    # Style content text
    requests.append({
        'updateTextStyle': {
            'objectId': content_box_id,
            'textRange': {'type': 'ALL'},
            'style': {
                'fontSize': {'magnitude': 16, 'unit': 'PT'},
                'foregroundColor': {
                    'opaqueColor': {'rgbColor': {'red': 0.1, 'green': 0.2, 'blue': 0.4}}
                }
            },
            'fields': 'fontSize,foregroundColor'
        }
    })

    # Style content paragraphs
    requests.append({
        'updateParagraphStyle': {
            'objectId': content_box_id,
            'textRange': {'type': 'ALL'},
            'style': {
                'lineSpacing': 150,
                'spaceAbove': {'magnitude': 8, 'unit': 'PT'},
                'spaceBelow': {'magnitude': 8, 'unit': 'PT'},
                'indentStart': {'magnitude': 15, 'unit': 'PT'}
            },
            'fields': 'lineSpacing,spaceAbove,spaceBelow,indentStart'
        }
    })

    # Add image with decorative border if present
    if image_url:
        # Image border/frame
        image_frame_id = f'{slide_id}_image_frame'
        requests.append({
            'createShape': {
                'objectId': image_frame_id,
                'shapeType': 'RECTANGLE',
                'elementProperties': {
                    'pageObjectId': slide_id,
                    'size': {'height': {'magnitude': 220, 'unit': 'PT'}, 'width': {'magnitude': 220, 'unit': 'PT'}},
                    'transform': {'scaleX': 1, 'scaleY': 1, 'translateX': 440, 'translateY': 120, 'unit': 'PT'}
                }
            }
        })

        # Style image frame
        requests.append({
            'updateShapeProperties': {
                'objectId': image_frame_id,
                'shapeProperties': {
                    'shapeBackgroundFill': {
                        'solidFill': {
                            'color': {
                                'rgbColor': {'red': 0.9, 'green': 0.95, 'blue': 1.0}
                            }
                        }
                    },
                    'outline': {
                        'outlineFill': {
                            'solidFill': {
                                'color': {
                                    'rgbColor': {'red': 0.3, 'green': 0.5, 'blue': 0.9}
                                }
                            }
                        },
                        'weight': {'magnitude': 3, 'unit': 'PT'}
                    }
                },
                'fields': 'shapeBackgroundFill,outline'
            }
        })

        # Add the actual image
        requests.append({
            'createImage': {
                'objectId': image_id,
                'url': image_url,
                'elementProperties': {
                    'pageObjectId': slide_id,
                    'size': {'height': {'magnitude': 200, 'unit': 'PT'}, 'width': {'magnitude': 200, 'unit': 'PT'}},
                    'transform': {'scaleX': 1, 'scaleY': 1, 'translateX': 450, 'translateY': 130, 'unit': 'PT'}
                }
            }
        })

    return requests


def create_slides_from_json(presentation_id: str, slides_dict: dict) -> str:
    """
    Create slides in the given Google Slides presentation using the JSON data.
    This is the only function that should be called from outside.
    """
    service = _get_slides_service()
    _clear_all_slides(presentation_id, service)

    data = slides_dict

    slides_data = data.get("slides", [])
    all_requests = []

    for idx, slide in enumerate(slides_data):
        slide_id = f'slide_{idx+1:03d}'
        image_url = slide.get('image')
        all_requests += _create_slide_requests(slide_id, slide['title'], slide['content'], image_url)

    service.presentations().batchUpdate(
        presentationId=presentation_id,
        body={'requests': all_requests}
    ).execute()
    return f"https://docs.google.com/presentation/d/{presentation_id}"
import json


slides_dict = {
  "title": "Chapter: पृथ्वी आणि आपले जीवन",
  "slides": [
    {
      "title": "Slide 1",
      "content": [
        "आकाशातील सर्व वस्तूंना 'खगोलीय वस्तू' म्हणतात.",
        "ज्या चांदण्या लुकलुकतात त्यांना तारे म्हणतात. तारे स्वयंप्रकाशित असतात.",
        "सूर्य हा एक तारा आहे. तो आपल्या जवळ असल्यामुळे मोठा व तेजस्वी दिसतो.",
        "ज्या चांदण्या लुकलुकत नाहीत त्यांना ग्रह म्हणतात. ग्रहांना स्वतःचा प्रकाश नसतो, त्यांना ताऱ्यांकडून प्रकाश मिळतो.",
        "आपली पृथ्वी हा एक ग्रह आहे. तिला सूर्यापासून प्रकाश मिळतो.",
        "पृथ्वी सूर्याभोवती फिरते, याला पृथ्वीचे परिभ्रमण म्हणतात."
      ],
      "image": "https://storage.googleapis.com/aicharya_image/evs_chapter6_1.png"
    },
    {
      "title": "Slide 2",
      "content": [
        "सूर्यमालेत पृथ्वीशिवाय बुध, शुक्र, मंगळ, गुरु, शनि, युरेनस, नेपच्यून हे आणखी सात ग्रह आहेत.",
        "सूर्य आणि त्याच्याभोवती परिभ्रमण करणाऱ्या ग्रहांना एकत्रितपणे सूर्यमाला म्हणतात.",
        "सूर्यमालेतील प्रत्येक ग्रह सूर्याभोवती ठरावीक मार्गावरून फिरतो, ज्याला त्या ग्रहाची कक्षा म्हणतात.",
        "ग्रहांभोवती परिभ्रमण करणाऱ्या खगोलीय वस्तूंना उपग्रह म्हणतात. चंद्र हा पृथ्वीचा उपग्रह आहे.",
        "सूर्याभोवती स्वतंत्रपणे परिभ्रमण करणाऱ्या लहान खगोलीय वस्तूंना बटुग्रह म्हणतात. उदा. प्लुटो.",
        "मंगळ व गुरू या ग्रहांच्या दरम्यान असंख्य लहान खगोलीय वस्तूंचा एक पट्टा आहे, ज्याला लघुग्रह म्हणतात."
      ],
      "image": "https://storage.googleapis.com/aicharya_image/evs_chapter6_2.png"
    },
    {
      "title": "Slide 3",
      "content": [
        "सूर्यमालेत सूर्य, ग्रह, उपग्रह, लघुग्रह आणि बटुग्रह यांचा समावेश होतो.",
        "खगोलीय वस्तूंमध्ये एकमेकांना स्वतःकडे खेचण्याची शक्ती असते, जिला गुरुत्वाकर्षण म्हणतात.",
        "सूर्याची ग्रहांवर कार्य करणारी गुरुत्वाकर्षण शक्ती आणि ग्रहांची सूर्यापासून दूर जाण्याची प्रवृत्ती यांच्या एकत्रित परिणामामुळे ग्रह सूर्याभोवती ठरावीक कक्षेत फिरतात.",
        "पृथ्वीच्या गुरुत्वाकर्षणामुळे पृथ्वीवरील सर्व वस्तू पृथ्वीवरच राहतात.",
        "अवकाश म्हणजे ग्रह, तारे यांच्या दरम्यान असणारी रिकामी जागा, यालाच अंतराळ असेही म्हणतात.",
        "पृथ्वीच्या गुरुत्वाकर्षणाच्या विरुद्ध शक्ती देऊन वस्तूला अवकाशात पाठवण्याच्या तंत्रज्ञानाला 'अवकाश प्रक्षेपण तंत्र' म्हणतात."
      ],
      "image": None
    },
    {
      "title": "Slide 4",
      "content": [
        "ISRO ने चंद्रयान-१ (२२ ऑक्टोबर २००८) आणि मंगलयान (M.O.M., ५ नोव्हेंबर २०१३) या यशस्वी मानवविरहित अवकाश मोहिमा पार पाडल्या आहेत.",
        "अवकाशयानाचे अवकाशात प्रक्षेपण करण्यासाठी शक्तिशाली अग्निबाणांचा म्हणजेच रॉकेटचा उपयोग करतात.",
        "कृत्रिम उपग्रहांचा उपयोग शेती, पर्यावरणाचे निरीक्षण, हवामान अंदाज, नकाशे तयार करणे, पृथ्वीवरील पाणी व खनिज संपत्तीचा शोध घेणे व संदेशवहन करण्यासाठी होतो.",
        "पृथ्वीसारखी सजीवसृष्टी असलेला एकही ग्रह अवकाश संशोधकांना अद्याप आढळलेला नाही, त्यामुळे आपली पृथ्वी हा एक अनमोल ग्रह आहे.",
        "सूर्य हा तारा आहे. सूर्यमालेतील इतर सर्व खगोलीय वस्तूंना सूर्यापासून प्रकाश मिळतो.",
        "सूर्य व त्याच्या भोवती परिभ्रमण करणारी पृथ्वी, इतर सात ग्रह, उपग्रह, बटुग्रह आणि लघुग्रह यांना एकत्रितपणे सूर्यमाला असे म्हणतात."
      ],
      "image": None
    },
    {
      "title": "Slide 5",
      "content": [
        "गुरुत्वाकर्षणामुळे पृथ्वीवरील वस्तू पृथ्वीवरच राहतात.",
        "अवकाशभ्रमण करण्यासाठी पृथ्वीच्या गुरुत्वाकर्षणाच्या बाहेर पडावे लागते, त्यासाठी अग्निबाणाचे तंत्रज्ञान वापरतात.",
        "राकेश शर्मा हे १९८४ साली अवकाशात जाणारे पहिले भारतीय अंतराळवीर होते.",
        "सूर्य, ग्रह, लघुग्रह, धूमकेतू इत्यादी खगोलीय वस्तूंना एकत्रितपणे सूर्यमाला म्हणतात.",
        "सूर्यमालेतील ग्रहांचा सूर्यापासूनचा क्रम: बुध, शुक्र, पृथ्वी, मंगळ, गुरू, शनी, युरेनस, नेपच्यून.",
        "सूर्य हा एक तारा असून तो स्वयंप्रकाशी आहे व त्याच्या प्रकाशामुळेच ग्रह प्रकाशित होतात."
      ],
      "image": None
    },
    {
      "title": "Slide 6",
      "content": [
        "ग्रह स्वतःभोवती फिरतात (परिभ्रमण) आणि सूर्याभोवतीही फिरतात (प्रदक्षिणा).",
        "उपग्रह ग्रहांभोवती फिरतात.",
        "पृथ्वी हा सूर्यमालेतील एकमेव ज्ञात ग्रह आहे जिथे सजीवसृष्टी आहे.",
        "पृथ्वीच्या गुरुत्वाकर्षणावर मात करून अवकाशात जाण्यासाठी रॉकेटचा उपयोग होतो.",
        "कृत्रिम उपग्रह दूरसंचार, हवामान अंदाज, नकाशानर्मिती आणि नैसर्गिक साधनसंपत्तीचा शोध घेण्यासाठी उपयुक्त माहिती पुरवतात."
      ],
      "image": None
    }
  ]
}


presentation_id = ""  

try:
    slide_url = create_slides_from_json(presentation_id, slides_dict)
    print(f"Slides created successfully! URL: {slide_url}")
except Exception as e:
    print(f"Error creating slides: {e}")

