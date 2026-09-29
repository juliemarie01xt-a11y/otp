const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/Sidebar.tsx', 'utf8');

if (!code.includes('LucideBot')) {
    code = code.replace(/LucideShield[\r\n]+} from 'lucide-react';/, "LucideShield,\n  LucideBot\n} from 'lucide-react';");
}

fs.writeFileSync('src/app/dashboard/Sidebar.tsx', code, 'utf8');
console.log('Fixed import!');
