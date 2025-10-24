from __future__ import annotations

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from bot.services import Services


async def currency_convert(update: Update, context: ContextTypes.DEFAULT_TYPE, services: Services) -> None:
    if len(context.args) < 2:
        await update.message.reply_text("نحوه استفاده: /cur USD IRR [مقدار]")
        return
    base = context.args[0].upper()
    quote = context.args[1].upper()
    amount = 1.0
    if len(context.args) >= 3:
        try:
            amount = float(context.args[2])
        except ValueError:
            await update.message.reply_text("مقدار نامعتبر است.")
            return

    url = "https://api.exchangerate.host/convert"
    params = {"from": base, "to": quote, "amount": amount}
    resp = await services.http.get(url, params=params)
    data = resp.json()
    if not data or not data.get("result"):
        await update.message.reply_text("امکان تبدیل ارز وجود ندارد.")
        return
    result = data["result"]
    await update.message.reply_text(f"{amount:g} {base} = {result:,.4f} {quote}")


def register(app: Application, services: Services, register_help) -> None:
    async def cur_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await currency_convert(update, context, services)

    app.add_handler(CommandHandler("cur", cur_cmd))

    register_help("/cur", "تبدیل ارز: /cur USD IRR [amount]")
