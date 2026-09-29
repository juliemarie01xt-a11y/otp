const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/Sidebar.tsx', 'utf8');

const oldMenuStr = `const MENU = [
  { name: 'Dashboard', path: '/dashboard', icon: LucideLayoutDashboard },
  { name: 'Buy Number', path: '/dashboard/buy', icon: LucideShoppingCart },
  { name: 'Telegram Bot', path: '/dashboard/telegram', icon: LucideBot },
  { name: 'Recharge / Top-Up', path: '/dashboard/recharge', icon: LucideWallet },
  { name: 'Numbers', path: '/dashboard/history', icon: LucideList },
  { name: 'My Profile', path: '/dashboard/settings', icon: LucideSettings },
  { name: 'Help & Support', path: '/dashboard/support', icon: LucideLifeBuoy },
];`;

const newMenuStr = `const MENU = [
  { name: 'Dashboard', path: '/dashboard', icon: LucideLayoutDashboard },
  { name: 'Buy Number', path: '/dashboard/buy', icon: LucideShoppingCart },
  { name: 'Recharge / Top-Up', path: '/dashboard/recharge', icon: LucideWallet },
  { name: 'Numbers', path: '/dashboard/history', icon: LucideList },
  { name: 'My Profile', path: '/dashboard/settings', icon: LucideSettings },
  { name: 'Help & Support', path: '/dashboard/support', icon: LucideLifeBuoy },
  { name: 'Telegram Bot', path: '/dashboard/telegram', icon: LucideBot },
];`;

if (code.includes(oldMenuStr)) {
    code = code.replace(oldMenuStr, newMenuStr);
    fs.writeFileSync('src/app/dashboard/Sidebar.tsx', code, 'utf8');
    console.log('Moved Telegram Bot to the bottom!');
} else {
    console.log('Could not find the MENU array.');
}
