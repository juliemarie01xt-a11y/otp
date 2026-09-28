with open('src/app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

code = re.sub(r"'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg'", "'https://img.icons8.com/color/96/whatsapp--v1.png'", code)
code = re.sub(r"'https://upload.wikimedia.org/wikipedia/commons/8/82/Google_Voice_icon_%282020%29.svg'", "'https://img.icons8.com/color/96/google-voice.png'", code)
code = re.sub(r"'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg'", "'https://img.icons8.com/color/96/telegram-app.png'", code)
code = re.sub(r"'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg'", "'https://img.icons8.com/color/96/google-logo.png'", code)

with open('src/app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
