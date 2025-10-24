from __future__ import annotations

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from bot.services import Services


async def translate(update: Update, context: ContextTypes.DEFAULT_TYPE, services: Services) -> None:
    if len(context.args) < 2:
        await update.message.reply_text("نحوه استفاده: /tr en متن برای ترجمه")
        return
    target = context.args[0]
    text = " ".join(context.args[1:])

    # Use MyMemory public API (no key) as a fallback
    url = "https://api.mymemory.translated.net/get"
    params = {"q": text, "langpair": f"auto|{target}"}
    resp = await services.http.get(url, params=params)
    data = resp.json()
    translated = (
        data.get("responseData", {}).get("translatedText")
        or (data.get("matches") or [{}])[0].get("translation")
    )
    if not translated:
        await update.message.reply_text("نتوانستم ترجمه کنم.")
        return
    await update.message.reply_text(translated)


def register(app: Application, services: Services, register_help) -> None:
    async def tr_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await translate(update, context, services)

    app.add_handler(CommandHandler("tr", tr_cmd))

    register_help("/tr", "ترجمه: /tr en متن")
