const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const replacements = [
    ["? Your account is not currently linked.", "❌ Your account is not currently linked."],
    ["? Your account has been securely disconnected from the Telegram Bot.", "🔌 Your account has been securely disconnected from the Telegram Bot."],
    ["? This route is no longer available.", "❌ This route is no longer available."],
    ["? Your wallet balance is insufficient.", "❌ Your wallet balance is insufficient."],
    ["? Provider failed to return a price. Order cancelled.", "❌ Provider failed to return a price. Order cancelled."],
    ["? Insufficient balance for this specific number route.", "❌ Insufficient balance for this specific number route."],
    ["? Provider returned invalid data. Cancelled.", "❌ Provider returned invalid data. Cancelled."],
    ["? Insufficient balance (concurrency check). Order cancelled.", "❌ Insufficient balance (concurrency check). Order cancelled."],
    ["? Out of stock for this specific tier. Please try a different route.", "❌ Out of stock for this specific tier. Please try a different route."],
    ["? Provider API Error:", "❌ Provider API Error:"],
    ["dY'Z High-Priority", "💎 High-Priority"],
    ["-? Standard", "⭐ Standard"],
    ["dY\"T Back to Countries", "🔙 Back to Countries"],
    ["dY>' <b>What service do you need?</b>", "🛒 <b>What service do you need?</b>"],
    ["dY>' <b>Available routes", "🛒 <b>Available routes"],
    ["dY>' <b>Choose a country", "🌍 <b>Choose a country"],
    ["?3 <b>Processing your purchase securely...</b>", "⏳ <b>Processing your purchase securely...</b>"]
];

for (const [bad, good] of replacements) {
    code = code.split(bad).join(good);
}

const badPurchase = "await tgApi('sendMessage', { \n              chat_id: chatId, parse_mode: 'HTML',\n              text: `o. <b>Number Purchased!</b>\\n\\nService: ${getService(rule.internal_service).name}\\nTier: ${rule.tier === 'premium' ? '💎 High-Priority' : '⭐ Standard'}\\nNumber: <code>+${phone}</code>\\nCost: $${formatMoney(retailCost)}\\n\\n?3 <i>Waiting for SMS code...</i>`\n            });";

const goodPurchase = `await tgApi('sendMessage', { 
              chat_id: chatId, parse_mode: 'HTML',
              text: \`✅ <b>Number Purchased!</b>\\n\\nService: \${getService(rule.internal_service).name}\\nTier: \${rule.tier === 'premium' ? '💎 High-Priority' : '⭐ Standard'}\\nNumber: <code>+\${phone}</code>\\nCost: $\${formatMoney(retailCost)}\\n\\n⏳ <i>Waiting for SMS code...</i>\`,
              reply_markup: {
                  inline_keyboard: [[
                      { text: '🔄 Check OTP', callback_data: \`check_otp_\${rule.target_api}::\${actId}\` }
                  ]]
              }
            });`;

code = code.replace(badPurchase, goodPurchase);

// In case the exact spacing didn't match, let's use a regex for the purchase block:
const regexPurchase = /await tgApi\('sendMessage', {\s*chat_id: chatId, parse_mode: 'HTML',\s*text: `o\. <b>Number Purchased![\s\S]*?Waiting for SMS code\.\.\.<\/i>`\s*}\);/;
code = code.replace(regexPurchase, goodPurchase);

// Also add the handler for check_otp_
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

if (!code.includes("data.startsWith('check_otp_')")) {
    code = code.replace(
      "// STEP C: Confirm Purchase",
      checkOtpHandler + "\n      // STEP C: Confirm Purchase"
    );
}

fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
console.log("Fixed emojis and added button safely!");
