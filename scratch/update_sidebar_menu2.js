const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/Sidebar.tsx', 'utf8');

if (!code.includes('LucideBot')) {
    code = code.replace("LucideShield\n} from 'lucide-react';", "LucideShield,\n  LucideBot\n} from 'lucide-react';");
}

code = code.replace(
  "{ name: 'Recharge / Top-Up', path: '/dashboard/recharge', icon: LucideWallet },",
  "{ name: 'Telegram Bot', path: '/dashboard/telegram', icon: LucideBot },\n  { name: 'Recharge / Top-Up', path: '/dashboard/recharge', icon: LucideWallet },"
);

fs.writeFileSync('src/app/dashboard/Sidebar.tsx', code, 'utf8');
console.log('Sidebar updated!');
