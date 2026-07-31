import os
from ..facerecognition.face_recognition import load_image, get_face_encodings as fr_get_face_encodings
from app.utils.encoding import load_encodings, save_encodings
import numpy as np

DATA_PATH = os.path.join(os.getcwd(), 'data', 'encodings.pkl')
os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)  # Ensure folder exists

encodings, roll_nos = load_encodings(DATA_PATH)

def register_student(image_path, roll_no):
    if str(roll_no) in roll_nos:
        print(f"Roll number {roll_no} is already registered.")
        return

    img = load_image(image_path)
    new_encodings = fr_get_face_encodings(img)

    if len(new_encodings) == 0:
        print(f"No face found in {os.path.basename(image_path)}")
        return

    encodings.append(new_encodings[0])
    roll_nos.append(str(roll_no))
    print(f"Registered roll no: {roll_no}")

    save_encodings(DATA_PATH, encodings, roll_nos)
    print("Encodings saved successfully.")



