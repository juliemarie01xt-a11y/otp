import os

with open("src/app/api/bot/command/route.ts", "r", encoding="utf-8") as f:
    code = f.read()

old_start = """    // Handle /start command
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
    }"""

new_start = """    // Handle /start command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase().startsWith('/start')) {
        const chatId = update.message.chat.id;
        
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
        
        if (profile) {
            let email = 'your SwiftOTP account';
            try {
               const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.id);
               if (user && user.email) email = user.email;
            } catch (e) {}

            await tgApi('sendMessage', { 
                chat_id: chatId, 
                parse_mode: 'HTML',
                text: `✅ This Telegram account is already linked to: <b>${email}</b>\n\nIf you want to unlink it and connect a different account, type /unlink` 
            });
        } else {
            await tgApi('sendMessage', { 
                chat_id: chatId, 
                parse_mode: 'HTML',
                text: `Welcome to SwiftOTP Official! 🛡️⚡\n\nYour unique Telegram ID is: <code>${chatId}</code>\n\nPlease enter this ID on the website dashboard to link your account.` 
            });
        }
        return NextResponse.json({ success: true });
    }"""

code = code.replace(old_start, new_start)

with open("src/app/api/bot/command/route.ts", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated /start command with email lookup!")
