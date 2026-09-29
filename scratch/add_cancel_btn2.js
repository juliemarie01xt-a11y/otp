const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const regex = /{ text: '🔄 Check OTP', callback_data: `check_otp_\$\{rule\.target_api\}::\$\{actId\}` }/g;
if (regex.test(code)) {
    code = code.replace(regex, "{ text: '🔄 Check OTP', callback_data: `check_otp_${rule.target_api}::${actId}` }, { text: '❌ Cancel', callback_data: `cancel_act_${rule.target_api}::${actId}` }");
    fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
    console.log("Successfully added Cancel to the purchase receipt!");
} else {
    // try checking if it's corrupted in the file
    const fallbackRegex = /{ text: '[^']+', callback_data: `check_otp_\$\{rule\.target_api\}::\$\{actId\}` }/g;
    if (fallbackRegex.test(code)) {
        code = code.replace(fallbackRegex, "{ text: '🔄 Check OTP', callback_data: `check_otp_${rule.target_api}::${actId}` }, { text: '❌ Cancel', callback_data: `cancel_act_${rule.target_api}::${actId}` }");
        fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
        console.log("Successfully fixed emoji and added Cancel to the purchase receipt!");
    } else {
        console.log("Still could not find it.");
    }
}
