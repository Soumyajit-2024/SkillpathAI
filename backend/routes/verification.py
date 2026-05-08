from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timedelta
from middleware.auth import get_current_user
from database import get_db
from services.ai_service import generate_verification_questions
from models.schemas import VerificationSubmission

router = APIRouter()

@router.get("/questions/{skill}")
async def get_questions(skill: str, current_user=Depends(get_current_user)):
    db = get_db()

    # Check if unexpired session already exists
    existing = await db.verif_sessions.find_one({
        "user_id": current_user["user_id"],
        "skill":   skill,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    if existing:
        # Return questions WITHOUT correct answers
        questions = [{k: v for k, v in q.items() if k != "correct"}
                     for q in existing["questions"]]
        return {"skill": skill, "questions": questions}

    # Generate fresh questions
    questions = await generate_verification_questions(skill)
    if not questions or not isinstance(questions, list):
        raise HTTPException(500, "Failed to generate questions. Try again.")

    # ✅ Store FULL questions (with correct answers) in MongoDB
    await db.verif_sessions.delete_many({
        "user_id": current_user["user_id"], "skill": skill
    })
    await db.verif_sessions.insert_one({
        "user_id":    current_user["user_id"],
        "skill":      skill,
        "questions":  questions,           # includes "correct" index
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=2),
    })

    # Strip correct answers before sending to client
    client_questions = [{k: v for k, v in q.items() if k != "correct"}
                        for q in questions]
    return {"skill": skill, "questions": client_questions}


@router.post("/submit")
async def submit_verification(sub: VerificationSubmission, current_user=Depends(get_current_user)):
    db = get_db()

    # ✅ Fetch stored questions from MongoDB — NOT regenerated from LLM
    session = await db.verif_sessions.find_one({
        "user_id": current_user["user_id"],
        "skill":   sub.skill,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    if not session:
        raise HTTPException(400, "Session expired or not found. Request questions again.")

    questions = session["questions"]
    total     = len(questions)
    correct_count = sum(
        1 for q in questions
        if sub.answers.get(str(q["id"])) == q.get("correct")
        or sub.answers.get(q["id"]) == q.get("correct")
    )
    passed = correct_count >= int(total * 0.6)

    # Clean up session after use
    await db.verif_sessions.delete_one({"_id": session["_id"]})

    if passed:
        await db.users.update_one(
            {"_id": ObjectId(current_user["user_id"])},
            {
                "$addToSet": {"verified_skills": sub.skill},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        await db.users.update_one(
            {"_id": ObjectId(current_user["user_id"]), "skills.name": sub.skill},
            {"$set": {"skills.$.verified": "verified"}}
        )

    return {
        "skill":   sub.skill,
        "passed":  passed,
        "score":   correct_count,
        "total":   total,
        "percent": round((correct_count / total) * 100),
        "message": (
            f"✅ Skill verified! {correct_count}/{total} correct." if passed
            else f"❌ Not yet. {correct_count}/{total} correct. Need {int(total*0.6)}/{total} to pass."
        )
    }
