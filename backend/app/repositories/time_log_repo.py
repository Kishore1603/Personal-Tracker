import math
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import and_, text
from app.models.time_log import DailyTimeLog, DailyTimeSummary
from app.schemas.time_log import DailyTimeLogCreate, PRODUCTIVE_CATEGORIES


def _sleep_score(sleep_h: float) -> float:
    """100 at 7.5 h optimal, decays linearly to 0 at 0 h or 12 h."""
    optimal = 7.5
    if sleep_h <= 0:
        return 0.0
    if sleep_h > 12:
        return max(0.0, 100 - (sleep_h - 12) * 15)
    return max(0.0, 100 - abs(sleep_h - optimal) * 20)


def _balance_score(hours_by_cat: dict[str, float]) -> float:
    """100 when all categories are balanced (low variance)."""
    values = list(hours_by_cat.values())
    if len(values) < 2:
        return 50.0
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    # Normalize: variance of 0 → 100, variance of 24 → 0
    score = max(0.0, 100 - variance * 5)
    return round(score, 2)


class TimeLogRepository:
    def __init__(self, db: Session):
        self.db = db

    # ── Reads ────────────────────────────────────────────────────────────────

    def get_entries_for_date(self, user_id: int, log_date: date) -> list[DailyTimeLog]:
        return (
            self.db.query(DailyTimeLog)
            .filter(DailyTimeLog.user_id == user_id, DailyTimeLog.log_date == log_date)
            .all()
        )

    def get_summary_for_date(self, user_id: int, log_date: date) -> DailyTimeSummary | None:
        return (
            self.db.query(DailyTimeSummary)
            .filter(
                DailyTimeSummary.user_id == user_id,
                DailyTimeSummary.summary_date == log_date,
            )
            .first()
        )

    def list_summaries(
        self, user_id: int, start: date, end: date
    ) -> list[DailyTimeSummary]:
        return (
            self.db.query(DailyTimeSummary)
            .filter(
                DailyTimeSummary.user_id == user_id,
                DailyTimeSummary.summary_date >= start,
                DailyTimeSummary.summary_date <= end,
            )
            .order_by(DailyTimeSummary.summary_date.asc())
            .all()
        )

    # ── Writes ───────────────────────────────────────────────────────────────

    def reset_day(self, user_id: int, log_date: date) -> None:
        """Delete all time-log entries and summary for a given day."""
        try:
            self.db.query(DailyTimeLog).filter(
                DailyTimeLog.user_id == user_id,
                DailyTimeLog.log_date == log_date,
            ).delete(synchronize_session=False)
            self.db.query(DailyTimeSummary).filter(
                DailyTimeSummary.user_id == user_id,
                DailyTimeSummary.summary_date == log_date,
            ).delete(synchronize_session=False)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def upsert_day(self, user_id: int, data: DailyTimeLogCreate) -> DailyTimeSummary:
        """
        Atomically delete existing rows for the day, insert fresh entries,
        recompute summary, then save.  All wrapped in one transaction.
        """
        log_date = data.log_date
        try:
            # Delete old rows
            self.db.query(DailyTimeLog).filter(
                DailyTimeLog.user_id == user_id,
                DailyTimeLog.log_date == log_date,
            ).delete(synchronize_session=False)

            hours_by_cat: dict[str, float] = {}
            entries = data.to_entries()
            for entry in entries:
                cat = entry.activity_category
                productive = 1 if cat in PRODUCTIVE_CATEGORIES else 0
                row = DailyTimeLog(
                    user_id=user_id,
                    log_date=log_date,
                    activity_category=cat,
                    hours_spent=entry.hours_spent,
                    is_productive=productive,
                    notes=entry.notes,
                )
                self.db.add(row)
                hours_by_cat[cat] = entry.hours_spent

            # Compute summary
            productive_h = sum(
                h for cat, h in hours_by_cat.items() if cat in PRODUCTIVE_CATEGORIES
            )
            sleep_h = hours_by_cat.get("sleep", 0.0)
            unproductive_h = 24.0 - productive_h

            eff = round((productive_h / 24.0) * 100, 2)
            sl_score = round(_sleep_score(sleep_h), 2)
            bal_score = _balance_score(hours_by_cat)
            composite = round(eff * 0.5 + sl_score * 0.3 + bal_score * 0.2, 2)

            # Upsert summary
            summary = (
                self.db.query(DailyTimeSummary)
                .filter(
                    DailyTimeSummary.user_id == user_id,
                    DailyTimeSummary.summary_date == log_date,
                )
                .first()
            )
            if summary is None:
                summary = DailyTimeSummary(
                    user_id=user_id, summary_date=log_date
                )
                self.db.add(summary)

            summary.total_productive_hours = productive_h
            summary.total_unproductive_hours = unproductive_h
            summary.sleep_hours = sleep_h
            summary.efficiency_score = eff
            summary.sleep_score = sl_score
            summary.balance_score = bal_score
            summary.composite_score = composite

            self.db.commit()
            self.db.refresh(summary)
            return summary
        except Exception:
            self.db.rollback()
            raise

    # ── Advanced analytics ────────────────────────────────────────────────────

    def moving_avg_productivity(self, user_id: int, window: int = 7) -> list[dict]:
        """7-day rolling average of productive hours using window functions."""
        sql = text(
            """
            SELECT
                summary_date,
                total_productive_hours,
                AVG(total_productive_hours) OVER (
                    ORDER BY summary_date
                    ROWS BETWEEN :window PRECEDING AND CURRENT ROW
                ) AS moving_avg
            FROM daily_time_summary
            WHERE user_id = :user_id
            ORDER BY summary_date
            """
        )
        rows = self.db.execute(sql, {"user_id": user_id, "window": window - 1}).fetchall()
        return [
            {
                "date": str(r.summary_date),
                "productive": r.total_productive_hours,
                "moving_avg": round(r.moving_avg or 0, 2),
            }
            for r in rows
        ]

    def burnout_risk_days(self, user_id: int) -> list[dict]:
        """Dates where sleep < 6h AND work > 10h."""
        sql = text(
            """
            SELECT s.summary_date, s.sleep_hours,
                   tl.hours_spent AS work_hours
            FROM daily_time_summary s
            JOIN daily_time_log tl
              ON tl.user_id = s.user_id
             AND tl.log_date = s.summary_date
             AND tl.activity_category = 'work'
            WHERE s.user_id = :user_id
              AND s.sleep_hours < 6
              AND tl.hours_spent > 10
            ORDER BY s.summary_date DESC
            """
        )
        rows = self.db.execute(sql, {"user_id": user_id}).fetchall()
        return [
            {"date": str(r.summary_date), "sleep": r.sleep_hours, "work": r.work_hours}
            for r in rows
        ]

    def rolling_30_day_efficiency(self, user_id: int) -> list[dict]:
        sql = text(
            """
            SELECT
                summary_date,
                efficiency_score,
                AVG(efficiency_score) OVER (
                    ORDER BY summary_date
                    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
                ) AS rolling_30_avg
            FROM daily_time_summary
            WHERE user_id = :user_id
            ORDER BY summary_date
            """
        )
        rows = self.db.execute(sql, {"user_id": user_id}).fetchall()
        return [
            {
                "date": str(r.summary_date),
                "efficiency": r.efficiency_score,
                "rolling_30": round(r.rolling_30_avg or 0, 2),
            }
            for r in rows
        ]

    def idle_trend(self, user_id: int) -> list[dict]:
        """Detect if idle hours are trending upward (time drift)."""
        sql = text(
            """
            SELECT
                log_date,
                hours_spent AS idle_hours,
                AVG(hours_spent) OVER (
                    ORDER BY log_date
                    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
                ) AS avg_idle_7d
            FROM daily_time_log
            WHERE user_id = :user_id
              AND activity_category = 'idle'
            ORDER BY log_date
            """
        )
        rows = self.db.execute(sql, {"user_id": user_id}).fetchall()
        return [
            {"date": str(r.log_date), "idle": r.idle_hours, "avg_7d": round(r.avg_idle_7d or 0, 2)}
            for r in rows
        ]
