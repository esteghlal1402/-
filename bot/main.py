import asyncio
import logging
from datetime import datetime
from typing import List, Tuple

import httpx
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from bot.config import load_config
from bot.plugin_loader import load_plugins
from bot.services import Services
from bot.services.db import Database
from bot.services.scheduler import SchedulerService

try:  # Optional dependency
    from openai import AsyncOpenAI  # type: ignore
except Exception:  # pragma: no cover - optional
    AsyncOpenAI = None  # type: ignore


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


async def build_services() -> Services:
    config = load_config()
    db = Database(config.database_path)
    await db.initialize()
    scheduler = SchedulerService(timezone=config.timezone)
    scheduler.start()
    http_client = httpx.AsyncClient(timeout=20)

    openai_client = None
    if config.openai_api_key and AsyncOpenAI is not None:
        openai_client = AsyncOpenAI(api_key=config.openai_api_key)

    services = Services(
        config=config, db=db, scheduler=scheduler, http=http_client, openai_client=openai_client
    )
    return services


async def setup_application(services: Services) -> Application:
    # post_init will schedule any pending reminders after bot is ready
    async def on_startup(app: Application) -> None:
        pending = await services.db.list_pending_reminders()
        for r in pending:
            rid = r["id"]
            chat_id = r["chat_id"]
            text = r["text"]
            run_at: datetime = r["run_at"]
            job_id = f"reminder:{rid}"

            async def reminder_job(reminder_id: int = rid, target_chat_id: int = chat_id, body: str = text) -> None:
                try:
                    await services.db.mark_reminder_sent(reminder_id)
                finally:
                    await app.bot.send_message(chat_id=target_chat_id, text=f"⏰ یادآوری: {body}")

            services.scheduler.schedule_once(job_id, run_at, reminder_job)

    application = (
        Application.builder()
        .token(services.config.telegram_token)
        .post_init(on_startup)
        .build()
    )

    help_entries: List[Tuple[str, str]] = []

    def register_help(command: str, description: str) -> None:
        help_entries.append((command, description))

    # Load plugins
    loaded = load_plugins(application, services, register_help)
    logger.info("Loaded plugins: %s", loaded)

    # Basic commands
    async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await update.message.reply_text(
            "سلام! 👋\nبرای دیدن دستورات، /help را ارسال کنید."
        )

    async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not help_entries:
            await update.message.reply_text("فعلاً دستوری ثبت نشده است.")
            return
        lines = ["دستورات موجود:"]
        for cmd, desc in sorted(help_entries):
            lines.append(f"{cmd} — {desc}")
        await update.message.reply_text("\n".join(lines))

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_cmd))

    return application


async def main() -> None:
    services = await build_services()
    application = await setup_application(services)
    try:
        await application.run_polling()
    finally:
        await services.http.aclose()
        await services.db.close()
        await services.scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(main())

