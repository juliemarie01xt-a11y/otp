const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const anchor1 = "ATOMIC SQL Deduct";
let p1 = code.indexOf(anchor1);
let p2 = code.indexOf("} else {", p1);

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
            });\n          `;
        
        const newBlock = preSM + newSM;
        code = code.substring(0, p1) + newBlock + code.substring(p2);
        
        // Ensure check_otp handler exists
        if (!code.includes("data.startsWith('check_otp_')")) {
            const checkOtpHandler = `
      // Handle Check OTP Button
      else if (data.startsWith('check_otp_')) {
        const fullActId = data.replace('check_otp_', '');
        
        const host = request.headers.get('host') || 'otp-three-liard.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        fetch(\`\${protocol}://\${host}/api/vsim/status?id=\${fullActId}\`).catch(()=>{});
        
        await tgApi('answerCallbackQuery', {
          callback_query_id: update.callback_query.id,
          text: '⏳ Checking for SMS...',
          show_alert: false
        });
      }
`;
            code = code.replace(
              "// STEP C: Confirm Purchase",
              checkOtpHandler + "\n      // STEP C: Confirm Purchase"
            );
        }

        fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
        console.log("Replaced perfectly using flexible indexing!");
    } else {
        console.log("Could not find sendMessage in block.");
    }
} else {
    console.log("Could not find anchors.", p1, p2);
}
