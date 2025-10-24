import os
from dataclasses import dataclass
from typing import Optional


def _load_dotenv_if_available() -> None:
    try:
        # Optional dependency; safe no-op if not installed
        from dotenv import load_dotenv  # type: ignore

        load_dotenv()
    except Exception:
        # Do not crash if python-dotenv is not present
        pass


@dataclass
class Config:
    telegram_token: str
    database_path: str = "data/bot.sqlite3"
    timezone: str = "UTC"

    # Optional service API keys (plugins may require these)
    openai_api_key: Optional[str] = None
    weather_api_key: Optional[str] = None  # e.g., OpenWeatherMap
    currency_api_key: Optional[str] = None  # e.g., exchangerate.host doesn't need one
    translate_api_key: Optional[str] = None  # e.g., DeepL


def load_config() -> Config:
    _load_dotenv_if_available()

    telegram_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not telegram_token:
        raise RuntimeError(
            "TELEGRAM_BOT_TOKEN is not set. Provide it via environment or .env file."
        )

    database_path = os.getenv("BOT_DB_PATH", "data/bot.sqlite3").strip()
    timezone = os.getenv("BOT_TIMEZONE", "UTC").strip()

    openai_api_key = os.getenv("OPENAI_API_KEY")
    weather_api_key = os.getenv("WEATHER_API_KEY")
    currency_api_key = os.getenv("CURRENCY_API_KEY")
    translate_api_key = os.getenv("TRANSLATE_API_KEY")

    return Config(
        telegram_token=telegram_token,
        database_path=database_path,
        timezone=timezone,
        openai_api_key=openai_api_key,
        weather_api_key=weather_api_key,
        currency_api_key=currency_api_key,
        translate_api_key=translate_api_key,
    )

