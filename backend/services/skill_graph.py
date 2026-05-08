from database import get_db
from typing import List, Dict, Optional

# ── Seed data — Skill Knowledge Graph ─────────────────────────────────────────
SKILL_KNOWLEDGE_GRAPH = {
    "Backend Developer": {
        "required": [
            {"name": "Node.js",        "importance": "critical",     "min_level": 70},
            {"name": "REST APIs",      "importance": "critical",     "min_level": 75},
            {"name": "MongoDB",        "importance": "important",    "min_level": 60},
            {"name": "SQL",            "importance": "important",    "min_level": 60},
            {"name": "Docker",         "importance": "important",    "min_level": 55},
            {"name": "System Design",  "importance": "important",    "min_level": 50},
            {"name": "Authentication", "importance": "important",    "min_level": 60},
            {"name": "Git",            "importance": "nice_to_have", "min_level": 50},
            {"name": "AWS",            "importance": "nice_to_have", "min_level": 40},
            {"name": "Redis",          "importance": "nice_to_have", "min_level": 35},
        ]
    },
    "Data Scientist": {
        "required": [
            {"name": "Python",              "importance": "critical",     "min_level": 75},
            {"name": "Machine Learning",    "importance": "critical",     "min_level": 65},
            {"name": "Statistics",          "importance": "critical",     "min_level": 70},
            {"name": "SQL",                 "importance": "important",    "min_level": 60},
            {"name": "Data Visualization",  "importance": "important",    "min_level": 55},
            {"name": "Deep Learning",       "importance": "important",    "min_level": 50},
            {"name": "Pandas",              "importance": "important",    "min_level": 65},
            {"name": "Scikit-learn",        "importance": "important",    "min_level": 60},
            {"name": "Tableau",             "importance": "nice_to_have", "min_level": 40},
            {"name": "Spark",               "importance": "nice_to_have", "min_level": 35},
        ]
    },
    "Full Stack Developer": {
        "required": [
            {"name": "React",          "importance": "critical",     "min_level": 70},
            {"name": "Node.js",        "importance": "critical",     "min_level": 65},
            {"name": "JavaScript",     "importance": "critical",     "min_level": 75},
            {"name": "MongoDB",        "importance": "important",    "min_level": 55},
            {"name": "REST APIs",      "importance": "important",    "min_level": 65},
            {"name": "HTML/CSS",       "importance": "important",    "min_level": 70},
            {"name": "Git",            "importance": "nice_to_have", "min_level": 50},
            {"name": "Docker",         "importance": "nice_to_have", "min_level": 40},
            {"name": "TypeScript",     "importance": "nice_to_have", "min_level": 50},
        ]
    },
    "DevOps Engineer": {
        "required": [
            {"name": "Docker",         "importance": "critical",     "min_level": 75},
            {"name": "Kubernetes",     "importance": "critical",     "min_level": 65},
            {"name": "AWS",            "importance": "critical",     "min_level": 70},
            {"name": "CI/CD",          "importance": "important",    "min_level": 65},
            {"name": "Linux",          "importance": "important",    "min_level": 70},
            {"name": "Terraform",      "importance": "important",    "min_level": 55},
            {"name": "Python",         "importance": "important",    "min_level": 50},
            {"name": "Monitoring",     "importance": "nice_to_have", "min_level": 45},
        ]
    },
    "AI Engineer": {
        "required": [
            {"name": "Python",         "importance": "critical",     "min_level": 80},
            {"name": "Machine Learning","importance": "critical",    "min_level": 70},
            {"name": "Deep Learning",  "importance": "critical",     "min_level": 65},
            {"name": "PyTorch",        "importance": "important",    "min_level": 60},
            {"name": "LLM APIs",       "importance": "important",    "min_level": 55},
            {"name": "MLOps",          "importance": "important",    "min_level": 50},
            {"name": "Statistics",     "importance": "important",    "min_level": 65},
            {"name": "Docker",         "importance": "nice_to_have", "min_level": 45},
        ]
    },
}

