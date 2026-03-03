from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from contextlib import asynccontextmanager
from pathlib import Path
import logging

from app.config import settings
from app.database import init_db
from app.routes import (
    auth_router,
    habits_router,
    time_log_router,
    meals_router,
    dashboard_router,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Absolute path to the app/ directory — works regardless of CWD
APP_DIR = Path(__file__).parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting Life Tracker — initializing database…")
    init_db()
    logger.info("✅ Database ready.")
    yield
    logger.info("🛑 Shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url=None,
)

# Static files
app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")

# Routers
app.include_router(auth_router)
app.include_router(habits_router)
app.include_router(time_log_router)
app.include_router(meals_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return RedirectResponse("/dashboard")


@app.exception_handler(404)
async def not_found(request: Request, _exc):
    from fastapi.templating import Jinja2Templates
    templates = Jinja2Templates(directory=str(APP_DIR / "templates"))
    return templates.TemplateResponse(
        "login.html",
        {"request": request, "error": "Page not found.", "success": None},
        status_code=404,
    )
