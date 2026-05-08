# SkillPath AI — Complete Project Package

## What's in this ZIP

```
SkillPath-AI/
├── SkillPath-AI-Demo.html     ← DEMO: Open in browser (no setup needed)
├── INSTALL.md                 ← Step-by-step installation guide
├── README.md                  ← This file
│
├── backend/                   ← Python FastAPI backend (57 files total)
│   ├── .env                   ← ⚠️  Add your API keys here
│   ├── main.py                ← FastAPI entry point
│   ├── config.py              ← Config loader + startup validation
│   ├── database.py            ← MongoDB connection
│   ├── seed.py                ← Run once to load skill data
│   ├── requirements.txt       ← All Python dependencies
│   ├── Dockerfile             ← For Railway/cloud deployment
│   ├── routes/                ← 13 API route files
│   ├── services/              ← AI service, skill graph, parsers
│   ├── middleware/            ← JWT authentication
│   └── models/                ← Pydantic schemas
│
└── frontend/                  ← React 18 frontend
    ├── package.json
    ├── public/
    └── src/
        ├── App.jsx            ← Routes + auth guards
        ├── pages/             ← 15 page components
        ├── components/        ← Sidebar, UI components
        ├── api/client.js      ← All API calls
        ├── context/           ← Auth state
        └── styles/globals.css ← Design system
```

---

## Quick Start (3 steps)

### Step 1 — Try the demo instantly
Open `SkillPath-AI-Demo.html` in Chrome/Firefox — works offline, no setup needed.
Create an account, explore all features with your own name and data.

### Step 2 — Get your Anthropic API key
1. Go to **https://console.anthropic.com/api-keys**
2. Sign up → Create Key → Copy it (starts with `sk-ant-api03-...`)

### Step 3 — Run the full project
See **INSTALL.md** for the complete setup guide.

Minimum required in `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
JWT_SECRET=any-long-random-string
MONGO_URL=mongodb://localhost:27017
```

---

## Features (18 total)

| Feature | Description |
|---|---|
| Auth System | Signup, Login, Google OAuth, Forgot Password |
| Profile + Onboarding | 4-step wizard with role, skills, academic, GitHub |
| Skill Gap Analyzer | Weighted knowledge graph + peer benchmarking |
| Resume PDF Analyzer | AI extracts skills + ATS score |
| GitHub Analyzer | Auto-detect skills from repos |
| AI Roadmap Generator | Personalized 6-8 week study plan |
| AI Career Chatbot | Context-aware chat with full profile |
| Job Description Parser | Match % against any JD |
| Skill Verification | MCQ quiz → verified badge |
| Interview Simulation | AI scores your answers 0-10 |
| Internship Recommendations | Ranked by skill match % |
| Project Recommendations | Gap-filling project ideas |
| Notifications | Platform alerts + admin broadcast |
| Admin Panel | User management, analytics, roles |
| API Key Settings | Manage keys from browser (admin) |

---

## Tech Stack

- **Frontend**: React 18, React Router v6, deployed on Vercel
- **Backend**: FastAPI (Python 3.11), deployed on Railway
- **Database**: MongoDB Atlas (free M0 cluster)
- **AI**: Claude Sonnet (Anthropic API)
- **NLP**: spaCy, pdfplumber

