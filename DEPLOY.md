# 2BOTS Deployment Guide

## Architecture Overview

```
2bots.io (Vercel)          →  Your Python API (Railway)
Next.js frontend               FastAPI + Claude + GPT + TTS
Landing page + App UI           All AI calls happen here
```

Users visit 2bots.io → Next.js serves the UI → UI calls your Python API on Railway.

---

## Step 1: Deploy the Python Backend to Railway

Railway is where your Python API runs. It's like Vercel but for Python.

### 1a. Create a Railway account
- Go to https://railway.app and sign up with GitHub

### 1b. Push your backend to GitHub
```bash
cd C:\Users\WCale\Desktop\2bots\backend
git init
git add app.py engine.py requirements.txt
git commit -m "Initial backend"
git remote add origin https://github.com/YOUR_USERNAME/2bots-backend.git
git push -u origin main
```

**IMPORTANT:** Do NOT commit your `.env` file. Add it to `.gitignore`:
```bash
echo .env >> .gitignore
```

### 1c. Create a Railway project
1. In Railway dashboard, click "New Project"
2. Choose "Deploy from GitHub repo"
3. Select your `2bots-backend` repo
4. Railway auto-detects Python

### 1d. Add environment variables in Railway
Go to your project → Variables tab → Add these:
```
ANTHROPIC_API_KEY=sk-ant-...your key...
OPENAI_API_KEY=sk-...your key...
PORT=8000
CORS_ORIGINS=http://localhost:3000,https://2bots.io,https://www.2bots.io
```

### 1e. Add a start command
In Railway → Settings → Deploy section:
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### 1f. Get your Railway URL
After deploy, Railway gives you a URL like:
`https://2bots-backend-production-xxxx.up.railway.app`

Test it works: visit that URL + `/health` — should show `{"status": "ok"}`

---

## Step 2: Deploy the Next.js Frontend to Vercel

### 2a. Push your frontend to GitHub
```bash
cd C:\Users\WCale\Desktop\2bots-web
git init
git add .
git commit -m "Initial frontend"
git remote add origin https://github.com/YOUR_USERNAME/2bots-web.git
git push -u origin main
```

### 2b. Import to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your `2bots-web` repo from GitHub
4. Framework preset: Next.js (auto-detected)

### 2c. Add environment variables in Vercel
In the import screen (or Settings → Environment Variables):
```
NEXT_PUBLIC_API_URL=https://2bots-backend-production-xxxx.up.railway.app
```
(Use the Railway URL from Step 1f)

### 2d. Deploy
Click Deploy. Vercel builds and gives you a URL like:
`https://2bots-web.vercel.app`

Test it works: visit the URL, you should see the landing page.

---

## Step 3: Point 2bots.io to Vercel

### 3a. Add domain in Vercel
1. Go to your project → Settings → Domains
2. Add `2bots.io` and `www.2bots.io`
3. Vercel will show you DNS records to add

### 3b. Update DNS at your domain registrar
Add the records Vercel tells you (usually an A record or CNAME).
This varies by registrar — Vercel's instructions are clear.

### 3c. Wait for DNS propagation (5 min to 48 hours, usually fast)

After this, `2bots.io` shows your landing page and `2bots.io/app` is the live app.

---

## Step 4: Test Everything

1. Go to https://2bots.io — landing page loads
2. Click "Try it free" — goes to /app
3. Set personality slider, hit START
4. Both bots should respond with text + audio
5. "SHUT UP & LISTEN" should record your voice
6. Type a message and hit Send

---

## Step 5 (Later): Add Auth + Billing

These aren't needed for launch but you'll want them soon:

### Clerk (auth)
1. Sign up at https://clerk.com
2. Create an app, get your keys
3. Add to Vercel env vars:
   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   - CLERK_SECRET_KEY
4. Install: `npm install @clerk/nextjs`
5. Wrap your app in ClerkProvider

### Stripe (billing)
1. Sign up at https://stripe.com
2. Create a product + price ($9.99/mo)
3. Add to Vercel env vars:
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_PRICE_ID
4. Install: `npm install stripe @stripe/stripe-js`
5. Create a checkout API route

### Supabase (usage tracking)
1. You already have an account
2. Create a new project
3. Create a `usage` table:
   - id (uuid, primary key)
   - user_id (text) — Clerk user ID or IP for anonymous
   - date (date)
   - session_count (int, default 0)
4. Add to Vercel env vars:
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_KEY

I'll wire all this up for you when you're ready — just get Steps 1-4 working first.

---

## Local Development

Run both at the same time:

**Terminal 1 — Backend:**
```bash
cd C:\Users\WCale\Desktop\2bots\backend
python -m uvicorn app:app --reload
```

**Terminal 2 — Frontend:**
```bash
cd C:\Users\WCale\Desktop\2bots-web
npm install
npm run dev
```

Then open http://localhost:3000

---

## Costs Estimate

| Service | Cost |
|---------|------|
| Vercel (frontend) | Free tier |
| Railway (backend) | ~$5/month |
| Claude API (Haiku) | ~$0.01 per conversation |
| OpenAI API (GPT-4o-mini + Whisper) | ~$0.02 per conversation |
| Edge TTS | Free |
| Clerk (auth) | Free up to 10,000 users |
| Stripe | 2.9% + $0.30 per transaction |

At 100 users doing 5 convos/day = $15-25/month in API costs.
At 1000 users = $150-250/month.
Break even at ~25 Pro subscribers.
