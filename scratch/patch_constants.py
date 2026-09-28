with open('src/lib/constants.ts', 'r', encoding='utf-8') as f:
    code = f.read()

old_services = """export const POPULAR_SERVICES = [
  { code: 'gv', name: 'Google Voice', logo: 'https://img.icons8.com/color/96/google-voice.png' },
  { code: 'go', name: 'Google / YouTube / Gmail', logo: 'https://img.icons8.com/color/96/google-logo.png' }
];"""

new_services = """export const POPULAR_SERVICES = [
  { code: 'gv', name: 'Google Voice', logo: 'https://img.icons8.com/color/96/google-voice.png' },
  { code: 'go', name: 'Google', logo: 'https://img.icons8.com/color/96/google-logo.png' },
  { code: 'gmail', name: 'Gmail', logo: 'https://img.icons8.com/color/96/gmail-new.png' },
  { code: 'wa', name: 'WhatsApp', logo: 'https://img.icons8.com/color/96/whatsapp--v1.png' },
  { code: 'tg', name: 'Telegram', logo: 'https://img.icons8.com/color/96/telegram-app.png' },
  { code: 'ig', name: 'Instagram', logo: 'https://img.icons8.com/color/96/instagram-new--v1.png' },
  { code: 'fb', name: 'Facebook', logo: 'https://img.icons8.com/color/96/facebook-new.png' }
];"""

code = code.replace(old_services, new_services)

with open('src/lib/constants.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
