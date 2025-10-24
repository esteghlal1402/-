from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from bot.services import Services


async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = " ".join(context.args) if context.args else ""
    if not text:
        await update.message.reply_text("متنی برای تکرار وارد کنید: /echo متن")
        return
    await update.message.reply_text(text)


async def now(update: Update, context: ContextTypes.DEFAULT_TYPE, services: Services) -> None:
    tz = ZoneInfo(services.config.timezone)
    t = datetime.now(tz)
    await update.message.reply_text(t.strftime("%Y-%m-%d %H:%M %Z"))


def register(app: Application, services: Services, register_help) -> None:
    app.add_handler(CommandHandler("echo", echo))

    async def time_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await now(update, context, services)

    app.add_handler(CommandHandler("time", time_cmd))

    register_help("/echo", "تکرار متن ارسالی")
    register_help("/time", "نمایش زمان فعلی بر اساس منطقه‌زمانی تنظیم‌شده")
