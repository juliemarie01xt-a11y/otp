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
    const authHeader = request.headers.get('x-telegram-bot-token');
    if (!BOT_TOKEN || authHeader !== BOT_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update = await request.json();

    
    // Handle /unlink command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/unlink') {
      const chatId = update.message.chat.id;

      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
      if (!profile) {
        await tgApi('sendMessage', { chat_id: chatId, text: '❌ Your account is not currently linked.' });
        return NextResponse.json({ success: true });
      }

      await supabaseAdmin.from('profiles').update({ telegram_id: null }).eq('id', profile.id);
      await tgApi('sendMessage', { chat_id: chatId, text: '🔌 Your account has been securely disconnected from the Telegram Bot.' });
      return NextResponse.json({ success: true });
    }


    // Handle /active command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/active') {
      const chatId = update.message.chat.id;
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
      
      if (profile) {
        const { data: pending } = await supabaseAdmin.from('activations').select('*').eq('user_id', profile.id).eq('status', 'PENDING');
        if (!pending || pending.length === 0) {
          await tgApi('sendMessage', { chat_id: chatId, text: 'ℹ️ You have no active numbers waiting for SMS right now.' });
        } else {
          let msg = `⏳ <b>Your Active Numbers:</b>\n\n`;
          
          // Next.js requires absolute URL for fetch in API routes
          const headersList = request.headers;
          const host = headersList.get('host') || 'otp-three-liard.vercel.app';
          const protocol = host.includes('localhost') ? 'http' : 'https';
          const baseUrl = `${protocol}://${host}`;
          
          for (const act of pending) {
             msg += `Service: <b>${act.service}</b>\nNumber: <code>${act.phone_number}</code>\nCost: ${Number(act.cost).toFixed(2)}\n\n`;
             // Ping the centralized status check asynchronously
             fetch(`${baseUrl}/api/vsim/status?id=${act.vsim_activation_id}`).catch(()=>{});
          }
          await tgApi('sendMessage', { chat_id: chatId, text: msg, parse_mode: 'HTML' });
        }
      }
      return NextResponse.json({ success: true });
    }

    // 1. Handle regular /buy command
    if (update.message && update.message.text && update.message.text.trim().toLowerCase() === '/buy') {
      const chatId = update.message.chat.id;

      // Check if user is linked
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
      if (!profile) {
        await tgApi('sendMessage', { chat_id: chatId, text: '? Your account is not linked. Please link it on the website first.', parse_mode: 'HTML' });
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
        const host = request.headers.get('host') || 'otp-three-liard.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        fetch(`${protocol}://${host}/api/vsim/status?id=${fullActId}`).catch(()=>{});
        await tgApi('answerCallbackQuery', { callback_query_id: update.callback_query.id, text: '⏳ Checking for SMS...', show_alert: false });
      }
      
      // Handle Cancel Action Button
      else if (data.startsWith('cancel_act_')) {
        const fullActId = data.replace('cancel_act_', '');
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('telegram_id', chatId.toString()).single();
        if (!profile) return NextResponse.json({ success: true });

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
                const { data: updatedAct } = await supabaseAdmin.from('activations').update({ status: 'CANCELLED' }).eq('vsim_activation_id', fullActId).eq('status', 'PENDING').select();
                if (updatedAct && updatedAct.length > 0) {
                    await supabaseAdmin.rpc('refund_balance', { p_user_id: profile.id, p_amount: Number(activation.cost) });
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
