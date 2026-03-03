from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Date, DateTime,
    ForeignKey, Float, UniqueConstraint, Index, Text, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

# Valid meal types
MEAL_TYPES = ("Breakfast", "Lunch", "Dinner", "Snack")


class DailyMeal(Base):
    __tablename__ = "daily_meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meal_date = Column(Date, default=date.today, nullable=False)
    meal_type = Column(String(20), nullable=False)  # Breakfast/Lunch/Dinner/Snack
    description = Column(Text, nullable=True)
    calories = Column(Float, nullable=True)
    protein_g = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="meals")

    __table_args__ = (
        # Unique for main meals, Snacks can have multiple rows
        # Enforced at the application level; no DB-level unique for Snack
        Index("ix_daily_meals_user_date", "user_id", "meal_date"),
        CheckConstraint(
            "meal_type IN ('Breakfast','Lunch','Dinner','Snack')",
            name="ck_meal_type",
        ),
    )

    def __repr__(self) -> str:
        return f"<DailyMeal id={self.id} date={self.meal_date} type={self.meal_type}>"
