from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from middleware.auth import get_current_user
from database import get_db
from services.skill_graph import recalculate_readiness
from models.schemas import ProfileUpdate

router = APIRouter()

def _ser(user: dict) -> dict:
    user["id"] = str(user.pop("_id"))
    user.pop("password_hash", None)
    return user

@router.get("/me")
async def get_profile(current_user=Depends(get_current_user)):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        raise HTTPException(404, "User not found")
    return _ser(user)

@router.put("/me")
async def update_profile(data: ProfileUpdate, current_user=Depends(get_current_user)):
    db     = get_db()
    update = {k: v for k, v in data.dict(exclude_none=True).items()}
    if "skills" in update:
        update["skills"] = [s.dict() if hasattr(s, "dict") else s for s in update["skills"]]
    update["updated_at"] = datetime.utcnow()

    await db.users.update_one({"_id": ObjectId(current_user["user_id"])}, {"$set": update})

    if "skills" in update or "target_role" in update:
        user  = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
        score = await recalculate_readiness(user)
        await db.users.update_one(
            {"_id": ObjectId(current_user["user_id"])},
            {"$set": {"readiness_score": score}}
        )
    return {"message": "Profile updated"}

# ✅ Composite placement readiness score
@router.get("/placement-score")
async def placement_score(current_user=Depends(get_current_user)):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})

    gap_score      = user.get("readiness_score", 0)
    resume_score   = user.get("resume_score", 0)
    verified_count = len(user.get("verified_skills", []))
    total_skills   = max(len(user.get("skills", [])), 1)
    verified_ratio = min(100, int((verified_count / total_skills) * 100))
    github_score   = user.get("github_data", {}).get("github_score", 0)

    placement = int(
        gap_score      * 0.40 +
        resume_score   * 0.25 +
        verified_ratio * 0.20 +
        github_score   * 0.15
    )
    return {
        "placement_score": placement,
        "breakdown": {
            "skill_readiness":  gap_score,
            "resume_quality":   resume_score,
            "verified_skills":  verified_ratio,
            "github_portfolio": github_score,
        }
    }

@router.get("/progress-history")
async def progress_history(current_user=Depends(get_current_user)):
    db      = get_db()
    history = await db.score_history.find(
        {"user_id": current_user["user_id"]}
    ).sort("recorded_at", -1).limit(12).to_list(12)
    for h in history:
        h["id"] = str(h.pop("_id"))
    return history

@router.post("/progress-snapshot")
async def save_snapshot(current_user=Depends(get_current_user)):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    await db.score_history.insert_one({
        "user_id":          current_user["user_id"],
        "readiness_score":  user.get("readiness_score", 0),
        "skills_count":     len(user.get("skills", [])),
        "verified_count":   len(user.get("verified_skills", [])),
        "recorded_at":      datetime.utcnow(),
    })
    return {"message": "Snapshot saved"}
