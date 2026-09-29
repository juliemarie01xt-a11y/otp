import os

with open("src/app/api/bot/command/route.ts", "r", encoding="utf-8") as f:
    code = f.read()

anchor = "    // Handle /balance command"

status_cmd = """    // Handle /status command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/status') {
        const chatId = update.message.chat.id;
        const { data: profile } = await supabaseAdmin.from('profiles').select('id, balance').eq('telegram_id', chatId.toString()).single();
        
        if (!profile) {
            await tgApi('sendMessage', { chat_id: chatId, text: '❌ Your account is not linked. Please link it on the website first to view your status.' });
            return NextResponse.json({ success: true });
        }

        let email = 'Unknown';
        try {
           const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.id);
           if (user && user.email) email = user.email;
        } catch (e) {}

        const { data: activations } = await supabaseAdmin.from('activations').select('cost').eq('user_id', profile.id);
        const totalNumbers = (activations || []).length;
        const totalSpent = (activations || []).reduce((sum, act) => sum + Number(act.cost || 0), 0);

        const statusMsg = `📊 <b>Your Account Status</b>\n\n👤 <b>Account:</b> <code>${email}</code>\n💰 <b>Current Balance:</b> $${Number(profile.balance).toFixed(2)}\n📈 <b>Total Spent:</b> $${totalSpent.toFixed(2)}\n📱 <b>Total Numbers Bought:</b> ${totalNumbers}`;

        await tgApi('sendMessage', { 
            chat_id: chatId, 
            text: statusMsg, 
            parse_mode: 'HTML' 
        });

        return NextResponse.json({ success: true });
    }

"""

p = code.find(anchor)
if p != -1:
    code = code[:p] + status_cmd + code[p:]
    with open("src/app/api/bot/command/route.ts", "w", encoding="utf-8") as f:
        f.write(code)
    print("Injected /status command!")
else:
    print("Anchor not found!")
