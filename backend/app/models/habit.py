from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime,
    ForeignKey, Float, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    habit_type = Column(String(10), nullable=False, default="daily")  # daily/weekly/monthly
    target_value = Column(Float, nullable=True, default=1.0)
    target_unit = Column(String(30), nullable=True)
    start_date = Column(Date, default=date.today, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    color = Column(String(20), nullable=True, default="#6366f1")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="habits")
    category = relationship("Category", back_populates="habits")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_habits_user_active", "user_id", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Habit id={self.id} name={self.name!r}>"
