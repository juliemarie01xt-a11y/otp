import os

with open("src/app/api/bot/command/route.ts", "r", encoding="utf-8") as f:
    code = f.read()

anchor = "    const update = await request.json();"

start_cmd = """
    // Handle /start command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase().startsWith('/start')) {
        const chatId = update.message.chat.id;
        
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
        
        if (profile) {
            await tgApi('sendMessage', { 
                chat_id: chatId, 
                text: '✅ This Telegram account is already linked to a SwiftOTP account!\n\nIf you want to unlink it, type /unlink' 
            });
        } else {
            await tgApi('sendMessage', { 
                chat_id: chatId, 
                parse_mode: 'HTML',
                text: `Welcome to SwiftOTP Official! 🛡️⚡\n\nYour unique Telegram ID is: <code>${chatId}</code>\n\nPlease enter this ID on the website dashboard to link your account.` 
            });
        }
        return NextResponse.json({ success: true });
    }
"""

p = code.find(anchor)
if p != -1:
    code = code[:p + len(anchor)] + "\n" + start_cmd + code[p + len(anchor):]
    with open("src/app/api/bot/command/route.ts", "w", encoding="utf-8") as f:
        f.write(code)
    print("Injected /start command!")
else:
    print("Anchor not found!")
