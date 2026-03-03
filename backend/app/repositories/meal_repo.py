from datetime import date
from sqlalchemy.orm import Session
from app.models.meal import DailyMeal
from app.schemas.meal import MealCreate, MealUpdate

NON_SNACK_TYPES = {"Breakfast", "Lunch", "Dinner"}


class MealRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_meals(self, user_id: int, meal_date: date) -> list[DailyMeal]:
        return (
            self.db.query(DailyMeal)
            .filter(DailyMeal.user_id == user_id, DailyMeal.meal_date == meal_date)
            .order_by(DailyMeal.id.asc())
            .all()
        )

    def list_meals_range(self, user_id: int, start: date, end: date) -> list[DailyMeal]:
        return (
            self.db.query(DailyMeal)
            .filter(
                DailyMeal.user_id == user_id,
                DailyMeal.meal_date >= start,
                DailyMeal.meal_date <= end,
            )
            .order_by(DailyMeal.meal_date.asc(), DailyMeal.id.asc())
            .all()
        )

    def get_meal(self, meal_id: int, user_id: int) -> DailyMeal | None:
        return (
            self.db.query(DailyMeal)
            .filter(DailyMeal.id == meal_id, DailyMeal.user_id == user_id)
            .first()
        )

    def get_meal_by_type(
        self, user_id: int, meal_date: date, meal_type: str
    ) -> DailyMeal | None:
        """Only meaningful for non-snack types."""
        return (
            self.db.query(DailyMeal)
            .filter(
                DailyMeal.user_id == user_id,
                DailyMeal.meal_date == meal_date,
                DailyMeal.meal_type == meal_type,
            )
            .first()
        )

    def create_meal(self, user_id: int, data: MealCreate) -> DailyMeal:
        meal = DailyMeal(user_id=user_id, **data.model_dump())
        self.db.add(meal)
        self.db.commit()
        self.db.refresh(meal)
        return meal

    def update_meal(self, meal: DailyMeal, data: MealUpdate) -> DailyMeal:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(meal, field, value)
        self.db.commit()
        self.db.refresh(meal)
        return meal

    def delete_meal(self, meal: DailyMeal) -> None:
        self.db.delete(meal)
        self.db.commit()

    def daily_totals(self, user_id: int, meal_date: date) -> dict:
        meals = self.list_meals(user_id, meal_date)
        totals = {
            "total_calories": sum(m.calories or 0 for m in meals),
            "total_protein_g": sum(m.protein_g or 0 for m in meals),
            "total_carbs_g": sum(m.carbs_g or 0 for m in meals),
            "total_fat_g": sum(m.fat_g or 0 for m in meals),
            "logged_types": [m.meal_type for m in meals],
        }
        return totals

    def consistency_score(self, user_id: int, start: date, end: date) -> float:
        """% of days in range that have all 3 main meals logged."""
        from datetime import timedelta

        total_days = (end - start).days + 1
        if total_days <= 0:
            return 0.0

        meals = self.list_meals_range(user_id, start, end)
        days_with_all: set[date] = set()
        by_date: dict[date, set[str]] = {}
        for m in meals:
            by_date.setdefault(m.meal_date, set()).add(m.meal_type)

        for d, types in by_date.items():
            if NON_SNACK_TYPES.issubset(types):
                days_with_all.add(d)

        return round(len(days_with_all) / total_days * 100, 2)
