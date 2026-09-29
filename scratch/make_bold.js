const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/telegram/page.tsx', 'utf8');

const oldLine = "Send the command <code>/start</code> to the bot.";
const newLine = "Send the command <b>/start</b> to the bot.";

if (code.includes(oldLine)) {
    code = code.replace(oldLine, newLine);
    fs.writeFileSync('src/app/dashboard/telegram/page.tsx', code, 'utf8');
    console.log("Made /start bold!");
} else {
    console.log("Could not find the line.");
}
