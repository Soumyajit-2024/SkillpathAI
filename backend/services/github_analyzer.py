import httpx, os
from typing import Optional

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

async def analyze_github_profile(github_url: str) -> dict:
    """Scan public GitHub profile for skills, projects, activity."""
    username = github_url.rstrip("/").split("/")[-1]
    headers  = {}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    result = {
        "username":     username,
        "repos_count":  0,
        "languages":    [],
        "top_repos":    [],
        "commit_count": 0,
        "github_score": 0,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        # Get user repos
        r = await client.get(
            f"https://api.github.com/users/{username}/repos?per_page=30&sort=updated",
            headers=headers
        )
        if r.status_code != 200:
            return result

        repos = r.json()
        result["repos_count"] = len(repos)

        langs_set = set()
        top_repos = []
        for repo in repos[:10]:
            if repo.get("language"):
                langs_set.add(repo["language"])
            top_repos.append({
                "name":        repo["name"],
                "description": repo.get("description", ""),
                "language":    repo.get("language", ""),
                "stars":       repo.get("stargazers_count", 0),
                "url":         repo.get("html_url", ""),
            })

        result["languages"] = list(langs_set)
        result["top_repos"] = top_repos[:5]
        result["github_score"] = _calculate_github_score(repos)

    return result

def _calculate_github_score(repos: list) -> int:
    """Simple scoring: number of repos + stars + variety of languages."""
    if not repos:
        return 0
    repo_count    = min(len(repos), 10) * 4           # max 40
    total_stars   = min(sum(r.get("stargazers_count", 0) for r in repos), 20) * 2   # max 40
    lang_variety  = min(len(set(r.get("language") for r in repos if r.get("language"))), 5) * 4  # max 20
    return min(100, repo_count + total_stars + lang_variety)

def map_github_langs_to_skills(languages: list) -> list:
    """Map GitHub language names to skill names used in knowledge graph."""
    mapping = {
        "Python":     "Python",
        "JavaScript": "JavaScript",
        "TypeScript": "TypeScript",
        "Java":       "Java",
        "Go":         "Go",
        "C++":        "C++",
        "C#":         "C#",
        "Ruby":       "Ruby",
        "Swift":      "Swift",
        "Kotlin":     "Kotlin",
        "Rust":       "Rust",
        "PHP":        "PHP",
        "HTML":       "HTML/CSS",
        "CSS":        "HTML/CSS",
        "Shell":      "Linux",
        "Dockerfile": "Docker",
    }
    return list(set(mapping[l] for l in languages if l in mapping))
