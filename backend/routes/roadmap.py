"""roadmap.py"""
from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime
from middleware.auth import get_current_user
from database import get_db
from services.skill_graph import analyze_gaps, recalculate_readiness, get_resource
from services.ai_service import generate_roadmap

router = APIRouter()

@router.get("/")
async def get_roadmap(current_user=Depends(get_current_user)):
    db        = get_db()
    existing  = await db.roadmaps.find_one({"user_id": current_user["user_id"]})
    if existing:
        existing.pop("_id")
        return existing

    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user.get("target_role"):
        return {"error": "Set a target role first"}

    user_skill_map = {
        s["name"].lower() if isinstance(s, dict) else s.lower(): s.get("level", 50) if isinstance(s, dict) else 50
        for s in user.get("skills", [])
    }
    gaps    = analyze_gaps(user_skill_map, user["target_role"])
    missing = [g["skill"] for g in gaps if g["gap"] > 0][:8]
    current = [s["name"] if isinstance(s, dict) else s for s in user.get("skills", [])]

    try:
        steps = await generate_roadmap(user["target_role"], missing, current)
    except Exception:
        steps = [{"week": i+1, "skill": sk, "resource": get_resource(sk)["platform"],
                  "resource_url": get_resource(sk)["url"], "hours": get_resource(sk)["hours"],
                  "done": False} for i, sk in enumerate(missing)]

    doc = {
        "user_id":     current_user["user_id"],
        "target_role": user["target_role"],
        "steps":       steps,
        "created_at":  datetime.utcnow().isoformat(),
        "updated_at":  datetime.utcnow().isoformat(),
    }
    await db.roadmaps.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.patch("/step")
async def mark_step_done(week: int, current_user=Depends(get_current_user)):
    db = get_db()
    await db.roadmaps.update_one(
        {"user_id": current_user["user_id"], "steps.week": week},
        {"$set": {"steps.$.done": True, "steps.$.done_at": datetime.utcnow().isoformat(),
                  "updated_at": datetime.utcnow().isoformat()}}
    )
    return {"message": f"Week {week} marked done"}

@router.delete("/regenerate")
async def regenerate_roadmap(current_user=Depends(get_current_user)):
    db = get_db()
    await db.roadmaps.delete_one({"user_id": current_user["user_id"]})
    return {"message": "Roadmap deleted. Call GET /roadmap to regenerate."}
