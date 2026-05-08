# SkillPath AI — Installation Guide

## Step 1: Get Your Anthropic API Key (Required)

1. Go to **https://console.anthropic.com/api-keys**
2. Sign up / log in
3. Click **Create Key** → name it anything
4. Copy the key — it starts with `sk-ant-api03-...`
5. Keep this key safe — you will need it in Step 3

---

## Step 2: Install Prerequisites

| Software | Download | Version needed |
|---|---|---|
| Python | python.org/downloads | 3.11+ |
| Node.js | nodejs.org | 18+ |
| MongoDB | mongodb.com/try/download | 6.0+ OR use Atlas free cloud |

Verify in terminal:
```
python --version
node --version
npm --version
```

---

## Step 3: Configure Your API Key

Open **`backend/.env`** in any text editor and fill in:

```env
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
JWT_SECRET=any-long-random-string-like-this-1234567890abcdef
MONGO_URL=mongodb://localhost:27017
```

That's the minimum to get started. All other keys are optional.

---

## Step 4: Start MongoDB

**Windows:**
```cmd
mkdir C:\data\db
mongod --dbpath C:\data\db
```

**Mac/Linux:**
```bash
mkdir -p /tmp/mongodb
mongod --dbpath /tmp/mongodb
```

> Alternative: Use MongoDB Atlas free cloud — go to cloud.mongodb.com,
> create a free cluster, and set MONGO_URL in .env to your Atlas connection string.

---

## Step 5: Start the Backend

Open a terminal, navigate to the project folder, then:

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it:
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install all Python packages
pip install -r requirements.txt

# Install NLP model
python -m spacy download en_core_web_sm

# Seed the database with skill data (run once)
python seed.py

# Start the server
uvicorn main:app --reload --port 8000
```

**Expected output:**
```
SkillPath AI — Starting...
✅ MongoDB connected: skillpath_ai
INFO: Uvicorn running on http://0.0.0.0:8000
```

Test at: **http://localhost:8000/docs** (shows all API endpoints)

---

## Step 6: Start the Frontend

Open a **new terminal**, navigate to the project folder, then:

```bash
cd frontend
npm install
npm start
```

**Expected output:**
```
Compiled successfully!
Local: http://localhost:3000
```

Browser opens automatically at **http://localhost:3000** showing the login page.

---

## Step 7: Create Your Account

1. Click **Create Account** tab on the login page
2. Fill in name, email, password
3. Complete the 4-step profile wizard (choose your target role, add skills)
4. Dashboard shows your personalized skill gap analysis

---

## Step 8: Verify AI is Working

1. Log in and go to **AI Advisor** in sidebar
2. Type a message like "What should I learn first?"
3. If Claude responds → everything is working

If you get an error:
- Check that `ANTHROPIC_API_KEY` in `backend/.env` is correct
- Admin users: go to **Settings** in sidebar to test and update the key

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `pip install` fails | Use `pip3` instead of `pip` |
| `venv\Scripts\activate` error (Windows) | Run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| MongoDB connection error | Make sure `mongod` is running in a separate terminal |
| AI features return 401 error | Your `ANTHROPIC_API_KEY` is wrong — update `backend/.env` |
| AI features return error after fixing key | Restart backend: `Ctrl+C` then `uvicorn main:app --reload --port 8000` |
| Frontend can't reach backend | Check `ALLOWED_ORIGINS=http://localhost:3000` in `backend/.env` |
| `npm install` fails | Delete `node_modules/` folder and try again |

---

## Deploy Online (Free)

| Service | What it hosts |
|---|---|
| MongoDB Atlas | Cloud database |
| Railway | Python backend |
| Vercel | React frontend |

After deploying to Railway, add all your `.env` variables in the Railway Variables tab.
After deploying to Vercel, set `REACT_APP_API_URL=https://your-railway-url.up.railway.app/api`.

Then update `ALLOWED_ORIGINS` in Railway to your Vercel URL.
