import os
import re

file_path = "src/app/api/bot/command/route.ts"
with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    code = f.read()

new_msg = "text: `👋 <b>Welcome to SwiftOTP!</b>\\n\\nTo start buying numbers directly from Telegram, you need to securely connect this chat to your website account.\\n\\n<b>How to link your account:</b>\\n1️⃣ Copy your Telegram ID: <code>${chatId}</code>\\n2️⃣ Open the <a href=\"https://otp-three-liard.vercel.app/dashboard/telegram\">Telegram BOT Page</a> on our website\\n3️⃣ Paste your ID into the secure Connection Status box and click Connect to Telegram!\\n\\n<i>You will receive a confirmation message here once successfully linked.</i>`"

# Replace the start command else block text
code = re.sub(r"text:\s*`Welcome to SwiftOTP Official!.*?\}`", new_msg + "\n            });", code, flags=re.DOTALL)

# Replace the fallback block text
code = re.sub(r"text:\s*'dY`< <b>Welcome to SwiftOTP!</b>.*?bot!'", new_msg, code, flags=re.DOTALL)
# Wait, let's use a broader regex for fallback
code = re.sub(r"text:\s*'.*?It looks like your account is not connected yet.*?bot!'", new_msg, code, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Messages replaced!")
