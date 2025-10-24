from dataclasses import dataclass
from typing import Optional

from bot.config import Config
from .db import Database
from .scheduler import SchedulerService

import httpx

try:  # Optional dependency; created only if API key provided
    from openai import AsyncOpenAI  # type: ignore
except Exception:  # pragma: no cover - optional
    AsyncOpenAI = None  # type: ignore


@dataclass
class Services:
    config: Config
    db: Database
    scheduler: SchedulerService
    http: httpx.AsyncClient
    openai_client: Optional["AsyncOpenAI"] = None

