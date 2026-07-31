# app/facerecognition/recognize_student.py

from ..facerecognition.face_recognition import load_image, get_face_encodings 
import numpy as np
import os
from app.utils.encoding import load_encodings

DATA_PATH = os.path.join(os.getcwd(), 'data', 'encodings.pkl')

def recognize_student_from_image(image_path: str):
    known_encodings, known_roll_nos = load_encodings(DATA_PATH)

    if not known_encodings:
        return ["No registered encodings found."]

    img = load_image(image_path)
    face_encodings = get_face_encodings(img)

    if len(face_encodings) == 0:
        return ["No face found"]

    matched_roll_nos = []
    for test_encoding in face_encodings:
        dists = np.linalg.norm(np.array(known_encodings) - test_encoding, axis=1)
        min_idx = np.argmin(dists)

        if dists[min_idx] < 0.5:
            matched_roll_nos.append(known_roll_nos[min_idx])
        else:
            matched_roll_nos.append("Unknown")

    return matched_roll_nos
