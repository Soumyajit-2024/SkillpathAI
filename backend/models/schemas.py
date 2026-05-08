from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# ── Enums ──────────────────────────────────────────────────────────────────────
class SkillLevel(str, Enum):
    BEGINNER     = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED     = "advanced"

class SkillImportance(str, Enum):
    CRITICAL      = "critical"
    IMPORTANT     = "important"
    NICE_TO_HAVE  = "nice_to_have"

class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    VERIFIED   = "verified"
    FAILED     = "failed"

# ── Auth ───────────────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str
    username: str

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token:  str
    token_type:    str = "bearer"
    user_id:       str
    name:          str

class GoogleAuthRequest(BaseModel):
    token: str   # Google OAuth ID token

# ── User Profile ───────────────────────────────────────────────────────────────
class AcademicRecord(BaseModel):
    college:      Optional[str] = None
    cgpa:         Optional[float] = None
    year:         Optional[int] = None
    degree:       Optional[str] = None
    subjects:     List[str] = []
    grades:       Dict[str, float] = {}

class UserSkill(BaseModel):
    name:         str
    level:        int = 0           # 0–100 self-reported
    verified:     VerificationStatus = VerificationStatus.UNVERIFIED
    source:       str = "manual"    # manual | resume | github | academic
    added_at:     datetime = Field(default_factory=datetime.utcnow)

class ProfileUpdate(BaseModel):
    name:           Optional[str] = None
    target_role:    Optional[str] = None
    skills:         Optional[List[UserSkill]] = None
    academic:       Optional[AcademicRecord] = None
    github_url:     Optional[str] = None
    portfolio_url:  Optional[str] = None
    career_interests: Optional[List[str]] = None

# ── Skill Knowledge Graph ──────────────────────────────────────────────────────
class SkillNode(BaseModel):
    name:          str
    category:      str              # Language | Framework | Tool | Concept | Cloud | DevOps
    difficulty:    SkillLevel
    prerequisites: List[str] = []
    description:   Optional[str] = None

class RoleNode(BaseModel):
    role:           str
    required_skills: List[Dict[str, Any]] = []
    # e.g. [{"name": "Python", "importance": "critical", "min_level": 60}]
    description:    Optional[str] = None
    avg_salary:     Optional[str] = None

# ── Skill Gap ──────────────────────────────────────────────────────────────────
class SkillGapItem(BaseModel):
    skill:       str
    your_level:  int
    required:    int
    gap:         int
    importance:  SkillImportance
    category:    str
    has_prereq_gap: bool = False

class GapAnalysisResponse(BaseModel):
    target_role:     str
    readiness_score: int
    user_id:         str
    gaps:            List[SkillGapItem]
    met_skills:      List[str]
    critical_count:  int
    important_count: int
    peer_percentile: Optional[int] = None

# ── Roadmap ────────────────────────────────────────────────────────────────────
class RoadmapStep(BaseModel):
    week:       int
    skill:      str
    resource:   str
    resource_url: Optional[str] = None
    hours:      int
    done:       bool = False
    done_at:    Optional[datetime] = None

class RoadmapResponse(BaseModel):
    user_id:     str
    target_role: str
    steps:       List[RoadmapStep]
    created_at:  datetime
    updated_at:  datetime

class MarkStepRequest(BaseModel):
    week: int

# ── Resume / Analyzer ─────────────────────────────────────────────────────────
class AnalysisResult(BaseModel):
    extracted_skills:    List[str]
    projects:            List[str]
    certifications:      List[str]
    tools:               List[str]
    experience_years:    Optional[int] = None
    resume_score:        int
    ats_score:           int
    improvement_tips:    List[str]
    github_score:        Optional[int] = None
    github_projects:     Optional[int] = None

# ── JD Parser ─────────────────────────────────────────────────────────────────
class JDParseRequest(BaseModel):
    jd_text:     str
    job_url:     Optional[str] = None

class JDParseResponse(BaseModel):
    role:             str
    experience_level: str
    required_skills:  List[str]
    nice_to_have:     List[str]
    matched_skills:   List[str]
    missing_skills:   List[str]
    match_percent:    int
    explanation:      str

# ── Chat ───────────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role:    str    # user | assistant
    content: str

class ChatRequest(BaseModel):
    message:  str
    history:  List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply:    str
    session_id: str

# ── Interview ─────────────────────────────────────────────────────────────────
class InterviewQuestion(BaseModel):
    id:       int
    question: str
    category: str   # technical | behavioral | coding

class AnswerSubmission(BaseModel):
    question: str
    answer:   str
    role:     str

class EvaluationResponse(BaseModel):
    correct_points:  List[str]
    missing_points:  List[str]
    suggestion:      str
    score:           int   # 0–10

# ── Skill Verification ────────────────────────────────────────────────────────
class VerificationQuestion(BaseModel):
    id:       int
    question: str
    options:  List[str]   # 4 choices
    skill:    str

class VerificationSubmission(BaseModel):
    skill:   str
    answers: Dict[int, int]   # question_id -> chosen option index

class VerificationResult(BaseModel):
    skill:    str
    passed:   bool
    score:    int
    total:    int
    message:  str

# ── Recommendations ───────────────────────────────────────────────────────────
class InternshipItem(BaseModel):
    title:    str
    company:  str
    match:    int
    skills:   List[str]
    stipend:  str
    type:     str
    reason:   str

class ProjectItem(BaseModel):
    title:       str
    skills:      str
    time:        str
    fills_gaps:  List[str]
    level:       str
    description: str

class CertificationItem(BaseModel):
    title:    str
    platform: str
    cost:     str
    duration: str
    skill:    str
    url:      Optional[str] = None

class FeedbackRequest(BaseModel):
    item_type:  str   # internship | project | certification | resource
    item_id:    str
    helpful:    bool
    comment:    Optional[str] = None
