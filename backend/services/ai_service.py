"""
SkillPath AI — AI Service Layer
All Claude API calls go through here.
KEY FIX: API key is read dynamically per call, not cached at import time.
"""
import os, json, re, httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
API_URL      = "https://api.anthropic.com/v1/messages"

def _get_headers() -> dict:
    """Rebuild headers fresh every call — so key changes take effect on restart."""
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key or "xxxx" in key or key == "sk-ant-xxxxxxxxxxxxxxxxxxxx":
        raise ValueError(
            "ANTHROPIC_API_KEY is missing or still a placeholder.\n"
            "  1. Go to https://console.anthropic.com/api-keys\n"
            "  2. Create a new key (starts with sk-ant-api03-...)\n"
            "  3. Open backend/.env and set: ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE\n"
            "  4. Restart the backend:  uvicorn main:app --reload --port 8000"
        )
    return {
        "Content-Type":      "application/json",
        "x-api-key":         key,
        "anthropic-version": "2023-06-01",
    }

def safe_json(text: str):
    text = text.strip()
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*",     "", text)
    starts = [i for i, c in enumerate(text) if c in "{["]
    ends   = [i for i, c in enumerate(text) if c in "}]"]
    if not starts or not ends:
        raise ValueError(f"No JSON in LLM response: {text[:120]}")
    return json.loads(text[starts[0]:ends[-1]+1])

def sanitize(text: str, max_len: int = 4000) -> str:
    if not isinstance(text, str): raise ValueError("Input must be string")
    text = text[:max_len]
    text = "".join(c for c in text if ord(c) >= 32 or c in "\n\t")
    for phrase in ["ignore previous instructions","ignore all instructions","system prompt:","jailbreak"]:
        if phrase in text.lower(): raise ValueError("Invalid input")
    return text.strip()

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10),
       retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPStatusError)))
async def _call(system: str, messages: list, max_tokens: int = 1000) -> str:
    headers = _get_headers()
    payload = {"model": CLAUDE_MODEL, "max_tokens": max_tokens, "system": system, "messages": messages}
    async with httpx.AsyncClient(timeout=35) as client:
        r = await client.post(API_URL, headers=headers, json=payload)
    if r.status_code == 401:
        raise ValueError("ANTHROPIC_API_KEY is invalid or expired. Update backend/.env and restart.")
    if r.status_code == 429:
        raise ValueError("Rate limited. Wait a moment and try again.")
    r.raise_for_status()
    return r.json()["content"][0]["text"]

async def extract_skills_from_resume(resume_text: str) -> dict:
    sys = 'You are a resume parser. Respond ONLY with valid JSON. Format: {"skills":["Python"],"tools":["Git"],"projects":["..."],"certifications":["..."],"experience_years":0,"tech_stack":["..."]}'
    return safe_json(await _call(sys, [{"role":"user","content":sanitize(resume_text,4000)}], 800))

async def parse_job_description(jd_text: str) -> dict:
    sys = 'Parse a job description. Respond ONLY with valid JSON. Format: {"role":"...","required_skills":["..."],"nice_to_have":["..."],"experience_level":"Entry"}'
    return safe_json(await _call(sys, [{"role":"user","content":sanitize(jd_text,5000)}], 600))

async def career_chat(user_profile: dict, history: list, message: str) -> str:
    skills = [s["name"] if isinstance(s,dict) else s for s in user_profile.get("skills",[])]
    sys = f"""You are an AI Career Advisor. Full user profile:
Name: {user_profile.get("name","User")} | Role: {user_profile.get("target_role","Not set")}
Skills: {", ".join(skills[:15]) or "None"} | Verified: {", ".join(user_profile.get("verified_skills",[])[:10])}
Readiness: {user_profile.get("readiness_score",0)}%
Be concise (3-5 sentences). Always use their actual data. Never give generic advice."""
    msgs = [{"role":m["role"],"content":m["content"]} for m in history[-20:]]
    msgs.append({"role":"user","content":sanitize(message,1000)})
    return await _call(sys, msgs, 400)

async def analyze_resume_quality(resume_text: str, target_role: str) -> dict:
    sys = 'Analyze this resume. Respond ONLY with valid JSON. Format: {"resume_score":75,"ats_score":68,"improvement_tips":["tip1"],"strengths":["s1"],"missing_keywords":["kw1"]}'
    return safe_json(await _call(sys, [{"role":"user","content":f"Role: {target_role}\n\n{sanitize(resume_text,3000)}"}], 500))

async def generate_project_description(raw: str) -> str:
    sys = "Convert to ONE professional resume bullet. Action verb + tech + impact. Only the bullet text, no quotes."
    return await _call(sys, [{"role":"user","content":sanitize(raw,500)}], 150)

async def evaluate_interview_answer(question: str, answer: str, role: str) -> dict:
    sys = 'Evaluate this interview answer. Respond ONLY with valid JSON. Format: {"correct_points":["..."],"missing_points":["..."],"suggestion":"...","score":7}'
    return safe_json(await _call(sys, [{"role":"user","content":f"Role:{role}\nQ:{question}\nA:{sanitize(answer,2000)}"}], 400))

async def generate_verification_questions(skill: str) -> list:
    sys = 'Generate exactly 5 MCQs. Respond ONLY with valid JSON array. Format: [{"id":1,"question":"...","options":["A","B","C","D"],"correct":0}]'
    return safe_json(await _call(sys, [{"role":"user","content":f"Skill: {skill}"}], 800))

async def generate_roadmap(target_role: str, missing: list, current: list) -> list:
    sys = 'Generate weekly learning roadmap. Max 8 weeks. Respond ONLY with valid JSON array. Format: [{"week":1,"skill":"...","resource":"...","resource_url":"https://...","hours":8}]'
    return safe_json(await _call(sys, [{"role":"user","content":f"Role:{target_role}\nHas:{','.join(current[:10])}\nNeeds:{','.join(missing[:8])}"}], 900))

async def check_api_key() -> dict:
    """Test if the current API key is valid. Used by /api/config/test-key."""
    try:
        headers = _get_headers()
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(API_URL, headers=headers,
                json={"model":CLAUDE_MODEL,"max_tokens":5,"messages":[{"role":"user","content":"hi"}]})
        if r.status_code == 200:   return {"valid":True, "model":CLAUDE_MODEL, "error":None}
        if r.status_code == 401:   return {"valid":False,"model":None,"error":"Invalid API key"}
        if r.status_code == 429:   return {"valid":True, "model":CLAUDE_MODEL,"error":"Rate limited (key valid)"}
        return {"valid":False,"model":None,"error":f"HTTP {r.status_code}"}
    except ValueError as e: return {"valid":False,"model":None,"error":str(e)}
    except Exception as e:  return {"valid":False,"model":None,"error":f"Connection error: {str(e)[:80]}"}
