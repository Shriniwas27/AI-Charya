import os
from google.cloud import storage
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")

if not GOOGLE_APPLICATION_CREDENTIALS:
    raise EnvironmentError("GOOGLE_APPLICATION_CREDENTIALS not set in .env")

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS

def upload_to_gcs(local_file_path: str, destination_blob_name: str) -> str:
    try:
        client = storage.Client()
        bucket = client.bucket(GCS_BUCKET_NAME)
        blob = bucket.blob(destination_blob_name)

        blob.upload_from_filename(local_file_path)

    
        return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{destination_blob_name}"
    except Exception as e:
        raise Exception(f"Failed to upload to GCS: {e}")



