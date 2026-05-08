"""
SkillPath AI — Centralized Configuration
=========================================
All environment variables are read here with clear validation.
Startup will FAIL with a helpful message if required keys are missing.
"""
import os, sys
from dotenv import load_dotenv

load_dotenv()

# ── Database ────────────────────────────────────────────────────────────────────
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME",   "skillpath_ai")

# ── Auth ─────────────────────────────────────────────────────────────────────────
JWT_SECRET        = os.getenv("JWT_SECRET", "")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

# ── AI Keys ──────────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GITHUB_TOKEN      = os.getenv("GITHUB_TOKEN", "")
GOOGLE_CLIENT_ID  = os.getenv("GOOGLE_CLIENT_ID", "")

# ── Storage ───────────────────────────────────────────────────────────────────────
CLOUDINARY_URL    = os.getenv("CLOUDINARY_URL", "")

# ── Email ─────────────────────────────────────────────────────────────────────────
SENDGRID_API_KEY  = os.getenv("SENDGRID_API_KEY", "")

# ── CORS ──────────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# ── Claude model ──────────────────────────────────────────────────────────────────
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")


def get_anthropic_key() -> str:
    """Always read from env at call time — never cached at import time."""
    return os.getenv("ANTHROPIC_API_KEY", ANTHROPIC_API_KEY)


def validate_config():
    """
    Call this on startup.
    Prints clear instructions and exits if required variables are missing.
    """
    errors = []

    if not JWT_SECRET or JWT_SECRET == "replace-with-a-64-char-random-hex-string":
        errors.append(
            "  ❌ JWT_SECRET is not set.\n"
            "     Generate one:  python -c \"import secrets; print(secrets.token_hex(32))\"\n"
            "     Then add to backend/.env:  JWT_SECRET=<generated_value>"
        )

    if not ANTHROPIC_API_KEY or "xxxx" in ANTHROPIC_API_KEY or ANTHROPIC_API_KEY == "sk-ant-xxxxxxxxxxxxxxxxxxxx":
        errors.append(
            "  ❌ ANTHROPIC_API_KEY is not set or is still the placeholder.\n"
            "     Get your key: https://console.anthropic.com → API Keys → Create Key\n"
            "     Then add to backend/.env:  ANTHROPIC_API_KEY=sk-ant-api03-..."
        )

    if errors:
        print("\n" + "="*60)
        print("  SkillPath AI — CONFIGURATION ERROR")
        print("="*60)
        for err in errors:
            print(err)
        print("\n  Open backend/.env and fill in the missing values.")
        print("  The .env file already has comments explaining each variable.")
        print("="*60 + "\n")
        sys.exit(1)

    # Warn about optional but recommended keys
    warnings = []
    if not GITHUB_TOKEN:
        warnings.append("  ⚠️  GITHUB_TOKEN not set — GitHub analyzer will be rate-limited (60 req/hr)")
    if not CLOUDINARY_URL or "xxxx" in CLOUDINARY_URL:
        warnings.append("  ⚠️  CLOUDINARY_URL not set — resumes stored in /tmp (lost on restart)")
    if not SENDGRID_API_KEY or "xxxx" in SENDGRID_API_KEY:
        warnings.append("  ⚠️  SENDGRID_API_KEY not set — forgot-password emails will not be sent")

    if warnings:
        print("\n  SkillPath AI — Optional keys not configured (non-fatal):")
        for w in warnings:
            print(w)
        print()
