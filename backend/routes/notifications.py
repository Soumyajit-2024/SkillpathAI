from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime

from database import get_db
from middleware.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_notifications(current_user=Depends(get_current_user)):
    db    = get_db()
    items = await db.notifications.find(
        {"user_id": current_user["user_id"]}
    ).sort("created_at", -1).limit(50).to_list(50)
    for item in items:
        item["id"] = str(item.pop("_id"))
    return items

@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": current_user["user_id"]},
        {"$set": {"read": True, "read_at": datetime.utcnow()}}
    )
    return {"message": "Marked as read"}

@router.patch("/read-all")
async def mark_all_read(current_user=Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_many(
        {"user_id": current_user["user_id"], "read": False},
        {"$set": {"read": True, "read_at": datetime.utcnow()}}
    )
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    await db.notifications.delete_one({
        "_id": ObjectId(notification_id),
        "user_id": current_user["user_id"]
    })
    return {"message": "Deleted"}
