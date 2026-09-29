const fs = require('fs');

// 1. Update deposit API
let depCode = fs.readFileSync('src/app/api/deposit/route.ts', 'utf8');
const oldDepLine = "source_amount: (amount * 1.005).toFixed(4), // Add our 0.5% profit cut upfront";
const newDepLine = "source_amount: (amount * (1.015 / 1.01)).toFixed(4), // Target 1.5% total fee (accounting for Plisio's 1%)";
if (depCode.includes(oldDepLine)) {
    depCode = depCode.replace(oldDepLine, newDepLine);
    fs.writeFileSync('src/app/api/deposit/route.ts', depCode, 'utf8');
    console.log("Updated deposit API math!");
} else {
    console.log("Could not find line in deposit API.");
}

// 2. Update webhook API
let webCode = fs.readFileSync('src/app/api/webhooks/plisio/route.ts', 'utf8');
const oldWebLine = "let addedAmount = Number(amountPaidStr) / 1.005;";
const newWebLine = "let addedAmount = Number(amountPaidStr) / (1.015 / 1.01);";
if (webCode.includes(oldWebLine)) {
    
    // Also add Telegram notification logic to Webhook
    // We need to fetch the telegram_id for the user
    // The webhook receives userId from the deposit table.
    
    // First, replace the math
    webCode = webCode.replace(oldWebLine, newWebLine);
    
    // Then add the Telegram notification logic right after the RPC call
    const oldRpcBlock = `if (rpcError) {
          console.error('Failed to credit user balance via RPC:', rpcError);
        }`;
    const newRpcBlock = `if (rpcError) {
          console.error('Failed to credit user balance via RPC:', rpcError);
        } else {
          // Success! Try to notify via Telegram if the user has a linked account
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
        
    webCode = webCode.replace(oldRpcBlock, newRpcBlock);
    
    fs.writeFileSync('src/app/api/webhooks/plisio/route.ts', webCode, 'utf8');
    console.log("Updated webhook API math and added Telegram ping!");
} else {
    console.log("Could not find line in webhook API.");
}
