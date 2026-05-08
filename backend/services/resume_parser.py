import pdfplumber
import spacy
import re
from typing import Optional

# Load spaCy model — run: python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None
    print("⚠️ spaCy model not loaded. Run: python -m spacy download en_core_web_sm")

# Curated skill keyword list for fast matching
SKILL_KEYWORDS = [
    "python","javascript","typescript","java","c++","c#","go","rust","swift","kotlin","php","ruby",
    "react","angular","vue","nextjs","nodejs","express","django","flask","fastapi","spring",
    "mongodb","postgresql","mysql","redis","elasticsearch","firebase","sqlite","dynamodb",
    "docker","kubernetes","aws","azure","gcp","terraform","ansible","jenkins","github actions","ci/cd",
    "machine learning","deep learning","nlp","computer vision","tensorflow","pytorch","scikit-learn",
    "pandas","numpy","matplotlib","tableau","power bi","spark","hadoop",
    "git","linux","rest api","graphql","microservices","system design","agile","scrum",
    "html","css","sql","nosql","data structures","algorithms","object oriented",
]

def extract_text_from_pdf(path: str) -> str:
    """Extract all text from a PDF file."""
    text = ""
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text

def extract_skills_fast(text: str) -> list:
    """Fast keyword-based skill extraction (no LLM, used as fallback)."""
    text_lower = text.lower()
    found = []
    for skill in SKILL_KEYWORDS:
        if skill in text_lower:
            # Map lowercase to display name
            display = skill.title()
            if skill == "nodejs":   display = "Node.js"
            if skill == "nextjs":   display = "Next.js"
            if skill == "mongodb":  display = "MongoDB"
            if skill == "restapi" or skill == "rest api": display = "REST APIs"
            if skill == "aws":      display = "AWS"
            if skill == "gcp":      display = "GCP"
            if skill == "html":     display = "HTML/CSS"
            if skill == "css":      continue   # covered by html/css
            found.append(display)
    return list(set(found))

def extract_github_url(text: str) -> Optional[str]:
    pattern = r'github\.com/[\w\-]+'
    match   = re.search(pattern, text, re.IGNORECASE)
    return f"https://{match.group(0)}" if match else None

def extract_email(text: str) -> Optional[str]:
    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    match   = re.search(pattern, text)
    return match.group(0) if match else None

def extract_experience_years(text: str) -> int:
    patterns = [
        r'(\d+)\+?\s*years?\s*of\s*experience',
        r'(\d+)\+?\s*years?\s*experience',
        r'experience\s*of\s*(\d+)\+?\s*years?',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return 0

def extract_projects(text: str) -> list:
    """Rough extraction of project names from resume."""
    lines    = text.split('\n')
    projects = []
    in_projects = False
    for line in lines:
        line = line.strip()
        if not line:
            continue
        lower = line.lower()
        if any(kw in lower for kw in ["project", "projects", "work experience", "portfolio"]):
            in_projects = True
            continue
        if in_projects and any(kw in lower for kw in ["education", "skills", "certification", "awards"]):
            in_projects = False
            continue
        if in_projects and len(line) > 10 and len(line) < 80:
            projects.append(line)
        if len(projects) >= 6:
            break
    return projects

def parse_resume_full(pdf_path: str) -> dict:
    """Full synchronous resume parse — call from async via run_in_executor."""
    text = extract_text_from_pdf(pdf_path)
    if not text:
        return {"error": "Could not extract text from PDF"}
    return {
        "raw_text":        text[:4000],   # limit for LLM context
        "skills_fast":     extract_skills_fast(text),
        "github_url":      extract_github_url(text),
        "email":           extract_email(text),
        "experience_years":extract_experience_years(text),
        "projects":        extract_projects(text),
    }
