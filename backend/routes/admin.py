from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional

from database import get_db
from middleware.auth import get_current_user

router = APIRouter()

# ── Admin guard ────────────────────────────────────────────────
async def require_admin(current_user=Depends(get_current_user)):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user or not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ── Stats ──────────────────────────────────────────────────────
@router.get("/stats")
async def get_stats(admin=Depends(require_admin)):
    db = get_db()
    total_users  = await db.users.count_documents({})
    active_today = await db.users.count_documents({
        "updated_at": {"$gte": datetime.utcnow() - timedelta(days=1)}
    })
    total_analyses = await db.jd_analyses.count_documents({})
    total_feedback = await db.feedback.count_documents({})
    helpful_count  = await db.feedback.count_documents({"helpful": True})
    helpful_pct    = int((helpful_count / total_feedback) * 100) if total_feedback > 0 else 0

    # Average readiness
    pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$readiness_score"}}}]
    agg = await db.users.aggregate(pipeline).to_list(1)
    avg_readiness = int(agg[0]["avg"]) if agg else 0

    # Top target roles
    role_pipeline = [
        {"$match": {"target_role": {"$ne": None}}},
        {"$group": {"_id": "$target_role", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 5}
    ]
    top_roles = await db.users.aggregate(role_pipeline).to_list(5)

    return {
        "total_users":      total_users,
        "active_today":     active_today,
        "total_analyses":   total_analyses,
        "total_feedback":   total_feedback,
        "helpful_pct":      helpful_pct,
        "avg_readiness":    avg_readiness,
        "top_target_roles": top_roles,
    }

# ── Users ──────────────────────────────────────────────────────
@router.get("/users")
async def list_users(page: int = 1, limit: int = 20, admin=Depends(require_admin)):
    db   = get_db()
    skip = (page - 1) * min(limit, 50)
    users = await db.users.find({}).sort("created_at", -1).skip(skip).limit(min(limit, 50)).to_list(50)
    total = await db.users.count_documents({})
    for u in users:
        u["id"] = str(u.pop("_id"))
        u.pop("password_hash", None)
    return {"users": users, "total": total, "page": page, "pages": -(-total // min(limit, 50))}

@router.put("/users/{user_id}")
async def update_user(user_id: str, data: dict, admin=Depends(require_admin)):
    db = get_db()
    # Only allow safe fields to be updated by admin
    safe = {k: v for k, v in data.items() if k in {"is_admin", "target_role", "readiness_score"}}
    safe["updated_at"] = datetime.utcnow()
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": safe})
    return {"message": "User updated"}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin=Depends(require_admin)):
    db = get_db()
    # Delete user and all their data
    await db.users.delete_one({"_id": ObjectId(user_id)})
    uid = user_id
    for col in ["roadmaps","chat_sessions","jd_analyses","score_history","feedback","verif_sessions","notifications"]:
        await getattr(db, col).delete_many({"user_id": uid})
    return {"message": "User and all data deleted"}

# ── Roles (Skill Knowledge Graph management) ───────────────────
@router.get("/roles")
async def list_roles(admin=Depends(require_admin)):
    db    = get_db()
    roles = await db.skill_graph.find({}).to_list(100)
    for r in roles:
        r["id"] = str(r.pop("_id"))
    return roles

@router.post("/roles")
async def add_role(data: dict, admin=Depends(require_admin)):
    db = get_db()
    if await db.skill_graph.find_one({"role": data.get("role")}):
        raise HTTPException(400, f"Role '{data['role']}' already exists")
    await db.skill_graph.insert_one({
        "role":           data["role"],
        "required_skills": data.get("required_skills", []),
        "created_at":     datetime.utcnow(),
    })
    return {"message": f"Role '{data['role']}' added"}

@router.put("/roles/{role}")
async def update_role(role: str, data: dict, admin=Depends(require_admin)):
    db = get_db()
    await db.skill_graph.update_one(
        {"role": role},
        {"$set": {k: v for k, v in data.items() if k != "_id"}}
    )
    return {"message": f"Role '{role}' updated"}

@router.delete("/roles/{role}")
async def delete_role(role: str, admin=Depends(require_admin)):
    db = get_db()
    await db.skill_graph.delete_one({"role": role})
    return {"message": f"Role '{role}' deleted"}

# ── Learning Resources ─────────────────────────────────────────
@router.get("/resources")
async def list_resources(admin=Depends(require_admin)):
    db        = get_db()
    resources = await db.learning_resources.find({}).to_list(200)
    for r in resources:
        r["id"] = str(r.pop("_id"))
    return resources

@router.post("/resources")
async def add_resource(data: dict, admin=Depends(require_admin)):
    db = get_db()
    await db.learning_resources.insert_one({**data, "created_at": datetime.utcnow()})
    return {"message": "Resource added"}

@router.delete("/resources/{resource_id}")
async def delete_resource(resource_id: str, admin=Depends(require_admin)):
    db = get_db()
    await db.learning_resources.delete_one({"_id": ObjectId(resource_id)})
    return {"message": "Resource deleted"}

# ── Feedback review ────────────────────────────────────────────
@router.get("/feedback")
async def list_feedback(page: int = 1, admin=Depends(require_admin)):
    db   = get_db()
    skip = (page - 1) * 20
    items = await db.feedback.find({}).sort("created_at", -1).skip(skip).limit(20).to_list(20)
    total = await db.feedback.count_documents({})
    for item in items:
        item["id"] = str(item.pop("_id"))
    return {"items": items, "total": total}

# ── Send notification to users ─────────────────────────────────
@router.post("/notifications/send")
async def send_notification(data: dict, admin=Depends(require_admin)):
    db      = get_db()
    target  = data.get("target", "all")
    message = data.get("message", "")
    title   = data.get("title", "Platform Update")
    ntype   = data.get("type", "info")

    if not message:
        raise HTTPException(400, "Message is required")

    query = {}
    if target == "inactive":
        query = {"updated_at": {"$lt": datetime.utcnow() - timedelta(days=7)}}
    elif target == "low_score":
        query = {"readiness_score": {"$lt": 40}}

    users = await db.users.find(query, {"_id": 1}).to_list(None)

    notifications = [{
        "user_id":    str(u["_id"]),
        "title":      title,
        "message":    message,
        "type":       ntype,
        "read":       False,
        "created_at": datetime.utcnow(),
    } for u in users]

    if notifications:
        await db.notifications.insert_many(notifications)

    return {"message": f"Sent to {len(notifications)} users"}
