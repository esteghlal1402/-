from __future__ import annotations

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from bot.services import Services


async def todo_list(update: Update, context: ContextTypes.DEFAULT_TYPE, services: Services) -> None:
    user_id = update.effective_user.id
    todos = await services.db.list_todos(user_id)
    if not todos:
        await update.message.reply_text("هیچ کاری در لیست نیست. با /todo_add اضافه کنید.")
        return
    lines = ["کارهای باز:"]
    for t in todos:
        lines.append(f"#{t['id']}: {t['text']}")
    await update.message.reply_text("\n".join(lines))


async def todo_add(update: Update, context: ContextTypes.DEFAULT_TYPE, services: Services) -> None:
    user_id = update.effective_user.id
    text = " ".join(context.args) if context.args else ""
    if not text:
        await update.message.reply_text("نحوه استفاده: /todo_add متن کار")
        return
    tid = await services.db.add_todo(user_id, text)
    await update.message.reply_text(f"✅ اضافه شد (#{tid})")


async def todo_done(update: Update, context: ContextTypes.DEFAULT_TYPE, services: Services) -> None:
    user_id = update.effective_user.id
    if not context.args:
        await update.message.reply_text("نحوه استفاده: /todo_done شناسه")
        return
    try:
        tid = int(context.args[0])
    except ValueError:
        await update.message.reply_text("شناسه معتبر نیست.")
        return
    ok = await services.db.complete_todo(user_id, tid)
    if ok:
        await update.message.reply_text("🎉 انجام شد!")
    else:
        await update.message.reply_text("یافت نشد یا قبلاً انجام شده است.")


def register(app: Application, services: Services, register_help) -> None:
    async def list_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await todo_list(update, context, services)

    async def add_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await todo_add(update, context, services)

    async def done_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await todo_done(update, context, services)

    app.add_handler(CommandHandler("todo", list_cmd))
    app.add_handler(CommandHandler("todo_add", add_cmd))
    app.add_handler(CommandHandler("todo_done", done_cmd))

    register_help("/todo", "نمایش لیست کارها")
    register_help("/todo_add", "افزودن کار جدید")
    register_help("/todo_done", "علامت‌زدن کار به‌عنوان انجام‌شده")
