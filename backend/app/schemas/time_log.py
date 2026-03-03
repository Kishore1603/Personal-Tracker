from datetime import date, datetime
from pydantic import BaseModel, model_validator, field_validator
from typing import Dict


# Built-in categories; additional ones can be passed as "custom_activities"
BUILTIN_CATEGORIES = {"sleep", "work", "study", "workout", "leisure", "idle"}

# Productive categories for scoring
PRODUCTIVE_CATEGORIES = {"work", "study", "workout"}


class TimeLogEntry(BaseModel):
    """Single activity entry inside a day submission."""
    activity_category: str
    hours_spent: float
    notes: str | None = None

    @field_validator("hours_spent")
    @classmethod
    def valid_hours(cls, v: float) -> float:
        if v < 0:
            raise ValueError("hours_spent cannot be negative.")
        if v > 24:
            raise ValueError("hours_spent cannot exceed 24.")
        return round(v, 2)

    @field_validator("activity_category")
    @classmethod
    def non_empty(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("activity_category cannot be empty.")
        return v


class DailyTimeLogCreate(BaseModel):
    log_date: date = date.today()
    sleep: float = 0.0
    work: float = 0.0
    study: float = 0.0
    workout: float = 0.0
    leisure: float = 0.0
    idle: float = 0.0
    # key → hours for any extra categories
    custom_activities: Dict[str, float] = {}

    @model_validator(mode="after")
    def validate_max_24_hours(self) -> "DailyTimeLogCreate":
        builtin_total = (
            self.sleep
            + self.work
            + self.study
            + self.workout
            + self.leisure
            + self.idle
        )
        custom_total = sum(self.custom_activities.values())
        total = round(builtin_total + custom_total, 4)
        if total > 24.0:
            raise ValueError(
                f"Total hours cannot exceed 24. Current sum: {total:.2f} h."
            )
        for name, h in self.custom_activities.items():
            if h < 0 or h > 24:
                raise ValueError(f"Custom activity '{name}' hours must be 0–24.")
        return self

    def to_entries(self) -> list[TimeLogEntry]:
        entries = []
        for cat in BUILTIN_CATEGORIES:
            h = getattr(self, cat, 0.0)
            entries.append(TimeLogEntry(activity_category=cat, hours_spent=h))
        for cat, h in self.custom_activities.items():
            entries.append(TimeLogEntry(activity_category=cat.strip().lower(), hours_spent=h))
        return entries


class DailyTimeLogOut(BaseModel):
    id: int
    log_date: date
    activity_category: str
    hours_spent: float
    is_productive: int
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DailyTimeSummaryOut(BaseModel):
    id: int
    summary_date: date
    total_productive_hours: float
    total_unproductive_hours: float
    sleep_hours: float
    efficiency_score: float
    sleep_score: float
    balance_score: float
    composite_score: float

    model_config = {"from_attributes": True}
