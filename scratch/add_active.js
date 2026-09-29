const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

// Fix the corrupted unlink emojis
code = code.replace("text: '? Your account is not currently linked.'", "text: '❌ Your account is not currently linked.'");
code = code.replace("text: '? Your account has been securely disconnected from the Telegram Bot.'", "text: '🔌 Your account has been securely disconnected from the Telegram Bot.'");

// Add /active command
const activeCmd = `
    // Handle /active command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/active') {
      const chatId = update.message.chat.id;
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
      
      if (profile) {
        const { data: pending } = await supabaseAdmin.from('activations').select('*').eq('user_id', profile.id).eq('status', 'PENDING');
        if (!pending || pending.length === 0) {
          await tgApi('sendMessage', { chat_id: chatId, text: 'ℹ️ You have no active numbers waiting for SMS right now.' });
        } else {
          let msg = \`⏳ <b>Your Active Numbers:</b>\\n\\n\`;
          
          // Next.js requires absolute URL for fetch in API routes
          const headersList = request.headers;
          const host = headersList.get('host') || 'otp-three-liard.vercel.app';
          const protocol = host.includes('localhost') ? 'http' : 'https';
          const baseUrl = \`\${protocol}://\${host}\`;
          
          for (const act of pending) {
             msg += \`Service: <b>\${act.service}</b>\\nNumber: <code>\${act.phone_number}</code>\\nCost: $\${Number(act.cost).toFixed(2)}\\n\\n\`;
             // Ping the centralized status check asynchronously
             fetch(\`\${baseUrl}/api/vsim/status?id=\${act.vsim_activation_id}\`).catch(()=>{});
          }
          await tgApi('sendMessage', { chat_id: chatId, text: msg, parse_mode: 'HTML' });
        }
      }
      return NextResponse.json({ success: true });
    }
`;

code = code.replace(
  "    // 1. Handle regular /buy command", 
  activeCmd + "\n    // 1. Handle regular /buy command"
);

fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
console.log("Added /active command!");
