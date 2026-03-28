# Md. Mirazul Hasan — Portfolio

A full-stack portfolio website built with **Next.js 16**, **Prisma**, **NextAuth**, and **TypeScript**.  
Features a dynamic admin panel, Light/Dark theme toggle, animated screensaver background, and a full CV management system.

---

## ✨ Features

- 🎨 **Light / Dark theme** with zero flash (FOUC-safe localStorage)
- 🌊 **Animated screensaver background** (bouncing colour puddles)
- 👤 **Profile** — name, bio, title, social links, avatar upload with crop/resize
- 🎓 **Education** — degree, field, grade (CGPA/GPA/Division with float support), Ongoing status  
- 💼 **Experience** — roles, timeline, "Currently Working" toggle
- 🚀 **Projects** — featured projects with tags, GitHub & live links
- 🧠 **Skills** — categorised with visual proficiency bars
- 📜 **Certificates** — credentials with verifiable URLs
- ✍️ **Blog Posts** — articles with markdown-ready storage
- 🔒 **Admin panel** — protected by NextAuth session

---

## 🚀 Quick Start (Local)

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/my-portfolio.git
cd my-portfolio

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Push the database schema
npx prisma db push

# 5. Seed the admin user (optional — or create via Prisma Studio)
npx prisma studio

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 AI Setup (Direct OpenAI)

The chat assistant can call OpenAI directly from `src/app/api/chat/route.ts`.

Add these variables to `.env.local`:

```env
CHAT_MODE=hybrid
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_FALLBACK_MODEL=gpt-4.1-mini
OPENAI_TIMEOUT_MS=30000
OPENAI_MAX_TOKENS=350
OPENAI_TEMPERATURE=0.3
```

`CHAT_MODE` options:
- `rules` -> Fast dynamic chatbot from your DB content (no LLM cost)
- `openai` -> Always use OpenAI
- `hybrid` -> Use DB rules first, fallback to OpenAI for unknown questions

For lowest cost, use `CHAT_MODE=rules`. For best flexibility, use `CHAT_MODE=hybrid`.

### OpenAI on Vercel

Set these Environment Variables in Vercel:

```env
CHAT_MODE=hybrid
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_FALLBACK_MODEL=gpt-4.1-mini
OPENAI_TIMEOUT_MS=30000
OPENAI_MAX_TOKENS=350
OPENAI_TEMPERATURE=0.3

# Optional for OpenAI-compatible gateways
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY_HEADER=Authorization
OPENAI_API_KEY_PREFIX=Bearer

# API protection (chat endpoint on your app)
CHAT_RATE_LIMIT_WINDOW_MS=60000
CHAT_RATE_LIMIT_MAX=20
```

If `CHAT_MODE=rules`, OpenAI variables are not required in production.

---

## 🌐 Deployment (Vercel — recommended)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/my-portfolio.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
2. Add these **Environment Variables** in the Vercel dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your production DB connection string (e.g. Railway / Neon PostgreSQL) |
| `NEXTAUTH_SECRET` | A secure random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your Vercel deployment URL, e.g. `https://your-portfolio.vercel.app` |

3. Click **Deploy** ✅

> **Note:** This project uses **PostgreSQL** datasource by default in Prisma.  
> Set a valid PostgreSQL `DATABASE_URL` in Vercel (Neon/Railway/Supabase all work).

### Apply schema on your PostgreSQL database

1. Ensure `DATABASE_URL` points to your PostgreSQL instance.
2. Run `npx prisma db push` (or `migrate deploy`) against that database.

---

## 🗂 Project Structure

```
my-portfolio/
├── prisma/           # Database schema & migrations
├── src/
│   ├── app/          # Next.js App Router pages
│   │   ├── admin/    # Protected admin panel
│   │   ├── api/      # REST API routes
│   │   └── page.tsx  # Public portfolio homepage
│   ├── components/   # Shared React components
│   └── lib/          # Prisma client & utils
├── .env.example      # Environment variable template
└── next.config.ts    # Next.js config
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js |
| Styling | Vanilla CSS + CSS Variables |
| Animations | `requestAnimationFrame` |
| Icons | Lucide React |

---

## 📄 License

MIT — free to use and adapt for your own portfolio.
