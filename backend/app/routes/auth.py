from fastapi import APIRouter, Depends, Request, Form, Response, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate
from app.services.auth_service import create_access_token, get_current_user
from app.config import settings

router = APIRouter(tags=["auth"])
templates = Jinja2Templates(directory="app/templates")


@router.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request, "error": None})


@router.post("/register", response_class=HTMLResponse)
def register(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(""),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    error = None
    if repo.get_by_username(username):
        error = "Username already taken."
    elif repo.get_by_email(email):
        error = "Email already registered."
    elif len(password) < 8:
        error = "Password must be at least 8 characters."

    if error:
        return templates.TemplateResponse(
            "register.html", {"request": request, "error": error}, status_code=400
        )

    data = UserCreate(
        username=username,
        email=email,
        password=password,
        full_name=full_name or None,
    )
    repo.create(data)
    return RedirectResponse("/login?registered=1", status_code=302)


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request, registered: str = ""):
    success_msg = "Registration successful! Please log in." if registered else None
    return templates.TemplateResponse(
        "login.html", {"request": request, "error": None, "success": success_msg}
    )


@router.post("/login")
def login(
    request: Request,
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    user = repo.get_by_username(username)
    if not user or not repo.verify_password(password, user.hashed_password):
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "error": "Invalid username or password.", "success": None},
            status_code=401,
        )

    token = create_access_token({"sub": str(user.id)})
    resp = RedirectResponse("/dashboard", status_code=302)
    resp.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return resp


@router.get("/logout")
def logout():
    resp = RedirectResponse("/login", status_code=302)
    resp.delete_cookie(settings.COOKIE_NAME)
    return resp


@router.get("/profile", response_class=HTMLResponse)
def profile(request: Request, db: Session = Depends(get_db)):
    try:
        user = get_current_user(request, db)
    except HTTPException:
        return RedirectResponse("/login", status_code=302)
    return templates.TemplateResponse("profile.html", {"request": request, "user": user})
