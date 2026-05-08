from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from bson import ObjectId
from datetime import datetime
import asyncio, os
from concurrent.futures import ThreadPoolExecutor

from database import get_db
from middleware.auth import get_current_user
from services.resume_parser import parse_resume_full
from services.github_analyzer import analyze_github_profile, map_github_langs_to_skills
from services.ai_service import extract_skills_from_resume, analyze_resume_quality
from main import limiter

router   = APIRouter()
_pool    = ThreadPoolExecutor(max_workers=3)
MAX_SIZE = 5 * 1024 * 1024   # 5 MB

async def _save_file(contents: bytes, user_id: str) -> str:
    """Save resume. In production use Cloudinary/S3. Falls back to /tmp for dev."""
    cloudinary_url = os.getenv("CLOUDINARY_URL")
    if cloudinary_url:
        import cloudinary, cloudinary.uploader
        result = cloudinary.uploader.upload(
            contents,
            folder="skillpath/resumes",
            public_id=f"resume_{user_id}",
            resource_type="raw",
            format="pdf",
        )
        return result["secure_url"]
    # Dev fallback
    path = f"/tmp/resume_{user_id}.pdf"
    with open(path, "wb") as f:
        f.write(contents)
    return path

@router.post("/resume")
@limiter.limit("10/minute")
async def analyze_resume(
    request: Request,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    # ✅ Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    contents = await file.read()

    # ✅ Validate file size
    if len(contents) > MAX_SIZE:
        raise HTTPException(413, f"File too large. Maximum size is 5 MB")

    file_url = await _save_file(contents, current_user["user_id"])

    # ✅ Use get_running_loop() — not deprecated get_event_loop()
    loop   = asyncio.get_running_loop()
    import tempfile, os as _os
    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    tmp.write(contents); tmp.close()
    parsed = await loop.run_in_executor(_pool, parse_resume_full, tmp.name)
    _os.unlink(tmp.name)

    ai_skills = {}
    if parsed.get("raw_text"):
        try:
            ai_skills = await extract_skills_from_resume(parsed["raw_text"])
        except Exception:
            ai_skills = {"skills": parsed.get("skills_fast", [])}

    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})

    quality = {}
    if parsed.get("raw_text"):
        try:
            quality = await analyze_resume_quality(parsed["raw_text"], user.get("target_role", ""))
        except Exception:
            quality = {"resume_score": 60, "ats_score": 55, "improvement_tips": []}

    all_skills = list(set(
        (ai_skills.get("skills") or []) + (parsed.get("skills_fast") or [])
    ))

    existing = {
        (s["name"].lower() if isinstance(s, dict) else s.lower()): s
        for s in user.get("skills", [])
    }
    for sk in all_skills:
        key = sk.lower()
        if key not in existing:
            existing[key] = {"name": sk, "level": 50, "source": "resume", "verified": "unverified"}

    await db.users.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$set": {
            "skills":      list(existing.values()),
            "resume_url":  file_url,
            "resume_score": quality.get("resume_score", 60),
            "ats_score":    quality.get("ats_score", 55),
            "updated_at":   datetime.utcnow(),
            **({"github_url": parsed["github_url"]} if parsed.get("github_url") else {}),
        }}
    )

    return {
        "extracted_skills":  all_skills,
        "projects":          ai_skills.get("projects", parsed.get("projects", [])),
        "certifications":    ai_skills.get("certifications", []),
        "resume_score":      quality.get("resume_score", 60),
        "ats_score":         quality.get("ats_score", 55),
        "improvement_tips":  quality.get("improvement_tips", []),
        "strengths":         quality.get("strengths", []),
        "resume_url":        file_url,
    }


@router.post("/github")
@limiter.limit("15/minute")
async def analyze_github(request: Request, github_url: str, current_user=Depends(get_current_user)):
    if not github_url.startswith("https://github.com/"):
        raise HTTPException(400, "Must be a valid github.com URL")

    result = await analyze_github_profile(github_url)
    skills_from_github = map_github_langs_to_skills(result.get("languages", []))

    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    existing = {
        (s["name"].lower() if isinstance(s, dict) else s.lower()): s
        for s in user.get("skills", [])
    }
    for sk in skills_from_github:
        if sk.lower() not in existing:
            existing[sk.lower()] = {"name": sk, "level": 40, "source": "github", "verified": "unverified"}

    await db.users.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$set": {
            "skills":      list(existing.values()),
            "github_url":  github_url,
            "github_data": result,
            "updated_at":  datetime.utcnow(),
        }}
    )
    return result
