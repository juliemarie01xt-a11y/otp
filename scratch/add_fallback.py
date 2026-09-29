import os

file_path = "src/app/api/bot/command/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

anchor = "    return NextResponse.json({ success: true });\n  } catch (error: any) {"

fallback_logic = """
    // Fallback for unknown text/intents
    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
        
        if (!profile) {
            await tgApi('sendMessage', { 
                chat_id: chatId, 
                parse_mode: 'HTML',
                text: '👋 <b>Welcome to SwiftOTP!</b>\n\nIt looks like your account is not connected yet. Please type <code>/start</code> to generate your unique Telegram ID and link it on our website to begin using the bot!'
            });
        } else {
            await tgApi('sendMessage', { 
                chat_id: chatId, 
                parse_mode: 'HTML',
                text: '🤔 I didn\\'t quite catch that.\n\nOpen the Menu to see available commands, or type <code>/buy</code> to purchase a new number!'
            });
        }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {"""

if anchor in code:
    code = code.replace(anchor, fallback_logic, 1)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Injected fallback logic successfully!")
else:
    print("Anchor not found!")
