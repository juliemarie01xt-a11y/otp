const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const anchor = "// 5. ATOMIC SQL Deduct";
let parts = code.split(anchor);

if (parts.length === 2) {
    let secondHalf = parts[1];
    
    // We want to replace the sendMessage that comes after the insert
    const insertAnchor = "status: 'PENDING'\n            });";
    let subParts = secondHalf.split(insertAnchor);
    
    if (subParts.length === 2) {
        let afterInsert = subParts[1];
        
        // Find the first } else {
        let elseIndex = afterInsert.indexOf("} else {");
        if (elseIndex !== -1) {
            // Replace everything before } else { with our new block
            let newAfterInsert = `\n
            await tgApi('sendMessage', { 
              chat_id: chatId, parse_mode: 'HTML',
              text: \`✅ <b>Number Purchased!</b>\\n\\nService: \${getService(rule.internal_service).name}\\nTier: \${rule.tier === 'premium' ? '💎 High-Priority' : '⭐ Standard'}\\nNumber: <code>+\${phone}</code>\\nCost: $\${formatMoney(retailCost)}\\n\\n⏳ <i>Waiting for SMS code...</i>\`,
              reply_markup: {
                  inline_keyboard: [[
                      { text: '🔄 Check OTP', callback_data: \`check_otp_\${rule.target_api}::\${actId}\` }
                  ]]
              }
            });
          ` + afterInsert.substring(elseIndex);
          
          code = parts[0] + anchor + subParts[0] + insertAnchor + newAfterInsert;
          
          // Add the callback query handler
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

          fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
          console.log("Safe replacement succeeded!");
        }
    }
}
