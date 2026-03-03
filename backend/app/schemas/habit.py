from datetime import date, datetime
from pydantic import BaseModel, field_validator


class HabitCreate(BaseModel):
    name: str
    description: str | None = None
    category_id: int | None = None
    habit_type: str = "daily"
    target_value: float = 1.0
    target_unit: str | None = None
    start_date: date = date.today()
    color: str = "#6366f1"

    @field_validator("habit_type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        if v not in ("daily", "weekly", "monthly"):
            raise ValueError("habit_type must be daily, weekly, or monthly.")
        return v


class HabitUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category_id: int | None = None
    habit_type: str | None = None
    target_value: float | None = None
    target_unit: str | None = None
    end_date: date | None = None
    is_active: bool | None = None
    color: str | None = None


class HabitOut(BaseModel):
    id: int
    name: str
    description: str | None
    habit_type: str
    target_value: float | None
    target_unit: str | None
    start_date: date
    is_active: bool
    color: str | None
    category_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class HabitLogCreate(BaseModel):
    habit_id: int
    log_date: date = date.today()
    value: float = 1.0
    notes: str | None = None


class HabitLogOut(BaseModel):
    id: int
    habit_id: int
    log_date: date
    value: float
    notes: str | None
    completed: int
    created_at: datetime

    model_config = {"from_attributes": True}
