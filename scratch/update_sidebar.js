const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/Sidebar.tsx', 'utf8');

// Check if LucideBot is imported
if (!code.includes('LucideBot')) {
    code = code.replace("} from 'lucide-react';", ", LucideBot } from 'lucide-react';");
}

const oldLinks = `  const navLinks = [
    { name: 'Dashboard', icon: LucideHome, href: '/dashboard' },
    { name: 'Buy Numbers', icon: LucideShoppingCart, href: '/dashboard/buy' },
    { name: 'Active Numbers', icon: LucidePhone, href: '/dashboard/active' },
    { name: 'Recharge', icon: LucideCreditCard, href: '/dashboard/recharge' },
    { name: 'Support', icon: LucideLifeBuoy, href: '/dashboard/support' },
    { name: 'Settings', icon: LucideSettings, href: '/dashboard/settings' },
  ];`;

const newLinks = `  const navLinks = [
    { name: 'Dashboard', icon: LucideHome, href: '/dashboard' },
    { name: 'Buy Numbers', icon: LucideShoppingCart, href: '/dashboard/buy' },
    { name: 'Telegram Bot', icon: LucideBot, href: '/dashboard/telegram' },
    { name: 'Active Numbers', icon: LucidePhone, href: '/dashboard/active' },
    { name: 'Recharge', icon: LucideCreditCard, href: '/dashboard/recharge' },
    { name: 'Support', icon: LucideLifeBuoy, href: '/dashboard/support' },
    { name: 'Settings', icon: LucideSettings, href: '/dashboard/settings' },
  ];`;

if (code.includes(oldLinks)) {
    code = code.replace(oldLinks, newLinks);
    fs.writeFileSync('src/app/dashboard/Sidebar.tsx', code, 'utf8');
    console.log('Sidebar updated!');
} else {
    console.log('Could not find oldLinks');
}
