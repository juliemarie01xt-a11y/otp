const fs = require('fs');
let botCode = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');
botCode = botCode.replace(/catch\(e\)/g, "catch(e: any)");
fs.writeFileSync('src/app/api/bot/command/route.ts', botCode, 'utf8');
console.log("Fixed typescript error!");
