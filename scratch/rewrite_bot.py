import os

with open('src/app/api/bot/command/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Fix all the bad emojis
replacements = {
    "? Your account is not currently linked.": "❌ Your account is not currently linked.",
    "? Your account has been securely disconnected": "🔌 Your account has been securely disconnected",
    "? This route is no longer available.": "❌ This route is no longer available.",
    "? Your wallet balance is insufficient.": "❌ Your wallet balance is insufficient.",
    "? Provider failed to return a price": "❌ Provider failed to return a price",
    "? Insufficient balance for this specific number": "❌ Insufficient balance for this specific number",
    "? Provider returned invalid data.": "❌ Provider returned invalid data.",
    "? Insufficient balance (concurrency check)": "❌ Insufficient balance (concurrency check)",
    "?O Out of stock for this specific tier.": "❌ Out of stock for this specific tier.",
    "? Out of stock for this specific tier.": "❌ Out of stock for this specific tier.",
    "?O Provider API Error:": "❌ Provider API Error:",
    "? Provider API Error:": "❌ Provider API Error:",
    "dY\"T Back to Countries": "🔙 Back to Countries",
    "dY>' <b>What service do you need?</b>": "🛒 <b>What service do you need?</b>",
    "dY>' <b>Available routes": "🛒 <b>Available routes",
    "dY>' <b>Choose a country": "🌍 <b>Choose a country",
    "?3 <b>Processing your purchase securely...</b>": "⏳ <b>Processing your purchase securely...</b>",
    "?3 <b>Processing your purchase securely...</b>": "⏳ <b>Processing your purchase securely...</b>",
    "dY'Z High-Priority": "💎 High-Priority",
    "-? Standard": "⭐ Standard",
    "? Standard": "⭐ Standard",
    "? Standard": "⭐ Standard",
    "o. <b>Number Purchased!</b>": "✅ <b>Number Purchased!</b>",
    "o. <b>Number Purchased!</b>": "✅ <b>Number Purchased!</b>",
    "?3 <i>Waiting for SMS code...</i>": "⏳ <i>Waiting for SMS code...</i>",
    "?3 <i>Waiting for SMS code...</i>": "⏳ <i>Waiting for SMS code...</i>",
    "dY\", Check OTP": "🔄 Check OTP",
}

for bad, good in replacements.items():
    code = code.replace(bad, good)

# 2. Add the /active command (if not exists)
if "/active" not in code:
    active_cmd = """
      // Handle /active command
      if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/active') {
        const chatId = update.message.chat.id;
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
        
        if (profile) {
          const { data: pending } = await supabaseAdmin.from('activations').select('*').eq('user_id', profile.id).eq('status', 'PENDING');
          if (!pending || pending.length === 0) {
            await tgApi('sendMessage', { chat_id: chatId, text: 'ℹ️ You have no active numbers to check.' });
          } else {
            const headersList = request.headers;
            const host = headersList.get('host') || 'otp-three-liard.vercel.app';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const baseUrl = `${protocol}://${host}`;
            
            await tgApi('sendMessage', { chat_id: chatId, text: '⏳ <b>Your Active Numbers:</b>', parse_mode: 'HTML' });
            
            for (const act of pending) {
               const inline_keyboard = [[
                   { text: '🔄 Check OTP', callback_data: `check_otp_${act.vsim_activation_id}` },
                   { text: '❌ Cancel', callback_data: `cancel_act_${act.vsim_activation_id}` }
               ]];
               
               const msg = `Service: <b>${act.service}</b>\\nNumber: <code>+${act.phone_number}</code>\\nCost: $${Number(act.cost).toFixed(2)}`;
               
               await tgApi('sendMessage', { 
                   chat_id: chatId, 
                   text: msg, 
                   parse_mode: 'HTML',
                   reply_markup: { inline_keyboard }
               });
               
               fetch(`${baseUrl}/api/vsim/status?id=${act.vsim_activation_id}`).catch(()=>{});
            }
          }
        }
        return NextResponse.json({ success: true });
      }
"""
    code = code.replace("      // 1. Handle regular /buy command", active_cmd + "\n      // 1. Handle regular /buy command")

# 3. Add the /cancel command (if not exists)
if "/cancel" not in code:
    cancel_cmd = """
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
               inline_keyboard.push([{ text: `❌ Cancel +${act.phone_number}`, callback_data: `cancel_act_${act.vsim_activation_id}` }]);
            }
            await tgApi('sendMessage', { 
              chat_id: chatId, 
              parse_mode: 'HTML',
              text: `❌ <b>Cancel a Number</b>\\n\\nSelect the number you want to cancel. The funds will be instantly refunded to your wallet.`,
              reply_markup: { inline_keyboard }
            });
          }
        }
        return NextResponse.json({ success: true });
      }
"""
    code = code.replace("      // Handle /active command", cancel_cmd + "\n      // Handle /active command")

# 4. Add the Check OTP inline button to the purchase receipt
if "check_otp_${rule.target_api}::${actId}" not in code:
    old_purch = "text: `✅ <b>Number Purchased!</b>\\n\\nService: ${getService(rule.internal_service).name}\\nTier: ${rule.tier === 'premium' ? '💎 High-Priority' : '⭐ Standard'}\\nNumber: <code>+${phone}</code>\\nCost: $${formatMoney(retailCost)}\\n\\n⏳ <i>Waiting for SMS code...</i>`"
    new_purch = old_purch + ",\n              reply_markup: {\n                  inline_keyboard: [[\n                      { text: '🔄 Check OTP', callback_data: `check_otp_${rule.target_api}::${actId}` }\n                  ]]\n              }"
    code = code.replace(old_purch, new_purch)

# 5. Add the callback queries for Check OTP and Cancel
if "data.startsWith('check_otp_')" not in code:
    callbacks = """
      // Handle Check OTP Button
      else if (data.startsWith('check_otp_')) {
        const fullActId = data.replace('check_otp_', '');
        const host = request.headers.get('host') || 'otp-three-liard.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        fetch(`${protocol}://${host}/api/vsim/status?id=${fullActId}`).catch(()=>{});
        await tgApi('answerCallbackQuery', { callback_query_id: update.callback_query.id, text: '⏳ Checking for SMS...', show_alert: false });
      }
      
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
            const res = await fetch(`${TARGET_API_URL}?api_key=${TARGET_API_KEY}&action=setStatus&id=${realId}&status=8`);
            const result = await res.text();
            
            if (result === 'ACCESS_CANCEL' || result === 'ACCESS_CANCEL_ALREADY' || result === 'BAD_STATUS' || result === 'NO_ACTIVATION' || result === 'ACCESS_APPROVED') {
                const { data: updatedAct } = await supabaseAdmin.from('activations').update({ status: 'CANCELLED' }).eq('vsim_activation_id', fullActId).eq('status', 'PENDING').select();
                if (updatedAct && updatedAct.length > 0) {
                    await supabaseAdmin.rpc('refund_balance', { p_user_id: profile.id, p_amount: Number(activation.cost) });
                    await tgApi('editMessageText', { 
                      chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
                      text: `✅ <b>Number Cancelled</b>\\n\\nNumber: <code>+${activation.phone_number}</code>\\nRefunded: <b>$${Number(activation.cost).toFixed(2)}</b>`
                    });
                } else {
                    await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '❌ Cancellation conflict.' });
                }
            } else {
                await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: `❌ Failed to cancel at provider: ${result}` });
            }
        } catch (e: any) {
            await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: `❌ Cancellation error: ${e.message}` });
        }
      }
"""
    code = code.replace("      // STEP C: Confirm Purchase", callbacks + "\n      // STEP C: Confirm Purchase")

with open('src/app/api/bot/command/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print("Bot API fully constructed!")
