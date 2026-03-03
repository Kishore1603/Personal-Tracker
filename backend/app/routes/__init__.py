from app.routes.auth import router as auth_router
from app.routes.habits import router as habits_router
from app.routes.time_log import router as time_log_router
from app.routes.meals import router as meals_router
from app.routes.dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "habits_router",
    "time_log_router",
    "meals_router",
    "dashboard_router",
]
