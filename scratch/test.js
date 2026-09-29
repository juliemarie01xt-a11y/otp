const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

const regex = /{\/\* Link Telegram Box \*\/}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

if (regex.test(code)) {
    console.log("Found the box!");
} else {
    console.log("Did not find the box via regex either.");
}
