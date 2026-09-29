import os

with open("src/app/api/bot/command/route.ts", "r", encoding="utf-8") as f:
    code = f.read()

anchor = "    // Handle /unlink command"

balance_cmd = """    // Handle /balance command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/balance') {
        const chatId = update.message.chat.id;
        const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('telegram_id', chatId.toString()).single();
        if (!profile) {
            await tgApi('sendMessage', { chat_id: chatId, text: '❌ Your account is not linked. Please link it on the website first.' });
        } else {
            await tgApi('sendMessage', { chat_id: chatId, text: `💰 <b>Wallet Balance:</b>\n$${Number(profile.balance).toFixed(2)}`, parse_mode: 'HTML' });
        }
        return NextResponse.json({ success: true });
    }

"""

p = code.find(anchor)
if p != -1:
    code = code[:p] + balance_cmd + code[p:]
    with open("src/app/api/bot/command/route.ts", "w", encoding="utf-8") as f:
        f.write(code)
    print("Injected /balance command!")
else:
    print("Anchor not found!")
