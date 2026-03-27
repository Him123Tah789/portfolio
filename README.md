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

## 🤖 Local AI Setup (Ollama)

The chat assistant uses Ollama via `src/app/api/chat/route.ts`.

```bash
# 1) Install/start Ollama app first, then pull model used by default in this repo
ollama pull llama2

# 2) (Optional) test model directly
ollama run llama2
```

Add these variables to `.env.local` (or keep defaults):

```env
CHAT_MODE=rules
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
OLLAMA_FALLBACK_MODEL=tinyllama:latest
```

`CHAT_MODE` options:
- `rules` → Fast dynamic chatbot from your DB content (no LLM required)
- `ollama` → Always use Ollama
- `hybrid` → Use DB rules first, fallback to Ollama for unknown questions

For deployment with smaller footprint and faster response, use `CHAT_MODE=rules`.

### Use Ollama after deploying to Vercel

Vercel cannot host Ollama directly. Run Ollama on another server (VPS, GPU VM, or reverse-proxy service) and point your Vercel backend to it.

Set these Environment Variables in Vercel:

```env
CHAT_MODE=ollama
OLLAMA_BASE_URL=https://your-ollama-host.example.com
OLLAMA_MODEL=llama3.2:1b
OLLAMA_FALLBACK_MODEL=tinyllama:latest
OLLAMA_TIMEOUT_MS=20000

# Optional if your Ollama endpoint is protected
OLLAMA_API_KEY=your-secret-token
OLLAMA_API_KEY_HEADER=Authorization
OLLAMA_API_KEY_PREFIX=Bearer

# API protection (chat endpoint on your app)
CHAT_RATE_LIMIT_WINDOW_MS=60000
CHAT_RATE_LIMIT_MAX=20
```

Hybrid mode example (rules first, Ollama fallback):

```env
CHAT_MODE=hybrid
OLLAMA_BASE_URL=https://your-ollama-host.example.com
```

If `CHAT_MODE=rules`, Ollama variables are not required in production.

### Harden remote Ollama endpoint (recommended)

1. Keep Ollama bound to localhost on the host machine (`127.0.0.1:11434`).
2. Put Nginx in front of Ollama with TLS and token protection.
3. Use the sample config in `deploy/nginx/ollama-proxy.conf`.
4. Replace these values before applying:
  - `ollama.example.com`
  - certificate paths
  - `Bearer REPLACE_WITH_STRONG_TOKEN`
5. Set the same token in Vercel as `OLLAMA_API_KEY`.

This way, your public site calls Vercel API routes, Vercel calls your protected proxy, and only then proxy reaches local Ollama.

If chat fails, make sure Ollama is running and the model is pulled.

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
