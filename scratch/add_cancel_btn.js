const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const oldBtns = "inline_keyboard: [[\n                      { text: '🔄 Check OTP', callback_data: \`check_otp_\${rule.target_api}::\${actId}\` }\n                  ]]";
const newBtns = "inline_keyboard: [[\n                      { text: '🔄 Check OTP', callback_data: \`check_otp_\${rule.target_api}::\${actId}\` },\n                      { text: '❌ Cancel', callback_data: \`cancel_act_\${rule.target_api}::\${actId}\` }\n                  ]]";

if (code.includes(oldBtns)) {
    code = code.replace(oldBtns, newBtns);
    fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
    console.log("Added Cancel button to Purchase Receipt!");
} else {
    console.log("Could not find the Check OTP button block.");
}
