from datetime import date, datetime
from pydantic import BaseModel, field_validator, model_validator

VALID_MEAL_TYPES = {"Breakfast", "Lunch", "Dinner", "Snack"}


class MealCreate(BaseModel):
    meal_date: date = date.today()
    meal_type: str
    description: str | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    notes: str | None = None

    @field_validator("meal_type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        v = v.strip().capitalize()
        if v not in VALID_MEAL_TYPES:
            raise ValueError(f"meal_type must be one of {sorted(VALID_MEAL_TYPES)}.")
        return v

    @model_validator(mode="after")
    def non_negative_macros(self) -> "MealCreate":
        for field in ("calories", "protein_g", "carbs_g", "fat_g"):
            val = getattr(self, field)
            if val is not None and val < 0:
                raise ValueError(f"{field} cannot be negative.")
        return self


class MealUpdate(BaseModel):
    description: str | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    notes: str | None = None


class MealOut(BaseModel):
    id: int
    meal_date: date
    meal_type: str
    description: str | None
    calories: float | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
