import os

file_path = "src/app/api/bot/command/route.ts"
with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

new_msg = "                text: `👋 <b>Welcome to SwiftOTP!</b>\\n\\nTo start buying numbers directly from Telegram, you need to securely connect this chat to your website account.\\n\\n<b>How to link your account:</b>\\n1️⃣ Copy your Telegram ID: <code>${chatId}</code>\\n2️⃣ Open the <a href=\"https://otp-three-liard.vercel.app/dashboard/telegram\">Telegram BOT Page</a> on our website\\n3️⃣ Paste your ID into the secure Connection Status box and click Connect to Telegram!\\n\\n<i>You will receive a confirmation message here once successfully linked.</i>`\n"

for i in range(len(lines)):
    if "Welcome to SwiftOTP" in lines[i]:
        lines[i] = new_msg

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("Messages replaced safely!")
