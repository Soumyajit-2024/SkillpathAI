from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, TEXT
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "skillpath_ai")

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db     = client[DB_NAME]
    await _create_indexes()
    print(f"✅ Connected to MongoDB: {DB_NAME}")

async def close_db():
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")

async def _create_indexes():
    # users
    await db.users.create_indexes([
        IndexModel([("email", ASCENDING)], unique=True),
        IndexModel([("username", ASCENDING)], unique=True),
    ])
    # skill_graph
    await db.skill_graph.create_indexes([
        IndexModel([("role", ASCENDING)], unique=True),
        IndexModel([("name", TEXT)]),
    ])
    # skills
    await db.skills.create_indexes([
        IndexModel([("name", ASCENDING)], unique=True),
        IndexModel([("name", TEXT), ("category", TEXT)]),
    ])
    # roadmaps
    await db.roadmaps.create_index([("user_id", ASCENDING)])
    # chat_sessions
    await db.chat_sessions.create_index([("user_id", ASCENDING)])
    # jd_analyses
    await db.jd_analyses.create_index([("user_id", ASCENDING)])
    # recommendations
    await db.recommendations.create_index([("user_id", ASCENDING)])

def get_db():
    return db
