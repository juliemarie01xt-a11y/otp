const fs = require('fs');
let code = fs.readFileSync('src/app/api/user/link-telegram/route.ts', 'utf8');

const oldMsg = "`? <b>Connection Successful!</b>\\n\\nYour SwiftOTP account (<code>${email}</code>) is now securely linked to this Telegram chat.\\n\\nYou can now type /buy to instantly purchase numbers!`";

const newMsg = "`?? <b>Account Successfully Linked!</b>\\n\\nWelcome aboard! Your <b>SwiftOTP</b> account (<code>${email}</code>) is now securely connected.\\n\\nYou can now manage your numbers directly from this chat:\\n?? <b>/buy</b> - Purchase a new number\\n?? <b>/balance</b> - Check your wallet balance\\n? <b>/cancel</b> - Cancel an active number\\n\\n<i>Start by typing /buy to get your first number!</i>`";

if (code.includes(oldMsg)) {
    code = code.replace(oldMsg, newMsg);
    fs.writeFileSync('src/app/api/user/link-telegram/route.ts', code, 'utf8');
    console.log("Updated success message!");
} else {
    console.log("Could not find the old message. Here is the code:", code);
}
