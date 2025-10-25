from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from bot.services import Services


def _parse_minutes(arg: str) -> int:
    # Supports plain minutes like "10" or suffixes like 10m, 2h, 1d
    s = arg.strip().lower()
    try:
        return int(s)
    except ValueError:
        pass
    if s.endswith("m"):
        return int(s[:-1])
    if s.endswith("h"):
        return int(float(s[:-1]) * 60)
    if s.endswith("d"):
        return int(float(s[:-1]) * 60 * 24)
    raise ValueError("bad format")


async def remind_in(update: Update, context: ContextTypes.DEFAULT_TYPE, services: Services) -> None:
    if len(context.args) < 2:
        await update.message.reply_text("نحوه استفاده: /remindin 10m متن یادآوری")
        return
    try:
        minutes = _parse_minutes(context.args[0])
    except Exception:
        await update.message.reply_text("فرمت زمان نامعتبر است. نمونه: 10m یا 2h")
        return
    text = " ".join(context.args[1:])
    tz = ZoneInfo(services.config.timezone)
    when = datetime.now(tz) + timedelta(minutes=minutes)
    rid = await services.db.add_reminder(
        user_id=update.effective_user.id,
        chat_id=update.effective_chat.id,
        when=when,
        text=text,
    )

    job_id = f"reminder:{rid}"

    async def job(reminder_id: int = rid, chat_id: int = update.effective_chat.id, body: str = text) -> None:
        try:
            await services.db.mark_reminder_sent(reminder_id)
        finally:
            await context.bot.send_message(chat_id=chat_id, text=f"⏰ یادآوری: {body}")

    services.scheduler.schedule_once(job_id, when, job)
    await update.message.reply_text("یادآوری زمان‌بندی شد ✅")


async def remind_at(update: Update, context: ContextTypes.DEFAULT_TYPE, services: Services) -> None:
    if len(context.args) < 3:
        await update.message.reply_text("نحوه استفاده: /remindat YYYY-MM-DD HH:MM متن")
        return
    date_str = context.args[0]
    time_str = context.args[1]
    text = " ".join(context.args[2:])
    tz = ZoneInfo(services.config.timezone)
    try:
        when = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M").replace(tzinfo=tz)
    except Exception:
        await update.message.reply_text("فرمت تاریخ/زمان نامعتبر است. نمونه: 2025-01-31 14:30")
        return

    rid = await services.db.add_reminder(
        user_id=update.effective_user.id,
        chat_id=update.effective_chat.id,
        when=when,
        text=text,
    )
    job_id = f"reminder:{rid}"

    async def job(reminder_id: int = rid, chat_id: int = update.effective_chat.id, body: str = text) -> None:
        try:
            await services.db.mark_reminder_sent(reminder_id)
        finally:
            await context.bot.send_message(chat_id=chat_id, text=f"⏰ یادآوری: {body}")

    services.scheduler.schedule_once(job_id, when, job)
    await update.message.reply_text("یادآوری زمان‌بندی شد ✅")


def register(app: Application, services: Services, register_help) -> None:
    async def rin(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await remind_in(update, context, services)

    async def rat(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await remind_at(update, context, services)

    app.add_handler(CommandHandler("remindin", rin))
    app.add_handler(CommandHandler("remindat", rat))

    register_help("/remindin", "یادآوری پس از مدت مشخص (مثلاً 10m یا 2h)")
    register_help("/remindat", "یادآوری در تاریخ/ساعت مشخص (YYYY-MM-DD HH:MM)")
