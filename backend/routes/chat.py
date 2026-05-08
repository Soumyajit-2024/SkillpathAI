"""chat.py"""
from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime
from middleware.auth import get_current_user
from database import get_db
from services.ai_service import career_chat
from models.schemas import ChatRequest

router = APIRouter()

@router.post("/")
async def chat(req: ChatRequest, current_user=Depends(get_current_user)):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    user.pop("_id", None); user.pop("password_hash", None)

    reply = await career_chat(user, [m.dict() for m in req.history], req.message)

    # Persist session
    session = await db.chat_sessions.find_one({"user_id": current_user["user_id"]})
    new_msgs = [{"role": "user", "content": req.message, "ts": datetime.utcnow().isoformat()},
                {"role": "assistant", "content": reply, "ts": datetime.utcnow().isoformat()}]
    if session:
        await db.chat_sessions.update_one(
            {"user_id": current_user["user_id"]},
            {"$push": {"messages": {"$each": new_msgs}}, "$set": {"updated_at": datetime.utcnow()}}
        )
        session_id = str(session["_id"])
    else:
        r = await db.chat_sessions.insert_one({
            "user_id": current_user["user_id"],
            "messages": new_msgs,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        session_id = str(r.inserted_id)
    return {"reply": reply, "session_id": session_id}

@router.get("/history")
async def chat_history(current_user=Depends(get_current_user)):
    db      = get_db()
    session = await db.chat_sessions.find_one({"user_id": current_user["user_id"]})
    if not session:
        return {"messages": []}
    return {"messages": session.get("messages", [])[-40:]}   # last 40 messages
