const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/Sidebar.tsx', 'utf8');

// Remove the telegram bot line entirely
code = code.replace(/[\s]*{ name: 'Telegram Bot', path: '\/dashboard\/telegram', icon: LucideBot },/g, "");

// Add it to the end of the MENU array
code = code.replace(
  /{ name: 'Help & Support', path: '\/dashboard\/support', icon: LucideLifeBuoy },/g,
  "{ name: 'Help & Support', path: '/dashboard/support', icon: LucideLifeBuoy },\n  { name: 'Telegram Bot', path: '/dashboard/telegram', icon: LucideBot },"
);

fs.writeFileSync('src/app/dashboard/Sidebar.tsx', code, 'utf8');
console.log('Moved Telegram Bot to the bottom securely!');
