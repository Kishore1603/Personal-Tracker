from datetime import date
from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import get_current_user
from app.repositories.meal_repo import MealRepository
from app.schemas.meal import MealCreate, MealUpdate

router = APIRouter(prefix="/meals", tags=["meals"])
templates = Jinja2Templates(directory="app/templates")

NON_SNACK = {"Breakfast", "Lunch", "Dinner"}


def _auth(request: Request, db: Session):
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


@router.get("", response_class=HTMLResponse)
def meals_page(request: Request, meal_date: str = "", db: Session = Depends(get_db)):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    target_date = date.fromisoformat(meal_date) if meal_date else date.today()
    repo = MealRepository(db)
    meals = repo.list_meals(user.id, target_date)
    totals = repo.daily_totals(user.id, target_date)
    return templates.TemplateResponse(
        "meals.html",
        {
            "request": request,
            "user": user,
            "target_date": target_date,
            "meals": meals,
            "totals": totals,
            "error": None,
            "success": None,
        },
    )


@router.post("", response_class=HTMLResponse)
def add_meal(
    request: Request,
    meal_date: str = Form(...),
    meal_type: str = Form(...),
    description: str = Form(""),
    calories: str = Form(""),
    protein_g: str = Form(""),
    carbs_g: str = Form(""),
    fat_g: str = Form(""),
    notes: str = Form(""),
    db: Session = Depends(get_db),
):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    target_date = date.fromisoformat(meal_date) if meal_date else date.today()
    repo = MealRepository(db)

    def _opt_float(v: str) -> float | None:
        try:
            return float(v) if v.strip() else None
        except ValueError:
            return None

    error = None
    # Enforce unique main meals per day
    if meal_type in NON_SNACK:
        existing = repo.get_meal_by_type(user.id, target_date, meal_type)
        if existing:
            error = f"{meal_type} is already logged for {target_date}. Edit or delete it first."

    if not error:
        try:
            data = MealCreate(
                meal_date=target_date,
                meal_type=meal_type,
                description=description or None,
                calories=_opt_float(calories),
                protein_g=_opt_float(protein_g),
                carbs_g=_opt_float(carbs_g),
                fat_g=_opt_float(fat_g),
                notes=notes or None,
            )
            repo.create_meal(user.id, data)
        except Exception as e:
            error = str(e)

    meals = repo.list_meals(user.id, target_date)
    totals = repo.daily_totals(user.id, target_date)
    return templates.TemplateResponse(
        "meals.html",
        {
            "request": request,
            "user": user,
            "target_date": target_date,
            "meals": meals,
            "totals": totals,
            "error": error,
            "success": None if error else "Meal logged!",
        },
        status_code=400 if error else 200,
    )


@router.post("/delete/{meal_id}")
def delete_meal(meal_id: int, request: Request, db: Session = Depends(get_db)):
    user = _auth(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    repo = MealRepository(db)
    meal = repo.get_meal(meal_id, user.id)
    if meal:
        repo.delete_meal(meal)
    return RedirectResponse(f"/meals?meal_date={meal.meal_date}", status_code=302)
