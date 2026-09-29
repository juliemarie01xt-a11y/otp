const fs = require('fs');
let botCode = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const oldDepositCmd = `    // Handle /deposit command
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
    }`;

const newDepositCmd = `    // Handle /deposit command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase().startsWith('/deposit')) {
      const chatId = update.message.chat.id;
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
      
      if (profile) {
         const parts = update.message.text.trim().split(' ');
         
         if (parts.length === 1) {
             const inline_keyboard = [
                 [ { text: '$5', callback_data: 'deposit_5' }, { text: '$10', callback_data: 'deposit_10' } ],
                 [ { text: '$25', callback_data: 'deposit_25' }, { text: '$50', callback_data: 'deposit_50' } ],
                 [ { text: '📝 Custom Amount', callback_data: 'deposit_custom' } ]
             ];
             await tgApi('sendMessage', { 
                 chat_id: chatId, 
                 text: '💰 <b>Top-Up Wallet</b>\\n\\nSelect an amount to deposit via Crypto. Funds are added instantly after 1 network confirmation.',
                 parse_mode: 'HTML',
                 reply_markup: { inline_keyboard }
             });
         } else {
             const amount = parseFloat(parts[1].replace('$', ''));
             if (isNaN(amount) || amount < 1) {
                 await tgApi('sendMessage', { chat_id: chatId, text: '❌ Invalid amount. Minimum deposit is $1.00.\\n\\nExample: /deposit 15.50' });
             } else {
                 // Trigger Plisio logic for custom amount directly via text command!
                 const { data: deposit } = await supabaseAdmin.from('deposits').insert({ user_id: profile.id, amount: amount, status: 'PENDING' }).select('id').single();
                 if (deposit) {
                     const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;
                     const host = request.headers.get('host') || 'otp-three-liard.vercel.app';
                     const protocol = host.includes('localhost') ? 'http' : 'https';
                     const callbackUrl = \`\${protocol}://\${host}/api/webhooks/plisio?json=true\`;
                     const multiplier = 1.015 / 1.01; 
                     try {
                         const response = await fetch(\`https://api.plisio.net/api/v1/invoices/new?source_currency=USD&source_amount=\${(amount * multiplier).toFixed(4)}&order_name=Wallet%20Top-Up&order_number=\${deposit.id}&callback_url=\${encodeURIComponent(callbackUrl)}&api_key=\${PLISIO_SECRET_KEY}\`);
                         const resData = await response.json();
                         if (resData && resData.status === 'success') {
                            await tgApi('sendMessage', { 
                              chat_id: chatId, parse_mode: 'HTML',
                              text: \`💳 <b>Crypto Deposit</b>\\n\\nAmount: <b>$\${amount.toFixed(2)}</b>\\nTotal with 1.5% network fee: <b>$\${(amount * 1.015).toFixed(2)}</b>\\n\\nClick the button below to pay securely via Plisio.\`,
                              reply_markup: { inline_keyboard: [[ { text: \`🔗 Pay $\${(amount * 1.015).toFixed(2)} via Plisio\`, url: resData.data.invoice_url } ]] }
                            });
                         }
                     } catch(e) {}
                 }
             }
         }
      }
      return NextResponse.json({ success: true });
    }`;

botCode = botCode.replace(oldDepositCmd, newDepositCmd);

const oldCustomCallback = `      // Handle Deposit Action
      else if (data.startsWith('deposit_')) {`;

const newCustomCallback = `      // Handle Deposit Action
      else if (data === 'deposit_custom') {
         await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '📝 <b>Custom Deposit</b>\\n\\nTo deposit a custom amount, simply type the command followed by the amount.\\n\\nExample: <code>/deposit 15.50</code>', parse_mode: 'HTML' });
      }
      else if (data.startsWith('deposit_')) {`;

botCode = botCode.replace(oldCustomCallback, newCustomCallback);

fs.writeFileSync('src/app/api/bot/command/route.ts', botCode, 'utf8');
console.log("Added custom deposit support!");
