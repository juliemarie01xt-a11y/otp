const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const oldActiveRegex = /let msg = `⏳ <b>Your Active Numbers:<\/b>\\n\\n`;[\s\S]*?await tgApi\('sendMessage', { chat_id: chatId, text: msg, parse_mode: 'HTML' }\);/;

const newActiveBlock = `
          // Next.js requires absolute URL for fetch in API routes
          const headersList = request.headers;
          const host = headersList.get('host') || 'otp-three-liard.vercel.app';
          const protocol = host.includes('localhost') ? 'http' : 'https';
          const baseUrl = \`\${protocol}://\${host}\`;
          
          await tgApi('sendMessage', { chat_id: chatId, text: '⏳ <b>Your Active Numbers:</b>', parse_mode: 'HTML' });
          
          for (const act of pending) {
             const inline_keyboard = [[
                 { text: '🔄 Check OTP', callback_data: \`check_otp_\${act.vsim_activation_id}\` },
                 { text: '❌ Cancel', callback_data: \`cancel_act_\${act.vsim_activation_id}\` }
             ]];
             
             const msg = \`Service: <b>\${getService(act.service).name || act.service}</b>\\nNumber: <code>+\${act.phone_number}</code>\\nCost: $\${Number(act.cost).toFixed(2)}\`;
             
             await tgApi('sendMessage', { 
                 chat_id: chatId, 
                 text: msg, 
                 parse_mode: 'HTML',
                 reply_markup: { inline_keyboard }
             });
             
             // Ping the centralized status check asynchronously
             fetch(\`\${baseUrl}/api/vsim/status?id=\${act.vsim_activation_id}\`).catch(()=>{});
          }
`;

if (oldActiveRegex.test(code)) {
    code = code.replace(oldActiveRegex, newActiveBlock);
    fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
    console.log("Updated /active to send rich cards with buttons!");
} else {
    console.log("Could not find the old /active block using regex.");
}
