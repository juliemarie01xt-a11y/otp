import os

file_path = "src/app/api/bot/command/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# I will find the exact bounds using find()
start_idx1 = code.find("Welcome to SwiftOTP Official!")
if start_idx1 != -1:
    end_idx1 = code.find("});", start_idx1)
    old_msg1 = code[start_idx1-7 : end_idx1+3]
    
    new_msg = "text: `👋 <b>Welcome to SwiftOTP!</b>\\n\\nTo start buying numbers directly from Telegram, you need to securely connect this chat to your website account.\\n\\n<b>How to link your account:</b>\\n1️⃣ Copy your Telegram ID: <code>${chatId}</code>\\n2️⃣ Open the <a href=\"https://otp-three-liard.vercel.app/dashboard/telegram\">Telegram BOT Page</a> on our website\\n3️⃣ Paste your ID into the secure Connection Status box and click Connect to Telegram!\\n\\n<i>You will receive a confirmation message here once successfully linked.</i>`\n            });"
    
    code = code.replace(old_msg1, new_msg)

start_idx2 = code.find("It looks like your account is not connected yet")
if start_idx2 != -1:
    # it's a single quote string
    start_tag = "text: '👋 <b>Welcome to SwiftOTP!</b>\\n\\nIt looks like your account is not connected yet"
    real_start = code.rfind("text:", 0, start_idx2)
    end_idx2 = code.find("});", start_idx2)
    old_msg2 = code[real_start : end_idx2+3]
    
    code = code.replace(old_msg2, new_msg)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Messages replaced flawlessly!")
