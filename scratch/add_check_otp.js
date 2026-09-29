const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

// 1. Fix the corrupted emojis and add the Check OTP button
const oldPurchaseMsgRegex = /await tgApi\('sendMessage', {\s*chat_id: chatId, parse_mode: 'HTML',\s*text: `o\. <b>Number Purchased!<\/b>\\n\\nService: \$\{getService\(rule\.internal_service\)\.name\}\\nTier: \$\{rule\.tier === 'premium' \? 'dY'Z High-Priority' : '-\? Standard'\}\\nNumber: <code>\+\$\{phone\}<\/code>\\nCost: \$\$\{formatMoney\(retailCost\)\}\\n\\n\?3 <i>Waiting for SMS code\.\.\.<\/i>`\s*}\);/;

const newPurchaseMsg = `await tgApi('sendMessage', { 
              chat_id: chatId, parse_mode: 'HTML',
              text: \`✅ <b>Number Purchased!</b>\\n\\nService: \${getService(rule.internal_service).name}\\nTier: \${rule.tier === 'premium' ? '💎 High-Priority' : '⭐ Standard'}\\nNumber: <code>+\${phone}</code>\\nCost: $\${formatMoney(retailCost)}\\n\\n⏳ <i>Waiting for SMS code...</i>\`,
              reply_markup: {
                  inline_keyboard: [[
                      { text: '🔄 Check OTP', callback_data: \`check_otp_\${rule.target_api}::\${actId}\` }
                  ]]
              }
            });`;

if (oldPurchaseMsgRegex.test(code)) {
    code = code.replace(oldPurchaseMsgRegex, newPurchaseMsg);
    console.log("Successfully injected Check OTP button!");
} else {
    // try fallback
    const fallbackRegex = /await tgApi\('sendMessage', {[\s\S]*?Waiting for SMS code...<\/i>`\s*}\);/;
    code = code.replace(fallbackRegex, newPurchaseMsg);
    console.log("Injected Check OTP using fallback regex!");
}

// 2. Handle the Check OTP callback query
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
