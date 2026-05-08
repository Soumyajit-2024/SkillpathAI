"""
SkillPath AI — Config Routes
=============================
Endpoints for checking and updating API configuration at runtime.
/api/config/status   — check which keys are configured
/api/config/test-key — test if ANTHROPIC_API_KEY actually works
/api/config/update   — update keys in .env file (admin only)
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import os, re
from pathlib import Path

from middleware.auth import get_current_user
from services.ai_service import check_api_key

router = APIRouter()

ENV_PATH = Path(__file__).parent.parent / ".env"


def _mask(val: str) -> str:
    """Show only first 8 and last 4 chars of a key."""
    if not val or len(val) < 14:
        return "not set"
    return val[:8] + "..." + val[-4:]


# ── GET /api/config/status ─────────────────────────────────────────────────────
@router.get("/status")
async def config_status(current_user=Depends(get_current_user)):
    """Returns which API keys are configured (masked for security)."""
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    github_token  = os.getenv("GITHUB_TOKEN", "")
    cloudinary    = os.getenv("CLOUDINARY_URL", "")
    sendgrid      = os.getenv("SENDGRID_API_KEY", "")

    def is_set(val):
        return bool(val) and "xxxx" not in val and val not in [
            "sk-ant-xxxxxxxxxxxxxxxxxxxx",
            "ghp_xxxxxxxxxxxxxxxxxxxx",
            "SG.xxxxxxxxxxxxxxxxxxxx",
        ]

    return {
        "anthropic": {
            "configured": is_set(anthropic_key),
            "masked":     _mask(anthropic_key) if is_set(anthropic_key) else "not configured",
        },
        "github": {
            "configured": is_set(github_token),
            "masked":     _mask(github_token) if is_set(github_token) else "not configured",
        },
        "cloudinary": {
            "configured": is_set(cloudinary),
            "masked":     "configured" if is_set(cloudinary) else "not configured",
        },
        "sendgrid": {
            "configured": is_set(sendgrid),
            "masked":     _mask(sendgrid) if is_set(sendgrid) else "not configured",
        },
        "mongo_url":  os.getenv("MONGO_URL", "mongodb://localhost:27017"),
        "claude_model": os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514"),
    }


# ── GET /api/config/test-key ───────────────────────────────────────────────────
@router.get("/test-key")
async def test_api_key(current_user=Depends(get_current_user)):
    """
    Sends a minimal test request to Anthropic to verify the API key works.
    Returns {"valid": true/false, "model": "...", "error": "..."}.
    """
    result = await check_api_key()
    return result


# ── POST /api/config/update ────────────────────────────────────────────────────
class KeyUpdateRequest(BaseModel):
    anthropic_api_key:  Optional[str] = None
    github_token:       Optional[str] = None
    cloudinary_url:     Optional[str] = None
    sendgrid_api_key:   Optional[str] = None
    allowed_origins:    Optional[str] = None


@router.post("/update")
async def update_config(data: KeyUpdateRequest, current_user=Depends(get_current_user)):
    """
    Updates keys in backend/.env file and reloads them into os.environ.
    Only the admin user can call this endpoint.
    """
    # Check admin
    from database import get_db
    from bson import ObjectId
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user or not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    updates = {}

    if data.anthropic_api_key and data.anthropic_api_key.startswith("sk-ant-"):
        updates["ANTHROPIC_API_KEY"] = data.anthropic_api_key
    elif data.anthropic_api_key:
        raise HTTPException(400, "Invalid Anthropic key format. Must start with sk-ant-")

    if data.github_token:
        updates["GITHUB_TOKEN"] = data.github_token

    if data.cloudinary_url:
        updates["CLOUDINARY_URL"] = data.cloudinary_url

    if data.sendgrid_api_key:
        updates["SENDGRID_API_KEY"] = data.sendgrid_api_key

    if data.allowed_origins:
        updates["ALLOWED_ORIGINS"] = data.allowed_origins

    if not updates:
        raise HTTPException(400, "No valid keys provided to update")

    # Update os.environ immediately (takes effect without restart for new requests)
    for key, val in updates.items():
        os.environ[key] = val

    # Also persist to .env file so changes survive restart
    if ENV_PATH.exists():
        env_text = ENV_PATH.read_text()
        for key, val in updates.items():
            # Replace existing line or append
            pattern = rf"^{key}\s*=.*$"
            new_line = f"{key}={val}"
            if re.search(pattern, env_text, re.MULTILINE):
                env_text = re.sub(pattern, new_line, env_text, flags=re.MULTILINE)
            else:
                env_text += f"\n{new_line}\n"
        ENV_PATH.write_text(env_text)

    return {
        "message": f"Updated {len(updates)} key(s) successfully. Changes are live immediately.",
        "updated": list(updates.keys()),
    }
