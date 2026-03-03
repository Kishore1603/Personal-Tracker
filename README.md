# 🌟 Life Tracker

A personal activity & habit tracker with a 24-hour time allocation system. Built with FastAPI, SQLite, and Jinja2 — no frontend framework required.

---

## Features

- **User Auth** — Register/login with JWT stored in HttpOnly cookies
- **Habit Tracker** — Create habits, log completions, track streaks
- **Time Log** — Allocate hours across Sleep, Work, Study, Workout, Leisure, Idle, and custom categories. Remaining hours auto-saved as *Un-Logged*
- **Meal Tracker** — Log Breakfast, Lunch, Dinner, Snacks with calories
- **Analytics Dashboards** — Weekly, Monthly, and Yearly breakdowns with charts
- **Scoring** — Efficiency, Sleep, Balance, and Composite scores per day
- **Mobile Friendly** — Responsive dark UI with hamburger nav on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.110, Python 3.13 |
| Database | SQLite (SQLAlchemy 2.0, WAL mode) |
| Auth | JWT (python-jose) + bcrypt + HttpOnly cookies |
| Templates | Jinja2 3.1 |
| Charts | Chart.js 4.4 (CDN) |
| Validation | Pydantic v2 |

---

## Project Structure

```
Personal tracker/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings (SECRET_KEY, DB URL, JWT config)
│   │   ├── database.py          # Engine, session, init_db()
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── category.py
│   │   │   ├── habit.py
│   │   │   ├── habit_log.py
│   │   │   ├── time_log.py
│   │   │   └── meal.py
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   ├── repositories/        # DB access layer
│   │   ├── services/            # Auth + Analytics logic
│   │   ├── routes/              # FastAPI routers
│   │   ├── templates/           # Jinja2 HTML templates
│   │   └── static/
│   │       ├── css/styles.css
│   │       └── js/main.js
│   ├── life_tracker.db          # SQLite database (auto-created)
│   └── requirements.txt
└── README.md
```

---

## Installation & Running

### Prerequisites
- Python 3.10 or higher

### 1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Open in browser
```
http://localhost:8000
```

### From your phone (same Wi-Fi)
Find your PC's local IP:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" }
```
Then open `http://<YOUR-IP>:8000` on your phone.

---

## Hosting Options

### Option A — Cloudflare Tunnel (Free, PC stays on)
```bash
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:8000
```
Gives a public HTTPS URL anyone can access, as long as your PC is running.

### Option B — Render.com (Free cloud hosting)
1. Push this repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Option C — Auto-start on Windows boot (NSSM)
```powershell
winget install NSSM.NSSM
nssm install LifeTracker python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
nssm set LifeTracker AppDirectory "C:\path\to\backend"
nssm start LifeTracker
```

---

## Environment Variables

You can create a `.env` file inside `backend/` to override defaults:

```env
SECRET_KEY=your-long-random-secret-key
DATABASE_URL=sqlite:///./life_tracker.db
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DEBUG=False
```

> **Important:** Change `SECRET_KEY` before hosting publicly.

---

## Stopping the Server

Press `Ctrl+C` in the terminal.

If port 8000 is already in use:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
```
