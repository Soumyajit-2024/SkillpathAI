from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
from dotenv import load_dotenv

load_dotenv()  # Load .env FIRST before anything reads env vars

from config import validate_config, ALLOWED_ORIGINS
from database import connect_db, close_db
from routes import (
    auth, profile, analyzer, gap, roadmap, chat, jdparser,
    recommendations, interview, verification, admin, notifications
)
from routes import config as config_routes

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_config()   # exits with helpful message if keys are wrong
    await connect_db()
    yield
    await close_db()

app = FastAPI(
    title="SkillPath AI API",
    description="AI-Driven Personalized Learning & Skill Gap Analyzer",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix="/api/auth",            tags=["Auth"])
app.include_router(profile.router,         prefix="/api/profile",         tags=["Profile"])
app.include_router(analyzer.router,        prefix="/api/analyzer",        tags=["Analyzer"])
app.include_router(gap.router,             prefix="/api/gap",             tags=["Skill Gap"])
app.include_router(roadmap.router,         prefix="/api/roadmap",         tags=["Roadmap"])
app.include_router(chat.router,            prefix="/api/chat",            tags=["Chat"])
app.include_router(jdparser.router,        prefix="/api/jd",              tags=["JD Parser"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(interview.router,       prefix="/api/interview",       tags=["Interview"])
app.include_router(verification.router,    prefix="/api/verify",          tags=["Verification"])
app.include_router(admin.router,           prefix="/api/admin",           tags=["Admin"])
app.include_router(notifications.router,   prefix="/api/notifications",   tags=["Notifications"])
app.include_router(config_routes.router,   prefix="/api/config",          tags=["Config"])

@app.get("/")
async def root(): return {"status": "SkillPath AI API v2.0 running", "docs": "/docs"}

@app.get("/health")
async def health():
    key_ok = bool(os.getenv("ANTHROPIC_API_KEY","")) and "xxxx" not in os.getenv("ANTHROPIC_API_KEY","")
    return {"status": "ok", "version": "2.0.0", "anthropic_configured": key_ok}
