### Multipurpose Advanced Bot (CLI + REST)

ربات همه‌کاره با هسته‌ی افزونه‌پذیر، رابط خط فرمان و API تحت وب.

- **امکانات**: help, echo, time, calc, todo، web search، scrape، پرسش مستقیم از LLM (اختیاری)
- **LLM**: با OpenAI (اختیاری). اگر کلید ندهید، بات بدون LLM هم کار می‌کند.

### راه‌اندازی سریع

1) وابستگی‌ها را نصب کنید:
```bash
npm install
```

2) فایل محیطی (اختیاری برای LLM):
```bash
echo "OPENAI_API_KEY=کلید_شما" > .env
```

3) اجرا به صورت CLI:
```bash
npm run dev
```
یا نسخه‌ی کامپایل‌شده:
```bash
npm run start
```

4) اجرا به صورت سرور REST:
```bash
npm run server
```
Endpoints:
- GET `/healthz`
- GET `/commands`
- POST `/api/command` body: `{ "input": "help" }`

### نمونه دستورات (CLI یا فیلد input در REST)
- `help`
- `echo سلام`
- `time`
- `calc (2+3)*4`
- `todo.add کار جدید`
- `todo.list`
- `todo.done <id>`
- `search گیت هاب`
- `scrape https://example.com`
- `ask تفاوت HTTP و HTTPS چیست؟` (نیازمند OPENAI_API_KEY)
