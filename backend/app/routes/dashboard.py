from datetime import date, datetime
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.analytics_service import AnalyticsService
from app.repositories.habit_repo import HabitRepository
from app.repositories.time_log_repo import TimeLogRepository
from app.repositories.meal_repo import MealRepository

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
templates = Jinja2Templates(directory="app/templates")


def _auth(request: Request, db: Session):
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


@router.get("", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)

    today = date.today()
    habit_repo = HabitRepository(db)
    time_repo = TimeLogRepository(db)
    meal_repo = MealRepository(db)

    habits = habit_repo.list_habits(user.id, active_only=True)
    today_logs = [
        {
            "habit": h,
            "logged": habit_repo.get_log(user.id, h.id, today) is not None,
            **habit_repo.compute_streaks(user.id, h.id),
        }
        for h in habits
    ]
    time_summary = time_repo.get_summary_for_date(user.id, today)
    time_entries = time_repo.get_entries_for_date(user.id, today)
    meals = meal_repo.list_meals(user.id, today)
    meal_totals = meal_repo.daily_totals(user.id, today)

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "user": user,
            "today": today,
            "now_hour": datetime.now().hour,
            "today_logs": today_logs,
            "time_summary": time_summary,
            "time_entries": time_entries,
            "meals": meals,
            "meal_totals": meal_totals,
        },
    )


@router.get("/weekly", response_class=HTMLResponse)
def weekly(request: Request, db: Session = Depends(get_db), ref: str = ""):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    from datetime import timedelta
    ref_date = date.fromisoformat(ref) if ref else date.today()
    svc = AnalyticsService(db)
    data = svc.weekly_summary(user.id, ref_date)
    advanced = svc.advanced_analytics(user.id)
    # Previous / next Monday for navigation
    week_start = ref_date - timedelta(days=ref_date.weekday())
    prev_week = (week_start - timedelta(days=7)).isoformat()
    next_week = (week_start + timedelta(days=7)).isoformat()
    return templates.TemplateResponse(
        "weekly.html",
        {
            "request": request,
            "user": user,
            "data": data,
            "advanced": advanced,
            "ref_date": ref_date,
            "prev_week": prev_week,
            "next_week": next_week,
        },
    )


@router.get("/monthly", response_class=HTMLResponse)
def monthly(
    request: Request,
    db: Session = Depends(get_db),
    year: int = date.today().year,
    month: int = date.today().month,
):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    svc = AnalyticsService(db)
    data = svc.monthly_summary(user.id, year, month)
    return templates.TemplateResponse(
        "monthly.html",
        {"request": request, "user": user, "data": data, "year": year, "month": month},
    )


@router.get("/yearly", response_class=HTMLResponse)
def yearly(
    request: Request,
    db: Session = Depends(get_db),
    year: int = date.today().year,
):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    svc = AnalyticsService(db)
    data = svc.yearly_summary(user.id, year)
    return templates.TemplateResponse(
        "yearly.html",
        {"request": request, "user": user, "data": data, "year": year},
    )
