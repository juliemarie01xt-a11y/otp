const fs = require('fs');
let webCode = fs.readFileSync('src/app/api/webhooks/plisio/route.ts', 'utf8');

const regex = /await supabaseAdmin\.rpc\('credit_balance', {\s*p_user_id: updatedDeposit\.user_id,\s*p_amount: addedAmount\s*}\);/g;

const replacement = `await supabaseAdmin.rpc('credit_balance', {
          p_user_id: updatedDeposit.user_id,
          p_amount: addedAmount
        });

        // Try to notify via Telegram if the user has a linked account
        try {
          const { data: profile } = await supabaseAdmin.from('profiles').select('telegram_id, balance').eq('id', updatedDeposit.user_id).single();
          if (profile && profile.telegram_id) {
             const tgToken = process.env.TELEGRAM_BOT_TOKEN;
             if (tgToken) {
               const text = \`✅ <b>Deposit Successful!</b>\\n\\n<b>$\${addedAmount.toFixed(2)}</b> has been securely added to your wallet.\\n\\nNew Balance: <b>$\${Number(profile.balance + addedAmount).toFixed(2)}</b>\`;
               await fetch(\`https://api.telegram.org/bot\${tgToken}/sendMessage\`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ chat_id: profile.telegram_id, text, parse_mode: 'HTML' })
               });
             }
          }
        } catch(e) {
           console.error("Failed to send telegram deposit notification", e);
        }`;

if (regex.test(webCode)) {
    webCode = webCode.replace(regex, replacement);
    fs.writeFileSync('src/app/api/webhooks/plisio/route.ts', webCode, 'utf8');
    console.log("Regex injected Telegram ping!");
} else {
    console.log("Regex failed.");
}
