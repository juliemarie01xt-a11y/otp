const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/telegram/page.tsx', 'utf8');

code = "'use client';\n\n" + code;

fs.writeFileSync('src/app/dashboard/telegram/page.tsx', code, 'utf8');
console.log("Added 'use client' directive!");