SKILL_PREREQUISITES = {
    "Machine Learning":    ["Python", "Statistics", "Linear Algebra"],
    "Deep Learning":       ["Python", "Machine Learning", "Linear Algebra"],
    "Kubernetes":          ["Docker", "Linux"],
    "React":               ["JavaScript", "HTML/CSS"],
    "Node.js":             ["JavaScript"],
    "REST APIs":           ["Node.js"],
    "System Design":       ["REST APIs", "Databases"],
    "MLOps":               ["Machine Learning", "Docker"],
    "Terraform":           ["AWS", "Linux"],
    "AWS":                 ["Linux"],
}

LEARNING_RESOURCES = {
    "Python":           {"url": "https://docs.python.org",      "platform": "Official Docs", "hours": 20},
    "Machine Learning": {"url": "https://www.coursera.org",     "platform": "Coursera",      "hours": 40},
    "React":            {"url": "https://react.dev",            "platform": "React Docs",    "hours": 25},
    "Node.js":          {"url": "https://nodejs.org/docs",      "platform": "Official Docs", "hours": 20},
    "Docker":           {"url": "https://docs.docker.com",      "platform": "Docker Docs",   "hours": 15},
    "MongoDB":          {"url": "https://university.mongodb.com","platform": "MongoDB Uni",  "hours": 12},
    "SQL":              {"url": "https://sqlzoo.net",            "platform": "SQLZoo",        "hours": 15},
    "AWS":              {"url": "https://aws.amazon.com/training","platform": "AWS Training", "hours": 30},
    "System Design":    {"url": "https://github.com/donnemartin/system-design-primer", "platform": "GitHub", "hours": 20},
}

# ── Core functions ─────────────────────────────────────────────────────────────
def get_role_requirements(role: str) -> list:
    return SKILL_KNOWLEDGE_GRAPH.get(role, {}).get("required", [])

def get_prerequisites(skill: str) -> list:
    return SKILL_PREREQUISITES.get(skill, [])

def get_resource(skill: str) -> dict:
    return LEARNING_RESOURCES.get(skill, {"url": f"https://google.com/search?q=learn+{skill}", "platform": "Web Search", "hours": 10})

async def recalculate_readiness(user: dict) -> int:
    role = user.get("target_role")
    if not role:
        return 0
    requirements = get_role_requirements(role)
    if not requirements:
        return 0

    user_skill_map: Dict[str, int] = {}
    for s in user.get("skills", []):
        name  = s["name"] if isinstance(s, dict) else s
        level = s.get("level", 50) if isinstance(s, dict) else 50
        user_skill_map[name.lower()] = level

    total_weight = 0
    met_weight   = 0
    weights = {"critical": 3, "important": 2, "nice_to_have": 1}

    for req in requirements:
        w      = weights.get(req["importance"], 1)
        level  = user_skill_map.get(req["name"].lower(), 0)
        needed = req["min_level"]
        total_weight += w
        if level >= needed:
            met_weight += w
        else:
            met_weight += w * (level / needed)

    return min(100, int((met_weight / total_weight) * 100)) if total_weight > 0 else 0

def analyze_gaps(user_skills: dict, target_role: str) -> list:
    requirements = get_role_requirements(target_role)
    gaps = []
    for req in requirements:
        skill_name = req["name"]
        your_level = user_skills.get(skill_name.lower(), 0)
        required   = req["min_level"]
        gap        = max(0, required - your_level)

        # Check prerequisite gaps
        prereqs         = get_prerequisites(skill_name)
        has_prereq_gap  = any(user_skills.get(p.lower(), 0) < 40 for p in prereqs)

        gaps.append({
            "skill":         skill_name,
            "your_level":    your_level,
            "required":      required,
            "gap":           gap,
            "importance":    req["importance"],
            "has_prereq_gap": has_prereq_gap,
        })
    return sorted(gaps, key=lambda x: (x["gap"], x["importance"] == "critical"), reverse=True)

async def seed_skill_graph():
    """Seed MongoDB with skill knowledge graph on first run."""
    db = get_db()
    for role, data in SKILL_KNOWLEDGE_GRAPH.items():
        await db.skill_graph.update_one(
            {"role": role},
            {"$setOnInsert": {"role": role, "required_skills": data["required"]}},
            upsert=True
        )
    print("✅ Skill knowledge graph seeded")
