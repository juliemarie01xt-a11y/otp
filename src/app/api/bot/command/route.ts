import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import axios from 'axios';
import { POPULAR_SERVICES, POPULAR_COUNTRIES, getService, getCountry } from '@/lib/constants';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const VSIM_API_URL = 'https://vsim.space/api/api.php';
const VSIM_API_KEY = process.env.VSIM_API_KEY;
const SMSBOWER_API_URL = 'https://smsbower.com/stubs/handler_api.php';
const SMSBOWER_API_KEY = process.env.SMSBOWER_API_KEY;

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
      const activeServices = Array.from(new Set((routes || []).map(r => r.internal_service)));

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
        text: '?? <b>What service do you need?</b>',
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
          row.push({ text: `${cty.short}`, callback_data: `buy_cty_${svcCode}_${ctyCode}` });
          if (row.length === 3) {
            inline_keyboard.push(row);
            row = [];
          }
        }
        if (row.length > 0) inline_keyboard.push(row);
        inline_keyboard.push([{ text: '?? Back to Services', callback_data: 'buy_back' }]);

        await tgApi('editMessageText', {
          chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
          text: `?? <b>Select a country for ${getService(svcCode).name}:</b>`,
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

        (routes || []).forEach(rule => {
          let wholesaleCost = Number(rule.cached_wholesale_cost);
          if (rule.target_api === 'vsim' && ctyCode === '12' && svcCode === 'go') {
             if (wholesaleCost < 0.188) wholesaleCost = 0.188;
          }
          const retailCost = (wholesaleCost + PROFIT_MARGIN).toFixed(3);
          const tierLabel = rule.tier === 'premium' ? '?? Premium' : '? Standard';
          const buttonText = `${tierLabel} - $${retailCost}`;
          
          // buy_rt_<rule_id> (UUID is 36 chars, fits in 64 bytes)
          inline_keyboard.push([{ text: buttonText, callback_data: `buy_rt_${rule.id}` }]);
        });

        inline_keyboard.push([{ text: '?? Back to Countries', callback_data: `buy_svc_${svcCode}` }]);

        await tgApi('editMessageText', {
          chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
          text: `?? <b>Available routes for ${getService(svcCode).name} (${getCountry(ctyCode).short}):</b>

Choose your quality tier:`,
          reply_markup: { inline_keyboard }
        });
      }

      // STEP C: Confirm Purchase
      else if (data.startsWith('buy_rt_')) {
        const ruleId = data.replace('buy_rt_', '');
        
        await tgApi('editMessageText', {
          chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
          text: `? <b>Processing your purchase securely...</b>`
        });

        const { data: rule } = await supabaseAdmin.from('routing_rules').select('*').eq('id', ruleId).single();
        if (!rule) {
           await tgApi('sendMessage', { chat_id: chatId, text: '? This route is no longer available.' });
           return NextResponse.json({ success: true });
        }

        const PROFIT_MARGIN = 0.012;
        let wholesaleCost = Number(rule.cached_wholesale_cost);
        if (rule.target_api === 'vsim' && rule.country_id === '12' && rule.internal_service === 'go') {
            if (wholesaleCost < 0.188) wholesaleCost = 0.188;
        }
        const retailCost = Number((wholesaleCost + PROFIT_MARGIN).toFixed(3));

        if (Number(profile.balance) < retailCost) {
           await tgApi('sendMessage', { chat_id: chatId, text: `? Insufficient balance. You need $${retailCost.toFixed(2)}` });
           return NextResponse.json({ success: true });
        }

        const TARGET_API_URL = rule.target_api === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
        const TARGET_API_KEY = rule.target_api === 'smsbower' ? SMSBOWER_API_KEY : VSIM_API_KEY;
        const API_SERVICE = rule.target_service_code || rule.internal_service;

        try {
          const res = await axios.get(TARGET_API_URL, {
            params: {
              api_key: TARGET_API_KEY,
              action: 'getNumber',
              service: API_SERVICE,
              country: rule.country_id,
              operator: rule.target_operator || 'any'
            }
          });

          const resData = res.data;
          
          if (resData && resData.phone && resData.activationId) {
            const { error: balErr } = await supabaseAdmin.rpc('deduct_balance', {
              user_id: profile.id,
              amount: retailCost
            });

            if (balErr) {
               await axios.get(TARGET_API_URL, { params: { api_key: TARGET_API_KEY, action: 'setStatus', id: resData.activationId, status: 8 }});
               await tgApi('sendMessage', { chat_id: chatId, text: '? Failed to process payment securely. Order cancelled.' });
               return NextResponse.json({ success: true });
            }

            await supabaseAdmin.from('activations').insert({
              user_id: profile.id,
              vsim_activation_id: `${rule.target_api}::${resData.activationId}`,
              country: rule.country_id,
              service: rule.internal_service,
              phone_number: resData.phone.toString(),
              cost: retailCost,
              status: 'PENDING'
            });

            await tgApi('sendMessage', { 
              chat_id: chatId, parse_mode: 'HTML',
              text: `? <b>Number Purchased!</b>

Service: ${getService(rule.internal_service).name}
Tier: ${rule.tier === 'premium' ? '?? Premium' : '? Standard'}
Number: <code>+${resData.phone}</code>
Cost: $${retailCost.toFixed(2)}

? <i>Waiting for SMS code...</i>`
            });
          } else {
             await tgApi('sendMessage', { chat_id: chatId, text: `? Out of stock for this specific tier. Please try a different route.` });
          }
        } catch (e: any) {
           await tgApi('sendMessage', { chat_id: chatId, text: `? Provider API Error: ${e.message} (Status: ${e.response?.status})` });
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
           text: '?? <b>What service do you need?</b>',
           reply_markup: { inline_keyboard }
         });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
