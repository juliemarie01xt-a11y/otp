const fs = require('fs');
let botCode = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const depositCmd = `
    // Handle /deposit command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/deposit') {
      const chatId = update.message.chat.id;
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
      
      if (profile) {
         const inline_keyboard = [
             [ { text: '$5', callback_data: 'deposit_5' }, { text: '$10', callback_data: 'deposit_10' } ],
             [ { text: '$25', callback_data: 'deposit_25' }, { text: '$50', callback_data: 'deposit_50' } ]
         ];
         await tgApi('sendMessage', { 
             chat_id: chatId, 
             text: '💰 <b>Top-Up Wallet</b>\\n\\nSelect an amount to deposit via Crypto. Funds are added instantly after 1 network confirmation.',
             parse_mode: 'HTML',
             reply_markup: { inline_keyboard }
         });
      }
      return NextResponse.json({ success: true });
    }

`;

const depositCallback = `
      // Handle Deposit Action
      else if (data.startsWith('deposit_')) {
         const amountStr = data.replace('deposit_', '');
         const amount = Number(amountStr);
         const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
         if (!profile) return NextResponse.json({ success: true });

         await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '⏳ Generating secure crypto invoice...' });

         const { data: deposit, error: dbError } = await supabaseAdmin
          .from('deposits')
          .insert({ user_id: profile.id, amount: amount, status: 'PENDING' })
          .select('id').single();

         if (!deposit) {
            await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '❌ Failed to initialize deposit.' });
            return NextResponse.json({ success: true });
         }

         const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;
         const PLISIO_API_URL = 'https://api.plisio.net/api/v1';
         
         const host = request.headers.get('host') || 'otp-three-liard.vercel.app';
         const protocol = host.includes('localhost') ? 'http' : 'https';
         const callbackUrl = \`\${protocol}://\${host}/api/webhooks/plisio?json=true\`;
         
         const multiplier = 1.015 / 1.01; 

         try {
             // using global fetch instead of axios for Edge runtime
             const response = await fetch(\`\${PLISIO_API_URL}/invoices/new?source_currency=USD&source_amount=\${(amount * multiplier).toFixed(4)}&order_name=Wallet%20Top-Up&order_number=\${deposit.id}&callback_url=\${encodeURIComponent(callbackUrl)}&api_key=\${PLISIO_SECRET_KEY}\`);
             const resData = await response.json();

             if (resData && resData.status === 'success') {
                const invoice_url = resData.data.invoice_url;
                await tgApi('editMessageText', { 
                  chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
                  text: \`💳 <b>Crypto Deposit</b>\\n\\nAmount: <b>$\${amount.toFixed(2)}</b>\\nTotal with 1.5% network fee: <b>$\${(amount * 1.015).toFixed(2)}</b>\\n\\nClick the button below to pay securely via Plisio.\`,
                  reply_markup: {
                      inline_keyboard: [[ { text: \`🔗 Pay $\${(amount * 1.015).toFixed(2)} via Plisio\`, url: invoice_url } ]]
                  }
                });
             } else {
                await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '❌ Failed to generate crypto invoice from gateway.' });
             }
         } catch(e) {
             await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: \`❌ Invoice Error: \${e.message}\` });
         }
      }

`;

let p1 = botCode.indexOf("    // Handle /active command");
if (p1 !== -1) {
    botCode = botCode.substring(0, p1) + depositCmd + botCode.substring(p1);
} else { console.log("p1 failed"); }

let p2 = botCode.indexOf("      // Handle Cancel Action Button");
if (p2 !== -1) {
    botCode = botCode.substring(0, p2) + depositCallback + botCode.substring(p2);
} else { console.log("p2 failed"); }

fs.writeFileSync('src/app/api/bot/command/route.ts', botCode, 'utf8');
console.log("Properly injected /deposit!");
