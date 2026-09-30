import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import axios from 'axios';
import { POPULAR_SERVICES, POPULAR_COUNTRIES, getService, getCountry } from '@/lib/constants';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const VSIM_API_KEY = process.env.VSIM_API_KEY;
const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';
const SMSBOWER_API_KEY = process.env.SMSBOWER_API_KEY;

// Helper to format money exactly like the frontend
const formatMoney = (amount: number | string) => {
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
};

// Helper to send/edit messages
async function tgApi(method: string, payload: any) {
  try {
    await axios.post(`${TELEGRAM_API}/${method}`, payload);
  } catch (e: any) {
    console.error('Telegram API Error:', e.response?.data || e.message);
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-telegram-bot-api-secret-token');
    const expectedToken = process.env.TELEGRAM_SECRET_TOKEN;
    if (!expectedToken || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update = await request.json();

    // 1. CLEAR STATE ON NEW COMMANDS
    if (update.message && update.message.text && update.message.text.startsWith('/')) {
        const chatId = update.message.chat.id.toString();
        // Ignore errors if table doesn't exist yet
        try {
            await supabaseAdmin.from('bot_sessions').delete().eq('telegram_id', chatId);
        } catch (e) {}
    }

    // 2. STATE MACHINE FOR /CREATE ACCOUNT FLOW
    if (update.message && update.message.text && !update.message.text.startsWith('/')) {
        const chatId = update.message.chat.id.toString();
        
        try {
            const { data: session } = await supabaseAdmin.from('bot_sessions').select('*').eq('telegram_id', chatId).single();
            
            if (session) {
                const text = update.message.text.trim();
                
                if (session.step === 'AWAITING_EMAIL') {
                    // Very basic email regex
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
                        await tgApi('sendMessage', { chat_id: chatId, text: '❌ That doesn\'t look like a valid email. Please try again or type /cancel to abort.' });
                        return NextResponse.json({ success: true });
                    }
                    
                    await supabaseAdmin.from('bot_sessions').update({ step: 'AWAITING_PASSWORD', temp_email: text }).eq('telegram_id', chatId);
                    await tgApi('sendMessage', { chat_id: chatId, text: `✅ Got it: ${text}\n\nNow, please send a strong password (minimum 6 characters).` });
                    return NextResponse.json({ success: true });
                }
                
                if (session.step === 'AWAITING_PASSWORD') {
                    if (text.length < 6) {
                        await tgApi('sendMessage', { chat_id: chatId, text: '❌ Password must be at least 6 characters long. Please try again or type /cancel to abort.' });
                        return NextResponse.json({ success: true });
                    }

                    await tgApi('sendMessage', { chat_id: chatId, text: '⏳ Creating your account securely...' });

                    // Check if they are already linked BEFORE creating the new account
                    const { data: existingProfile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId).single();
                    const isAlreadyLinked = !!existingProfile;
                    let originalEmail = 'Unknown';
                    
                    if (isAlreadyLinked) {
                        try {
                           const { data: { user: origUser } } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);
                           if (origUser && origUser.email) originalEmail = origUser.email;
                        } catch (e) {}
                    }

                    // Use signUp so the Resend email hook is automatically triggered!
                    const { data, error } = await supabaseAdmin.auth.signUp({
                      email: session.temp_email,
                      password: text
                    });

                    if (error) {
                        await tgApi('sendMessage', { chat_id: chatId, text: `❌ Failed to create account: ${error.message}\n\nPlease type /create to try again.` });
                        await supabaseAdmin.from('bot_sessions').delete().eq('telegram_id', chatId);
                        return NextResponse.json({ success: true });
                    }

                    if (data?.user?.identities?.length === 0) {
                        await tgApi('sendMessage', { chat_id: chatId, text: `❌ This email is already registered.\n\nPlease type /create to try a different email.` });
                        await supabaseAdmin.from('bot_sessions').delete().eq('telegram_id', chatId);
                        return NextResponse.json({ success: true });
                    }

                    // Clean up session
                    await supabaseAdmin.from('bot_sessions').delete().eq('telegram_id', chatId);
                    
                    let successMessage = `🎉 <b>Account created successfully!</b>\n\n`;

                    if (isAlreadyLinked) {
                        successMessage += `Your new account (<code>${session.temp_email}</code>) has been created! <i>(Note: This bot remains securely linked to your original account <code>${originalEmail}</code>)</i>.\n\n`;
                    } else {
                        successMessage += `Your account (<code>${session.temp_email}</code>) has been securely linked to this Telegram bot.\n\n`;
                        // Link the telegram ID to the new profile since they weren't linked before
                        setTimeout(async () => {
                            if (data?.user?.id) {
                                await supabaseAdmin.from('profiles').update({ telegram_id: chatId }).eq('id', data.user.id);
                            }
                        }, 1500);
                    }

                    successMessage += `📧 <b>Please check your email inbox (and Spam/Junk folder)</b> to verify your email address.\n\n`;
                    successMessage += `⚠️ <b>IMPORTANT:</b> For your security, please completely delete your previous message containing your password from this chat, and remember it!\n\n`;
                    successMessage += `<i>Type /buy to get started, /deposit to add funds, or visit <a href="https://swiftotp.store">swiftotp.store</a> to manage your account on the web.</i>`;

                    await tgApi('sendMessage', { 
                        chat_id: chatId, 
                        parse_mode: 'HTML',
                        text: successMessage 
                    });
                    return NextResponse.json({ success: true });
                }
            }
        } catch (err) {
            // Table might not exist yet, just ignore
        }
    }

    // Handle /create command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/create') {
        const chatId = update.message.chat.id.toString();
        
        try {
            // Start flow
            await supabaseAdmin.from('bot_sessions').upsert({ telegram_id: chatId, step: 'AWAITING_EMAIL' });
            
            // Tell them clearly if they are already linked so there is no confusion
            const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId).single();
            const introMsg = profile 
                ? `🚀 <b>Let's create a new SwiftOTP account!</b>\n\n<i>(Note: This Telegram bot is already linked to an account. Your new account will be created safely, but it won't replace your currently linked wallet.)</i>\n\nPlease send me your <b>Email Address</b>.` 
                : `🚀 <b>Let's create your SwiftOTP account!</b>\n\nPlease send me your <b>Email Address</b>.`;

            await tgApi('sendMessage', { 
                chat_id: chatId, 
                parse_mode: 'HTML',
                text: introMsg 
            });
        } catch (err) {
            await tgApi('sendMessage', { chat_id: chatId, text: '❌ System error starting account creation. Please ensure the bot_sessions table is created.' });
        }
        return NextResponse.json({ success: true });
    }

    
    // Handle Resend Verification Button
    if (update.message && update.message.text && update.message.text.trim() === '📧 Resend Verification') {
        const chatId = update.message.chat.id;
        const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
        if (!profile) return NextResponse.json({ success: true });

        
        // Block if Banned
        if (profile.is_banned) {
            await tgApi('sendMessage', {
                chat_id: chatId,
                text: '🚫 <b>Account Suspended</b>\n\nYour account has been temporarily blocked for suspicious activity.\n\nIf you believe this is a mistake, please contact support.',
                parse_mode: 'HTML',
                reply_markup: { remove_keyboard: true }
            });
            return NextResponse.json({ success: true });
        }

        // Block if not verified
        if (profile.is_email_verified === false) {
            await tgApi('sendMessage', {
                chat_id: chatId,
                text: `⚠️ <b>Email Not Verified</b>\n\nYou must verify your email address before using the bot.\n\nPlease check your inbox/spam folder.`,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Resend Verification', callback_data: 'resend_verify' }]]
                }
            });
            return NextResponse.json({ success: true });
        }


        if (profile.is_email_verified) {
           await tgApi('sendMessage', { 
               chat_id: chatId, 
               text: '✅ Your email is already verified! You can now use all commands.',
               reply_markup: { remove_keyboard: true }
           });
           return NextResponse.json({ success: true });
        }

        const now = new Date();
        const lastResend = profile.last_resend_at ? new Date(profile.last_resend_at) : new Date(0);
        const diffMs = now.getTime() - lastResend.getTime();

        if (diffMs < 60000) {
           const secondsLeft = Math.ceil((60000 - diffMs) / 1000);
           await tgApi('sendMessage', { chat_id: chatId, text: `⏳ Please wait ${secondsLeft} seconds before requesting another email.` });
           return NextResponse.json({ success: true });
        }

        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        if (user && user.email) {
            await supabaseAdmin.auth.resend({ type: 'signup', email: user.email });
            await supabaseAdmin.from('profiles').update({ last_resend_at: now.toISOString() }).eq('id', profile.id);
            await tgApi('sendMessage', { chat_id: chatId, text: '📧 A new verification email has been sent to your inbox/spam folder!' });
        }
        return NextResponse.json({ success: true });
    }

    // Handle /start command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase().startsWith('/start')) {
        const chatId = update.message.chat.id;
        
        const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
        
        if (profile) {
            let email = 'your SwiftOTP account';
            try {
               const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.id);
               if (user && user.email) email = user.email;
            } catch (e) {}

            await tgApi('sendMessage', { 
                chat_id: chatId, 
                parse_mode: 'HTML',
                text: `✅ This Telegram account is already linked to: <b>${email}</b>

If you want to unlink it and connect a different account, type /unlink` 
            });
        } else {
            await tgApi('sendMessage', { 
                chat_id: chatId, 
                parse_mode: 'HTML',
                text: `👋 <b>Welcome to SwiftOTP!</b>\n\nTo start buying numbers directly from Telegram, you need to securely connect this chat to your website account.\n\n<b>How to link your account:</b>\n1️⃣ Copy your Telegram ID: <code>${chatId}</code>\n2️⃣ Open the <a href="https://swiftotp.store/dashboard/telegram">Telegram BOT Page</a> on our website\n3️⃣ Paste your ID into the secure Connection Status box and click Connect to Telegram!\n\n<i>You will receive a confirmation message here once successfully linked.</i>`
            });
        }
        return NextResponse.json({ success: true });
    }


    
    // Handle /status command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/status') {
        const chatId = update.message.chat.id;
        const { data: profile } = await supabaseAdmin.from('profiles').select('id, balance, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
        
        if (!profile) {
            await tgApi('sendMessage', { 
              chat_id: chatId, 
              text: '❌ <b>Account Not Linked</b>\n\nTo use this command, you need to connect your Telegram account.\n\n<b>Choose an option:</b>\n🔹 Type /create to instantly create a brand new account\n🔹 Type /start to link an existing website account', 
              parse_mode: 'HTML' 
            });
            return NextResponse.json({ success: true });
        }

        let email = 'Unknown';
        try {
           const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.id);
           if (user && user.email) email = user.email;
        } catch (e) {}

        const { data: activations } = await supabaseAdmin.from('activations').select('cost').eq('user_id', profile.id).eq('status', 'COMPLETED');
        const totalNumbers = (activations || []).length;
        const totalSpent = (activations || []).reduce((sum, act) => sum + Number(act.cost || 0), 0);

        const statusMsg = `📊 <b>Your Account Status</b>

👤 <b>Account:</b> <code>${email}</code>
💰 <b>Current Balance:</b> $${Number(profile.balance).toFixed(2)}
📈 <b>Total Spent:</b> $${totalSpent.toFixed(2)}
📱 <b>Total Numbers Bought:</b> ${totalNumbers}`;

        await tgApi('sendMessage', { 
            chat_id: chatId, 
            text: statusMsg, 
            parse_mode: 'HTML' 
        });

        return NextResponse.json({ success: true });
    }

    // Handle /balance command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/balance') {
        const chatId = update.message.chat.id;
        const { data: profile } = await supabaseAdmin.from('profiles').select('balance, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
        if (!profile) {
            await tgApi('sendMessage', { 
              chat_id: chatId, 
              text: '❌ <b>Account Not Linked</b>\n\nTo use this command, you need to connect your Telegram account.\n\n<b>Choose an option:</b>\n🔹 Type /create to instantly create a brand new account\n🔹 Type /start to link an existing website account', 
              parse_mode: 'HTML' 
            });
        } else {
            await tgApi('sendMessage', { chat_id: chatId, text: `💰 <b>Wallet Balance:</b>
$${Number(profile.balance).toFixed(2)}`, parse_mode: 'HTML' });
        }
        return NextResponse.json({ success: true });
    }

    // Handle /unlink command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/unlink') {
      const chatId = update.message.chat.id;

      const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
      if (!profile) {
        await tgApi('sendMessage', { chat_id: chatId, text: '❌ Your account is not currently linked.' });
        return NextResponse.json({ success: true });
      }

      await supabaseAdmin.from('profiles').update({ telegram_id: null }).eq('id', profile.id);
      await tgApi('sendMessage', { chat_id: chatId, text: '🔌 Your account has been securely disconnected from the Telegram Bot.' });
      return NextResponse.json({ success: true });
    }



    // Handle /deposit command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase().startsWith('/deposit')) {
      const chatId = update.message.chat.id;
      const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
      
      if (profile) {
         const parts = update.message.text.trim().split(' ');
         
         if (parts.length === 1) {
             const inline_keyboard = [
                 [ { text: '$5', callback_data: 'deposit_5' }, { text: '$10', callback_data: 'deposit_10' } ],
                 [ { text: '$25', callback_data: 'deposit_25' }, { text: '$50', callback_data: 'deposit_50' } ],
                 [ { text: '📝 Custom Amount', callback_data: 'deposit_custom' } ]
             ];
             await tgApi('sendMessage', { 
                 chat_id: chatId, 
                 text: '💰 <b>Top-Up Wallet</b>\n\nSelect an amount to deposit via Crypto. Funds are added instantly after 1 network confirmation.',
                 parse_mode: 'HTML',
                 reply_markup: { inline_keyboard }
             });
         } else {
             const amount = parseFloat(parts[1].replace('$', ''));
             if (isNaN(amount) || amount < 1) {
                 await tgApi('sendMessage', { chat_id: chatId, text: '❌ Invalid amount. Minimum deposit is $1.00.\n\nExample: /deposit 15.50' });
             } else {
                 const { data: deposit } = await supabaseAdmin.from('deposits').insert({ user_id: profile.id, amount: amount, status: 'PENDING' }).select('id').single();
                 if (deposit) {
                     const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;
                     const host = request.headers.get('host') || 'swiftotp.store';
                     const protocol = host.includes('localhost') ? 'http' : 'https';
                     const callbackUrl = `${protocol}://${host}/api/webhooks/plisio?json=true`;
                     const multiplier = 1.015 / 1.01; 
                     try {
                         const response = await fetch(`https://api.plisio.net/api/v1/invoices/new?source_currency=USD&source_amount=${(amount * multiplier).toFixed(4)}&order_name=Wallet%20Top-Up&order_number=${deposit.id}&callback_url=${encodeURIComponent(callbackUrl)}&api_key=${PLISIO_SECRET_KEY}`);
                         const resData = await response.json();
                         if (resData && resData.status === 'success') {
                            await tgApi('sendMessage', { 
                              chat_id: chatId, parse_mode: 'HTML',
                              text: `💳 <b>Crypto Deposit</b>

Amount: <b>$${amount.toFixed(2)}</b>
Total with 1.5% network fee: <b>$${(amount * 1.015).toFixed(2)}</b>

Click the button below to pay securely via Plisio.`,
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

    // Handle /active command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/active') {
      const chatId = update.message.chat.id;
      const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
      
      if (profile) {
        const { data: pending } = await supabaseAdmin.from('activations').select('*').eq('user_id', profile.id).eq('status', 'PENDING');
        if (!pending || pending.length === 0) {
          await tgApi('sendMessage', { chat_id: chatId, text: 'ℹ️ You have no active numbers waiting for SMS right now.' });
        } else {
          // Next.js requires absolute URL for fetch in API routes
          const headersList = request.headers;
          const host = headersList.get('host') || 'swiftotp.store';
          const protocol = host.includes('localhost') ? 'http' : 'https';
          const baseUrl = `${protocol}://${host}`;
          
          for (const act of pending) {
             const createdTime = new Date(act.created_at).getTime();
             const now = new Date().getTime();
             const elapsedMins = (now - createdTime) / 60000;
             const remainingMins = Math.max(0, 15 - Math.floor(elapsedMins));

             let msg = `⏳ <b>Waiting for SMS...</b>\n\n`;
             msg += `Service: <b>${act.service}</b>\n`;
             msg += `Number: <code>+${act.phone_number}</code>\n`;
             msg += `Cost: <b>$${Number(act.cost).toFixed(2)}</b>\n`;
             msg += `Time Left: <b>${remainingMins} minutes</b> <i>(Auto-refunds at 0)</i>\n`;

             // Ping the centralized status check asynchronously
             fetch(`${baseUrl}/api/vsim/status?id=${act.vsim_activation_id}`).catch(()=>{});
             
             await tgApi('sendMessage', { 
               chat_id: chatId, 
               text: msg, 
               parse_mode: 'HTML',
               reply_markup: {
                 inline_keyboard: [[
                    { text: '❌ Cancel & Refund', callback_data: `cancel_act_${act.vsim_activation_id}` }
                 ]]
               }
             });
          }
        }
      }
      return NextResponse.json({ success: true });
    }

    // 1. Handle regular /buy command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/buy') {
      const chatId = update.message.chat.id;

      // Check if user is linked
      const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
      if (!profile) {
        await tgApi('sendMessage', { 
          chat_id: chatId, 
          text: '❌ <b>Account Not Linked</b>\n\nTo use this command, you need to connect your Telegram account.\n\n<b>Choose an option:</b>\n🔹 Type /create to instantly create a brand new account\n🔹 Type /start to link an existing website account', 
          parse_mode: 'HTML' 
        });
        return NextResponse.json({ success: true });
      }

      // Fetch all unique internal_services that have active routes
      const { data: routes } = await supabaseAdmin.from('routing_rules').select('internal_service');
      const activeServices = Array.from(new Set((routes || []).map(r => r.internal_service))).filter(s => s !== 'gmail');

      if (activeServices.length === 0) {
        await tgApi('sendMessage', { chat_id: chatId, text: '? No active services available right now.' });
        return NextResponse.json({ success: true });
      }

      // Build inline keyboard (2 buttons per row)
      const inline_keyboard = [];
      let row = [];
      for (const svcCode of activeServices) {
        const svcName = getService(svcCode).name;
        row.push({ text: svcName, callback_data: `buy_svc_${svcCode}` });
        if (row.length === 2) {
          inline_keyboard.push(row);
          row = [];
        }
      }
      if (row.length > 0) inline_keyboard.push(row);

      await tgApi('sendMessage', {
        chat_id: chatId,
        text: '🛒 <b>What service do you need?</b>',
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard }
      });
      return NextResponse.json({ success: true });
    }

    // 2. Handle Button Clicks
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const messageId = cb.message.message_id;
      const data = cb.data;

      // Acknowledge the click quickly
      await tgApi('answerCallbackQuery', { callback_query_id: cb.id });

      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('telegram_id', chatId.toString()).single();
      if (!profile) return NextResponse.json({ success: true });

        
        // Block if Banned
        if (profile.is_banned) {
            await tgApi('sendMessage', {
                chat_id: chatId,
                text: '🚫 <b>Account Suspended</b>\n\nYour account has been temporarily blocked for suspicious activity.\n\nIf you believe this is a mistake, please contact support.',
                parse_mode: 'HTML',
                reply_markup: { remove_keyboard: true }
            });
            return NextResponse.json({ success: true });
        }

        // Block if not verified
        if (profile.is_email_verified === false) {
            await tgApi('sendMessage', {
                chat_id: chatId,
                text: `⚠️ <b>Email Not Verified</b>\n\nYou must verify your email address before using the bot.\n\nPlease check your inbox/spam folder.`,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Resend Verification', callback_data: 'resend_verify' }]]
                }
            });
            return NextResponse.json({ success: true });
        }


      // STEP A: Picked a Service -> Show Countries
      if (data.startsWith('buy_svc_')) {
        const svcCode = data.replace('buy_svc_', '');
        const { data: routes } = await supabaseAdmin.from('routing_rules').select('country_id').eq('internal_service', svcCode);
        const activeCountries = Array.from(new Set((routes || []).map(r => r.country_id)));

        const inline_keyboard = [];
        let row = [];
        for (const ctyCode of activeCountries) {
          const cty = getCountry(ctyCode);
          row.push({ text: `${cty.flag} ${cty.name}`, callback_data: `buy_cty_${svcCode}_${ctyCode}` });
          if (row.length === 3) {
            inline_keyboard.push(row);
            row = [];
          }
        }
        if (row.length > 0) inline_keyboard.push(row);
        inline_keyboard.push([{ text: '🔙 Back to Services', callback_data: 'buy_back' }]);

        await tgApi('editMessageText', {
          chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
          text: `🛒 <b>Select a country for ${getService(svcCode).name}:</b>`,
          reply_markup: { inline_keyboard }
        });
      }

            // STEP B: Picked a Country -> Show exact routes/tiers
      else if (data.startsWith('buy_cty_')) {
        const parts = data.replace('buy_cty_', '').split('_');
        const svcCode = parts[0];
        const ctyCode = parts[1];

        const { data: routes } = await supabaseAdmin
          .from('routing_rules')
          .select('*')
          .eq('internal_service', svcCode)
          .eq('country_id', ctyCode)
          .order('cached_wholesale_cost', { ascending: true });

        const inline_keyboard = [];
        const PROFIT_MARGIN = 0.012;

        const premiumRules = (routes || []).filter(r => r.tier === 'premium');
        const standardRules = (routes || []).filter(r => r.tier === 'standard');
        const getLetter = (index: number) => String.fromCharCode(65 + index);

        const processRule = (rule: any, index: number) => {
          let wholesaleCost = Number(rule.cached_wholesale_cost);
          if (ctyCode === '12' && rule.target_api === 'vsim' && rule.target_service_code === 'lvbv') {
             if (wholesaleCost < 0.188) wholesaleCost = 0.188;
          }
          const retailCost = wholesaleCost + PROFIT_MARGIN;
          const tierLabel = rule.tier === 'premium' ? '💎 High-Priority' : '⭐ Standard';
          const buttonText = `${tierLabel} (Server ${getLetter(index)}) - $${formatMoney(retailCost)}`;
          return [{ text: buttonText, callback_data: `buy_rt_${rule.id}` }];
        };

        premiumRules.forEach((rule, i) => inline_keyboard.push(processRule(rule, i)));
        standardRules.forEach((rule, i) => inline_keyboard.push(processRule(rule, i)));

        inline_keyboard.push([{ text: '🔙 Back to Countries', callback_data: `buy_svc_${svcCode}` }]);

        await tgApi('editMessageText', {
          chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
          text: `🛒 <b>Available routes for ${getService(svcCode).name} (${getCountry(ctyCode).flag} ${getCountry(ctyCode).name}):</b>\n\nChoose your quality tier:`,
          reply_markup: { inline_keyboard }
        });
      }


      // Handle Check OTP Button
      else if (data.startsWith('check_otp_')) {
        const fullActId = data.replace('check_otp_', '');
        const host = request.headers.get('host') || 'swiftotp.store';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        fetch(`${protocol}://${host}/api/vsim/status?id=${fullActId}`).catch(()=>{});
        await tgApi('answerCallbackQuery', { callback_query_id: update.callback_query.id, text: '⏳ Checking for SMS...', show_alert: false });
      }
      

      // Handle Deposit Action
      else if (data === 'deposit_custom') {
         await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '📝 <b>Custom Deposit</b>\n\nTo deposit a custom amount, simply type the command followed by the amount.\n\nExample: <code>/deposit 15.50</code>', parse_mode: 'HTML' });
      }
      else if (data.startsWith('deposit_')) {
         const amountStr = data.replace('deposit_', '');
         const amount = Number(amountStr);
         const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
         if (!profile) return NextResponse.json({ success: true });

        
        // Block if Banned
        if (profile.is_banned) {
            await tgApi('sendMessage', {
                chat_id: chatId,
                text: '🚫 <b>Account Suspended</b>\n\nYour account has been temporarily blocked for suspicious activity.\n\nIf you believe this is a mistake, please contact support.',
                parse_mode: 'HTML',
                reply_markup: { remove_keyboard: true }
            });
            return NextResponse.json({ success: true });
        }

        // Block if not verified
        if (profile.is_email_verified === false) {
            await tgApi('sendMessage', {
                chat_id: chatId,
                text: `⚠️ <b>Email Not Verified</b>\n\nYou must verify your email address before using the bot.\n\nPlease check your inbox/spam folder.`,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Resend Verification', callback_data: 'resend_verify' }]]
                }
            });
            return NextResponse.json({ success: true });
        }


         await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '⏳ Generating secure crypto invoice...' });

         const { data: deposit, error: dbError } = await supabaseAdmin
          .from('deposits')
          .insert({ user_id: profile.id, amount: amount, status: 'PENDING' })
          .select('id').single();

         if (!deposit) {
            await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '❌ Failed to initialize deposit.' });
            return NextResponse.json({ success: true });
         }

         const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;
         const PLISIO_API_URL = 'https://api.plisio.net/api/v1';
         
         const host = request.headers.get('host') || 'swiftotp.store';
         const protocol = host.includes('localhost') ? 'http' : 'https';
         const callbackUrl = `${protocol}://${host}/api/webhooks/plisio?json=true`;
         
         const multiplier = 1.015 / 1.01; 

         try {
             const response = await axios.get(`${PLISIO_API_URL}/invoices/new`, {
               params: {
                 source_currency: 'USD',
                 source_amount: (amount * multiplier).toFixed(4), 
                 order_name: 'Wallet Top-Up',
                 order_number: deposit.id,
                 callback_url: callbackUrl,
                 api_key: PLISIO_SECRET_KEY
               }
             });

             if (response.data && response.data.status === 'success') {
                const invoice_url = response.data.data.invoice_url;
                await tgApi('editMessageText', { 
                  chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
                  text: `💳 <b>Crypto Deposit</b>\n\nAmount: <b>${amount.toFixed(2)}</b>\nTotal with 1.5% network fee: <b>${(amount * 1.015).toFixed(2)}</b>\n\nClick the button below to pay securely via Plisio.`,
                  reply_markup: {
                      inline_keyboard: [[ { text: `🔗 Pay ${(amount * 1.015).toFixed(2)} via Plisio`, url: invoice_url } ]]
                  }
                });
             } else {
                await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '❌ Failed to generate crypto invoice from gateway.' });
             }
         } catch(e: any) {
             await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: `❌ Invoice Error: ${e.message}` });
         }
      }


      // Handle Deposit Action
      else if (data === 'deposit_custom') {
         await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '📝 <b>Custom Deposit</b>\n\nTo deposit a custom amount, simply type the command followed by the amount.\n\nExample: <code>/deposit 15.50</code>', parse_mode: 'HTML' });
      }
      else if (data.startsWith('deposit_')) {
         const amountStr = data.replace('deposit_', '');
         const amount = Number(amountStr);
         const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
         if (!profile) return NextResponse.json({ success: true });

        
        // Block if Banned
        if (profile.is_banned) {
            await tgApi('sendMessage', {
                chat_id: chatId,
                text: '🚫 <b>Account Suspended</b>\n\nYour account has been temporarily blocked for suspicious activity.\n\nIf you believe this is a mistake, please contact support.',
                parse_mode: 'HTML',
                reply_markup: { remove_keyboard: true }
            });
            return NextResponse.json({ success: true });
        }

        // Block if not verified
        if (profile.is_email_verified === false) {
            await tgApi('sendMessage', {
                chat_id: chatId,
                text: `⚠️ <b>Email Not Verified</b>\n\nYou must verify your email address before using the bot.\n\nPlease check your inbox/spam folder.`,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Resend Verification', callback_data: 'resend_verify' }]]
                }
            });
            return NextResponse.json({ success: true });
        }


         await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '⏳ Generating secure crypto invoice...' });

         const { data: deposit, error: dbError } = await supabaseAdmin
          .from('deposits')
          .insert({ user_id: profile.id, amount: amount, status: 'PENDING' })
          .select('id').single();

         if (!deposit) {
            await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '❌ Failed to initialize deposit.' });
            return NextResponse.json({ success: true });
         }

         const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;
         const PLISIO_API_URL = 'https://api.plisio.net/api/v1';
         
         const host = request.headers.get('host') || 'swiftotp.store';
         const protocol = host.includes('localhost') ? 'http' : 'https';
         const callbackUrl = `${protocol}://${host}/api/webhooks/plisio?json=true`;
         
         const multiplier = 1.015 / 1.01; 

         try {
             // using global fetch instead of axios for Edge runtime
             const response = await fetch(`${PLISIO_API_URL}/invoices/new?source_currency=USD&source_amount=${(amount * multiplier).toFixed(4)}&order_name=Wallet%20Top-Up&order_number=${deposit.id}&callback_url=${encodeURIComponent(callbackUrl)}&api_key=${PLISIO_SECRET_KEY}`);
             const resData = await response.json();

             if (resData && resData.status === 'success') {
                const invoice_url = resData.data.invoice_url;
                await tgApi('editMessageText', { 
                  chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
                  text: `💳 <b>Crypto Deposit</b>\n\nAmount: <b>$${amount.toFixed(2)}</b>\nTotal with 1.5% network fee: <b>$${(amount * 1.015).toFixed(2)}</b>\n\nClick the button below to pay securely via Plisio.`,
                  reply_markup: {
                      inline_keyboard: [[ { text: `🔗 Pay $${(amount * 1.015).toFixed(2)} via Plisio`, url: invoice_url } ]]
                  }
                });
             } else {
                await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '❌ Failed to generate crypto invoice from gateway.' });
             }
         } catch(e: any) {
             await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: `❌ Invoice Error: ${e.message}` });
         }
      }

      // Handle Cancel Action Button
      else if (data.startsWith('cancel_act_')) {
        const fullActId = data.replace('cancel_act_', '');
        const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
        if (!profile) return NextResponse.json({ success: true });

        
        // Block if Banned
        if (profile.is_banned) {
            await tgApi('sendMessage', {
                chat_id: chatId,
                text: '🚫 <b>Account Suspended</b>\n\nYour account has been temporarily blocked for suspicious activity.\n\nIf you believe this is a mistake, please contact support.',
                parse_mode: 'HTML',
                reply_markup: { remove_keyboard: true }
            });
            return NextResponse.json({ success: true });
        }

        // Block if not verified
        if (profile.is_email_verified === false) {
            await tgApi('sendMessage', {
                chat_id: chatId,
                text: `⚠️ <b>Email Not Verified</b>\n\nYou must verify your email address before using the bot.\n\nPlease check your inbox/spam folder.`,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Resend Verification', callback_data: 'resend_verify' }]]
                }
            });
            return NextResponse.json({ success: true });
        }


        const { data: activation } = await supabaseAdmin.from('activations').select('cost, status, phone_number').eq('vsim_activation_id', fullActId).eq('user_id', profile.id).single();
        
        if (!activation || activation.status !== 'PENDING') {
           await tgApi('answerCallbackQuery', { callback_query_id: update.callback_query.id, text: '❌ Number is no longer active.', show_alert: true });
           return NextResponse.json({ success: true });
        }
        
        await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '⏳ Cancelling and refunding securely...' });

        const parts = fullActId.split('::');
        const source = parts.length > 1 ? parts[0] : 'vsim';
        const realId = parts.length > 1 ? parts[1] : fullActId;
        const TARGET_API_URL = source === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
        const TARGET_API_KEY = source === 'smsbower' ? SMSBOWER_API_KEY : VSIM_API_KEY;

        try {
            const res = await fetch(`${TARGET_API_URL}?api_key=${TARGET_API_KEY}&action=setStatus&id=${realId}&status=8`);
            const result = await res.text();
            
            if (result === 'ACCESS_CANCEL' || result === 'ACCESS_CANCEL_ALREADY' || result === 'BAD_STATUS' || result === 'NO_ACTIVATION' || result === 'ACCESS_APPROVED') {
                const { data: updatedAct } = await supabaseAdmin.from('activations').update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() }).eq('vsim_activation_id', fullActId).eq('status', 'PENDING').select();
                if (updatedAct && updatedAct.length > 0) {
                    await supabaseAdmin.rpc('refund_balance', { p_user_id: profile.id, p_amount: Number(activation.cost) });
                    
                    // Add a Hoarder Strike using the new Probability Engine!
                    await supabaseAdmin.rpc('handle_hoarder_strike', { p_user_id: profile.id, p_activation_id: fullActId });
                    
                    await tgApi('editMessageText', { 
                      chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
                      text: `✅ <b>Number Cancelled</b>\n\nNumber: <code>+${activation.phone_number}</code>\nRefunded: <b>$${Number(activation.cost).toFixed(2)}</b>`
                    });
                } else {
                    await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: '❌ Cancellation conflict.' });
                }
            } else {
                await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: `❌ Failed to cancel at provider: ${result}` });
            }
        } catch (e: any) {
            await tgApi('editMessageText', { chat_id: chatId, message_id: messageId, text: `❌ Cancellation error: ${e.message}` });
        }
      }

      // STEP C: Confirm Purchase
      else if (data.startsWith('buy_rt_')) {
        const ruleId = data.replace('buy_rt_', '');
        
        await tgApi('editMessageText', {
          chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
          text: `⏳ <b>Processing your purchase securely...</b>`
        });

        const { data: rule } = await supabaseAdmin.from('routing_rules').select('*').eq('id', ruleId).single();
        if (!rule) {
           await tgApi('sendMessage', { chat_id: chatId, text: '❌ This route is no longer available.' });
           return NextResponse.json({ success: true });
        }

        const PROFIT_MARGIN = 0.012;
        const userBalance = Number(profile.balance);

        if (userBalance <= PROFIT_MARGIN) {
           await tgApi('sendMessage', { chat_id: chatId, text: `❌ Your wallet balance is insufficient.` });
           return NextResponse.json({ success: true });
        }

        const TARGET_API_URL = rule.target_api === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
        const TARGET_API_KEY = rule.target_api === 'smsbower' ? SMSBOWER_API_KEY : VSIM_API_KEY;

        try {
          const apiParams: any = {
            api_key: TARGET_API_KEY,
            action: 'getNumberV2',
            service: rule.target_service_code || rule.internal_service,
            country: rule.country_id
          };
          if (rule.target_operator) apiParams.operator = rule.target_operator;
          if (rule.target_provider) apiParams.providerIds = rule.target_provider;
          
          const res = await axios.get(TARGET_API_URL, { params: apiParams, validateStatus: (s) => s < 500 });
          const resData = res.data;
          
          // 1. EXACT match with frontend success condition
          if (resData && resData.success !== false && (resData.activationId || resData.success === true)) {
            
            // 2. LIVE Pricing!
            const wholesaleCost = Number(resData.activationCost);
            const actId = resData.activationId || resData.id;
            
            if (isNaN(wholesaleCost) || wholesaleCost <= 0) {
              await axios.get(TARGET_API_URL, { params: { api_key: TARGET_API_KEY, action: 'setStatus', id: actId, status: 8 }});
              await tgApi('sendMessage', { chat_id: chatId, text: '❌ Provider failed to return a price. Order cancelled.' });
              return NextResponse.json({ success: true });
            }

            let retailCost = Number((wholesaleCost + PROFIT_MARGIN).toPrecision(12));
            
            // 3. EXACT match with GV Floor check
            if (rule.country_id === '12' && rule.target_api === 'vsim' && rule.target_service_code === 'lvbv') {
               if (retailCost < 0.20) retailCost = 0.20;
            }

            // 4. Final Balance sanity check based on LIVE pricing
            if (retailCost > userBalance) {
               await axios.get(TARGET_API_URL, { params: { api_key: TARGET_API_KEY, action: 'setStatus', id: actId, status: 8 }});
               await tgApi('sendMessage', { chat_id: chatId, text: `❌ Insufficient balance for this specific number route. You need $${formatMoney(retailCost)}` });
               return NextResponse.json({ success: true });
            }

            const phone = resData.phoneNumber || resData.phone;
            
            if (!actId || !phone) {
               await tgApi('sendMessage', { chat_id: chatId, text: '❌ Provider returned invalid data. Cancelled.' });
               return NextResponse.json({ success: true });
            }

            // 5. ATOMIC SQL Deduct
            const { error: balErr } = await supabaseAdmin.rpc('deduct_balance', {
              p_user_id: profile.id,
              p_amount: retailCost
            });

            if (balErr) {
               await axios.get(TARGET_API_URL, { params: { api_key: TARGET_API_KEY, action: 'setStatus', id: actId, status: 8 }});
               await tgApi('sendMessage', { chat_id: chatId, text: '❌ Insufficient balance (concurrency check). Order cancelled.' });
               return NextResponse.json({ success: true });
            }

            await supabaseAdmin.from('activations').insert({
              user_id: profile.id,
              vsim_activation_id: `${rule.target_api}::${actId}`,
              country: rule.country_id,
              service: rule.internal_service,
              phone_number: phone.toString(),
              cost: retailCost,
              status: 'PENDING'
            });

            await tgApi('sendMessage', { 
              chat_id: chatId, parse_mode: 'HTML',
              text: `✅ <b>Number Purchased!</b>\n\nService: ${getService(rule.internal_service).name}\nTier: ${rule.tier === 'premium' ? '💎 High-Priority' : '⭐ Standard'}\nNumber: <code>+${phone}</code>\nCost: $${formatMoney(retailCost)}\n\n⏳ <i>Waiting for SMS code...</i>`,
              reply_markup: {
                  inline_keyboard: [[
                      { text: '🔄 Check OTP', callback_data: `check_otp_${rule.target_api}::${actId}` }, { text: '❌ Cancel', callback_data: `cancel_act_${rule.target_api}::${actId}` }
                  ]]
              }
            });
          } else {
             await tgApi('sendMessage', { chat_id: chatId, text: `❌ Out of stock for this specific tier. Please try a different route.` });
          }
        } catch (e: any) {
           await tgApi('sendMessage', { chat_id: chatId, text: `❌ Provider API Error: ${e.message} (Status: ${e.response?.status})` });
        }
      }

      // STEP D: Back button
      else if (data === 'buy_back') {
         const { data: routes } = await supabaseAdmin.from('routing_rules').select('internal_service');
         const activeServices = Array.from(new Set((routes || []).map(r => r.internal_service)));
         const inline_keyboard = [];
         let row = [];
         for (const svcCode of activeServices) {
           const svcName = getService(svcCode).name;
           row.push({ text: svcName, callback_data: `buy_svc_${svcCode}` });
           if (row.length === 2) { inline_keyboard.push(row); row = []; }
         }
         if (row.length > 0) inline_keyboard.push(row);

         await tgApi('editMessageText', {
           chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
           text: '🛒 <b>What service do you need?</b>',
           reply_markup: { inline_keyboard }
         });
      }
    }


    // Fallback for unknown text/intents
    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const { data: profile } = await supabaseAdmin.from('profiles').select('id, is_email_verified, last_resend_at, is_banned').eq('telegram_id', chatId.toString()).single();
        
        if (!profile) {
            await tgApi('sendMessage', { 
                chat_id: chatId, 
                parse_mode: 'HTML',
                text: '👋 <b>Hello there!</b>\n\nIt looks like you haven\'t connected a SwiftOTP account to this chat yet.\n\n<b>To get started, choose an option:</b>\n🔹 Type /create to instantly create a brand new account\n🔹 Type /start to link an existing website account'
            });
        } else {
            await tgApi('sendMessage', { 
                chat_id: chatId, 
                parse_mode: 'HTML',
                text: `🤔 I didn't quite catch that.\n\nOpen the Menu to see available commands, or type <code>/buy</code> to purchase a new number!`
            });
        }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
