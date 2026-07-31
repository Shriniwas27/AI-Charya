from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
from dotenv import load_dotenv
import asyncio

from app.utils.logger import setup_logger

# Load environment variables
load_dotenv(verbose=True)

logger = setup_logger("mongodb")

# Get MongoDB config
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is not set")

MONGODB_DB = os.getenv("MONGODB_DB")
if not MONGODB_DB:
    raise ValueError("MONGODB_DB environment variable is not set")

# MongoDB Wrapper Class
class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    # Collections (add more if needed)
    student_collection = None
    teacher_collection = None
    class_record_collection = None
    topic_schedule_collection = None
    book_collection = None
    
mongodb = MongoDB()

async def connect_to_mongo():
    try:
        retries = 3
        while retries > 0:
            try:
                mongodb.client = AsyncIOMotorClient(
                    MONGODB_URI,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=5000
                )
                # Test the connection
                await mongodb.client.server_info()
                mongodb.db = mongodb.client[MONGODB_DB]

                # Store references to collections (optional but handy)
                mongodb.student_collection = mongodb.db["students"]
                mongodb.teacher_collection = mongodb.db["teachers"]
                mongodb.class_record_collection = mongodb.db["class_records"]
                mongodb.topic_schedule_collection = mongodb.db["topic_schedules"]
                mongodb.book_collection = mongodb.db["books"]
                logger.info(f"Successfully connected to MongoDB database: {MONGODB_DB}")
                break
            except (ServerSelectionTimeoutError, ConnectionFailure) as e:
                retries -= 1
                logger.warning(f"Connection attempt failed, retrying... ({retries} attempts left)")
                if retries == 0:
                    raise
                await asyncio.sleep(1)
    except Exception as e:
        logger.error(f"Unexpected error during MongoDB connection: {str(e)}")
        raise

async def close_mongo_connection():
    if mongodb.client:
        try:
            mongodb.client.close()
            logger.info("MongoDB connection closed successfully")
        except Exception as e:
            logger.error(f"Error closing MongoDB connection: {str(e)}")


