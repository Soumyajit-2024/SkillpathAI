"""interview.py"""
from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from services.ai_service import evaluate_interview_answer
from models.schemas import AnswerSubmission

router = APIRouter()

QUESTION_BANK = {
    "Backend Developer": [
        {"id":1,"question":"Explain how REST APIs work and describe the key HTTP methods.","category":"technical"},
        {"id":2,"question":"What is the difference between SQL and NoSQL databases? When would you use each?","category":"technical"},
        {"id":3,"question":"Walk me through how you would design a simple URL shortener system.","category":"system_design"},
        {"id":4,"question":"What is JWT authentication and how does it work?","category":"technical"},
        {"id":5,"question":"Describe a challenging bug you fixed and how you approached it.","category":"behavioral"},
    ],
    "Data Scientist": [
        {"id":1,"question":"Explain the bias-variance tradeoff in machine learning.","category":"technical"},
        {"id":2,"question":"How would you handle a highly imbalanced dataset?","category":"technical"},
        {"id":3,"question":"Walk through how you would build a recommendation system.","category":"system_design"},
        {"id":4,"question":"What cross-validation techniques have you used and why?","category":"technical"},
        {"id":5,"question":"Describe a data science project you completed end-to-end.","category":"behavioral"},
    ],
    "Full Stack Developer": [
        {"id":1,"question":"Explain the virtual DOM in React and why it's useful.","category":"technical"},
        {"id":2,"question":"How does event loop work in Node.js?","category":"technical"},
        {"id":3,"question":"Design a real-time chat application architecture.","category":"system_design"},
        {"id":4,"question":"What's the difference between authentication and authorization?","category":"technical"},
        {"id":5,"question":"Describe your experience working in a team on a full stack project.","category":"behavioral"},
    ],
}

@router.get("/questions")
async def get_questions(role: str = "Backend Developer", current_user=Depends(get_current_user)):
    questions = QUESTION_BANK.get(role, QUESTION_BANK["Backend Developer"])
    return {"role": role, "questions": questions}

@router.post("/evaluate")
async def evaluate_answer(submission: AnswerSubmission, current_user=Depends(get_current_user)):
    result = await evaluate_interview_answer(
        submission.question, submission.answer, submission.role
    )
    return result
