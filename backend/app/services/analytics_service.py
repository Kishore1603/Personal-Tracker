from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.repositories.habit_repo import HabitRepository
from app.repositories.time_log_repo import TimeLogRepository
from app.repositories.meal_repo import MealRepository


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.habit_repo = HabitRepository(db)
        self.time_repo = TimeLogRepository(db)
        self.meal_repo = MealRepository(db)

    # ─────────────────────────────── WEEKLY ──────────────────────────────────

    def weekly_summary(self, user_id: int, ref_date: date | None = None) -> dict:
        ref = ref_date or date.today()
        start = ref - timedelta(days=ref.weekday())  # Monday
        end = start + timedelta(days=6)

        habit_pct = self._habit_completion_pct(user_id, start, end)
        summaries = self.time_repo.list_summaries(user_id, start, end)
        avg_productive = (
            sum(s.total_productive_hours for s in summaries) / len(summaries)
            if summaries
            else 0.0
        )
        avg_sleep = (
            sum(s.sleep_hours for s in summaries) / len(summaries) if summaries else 0.0
        )
        meal_consistency = self.meal_repo.consistency_score(user_id, start, end)
        time_dist = self._time_distribution(user_id, start, end)

        return {
            "period": f"{start} → {end}",
            "habit_completion_pct": round(habit_pct, 2),
            "avg_productive_hours": round(avg_productive, 2),
            "avg_sleep_hours": round(avg_sleep, 2),
            "meal_consistency_score": meal_consistency,
            "time_distribution": time_dist,
            "summaries": summaries,
        }

    # ─────────────────────────────── MONTHLY ─────────────────────────────────

    def monthly_summary(self, user_id: int, year: int, month: int) -> dict:
        from calendar import monthrange

        start = date(year, month, 1)
        end = date(year, month, monthrange(year, month)[1])

        # Previous month for comparison
        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1
        prev_end = date(prev_year, prev_month, monthrange(prev_year, prev_month)[1])
        prev_start = date(prev_year, prev_month, 1)

        summaries = self.time_repo.list_summaries(user_id, start, end)
        prev_summaries = self.time_repo.list_summaries(user_id, prev_start, prev_end)

        avg_eff = (
            sum(s.efficiency_score for s in summaries) / len(summaries) if summaries else 0
        )
        prev_avg_eff = (
            sum(s.efficiency_score for s in prev_summaries) / len(prev_summaries)
            if prev_summaries
            else 0
        )

        longest = self._longest_streak_in_period(user_id, start, end)
        habit_pct = self._habit_completion_pct(user_id, start, end)

        return {
            "period": f"{start} → {end}",
            "avg_efficiency": round(avg_eff, 2),
            "prev_avg_efficiency": round(prev_avg_eff, 2),
            "efficiency_change": round(avg_eff - prev_avg_eff, 2),
            "longest_streak": longest,
            "habit_completion_pct": round(habit_pct, 2),
            "summaries": summaries,
        }

    # ─────────────────────────────── YEARLY ──────────────────────────────────

    def yearly_summary(self, user_id: int, year: int) -> dict:
        start = date(year, 1, 1)
        end = date(year, 12, 31)

        habit_pct = self._habit_completion_pct(user_id, start, end)
        summaries = self.time_repo.list_summaries(user_id, start, end)
        avg_eff = (
            sum(s.efficiency_score for s in summaries) / len(summaries) if summaries else 0
        )
        avg_sleep_score = (
            sum(s.sleep_score for s in summaries) / len(summaries) if summaries else 0
        )
        meal_consistency = self.meal_repo.consistency_score(user_id, start, end)

        # Composite = habit*0.4 + efficiency*0.3 + sleep*0.2 + meal*0.1
        composite = (
            habit_pct * 0.4
            + avg_eff * 0.3
            + avg_sleep_score * 0.2
            + meal_consistency * 0.1
        )

        return {
            "year": year,
            "habit_consistency": round(habit_pct, 2),
            "avg_efficiency": round(avg_eff, 2),
            "avg_sleep_score": round(avg_sleep_score, 2),
            "meal_consistency": round(meal_consistency, 2),
            "composite_score": round(composite, 2),
        }

    # ─────────────────────────────── ADVANCED ────────────────────────────────

    def advanced_analytics(self, user_id: int) -> dict:
        moving_avg = self.time_repo.moving_avg_productivity(user_id, window=7)
        rolling_eff = self.time_repo.rolling_30_day_efficiency(user_id)
        burnout = self.time_repo.burnout_risk_days(user_id)
        idle = self.time_repo.idle_trend(user_id)
        sleep_prod_corr = self._sleep_productivity_correlation(user_id)
        return {
            "moving_avg_7d": moving_avg,
            "rolling_30d_efficiency": rolling_eff,
            "burnout_risk_days": burnout,
            "idle_trend": idle,
            "sleep_productivity_correlation": sleep_prod_corr,
        }

    # ─────────────────────────────── HELPERS ─────────────────────────────────

    def _habit_completion_pct(self, user_id: int, start: date, end: date) -> float:
        sql = text(
            """
            WITH active_habits AS (
                SELECT id FROM habits
                WHERE user_id = :user_id AND is_active = 1
                  AND start_date <= :end_date
            ),
            expected AS (
                SELECT COUNT(*) * (julianday(:end_date) - julianday(:start_date) + 1)
                    AS total_expected
                FROM active_habits
            ),
            actual AS (
                SELECT COUNT(*) AS total_logged
                FROM habit_logs
                WHERE user_id = :user_id
                  AND log_date BETWEEN :start_date AND :end_date
                  AND completed = 1
            )
            SELECT
                COALESCE(actual.total_logged, 0) * 100.0
                    / NULLIF(expected.total_expected, 0) AS pct
            FROM expected, actual
            """
        )
        row = self.db.execute(
            sql,
            {"user_id": user_id, "start_date": start, "end_date": end},
        ).fetchone()
        return float(row.pct or 0)

    def _longest_streak_in_period(self, user_id: int, start: date, end: date) -> int:
        sql = text(
            """
            WITH log_dates AS (
                SELECT DISTINCT log_date
                FROM habit_logs
                WHERE user_id = :user_id
                  AND log_date BETWEEN :start_date AND :end_date
                  AND completed = 1
                ORDER BY log_date
            )
            SELECT log_date FROM log_dates
            """
        )
        rows = self.db.execute(
            sql, {"user_id": user_id, "start_date": start, "end_date": end}
        ).fetchall()
        if not rows:
            return 0
        dates = sorted(r.log_date for r in rows)
        longest, streak = 1, 1
        for i in range(1, len(dates)):
            if (dates[i] - dates[i - 1]).days == 1:
                streak += 1
                longest = max(longest, streak)
            else:
                streak = 1
        return longest

    def _time_distribution(self, user_id: int, start: date, end: date) -> list[dict]:
        sql = text(
            """
            SELECT activity_category, SUM(hours_spent) AS total_h
            FROM daily_time_log
            WHERE user_id = :user_id AND log_date BETWEEN :start AND :end
            GROUP BY activity_category
            ORDER BY total_h DESC
            """
        )
        rows = self.db.execute(sql, {"user_id": user_id, "start": start, "end": end}).fetchall()
        return [{"category": r.activity_category, "total_hours": round(r.total_h, 2)} for r in rows]

    def _sleep_productivity_correlation(self, user_id: int) -> dict:
        """Pearson correlation between sleep hours and productive hours."""
        sql = text(
            """
            SELECT sleep_hours, total_productive_hours
            FROM daily_time_summary
            WHERE user_id = :user_id AND sleep_hours > 0
            """
        )
        rows = self.db.execute(sql, {"user_id": user_id}).fetchall()
        n = len(rows)
        if n < 2:
            return {"correlation": None, "sample_size": n}

        xs = [r.sleep_hours for r in rows]
        ys = [r.total_productive_hours for r in rows]
        mean_x = sum(xs) / n
        mean_y = sum(ys) / n
        num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
        den = (sum((x - mean_x) ** 2 for x in xs) * sum((y - mean_y) ** 2 for y in ys)) ** 0.5
        corr = round(num / den, 4) if den > 0 else None
        return {"correlation": corr, "sample_size": n}
