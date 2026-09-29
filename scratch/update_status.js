const fs = require('fs');
let code = fs.readFileSync('src/app/api/vsim/status/route.ts', 'utf8');

const oldOkBlock = `        if (data.startsWith('STATUS_OK:')) {
            const code = data.split(':')[1];
            // Update our database to store the OTP and mark as completed
            await supabaseAdmin
              .from('activations')
              .update({ status: 'COMPLETED', code: code })
              .eq('vsim_activation_id', id.toString());
              
            return NextResponse.json({ status: 'COMPLETED', code });
        }`;

const newOkBlock = `        if (data.startsWith('STATUS_OK:')) {
            const code = data.split(':')[1];
            
            // ATOMIC LOCK: Try to change status from PENDING to COMPLETED.
            const { data: updatedAct } = await supabaseAdmin
              .from('activations')
              .update({ status: 'COMPLETED', code: code })
              .eq('vsim_activation_id', id.toString())
              .eq('status', 'PENDING')
              .select('user_id, service, country');
              
            // If it was just completed right now (not previously completed by another thread)
            if (updatedAct && updatedAct.length > 0) {
                const userId = updatedAct[0].user_id;
                
                // Fetch user to see if they have a Telegram Bot linked
                const { data: profile } = await supabaseAdmin.from('profiles').select('telegram_id').eq('id', userId).single();
                
                if (profile && profile.telegram_id) {
                    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
                    if (BOT_TOKEN) {
                        try {
                            const tgUrl = \`https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage\`;
                            await fetch(tgUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chat_id: profile.telegram_id,
                                    parse_mode: 'HTML',
                                    text: \`💬 <b>New SMS Received!</b>\\n\\nService: <b>\${updatedAct[0].service}</b>\\nCode: <code>\${code}</code>\\n\\n<i>This number is now completed.</i>\`
                                })
                            });
                        } catch (e) {
                            console.error("TG Ping Error:", e);
                        }
                    }
                }
            }
              
            return NextResponse.json({ status: 'COMPLETED', code });
        }`;

if (code.includes(oldOkBlock)) {
    code = code.replace(oldOkBlock, newOkBlock);
    fs.writeFileSync('src/app/api/vsim/status/route.ts', code, 'utf8');
    console.log("Updated STATUS_OK block!");
} else {
    console.log("Could not find STATUS_OK block.");
}
