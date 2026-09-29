const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const anchor1 = "            // 5. ATOMIC SQL Deduct";
const anchor2 = "            } else {";

let p1 = code.indexOf(anchor1);
let p2 = code.indexOf(anchor2, p1);

if (p1 !== -1 && p2 !== -1) {
    const originalBlock = code.substring(p1, p2);
    
    // We want to replace the sendMessage block inside originalBlock
    const startSM = originalBlock.indexOf("await tgApi('sendMessage'");
    if (startSM !== -1) {
        const preSM = originalBlock.substring(0, startSM);
        const newSM = `await tgApi('sendMessage', { 
              chat_id: chatId, parse_mode: 'HTML',
              text: \`✅ <b>Number Purchased!</b>\\n\\nService: \${getService(rule.internal_service).name}\\nTier: \${rule.tier === 'premium' ? '💎 High-Priority' : '⭐ Standard'}\\nNumber: <code>+\${phone}</code>\\nCost: $\${formatMoney(retailCost)}\\n\\n⏳ <i>Waiting for SMS code...</i>\`,
              reply_markup: {
                  inline_keyboard: [[
                      { text: '🔄 Check OTP', callback_data: \`check_otp_\${rule.target_api}::\${actId}\` }
                  ]]
              }
            });\n`;
        
        const newBlock = preSM + newSM;
        code = code.substring(0, p1) + newBlock + code.substring(p2);
        fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
        console.log("Replaced perfectly using precise indexing!");
    } else {
        console.log("Could not find sendMessage in block.");
    }
} else {
    console.log("Could not find anchors.", p1, p2);
}
