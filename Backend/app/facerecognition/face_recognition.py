import dlib
import numpy as np
import cv2
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


SHAPE_PREDICTOR_PATH = os.path.join(BASE_DIR, "models", "shape_predictor_68_face_landmarks.dat")
FACE_ENCODER_PATH = os.path.join(BASE_DIR, "models", "dlib_face_recognition_resnet_model_v1.dat")


face_detector = dlib.get_frontal_face_detector()
shape_predictor = dlib.shape_predictor(SHAPE_PREDICTOR_PATH)
face_encoder = dlib.face_recognition_model_v1(FACE_ENCODER_PATH)

def load_image(image_path):
    img = cv2.imread(image_path)
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

def get_face_encodings(img):
    dets = face_detector(img, 1)
    encodings = []
    for det in dets:
        shape = shape_predictor(img, det)
        encoding = np.array(face_encoder.compute_face_descriptor(img, shape))
        encodings.append(encoding)
    return encodings

