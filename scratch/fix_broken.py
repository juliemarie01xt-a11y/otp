import os

with open("src/app/api/bot/command/route.ts", "r", encoding="utf-8") as f:
    code = f.read()

# Fix the broken line
old_broken = "const amount = parseFloat(parts[1].replace('\n\n    // Handle /active command"
# Wait, let's just find "const amount = parseFloat(parts[1].replace('" and everything up to "// Handle /active command"
p1 = code.find("             const amount = parseFloat(parts[1].replace('")
p2 = code.find("    // Handle /active command")

if p1 != -1 and p2 != -1:
    fixed_block = """             const amount = parseFloat(parts[1].replace('$', ''));
             if (isNaN(amount) || amount < 1) {
                 await tgApi('sendMessage', { chat_id: chatId, text: '❌ Invalid amount. Minimum deposit is $1.00.\\n\\nExample: /deposit 15.50' });
             } else {
                 const { data: deposit } = await supabaseAdmin.from('deposits').insert({ user_id: profile.id, amount: amount, status: 'PENDING' }).select('id').single();
                 if (deposit) {
                     const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;
                     const host = request.headers.get('host') || 'otp-three-liard.vercel.app';
                     const protocol = host.includes('localhost') ? 'http' : 'https';
                     const callbackUrl = `${protocol}://${host}/api/webhooks/plisio?json=true`;
                     const multiplier = 1.015 / 1.01; 
                     try {
                         const response = await fetch(`https://api.plisio.net/api/v1/invoices/new?source_currency=USD&source_amount=${(amount * multiplier).toFixed(4)}&order_name=Wallet%20Top-Up&order_number=${deposit.id}&callback_url=${encodeURIComponent(callbackUrl)}&api_key=${PLISIO_SECRET_KEY}`);
                         const resData = await response.json();
                         if (resData && resData.status === 'success') {
                            await tgApi('sendMessage', { 
                              chat_id: chatId, parse_mode: 'HTML',
                              text: `💳 <b>Crypto Deposit</b>\\n\\nAmount: <b>$${amount.toFixed(2)}</b>\\nTotal with 1.5% network fee: <b>$${(amount * 1.015).toFixed(2)}</b>\\n\\nClick the button below to pay securely via Plisio.`,
                              reply_markup: { inline_keyboard: [[ { text: `🔗 Pay $${(amount * 1.015).toFixed(2)} via Plisio`, url: resData.data.invoice_url } ]] }
                            });
                         }
                     } catch(e) {}
                 }
             }
         }
      }
      return NextResponse.json({ success: true });
    }

"""
    code = code[:p1] + fixed_block + code[p2:]
    
    with open("src/app/api/bot/command/route.ts", "w", encoding="utf-8") as f:
        f.write(code)
    print("Fixed broken syntax!")
else:
    print("Could not find broken syntax boundaries.")
