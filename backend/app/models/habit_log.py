from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Date, DateTime,
    ForeignKey, Float, UniqueConstraint, Index, Text
)
from sqlalchemy.orm import relationship
from app.database import Base


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, default=date.today, nullable=False)
    value = Column(Float, default=1.0, nullable=False)
    notes = Column(Text, nullable=True)
    completed = Column(Integer, default=1, nullable=False)  # 1 = completed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="habit_logs")
    habit = relationship("Habit", back_populates="logs")

    # Unique: one log per (user, habit, date)
    __table_args__ = (
        UniqueConstraint("user_id", "habit_id", "log_date", name="uq_habit_log_daily"),
        Index("ix_habit_logs_user_date", "user_id", "log_date"),
    )

    def __repr__(self) -> str:
        return f"<HabitLog id={self.id} habit_id={self.habit_id} date={self.log_date}>"
