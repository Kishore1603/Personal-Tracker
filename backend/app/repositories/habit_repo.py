from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.habit import Habit
from app.models.habit_log import HabitLog
from app.schemas.habit import HabitCreate, HabitUpdate, HabitLogCreate


class HabitRepository:
    def __init__(self, db: Session):
        self.db = db

    # ── Habits ──────────────────────────────────────────────────────────────

    def list_habits(self, user_id: int, active_only: bool = False) -> list[Habit]:
        q = self.db.query(Habit).filter(Habit.user_id == user_id)
        if active_only:
            q = q.filter(Habit.is_active == True)
        return q.order_by(Habit.created_at.desc()).all()

    def get_habit(self, habit_id: int, user_id: int) -> Habit | None:
        return (
            self.db.query(Habit)
            .filter(Habit.id == habit_id, Habit.user_id == user_id)
            .first()
        )

    def create_habit(self, user_id: int, data: HabitCreate) -> Habit:
        habit = Habit(user_id=user_id, **data.model_dump())
        self.db.add(habit)
        self.db.commit()
        self.db.refresh(habit)
        return habit

    def update_habit(self, habit: Habit, data: HabitUpdate) -> Habit:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(habit, field, value)
        self.db.commit()
        self.db.refresh(habit)
        return habit

    def delete_habit(self, habit: Habit) -> None:
        self.db.delete(habit)
        self.db.commit()

    # ── Habit Logs ──────────────────────────────────────────────────────────

    def get_log(self, user_id: int, habit_id: int, log_date: date) -> HabitLog | None:
        return (
            self.db.query(HabitLog)
            .filter(
                HabitLog.user_id == user_id,
                HabitLog.habit_id == habit_id,
                HabitLog.log_date == log_date,
            )
            .first()
        )

    def create_log(self, user_id: int, data: HabitLogCreate) -> HabitLog:
        log = HabitLog(user_id=user_id, **data.model_dump())
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def delete_log(self, log: HabitLog) -> None:
        self.db.delete(log)
        self.db.commit()

    def logs_for_habit(
        self, user_id: int, habit_id: int, since: date | None = None
    ) -> list[HabitLog]:
        q = self.db.query(HabitLog).filter(
            HabitLog.user_id == user_id, HabitLog.habit_id == habit_id
        )
        if since:
            q = q.filter(HabitLog.log_date >= since)
        return q.order_by(HabitLog.log_date.desc()).all()

    def logs_for_date_range(
        self, user_id: int, start: date, end: date
    ) -> list[HabitLog]:
        return (
            self.db.query(HabitLog)
            .filter(
                HabitLog.user_id == user_id,
                HabitLog.log_date >= start,
                HabitLog.log_date <= end,
            )
            .all()
        )

    # ── Streak computation ───────────────────────────────────────────────────

    def compute_streaks(self, user_id: int, habit_id: int) -> dict:
        logs = (
            self.db.query(HabitLog.log_date)
            .filter(
                HabitLog.user_id == user_id,
                HabitLog.habit_id == habit_id,
                HabitLog.completed == 1,
            )
            .order_by(HabitLog.log_date.desc())
            .all()
        )
        dates = sorted({r.log_date for r in logs}, reverse=True)
        if not dates:
            return {"current_streak": 0, "longest_streak": 0}

        # Current streak
        current = 0
        today = date.today()
        expected = today
        for d in dates:
            if d == expected:
                current += 1
                expected -= timedelta(days=1)
            elif d == today - timedelta(days=1) and current == 0:
                current += 1
                expected = d - timedelta(days=1)
            else:
                break

        # Longest streak
        longest = 0
        streak = 1
        for i in range(1, len(dates)):
            if (dates[i - 1] - dates[i]).days == 1:
                streak += 1
                longest = max(longest, streak)
            else:
                streak = 1
        longest = max(longest, streak, current)

        return {"current_streak": current, "longest_streak": longest}
