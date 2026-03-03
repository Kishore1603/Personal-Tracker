from datetime import date
from fastapi import APIRouter, Depends, Request, Form, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import get_current_user
from app.repositories.habit_repo import HabitRepository
from app.models.category import Category

router = APIRouter(prefix="/habits", tags=["habits"])
templates = Jinja2Templates(directory="app/templates")


def _auth(request: Request, db: Session) -> object:
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


@router.get("", response_class=HTMLResponse)
def list_habits(request: Request, db: Session = Depends(get_db)):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    repo = HabitRepository(db)
    habits = repo.list_habits(user.id)
    # Enrich with today's log status and streaks
    today = date.today()
    habit_data = []
    for h in habits:
        log = repo.get_log(user.id, h.id, today)
        streaks = repo.compute_streaks(user.id, h.id)
        habit_data.append(
            {
                "habit": h,
                "logged_today": log is not None,
                "current_streak": streaks["current_streak"],
                "longest_streak": streaks["longest_streak"],
            }
        )
    return templates.TemplateResponse(
        "habits.html",
        {"request": request, "user": user, "habit_data": habit_data, "today": today},
    )


@router.get("/create", response_class=HTMLResponse)
def create_form(request: Request, db: Session = Depends(get_db)):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    categories = db.query(Category).all()
    return templates.TemplateResponse(
        "habit_form.html",
        {"request": request, "user": user, "categories": categories, "habit": None, "error": None},
    )


@router.post("/create", response_class=HTMLResponse)
def create_habit(
    request: Request,
    name: str = Form(...),
    description: str = Form(""),
    category_id: str = Form(""),
    habit_type: str = Form("daily"),
    target_value: float = Form(1.0),
    target_unit: str = Form(""),
    start_date: str = Form(""),
    color: str = Form("#6366f1"),
    db: Session = Depends(get_db),
):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    from app.schemas.habit import HabitCreate

    repo = HabitRepository(db)
    sd = date.fromisoformat(start_date) if start_date else date.today()
    cat_id = int(category_id) if category_id else None
    data = HabitCreate(
        name=name,
        description=description or None,
        category_id=cat_id,
        habit_type=habit_type,
        target_value=target_value,
        target_unit=target_unit or None,
        start_date=sd,
        color=color,
    )
    repo.create_habit(user.id, data)
    return RedirectResponse("/habits", status_code=302)


@router.get("/edit/{habit_id}", response_class=HTMLResponse)
def edit_form(habit_id: int, request: Request, db: Session = Depends(get_db)):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    repo = HabitRepository(db)
    habit = repo.get_habit(habit_id, user.id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found.")
    categories = db.query(Category).all()
    return templates.TemplateResponse(
        "habit_form.html",
        {"request": request, "user": user, "categories": categories, "habit": habit, "error": None},
    )


@router.post("/edit/{habit_id}", response_class=HTMLResponse)
def edit_habit(
    habit_id: int,
    request: Request,
    name: str = Form(...),
    description: str = Form(""),
    category_id: str = Form(""),
    habit_type: str = Form("daily"),
    target_value: float = Form(1.0),
    target_unit: str = Form(""),
    is_active: str = Form("on"),
    color: str = Form("#6366f1"),
    db: Session = Depends(get_db),
):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    from app.schemas.habit import HabitUpdate

    repo = HabitRepository(db)
    habit = repo.get_habit(habit_id, user.id)
    if not habit:
        raise HTTPException(status_code=404)
    cat_id = int(category_id) if category_id else None
    data = HabitUpdate(
        name=name,
        description=description or None,
        category_id=cat_id,
        habit_type=habit_type,
        target_value=target_value,
        target_unit=target_unit or None,
        is_active=(is_active == "on"),
        color=color,
    )
    repo.update_habit(habit, data)
    return RedirectResponse("/habits", status_code=302)


@router.post("/delete/{habit_id}")
def delete_habit(habit_id: int, request: Request, db: Session = Depends(get_db)):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    repo = HabitRepository(db)
    habit = repo.get_habit(habit_id, user.id)
    if habit:
        repo.delete_habit(habit)
    return RedirectResponse("/habits", status_code=302)


@router.post("/log/{habit_id}")
def log_habit(
    habit_id: int,
    request: Request,
    notes: str = Form(""),
    db: Session = Depends(get_db),
):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    from app.schemas.habit import HabitLogCreate

    repo = HabitRepository(db)
    today = date.today()
    existing = repo.get_log(user.id, habit_id, today)
    if not existing:
        data = HabitLogCreate(habit_id=habit_id, log_date=today, notes=notes or None)
        repo.create_log(user.id, data)
    return RedirectResponse("/habits", status_code=302)


@router.post("/unlog/{habit_id}")
def unlog_habit(habit_id: int, request: Request, db: Session = Depends(get_db)):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    repo = HabitRepository(db)
    today = date.today()
    log = repo.get_log(user.id, habit_id, today)
    if log:
        repo.delete_log(log)
    return RedirectResponse("/habits", status_code=302)
