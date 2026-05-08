"""recommendations.py"""
from fastapi import APIRouter, Depends
from bson import ObjectId
from middleware.auth import get_current_user
from database import get_db
from services.skill_graph import get_role_requirements
from models.schemas import FeedbackRequest

router = APIRouter()

INTERNSHIP_DB = [
    {"id":"i1","title":"Backend Developer Intern","company":"Flipkart","skills":["Node.js","MongoDB","REST APIs"],"stipend":"₹25k/mo","type":"Remote"},
    {"id":"i2","title":"Full Stack Intern","company":"Swiggy","skills":["React","Node.js","SQL"],"stipend":"₹20k/mo","type":"Hybrid"},
    {"id":"i3","title":"Python Developer Intern","company":"Razorpay","skills":["Python","REST APIs","PostgreSQL"],"stipend":"₹30k/mo","type":"On-site"},
    {"id":"i4","title":"Data Analyst Intern","company":"CRED","skills":["Python","SQL","Pandas","Tableau"],"stipend":"₹22k/mo","type":"Remote"},
    {"id":"i5","title":"ML Intern","company":"Zepto","skills":["Python","Machine Learning","Scikit-learn"],"stipend":"₹28k/mo","type":"Remote"},
]

PROJECT_DB = [
    {"id":"p1","title":"REST API with JWT Auth","skills":"Node.js, MongoDB, JWT","time":"5 days","fills":["Node.js","MongoDB","REST APIs"],"level":"Intermediate"},
    {"id":"p2","title":"Docker + Node.js Microservice","skills":"Docker, Node.js, Nginx","time":"4 days","fills":["Docker","DevOps basics"],"level":"Intermediate"},
    {"id":"p3","title":"System Design: URL Shortener","skills":"Redis, SQL, Caching","time":"6 days","fills":["System Design","Redis"],"level":"Advanced"},
    {"id":"p4","title":"ML Price Predictor","skills":"Python, Scikit-learn, Pandas","time":"5 days","fills":["Machine Learning","Python"],"level":"Intermediate"},
    {"id":"p5","title":"Chat App with WebSockets","skills":"Node.js, Socket.io, MongoDB","time":"4 days","fills":["Node.js","WebSockets"],"level":"Intermediate"},
]

CERT_DB = [
    {"id":"c1","title":"Google Data Analytics Certificate","platform":"Coursera","cost":"Free audit","duration":"6 months","skill":"Data Analysis","url":"https://coursera.org"},
    {"id":"c2","title":"AWS Cloud Practitioner","platform":"AWS","cost":"$100 exam","duration":"1 month prep","skill":"AWS","url":"https://aws.amazon.com/certification"},
    {"id":"c3","title":"MongoDB Developer Path","platform":"MongoDB University","cost":"Free","duration":"3 months","skill":"MongoDB","url":"https://university.mongodb.com"},
    {"id":"c4","title":"Meta Backend Developer","platform":"Coursera","cost":"Free audit","duration":"8 months","skill":"Backend","url":"https://coursera.org"},
    {"id":"c5","title":"Microsoft AI Fundamentals","platform":"Microsoft Learn","cost":"Free","duration":"1 month","skill":"AI","url":"https://learn.microsoft.com"},
]

def _skill_match(item_skills, user_skills_set):
    matched = sum(1 for s in item_skills if s.lower() in user_skills_set)
    return int((matched / len(item_skills)) * 100) if item_skills else 0

@router.get("/internships")
async def get_internships(current_user=Depends(get_current_user)):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    user_skills = set(
        (s["name"].lower() if isinstance(s, dict) else s.lower())
        for s in user.get("skills", [])
    )
    results = []
    for item in INTERNSHIP_DB:
        match = _skill_match(item["skills"], user_skills)
        matched   = [s for s in item["skills"] if s.lower() in user_skills]
        missing   = [s for s in item["skills"] if s.lower() not in user_skills]
        reason    = f"You have {len(matched)}/{len(item['skills'])} required skills. " + \
                    (f"Missing: {', '.join(missing[:2])}" if missing else "All skills matched!")
        results.append({**item, "match": match, "matched_skills": matched, "missing": missing, "reason": reason})
    return sorted(results, key=lambda x: x["match"], reverse=True)

@router.get("/projects")
async def get_projects(current_user=Depends(get_current_user)):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    user_skills = set(
        (s["name"].lower() if isinstance(s, dict) else s.lower())
        for s in user.get("skills", [])
    )
    return [
        {**p, "relevant": any(f.lower() not in user_skills for f in p["fills"])}
        for p in PROJECT_DB
    ]

@router.get("/certifications")
async def get_certifications(current_user=Depends(get_current_user)):
    return CERT_DB

@router.post("/feedback")
async def save_feedback(req: FeedbackRequest, current_user=Depends(get_current_user)):
    db = get_db()
    await db.feedback.insert_one({
        "user_id":   current_user["user_id"],
        "item_type": req.item_type,
        "item_id":   req.item_id,
        "helpful":   req.helpful,
        "comment":   req.comment,
    })
    return {"message": "Feedback saved"}
