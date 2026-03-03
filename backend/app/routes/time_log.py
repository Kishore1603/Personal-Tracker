from datetime import date
from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import get_current_user
from app.repositories.time_log_repo import TimeLogRepository
from app.schemas.time_log import DailyTimeLogCreate

router = APIRouter(prefix="/time-log", tags=["time_log"])
templates = Jinja2Templates(directory="app/templates")


def _auth(request: Request, db: Session):
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


@router.get("", response_class=HTMLResponse)
def time_log_page(
    request: Request,
    log_date: str = "",
    db: Session = Depends(get_db),
):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    target_date = date.fromisoformat(log_date) if log_date else date.today()
    repo = TimeLogRepository(db)
    entries = repo.get_entries_for_date(user.id, target_date)
    summary = repo.get_summary_for_date(user.id, target_date)

    entry_map = {e.activity_category: e.hours_spent for e in entries}

    return templates.TemplateResponse(
        "time_log.html",
        {
            "request": request,
            "user": user,
            "target_date": target_date,
            "entry_map": entry_map,
            "summary": summary,
            "error": None,
            "success": None,
        },
    )


@router.post("", response_class=HTMLResponse)
def save_time_log(
    request: Request,
    log_date: str = Form(...),
    sleep: float = Form(0.0),
    work: float = Form(0.0),
    study: float = Form(0.0),
    workout: float = Form(0.0),
    leisure: float = Form(0.0),
    idle: float = Form(0.0),
    custom1_name: str = Form(""),
    custom1_hours: float = Form(0.0),
    custom2_name: str = Form(""),
    custom2_hours: float = Form(0.0),
    custom3_name: str = Form(""),
    custom3_hours: float = Form(0.0),
    db: Session = Depends(get_db),
):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)

    target_date = date.fromisoformat(log_date) if log_date else date.today()
    repo = TimeLogRepository(db)

    # Build custom activities dict
    custom: dict[str, float] = {}
    for name, hours in [
        (custom1_name, custom1_hours),
        (custom2_name, custom2_hours),
        (custom3_name, custom3_hours),
    ]:
        if name.strip():
            custom[name.strip()] = hours

    # Auto-compute un-logged time so total always equals 24
    entered_total = round(sleep + work + study + workout + leisure + idle + sum(custom.values()), 4)
    un_logged = round(max(0.0, 24.0 - entered_total), 2)
    custom["un_logged"] = un_logged

    try:
        data = DailyTimeLogCreate(
            log_date=target_date,
            sleep=sleep,
            work=work,
            study=study,
            workout=workout,
            leisure=leisure,
            idle=idle,
            custom_activities=custom,
        )
        summary = repo.upsert_day(user.id, data)
        entries = repo.get_entries_for_date(user.id, target_date)
        entry_map = {e.activity_category: e.hours_spent for e in entries}
        return templates.TemplateResponse(
            "time_log.html",
            {
                "request": request,
                "user": user,
                "target_date": target_date,
                "entry_map": entry_map,
                "summary": summary,
                "error": None,
                "success": "Time log saved successfully!",
            },
        )
    except Exception as e:
        entries = repo.get_entries_for_date(user.id, target_date)
        entry_map = {e.activity_category: e.hours_spent for e in entries}
        return templates.TemplateResponse(
            "time_log.html",
            {
                "request": request,
                "user": user,
                "target_date": target_date,
                "entry_map": entry_map,
                "summary": None,
                "error": str(e),
                "success": None,
            },
            status_code=422,
        )



