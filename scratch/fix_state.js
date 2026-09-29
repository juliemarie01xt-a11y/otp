const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

code = code.replace(
  "setTgMsg({ type: 'success', text: 'Telegram account linked successfully!' });",
  "setTgMsg({ type: 'success', text: 'Telegram account linked successfully!' });\n          setProfile({ ...profile, telegram_id: telegramId });"
);

fs.writeFileSync('src/app/dashboard/settings/page.tsx', code, 'utf8');
