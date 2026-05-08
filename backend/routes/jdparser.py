"""jdparser.py"""
from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime
from middleware.auth import get_current_user
from database import get_db
from services.ai_service import parse_job_description
from models.schemas import JDParseRequest

router = APIRouter()

@router.post("/parse")
async def parse_jd(req: JDParseRequest, current_user=Depends(get_current_user)):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})

    parsed = await parse_job_description(req.jd_text)
    my_skills = set(
        (s["name"].lower() if isinstance(s, dict) else s.lower())
        for s in user.get("skills", [])
    )
    required = parsed.get("required_skills", [])
    matched  = [s for s in required if s.lower() in my_skills]
    missing  = [s for s in required if s.lower() not in my_skills]
    pct      = int((len(matched) / len(required)) * 100) if required else 0

    explanation = (
        f"You match {len(matched)} of {len(required)} required skills for this {parsed.get('role', 'role')}. "
        f"Your strongest matches are {', '.join(matched[:3]) if matched else 'none yet'}. "
        f"Focus on {', '.join(missing[:3]) if missing else 'all requirements met'} to increase your match."
    )

    result = {
        "role":             parsed.get("role", ""),
        "experience_level": parsed.get("experience_level", ""),
        "required_skills":  required,
        "nice_to_have":     parsed.get("nice_to_have", []),
        "matched_skills":   matched,
        "missing_skills":   missing,
        "match_percent":    pct,
        "explanation":      explanation,
    }
    await db.jd_analyses.insert_one({
        "user_id": current_user["user_id"],
        "result":  result,
        "jd_text": req.jd_text[:500],
        "analyzed_at": datetime.utcnow(),
    })
    return result

@router.get("/history")
async def jd_history(current_user=Depends(get_current_user)):
    db      = get_db()
    records = await db.jd_analyses.find({"user_id": current_user["user_id"]}).sort("analyzed_at", -1).limit(10).to_list(10)
    for r in records:
        r["id"] = str(r.pop("_id"))
    return records
