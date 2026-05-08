"""
Run this once after starting backend to seed MongoDB with
the Skill Knowledge Graph data.

Usage:
  cd backend
  source venv/bin/activate
  python seed.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import connect_db, get_db
from services.skill_graph import SKILL_KNOWLEDGE_GRAPH, SKILL_PREREQUISITES, LEARNING_RESOURCES

async def seed():
    await connect_db()
    db = get_db()

    print("Seeding skill_graph collection...")
    for role, data in SKILL_KNOWLEDGE_GRAPH.items():
        await db.skill_graph.update_one(
            {"role": role},
            {"$setOnInsert": {"role": role, "required_skills": data["required"]}},
            upsert=True
        )
        print(f"  ✅ {role}")

    print("\nSeeding skills collection...")
    for skill, prereqs in SKILL_PREREQUISITES.items():
        resource = LEARNING_RESOURCES.get(skill, {})
        await db.skills.update_one(
            {"name": skill},
            {"$setOnInsert": {
                "name": skill,
                "prerequisites": prereqs,
                "resource_url": resource.get("url", ""),
                "platform": resource.get("platform", ""),
                "hours": resource.get("hours", 10),
            }},
            upsert=True
        )
        print(f"  ✅ {skill}")

    count_roles  = await db.skill_graph.count_documents({})
    count_skills = await db.skills.count_documents({})
    print(f"\n✅ Seeding complete!")
    print(f"   Roles in DB:  {count_roles}")
    print(f"   Skills in DB: {count_skills}")
    print(f"\nYou can now start the server: uvicorn main:app --reload --port 8000")

if __name__ == "__main__":
    asyncio.run(seed())
