import os

file_path = "src/app/api/bot/command/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# Update the /start message
old_start_msg = "text: `Welcome to SwiftOTP Official! 🛡️⚡\\n\\nYour unique Telegram ID is: <code>${chatId}</code>\\n\\nPlease enter this ID on the website dashboard to link your account.`"
new_start_msg = "text: `👋 <b>Welcome to SwiftOTP!</b>\\n\\nTo start buying numbers directly from Telegram, you need to securely connect this chat to your website account.\\n\\n<b>How to link your account:</b>\\n1️⃣ Copy your Telegram ID: <code>${chatId}</code>\\n2️⃣ Open the <a href=\"https://otp-three-liard.vercel.app/dashboard/telegram\">Telegram BOT Page</a> on our website\\n3️⃣ Paste your ID into the secure Connection box and click Connect to Telegram!\\n\\n<i>You will receive a confirmation message here once successfully linked.</i>`"

if old_start_msg in code:
    code = code.replace(old_start_msg, new_start_msg)
    print("Updated /start message.")
else:
    print("Could not find old /start msg.")

# Update the fallback message
old_fallback_msg = "text: '👋 <b>Welcome to SwiftOTP!</b>\\n\\nIt looks like your account is not connected yet. Please type <code>/start</code> to generate your unique Telegram ID and link it on our website to begin using the bot!'"
new_fallback_msg = "text: `👋 <b>Welcome to SwiftOTP!</b>\\n\\nTo start buying numbers directly from Telegram, you need to securely connect this chat to your website account.\\n\\n<b>How to link your account:</b>\\n1️⃣ Copy your Telegram ID: <code>${chatId}</code>\\n2️⃣ Open the <a href=\"https://otp-three-liard.vercel.app/dashboard/telegram\">Telegram BOT Page</a> on our website\\n3️⃣ Paste your ID into the secure Connection box and click Connect to Telegram!\\n\\n<i>You will receive a confirmation message here once successfully linked.</i>`"

if old_fallback_msg in code:
    code = code.replace(old_fallback_msg, new_fallback_msg)
    print("Updated fallback message.")
else:
    print("Could not find old fallback msg.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)
