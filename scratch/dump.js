const fs = require('fs');
const code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');
fs.writeFileSync('scratch/dump.txt', code, 'utf8');
console.log("Dumped!");
