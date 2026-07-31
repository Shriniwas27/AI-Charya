import pickle
import os

def save_encodings(file_path, encodings, roll_nos):
    """
    Saves face encodings along with roll numbers to a pickle file.

    Args:
        file_path (str): Path to save file.
        encodings (list): List of face embeddings.
        roll_nos (list): List of roll numbers (as strings).
    """
    with open(file_path, 'wb') as f:
        pickle.dump({'encodings': encodings, 'roll_nos': roll_nos}, f)

def load_encodings(file_path):
    """
    Loads face encodings and roll numbers from a pickle file.

    Args:
        file_path (str): Path of the pickle file.

    Returns:
        tuple: (encodings, roll_nos)
    """
    if not os.path.exists(file_path):
        return [], []
    with open(file_path, 'rb') as f:
        data = pickle.load(f)
    return data['encodings'], data['roll_nos']