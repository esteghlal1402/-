from __future__ import annotations

from datetime import datetime
from typing import Any, Callable

from apscheduler.schedulers.asyncio import AsyncIOScheduler


class SchedulerService:
    def __init__(self, timezone: str = "UTC") -> None:
        self.scheduler = AsyncIOScheduler(timezone=timezone)
        self._started = False

    def start(self) -> None:
        if not self._started:
            self.scheduler.start()
            self._started = True

    async def shutdown(self) -> None:
        if self._started:
            # APScheduler's shutdown is synchronous; call without awaiting
            self.scheduler.shutdown(wait=False)
            self._started = False

    def schedule_once(
        self,
        job_id: str,
        run_date: datetime,
        func: Callable[..., Any],
        *args: Any,
        **kwargs: Any,
    ) -> None:
        self.scheduler.add_job(
            func,
            trigger="date",
            id=job_id,
            run_date=run_date,
            args=args,
            kwargs=kwargs,
            replace_existing=True,
            misfire_grace_time=60,
        )

    def cancel(self, job_id: str) -> None:
        try:
            self.scheduler.remove_job(job_id)
        except Exception:
            # It's fine if it's already gone
            pass

    def has_job(self, job_id: str) -> bool:
        job = self.scheduler.get_job(job_id)
        return job is not None

