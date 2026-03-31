# Personal Tracker

A production-ready, gamified personal tracking web application built with Next.js 14, Tailwind CSS, Prisma, and PostgreSQL.

## Features

- **Daily Habit Tracking** — Log goals, track streaks, earn points
- **Yearly Resolutions** — Set and track annual goals with milestone rewards
- **Finance Tracker** — Multi-account management (income, expenses, balance tracking)
- **Movie Tracker** — Log watched movies, rate them, earn milestone rewards at 50 and 100 films
- **Trip Expense Tracker** — Log trips and per-category expenses
- **Gamification** — 5 named levels (Initiate → Unstoppable), points, rewards
- **Smart Dashboard** — Weekly activity charts, streaks, level progress
- **Analytics** — Goal trends, finance charts, movie and travel insights
- **In-App Notifications** — Automated alerts for missed goals, streaks, rewards, and spending

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + Framer Motion |
| Database | PostgreSQL (Neon / Supabase free tier) |
| ORM | Prisma |
| Auth | NextAuth.js v4 (Google OAuth) |
| Charts | Recharts |
| Deployment | Vercel |

---

## Prerequisites

- Node.js 18+
- A PostgreSQL database (free options: [Neon](https://neon.tech) or [Supabase](https://supabase.com))
- A Google OAuth app (for sign-in)

---

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd personal-tracker
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Database — get from Neon or Supabase dashboard
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Google OAuth — see setup below
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Cron job protection
CRON_SECRET="some-random-secret-string"
```

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Set **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-app.vercel.app/api/auth/callback/google` (production)
6. Copy the **Client ID** and **Client Secret** into `.env.local`

### 4. Set up the database

```bash
npx prisma db push
```

This creates all tables based on `prisma/schema.prisma`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/personal-tracker.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Add all environment variables from `.env.local` in the Vercel dashboard:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_URL` → set to `https://your-app.vercel.app`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `CRON_SECRET`
3. Deploy — Vercel auto-detects Next.js

### 3. Cron job (automatic daily tasks)

`vercel.json` is already configured to run `/api/cron/daily` every day at 23:00 UTC. Vercel Hobby plan supports one cron job for free.

The cron job:
- Marks missed goals as MISSED
- Sends missed goal notifications
- Alerts on overspending (expense > 80% of monthly income)
- Sends resolution deadline reminders

---

## Project Structure

```
personal-tracker/
├── app/
│   ├── (dashboard)/          # Protected routes
│   │   ├── page.tsx          # Home dashboard
│   │   ├── goals/            # Habit tracking
│   │   ├── resolutions/      # Yearly goals
│   │   ├── finance/          # Finance tracker
│   │   ├── movies/           # Movie log
│   │   ├── trips/            # Trip expenses
│   │   ├── rewards/          # Points & rewards
│   │   ├── analytics/        # Charts & insights
│   │   └── notifications/    # Notification center
│   ├── api/                  # API routes
│   ├── signin/               # Sign-in page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                   # Button, Card, Modal, Input, Badge, Toast
│   ├── layout/               # Sidebar, Header
│   ├── dashboard/            # TodayGoals, LevelProgress, StatsCard
│   ├── goals/                # GoalForm, GoalCard
│   ├── finance/              # TransactionForm
│   ├── movies/               # MovieForm
│   ├── trips/                # TripForm, AddExpenseForm
│   └── gamification/         # LevelBadge, RewardCard
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── auth.ts               # NextAuth config
│   ├── gamification.ts       # Level system
│   ├── streaks.ts            # Streak calculations
│   ├── rewards.ts            # Point & reward logic
│   ├── notifications.ts      # Notification helpers
│   └── utils.ts              # Formatting, constants
├── prisma/
│   └── schema.prisma         # Full DB schema
├── types/index.ts            # TypeScript types
├── hooks/use-toast.ts        # Toast hook
└── vercel.json               # Cron configuration
```

---

## Level System

| Level | Name | Points Required | Icon |
|-------|------|-----------------|------|
| 1 | Initiate | 0 | 🌱 |
| 2 | Consistent | 100 | ⚡ |
| 3 | Disciplined | 300 | 🔥 |
| 4 | Elite | 700 | 💎 |
| 5 | Unstoppable | 1500 | 🚀 |

### How to earn points

| Action | Points |
|--------|--------|
| Complete a daily goal | 10 pts (configurable per goal) |
| 7-day streak | 25 pts |
| 30-day streak | 100 pts |
| 100-day streak | 500 pts |
| Resolution 25% milestone | 15 pts |
| Resolution 50% milestone | 30 pts |
| Resolution 75% milestone | 50 pts |
| Complete a resolution | 100 pts |
| Watch 50 movies | 75 pts |
| Watch 100 movies | 150 pts |

---

## API Reference

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/goals` | GET, POST | List/create goals |
| `/api/goals/[id]` | GET, PATCH, DELETE | Single goal ops |
| `/api/goals/[id]/logs` | GET, POST | Log completions |
| `/api/goals/today` | GET | Today's scheduled goals |
| `/api/resolutions` | GET, POST | List/create resolutions |
| `/api/resolutions/[id]` | GET, PATCH, DELETE | Single resolution ops |
| `/api/finance/accounts` | GET, POST | Finance accounts |
| `/api/finance/transactions` | GET, POST | Transactions (filter: accountId, type, month) |
| `/api/finance/transactions/[id]` | PATCH, DELETE | Edit/delete transaction |
| `/api/movies` | GET, POST | Movie log (filter: year, genre) |
| `/api/movies/[id]` | PATCH, DELETE | Edit/delete movie |
| `/api/trips` | GET, POST | Trips with expenses |
| `/api/trips/[id]/expenses` | GET, POST | Trip expenses |
| `/api/rewards` | GET | Unlocked rewards |
| `/api/notifications` | GET, PATCH | List / mark-all-read |
| `/api/notifications/[id]` | PATCH, DELETE | Mark read / delete |
| `/api/gamification` | GET | Level data + point history |
| `/api/dashboard` | GET | Full dashboard data |
| `/api/cron/daily` | POST | Daily automation (CRON_SECRET required) |

---

## Troubleshooting

**`PrismaClientInitializationError`** — Check that `DATABASE_URL` is set correctly and the database is reachable.

**Google OAuth redirect error** — Make sure both `http://localhost:3000/api/auth/callback/google` (dev) and your production URL are listed in the Google Cloud Console authorized redirect URIs.

**`NEXTAUTH_SECRET` missing** — Generate with `openssl rand -base64 32` and add to env vars.

**Cron not firing on Vercel** — Ensure `CRON_SECRET` is added to Vercel environment variables and that `vercel.json` is committed.
