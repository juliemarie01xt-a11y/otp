import os

with open("src/app/api/bot/command/route.ts", "r", encoding="utf-8") as f:
    code = f.read()

old_auth = """    const authHeader = request.headers.get('x-telegram-bot-token');
    if (!BOT_TOKEN || authHeader !== BOT_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }"""

new_auth = """    const authHeader = request.headers.get('x-telegram-bot-api-secret-token');
    const expectedToken = process.env.TELEGRAM_SECRET_TOKEN || 'swiftotp_secure_webhook_token_2026';
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }"""

if old_auth in code:
    code = code.replace(old_auth, new_auth)
    with open("src/app/api/bot/command/route.ts", "w", encoding="utf-8") as f:
        f.write(code)
    print("Fixed Auth!")
else:
    print("Auth block not found!")
