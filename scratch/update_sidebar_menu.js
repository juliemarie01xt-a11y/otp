const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/Sidebar.tsx', 'utf8');

if (!code.includes('LucideBot')) {
    code = code.replace("LucideShield\n} from 'lucide-react';", "LucideShield,\n  LucideBot\n} from 'lucide-react';");
}

const oldMenu = `const MENU = [
  { name: 'Dashboard', path: '/dashboard', icon: LucideLayoutDashboard },
  { name: 'Buy Number', path: '/dashboard/buy', icon: LucideShoppingCart },
  { name: 'Recharge / Top-Up', path: '/dashboard/recharge', icon: LucideWallet },
  { name: 'Numbers', path: '/dashboard/history', icon: LucideList },
  { name: 'My Profile', path: '/dashboard/settings', icon: LucideSettings },
  { name: 'Help & Support', path: '/dashboard/support', icon: LucideLifeBuoy },
];`;

const newMenu = `const MENU = [
  { name: 'Dashboard', path: '/dashboard', icon: LucideLayoutDashboard },
  { name: 'Buy Number', path: '/dashboard/buy', icon: LucideShoppingCart },
  { name: 'Telegram Bot', path: '/dashboard/telegram', icon: LucideBot },
  { name: 'Recharge / Top-Up', path: '/dashboard/recharge', icon: LucideWallet },
  { name: 'Numbers', path: '/dashboard/history', icon: LucideList },
  { name: 'My Profile', path: '/dashboard/settings', icon: LucideSettings },
  { name: 'Help & Support', path: '/dashboard/support', icon: LucideLifeBuoy },
];`;

if (code.includes(oldMenu)) {
    code = code.replace(oldMenu, newMenu);
    fs.writeFileSync('src/app/dashboard/Sidebar.tsx', code, 'utf8');
    console.log('Sidebar updated with Telegram link!');
} else {
    console.log('Could not find oldMenu block.');
}
