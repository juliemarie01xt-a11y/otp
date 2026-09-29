const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/Sidebar.tsx', 'utf8');

code = code.replace("LucideShield", "LucideShield, LucideBot");

fs.writeFileSync('src/app/dashboard/Sidebar.tsx', code, 'utf8');
console.log('Fixed import the easy way!');
