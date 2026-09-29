const fs = require('fs');
let code = fs.readFileSync('src/app/api/user/link-telegram/route.ts', 'utf8');

// The emojis got corrupted to ?? or ?, so we will replace the corrupted lines completely.
const corruptedRegex = /`\?\? <b>Account Successfully Linked![\s\S]*?first number!<\/i>`/;

const fixedMsg = "`🎉 <b>Account Successfully Linked!</b>\\n\\nWelcome aboard! Your <b>SwiftOTP</b> account (<code>${email}</code>) is now securely connected.\\n\\nYou can now manage your numbers directly from this chat:\\n🛒 <b>/buy</b> - Purchase a new number\\n💰 <b>/balance</b> - Check your wallet balance\\n❌ <b>/cancel</b> - Cancel an active number\\n\\n<i>Start by typing /buy to get your first number!</i>`";

if (corruptedRegex.test(code)) {
    code = code.replace(corruptedRegex, fixedMsg);
    fs.writeFileSync('src/app/api/user/link-telegram/route.ts', code, 'utf8');
    console.log("Fixed emojis!");
} else {
    // try a more generic replace
    const fallbackRegex = /`[\s\S]*?Account Successfully Linked[\s\S]*?first number!<\/i>`/;
    if (fallbackRegex.test(code)) {
        code = code.replace(fallbackRegex, fixedMsg);
        fs.writeFileSync('src/app/api/user/link-telegram/route.ts', code, 'utf8');
        console.log("Fixed emojis with fallback regex!");
    } else {
        console.log("Could not find the corrupted message!");
    }
}
