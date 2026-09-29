const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

// Revert the bad emoji replace
code = code.replace(/⭐ /g, "? ");

// Re-add the proper emoji for Standard tier
code = code.replace(/\? Standard/g, "⭐ Standard");

fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
console.log("Fixed ternary operators!");
