from __future__ import annotations

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from bot.services import Services


async def ai_chat(update: Update, context: ContextTypes.DEFAULT_TYPE, services: Services) -> None:
    if services.openai_client is None:
        await update.message.reply_text("OpenAI پیکربندی نشده است.")
        return
    prompt = " ".join(context.args) if context.args else "سلام!"

    try:
        resp = await services.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=400,
        )
        text = resp.choices[0].message.content  # type: ignore[attr-defined]
    except Exception:
        text = "مشکلی پیش آمد."

    await update.message.reply_text(text)


def register(app: Application, services: Services, register_help) -> None:
    async def ai_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await ai_chat(update, context, services)

    app.add_handler(CommandHandler("ai", ai_cmd))

    register_help("/ai", "گفتگو با هوش مصنوعی (اختیاری)")
