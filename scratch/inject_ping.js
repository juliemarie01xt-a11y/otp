const fs = require('fs');
let webCode = fs.readFileSync('src/app/api/webhooks/plisio/route.ts', 'utf8');

const anchor = `        });\n      }`;

const newPing = `        });

        // Try to notify via Telegram if the user has a linked account
        try {
          const { data: profile } = await supabaseAdmin.from('profiles').select('telegram_id, balance').eq('id', updatedDeposit.user_id).single();
          if (profile && profile.telegram_id) {
             const tgToken = process.env.TELEGRAM_BOT_TOKEN;
             if (tgToken) {
               const text = \`✅ <b>Deposit Successful!</b>\\n\\n<b>$\${addedAmount.toFixed(2)}</b> has been securely added to your wallet.\\n\\nNew Balance: <b>$\${Number(profile.balance).toFixed(2)}</b>\`;
               await fetch(\`https://api.telegram.org/bot\${tgToken}/sendMessage\`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ chat_id: profile.telegram_id, text, parse_mode: 'HTML' })
               });
             }
          }
        } catch(e) {
           console.error("Failed to send telegram deposit notification", e);
        }
      }`;

if (webCode.includes(anchor)) {
    webCode = webCode.replace(anchor, newPing);
    fs.writeFileSync('src/app/api/webhooks/plisio/route.ts', webCode, 'utf8');
    console.log("Injected Telegram ping!");
}
