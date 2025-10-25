from __future__ import annotations

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from bot.services import Services


async def weather(update: Update, context: ContextTypes.DEFAULT_TYPE, services: Services) -> None:
    if not context.args:
        await update.message.reply_text("نحوه استفاده: /w شهر (مثلاً Tehran)")
        return
    city = " ".join(context.args)
    api_key = services.config.weather_api_key
    if not api_key:
        await update.message.reply_text("کلید OpenWeather را در WEATHER_API_KEY تنظیم کنید.")
        return

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": api_key, "units": "metric", "lang": "fa"}
    resp = await services.http.get(url, params=params)
    data = resp.json()
    if data.get("cod") != 200:
        await update.message.reply_text("نتوانستم اطلاعات هوا را بیابم.")
        return

    name = data.get("name", city)
    main = data.get("main", {})
    wind = data.get("wind", {})
    weather_list = data.get("weather", [])
    description = weather_list[0].get("description") if weather_list else ""

    temp = main.get("temp")
    feels = main.get("feels_like")
    humidity = main.get("humidity")
    wind_speed = wind.get("speed")

    parts = [
        f"آب‌وهوا در {name}",
        f"دما: {temp}°C (حس می‌شود: {feels}°C)",
        f"رطوبت: {humidity}% | باد: {wind_speed} m/s",
        f"شرح: {description}",
    ]
    await update.message.reply_text("\n".join(parts))


def register(app: Application, services: Services, register_help) -> None:
    async def w_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await weather(update, context, services)

    app.add_handler(CommandHandler("w", w_cmd))

    register_help("/w", "آب‌وهوا: /w Tehran")
