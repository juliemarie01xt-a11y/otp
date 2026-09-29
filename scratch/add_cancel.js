const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const cancelCmd = `
    // Handle /cancel command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/cancel') {
      const chatId = update.message.chat.id;
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
      
      if (profile) {
        const { data: pending } = await supabaseAdmin.from('activations').select('*').eq('user_id', profile.id).eq('status', 'PENDING');
        if (!pending || pending.length === 0) {
          await tgApi('sendMessage', { chat_id: chatId, text: 'ℹ️ You have no active numbers to cancel.' });
        } else {
          const inline_keyboard = [];
          for (const act of pending) {
             inline_keyboard.push([{ text: \`❌ Cancel +\${act.phone_number}\`, callback_data: \`cancel_act_\${act.vsim_activation_id}\` }]);
          }
          await tgApi('sendMessage', { 
            chat_id: chatId, 
            parse_mode: 'HTML',
            text: \`❌ <b>Cancel a Number</b>\\n\\nSelect the number you want to cancel. The funds will be instantly refunded to your wallet.\`,
            reply_markup: { inline_keyboard }
          });
        }
      }
      return NextResponse.json({ success: true });
    }
`;

const cancelActHandler = `
      // Handle Cancel Action Button
      else if (data.startsWith('cancel_act_')) {
        const fullActId = data.replace('cancel_act_', '');
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
        if (!profile) return NextResponse.json({ success: true });

        const { data: activation } = await supabaseAdmin.from('activations').select('cost, status, phone_number').eq('vsim_activation_id', fullActId).eq('user_id', profile.id).single();
        
        if (!activation || activation.status !== 'PENDING') {
           await tgApi('answerCallbackQuery', { callback_query_id: update.callback_query.id, text: '❌ Number is no longer active.', show_alert: true });
           return NextResponse.json({ success: true });
        }
        
        await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '⏳ Cancelling and refunding securely...' });

        const parts = fullActId.split('::');
        const source = parts.length > 1 ? parts[0] : 'vsim';
        const realId = parts.length > 1 ? parts[1] : fullActId;
        const TARGET_API_URL = source === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
        const TARGET_API_KEY = source === 'smsbower' ? SMSBOWER_API_KEY : VSIM_API_KEY;

        try {
            const res = await fetch(\`\${TARGET_API_URL}?api_key=\${TARGET_API_KEY}&action=setStatus&id=\${realId}&status=8\`);
            const result = await res.text();
            
            if (result === 'ACCESS_CANCEL' || result === 'ACCESS_CANCEL_ALREADY' || result === 'BAD_STATUS' || result === 'NO_ACTIVATION' || result === 'ACCESS_APPROVED') {
                const { data: updatedAct } = await supabaseAdmin.from('activations').update({ status: 'CANCELLED' }).eq('vsim_activation_id', fullActId).eq('status', 'PENDING').select();
                if (updatedAct && updatedAct.length > 0) {
                    await supabaseAdmin.rpc('refund_balance', { p_user_id: profile.id, p_amount: Number(activation.cost) });
                    await tgApi('editMessageText', { 
                      chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
                      text: \`✅ <b>Number Cancelled</b>\\n\\nNumber: <code>+\${activation.phone_number}</code>\\nRefunded: <b>$\${Number(activation.cost).toFixed(2)}</b>\`
                    });
                } else {
                    await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '❌ Cancellation conflict. It may have already received a code.' });
                }
            } else {
                await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: \`❌ Failed to cancel at provider: \${result}\` });
            }
        } catch (e) {
            await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: \`❌ Cancellation error: \${e.message}\` });
        }
      }
`;

if (!code.includes("data.startsWith('cancel_act_')")) {
    code = code.replace(
        "    // Handle /active command",
        cancelCmd + "\n    // Handle /active command"
    );
    
    code = code.replace(
        "      // STEP C: Confirm Purchase",
        cancelActHandler + "\n      // STEP C: Confirm Purchase"
    );
    
    fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
    console.log("Added /cancel command securely!");
} else {
    console.log("Cancel command already exists.");
}
