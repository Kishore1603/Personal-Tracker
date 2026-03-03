from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Date, DateTime,
    ForeignKey, Float, UniqueConstraint, Index,
    CheckConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


class DailyTimeLog(Base):
    """One row per (user, date, activity_category)."""

    __tablename__ = "daily_time_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, default=date.today, nullable=False)
    activity_category = Column(String(50), nullable=False)
    hours_spent = Column(Float, nullable=False)
    is_productive = Column(Integer, default=0)  # 1 = productive
    notes = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="time_logs")

    __table_args__ = (
        UniqueConstraint("user_id", "log_date", "activity_category", name="uq_time_log_daily_cat"),
        Index("ix_time_log_user_date", "user_id", "log_date"),
        CheckConstraint("hours_spent >= 0 AND hours_spent <= 24", name="ck_hours_range"),
    )

    def __repr__(self) -> str:
        return f"<DailyTimeLog id={self.id} date={self.log_date} cat={self.activity_category}>"


class DailyTimeSummary(Base):
    """One row per (user, date) — aggregated totals and scores."""

    __tablename__ = "daily_time_summary"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    summary_date = Column(Date, nullable=False)
    total_productive_hours = Column(Float, default=0.0)
    total_unproductive_hours = Column(Float, default=0.0)
    sleep_hours = Column(Float, default=0.0)
    efficiency_score = Column(Float, default=0.0)  # (productive / 24) * 100
    sleep_score = Column(Float, default=0.0)        # 100 when 7–8 h
    balance_score = Column(Float, default=0.0)      # variance-based
    composite_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="time_summaries")

    __table_args__ = (
        UniqueConstraint("user_id", "summary_date", name="uq_time_summary_user_date"),
        Index("ix_time_summary_user_date", "user_id", "summary_date"),
    )

    def __repr__(self) -> str:
        return f"<DailyTimeSummary id={self.id} date={self.summary_date} eff={self.efficiency_score:.1f}>"
