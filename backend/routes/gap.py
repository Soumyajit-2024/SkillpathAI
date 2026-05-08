from fastapi import APIRouter, Depends
from bson import ObjectId
from middleware.auth import get_current_user
from database import get_db
from services.skill_graph import analyze_gaps, recalculate_readiness, get_role_requirements

router = APIRouter()

@router.get("/analyze")
async def get_gap_analysis(current_user=Depends(get_current_user)):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})

    if not user.get("target_role"):
        return {"error": "Please set a target role in your profile first"}

    user_skill_map = {
        (s["name"].lower() if isinstance(s, dict) else s.lower()):
        (s.get("level", 50) if isinstance(s, dict) else 50)
        for s in user.get("skills", [])
    }

    gaps         = analyze_gaps(user_skill_map, user["target_role"])
    requirements = get_role_requirements(user["target_role"])
    met          = [r["name"] for r in requirements
                    if user_skill_map.get(r["name"].lower(), 0) >= r["min_level"]]
    score        = await recalculate_readiness(user)

    # ✅ Real peer benchmarking via MongoDB aggregation
    peer_pct = None
    try:
        pipeline = [
            {"$match": {"target_role": user["target_role"], "readiness_score": {"$gt": 0}}},
            {"$group": {"_id": None, "scores": {"$push": "$readiness_score"}, "count": {"$sum": 1}}}
        ]
        agg = await db.users.aggregate(pipeline).to_list(1)
        if agg and agg[0]["count"] >= 5:
            scores = sorted(agg[0]["scores"])
            below  = sum(1 for s in scores if s < score)
            peer_pct = int((below / len(scores)) * 100)
    except Exception:
        pass   # Not enough data yet

    # Save updated score
    await db.users.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$set": {"readiness_score": score}}
    )

    return {
        "target_role":      user["target_role"],
        "readiness_score":  score,
        "gaps":             gaps,
        "met_skills":       met,
        "critical_count":   sum(1 for g in gaps if g["importance"] == "critical"  and g["gap"] > 0),
        "important_count":  sum(1 for g in gaps if g["importance"] == "important" and g["gap"] > 0),
        "peer_percentile":  peer_pct,   # None if insufficient data
    }

@router.get("/roles")
async def get_available_roles():
    """Return all roles that have skill mappings configured."""
    from services.skill_graph import SKILL_KNOWLEDGE_GRAPH
    return {"roles": list(SKILL_KNOWLEDGE_GRAPH.keys())}
