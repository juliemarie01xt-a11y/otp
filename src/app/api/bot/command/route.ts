import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import axios from 'axios';
import { POPULAR_SERVICES } from '@/lib/constants';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VSIM_API_URL = 'https://vsim.space/api/api.php';
const VSIM_API_KEY = process.env.VSIM_API_KEY;
const SMSBOWER_API_URL = 'https://smsbower.com/stubs/handler_api.php';
const SMSBOWER_API_KEY = process.env.SMSBOWER_API_KEY;

// Very basic mapping for telegram text to codes
const COUNTRY_MAP: Record<string, string> = {
  'usa': '12', 'us': '12', 'united states': '12',
  'uk': '16', 'united kingdom': '16', 'england': '16',
  'canada': '36', 'ca': '36',
  'india': '22', 'in': '22'
};

const SERVICE_MAP: Record<string, string> = {
  'google': 'go', 'gmail': 'go', 'youtube': 'go',
  'whatsapp': 'wa', 'wa': 'wa',
  'telegram': 'tg', 'tg': 'tg',
  'instagram': 'ig', 'ig': 'ig',
  'facebook': 'fb', 'fb': 'fb'
};

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-telegram-bot-token');
    if (!BOT_TOKEN || authHeader !== BOT_TOKEN) {
      return NextResponse.json({ text: 'Unauthorized. Invalid Bot Token.' }, { status: 401 });
    }

    const { telegramId, command, args } = await request.json();

    // Find User by Telegram ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (!profile) {
      return NextResponse.json({ text: '? Your account is not linked. Please link it on the website first.' });
    }

    // Command: BUY
    if (command === 'buy') {
      if (args.length < 2) {
        return NextResponse.json({ text: '? Invalid format. Use: /buy <service> <country>\nExample: /buy google usa' });
      }

      const serviceStr = args[0].toLowerCase();
      const countryStr = args[1].toLowerCase();

      const serviceCode = SERVICE_MAP[serviceStr];
      const countryCode = COUNTRY_MAP[countryStr];

      if (!serviceCode || !countryCode) {
        return NextResponse.json({ text: `? Unknown service or country.\nTry: /buy google usa\nSupported services: google, whatsapp, telegram, instagram, facebook\nSupported countries: usa, uk, canada, india` });
      }

      // Find the cheapest active route for this combination
      const { data: routes, error: routeErr } = await supabaseAdmin
        .from('routing_rules')
        .select('*')
        .eq('internal_service', serviceCode)
        .eq('country_id', countryCode)
        .order('cached_wholesale_cost', { ascending: true });

      if (!routes || routes.length === 0) {
        return NextResponse.json({ text: '? No active routes found for this service and country. They might be out of stock.' });
      }

      // Check balance
      const PROFIT_MARGIN = 0.012;
      const userBalance = Number(profile.balance);

      if (userBalance <= PROFIT_MARGIN) {
        return NextResponse.json({ text: '? Your wallet balance is insufficient for this transaction. Please /deposit' });
      }

      let lastError = 'Out of stock';

      for (const rule of routes) {
        const TARGET_API_URL = rule.target_api === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
        const TARGET_API_KEY = rule.target_api === 'smsbower' ? SMSBOWER_API_KEY : VSIM_API_KEY;
        const API_SERVICE = rule.target_service_code || serviceCode;

        try {
          const res = await axios.get(TARGET_API_URL, {
            params: {
              api_key: TARGET_API_KEY,
              action: 'getNumber',
              service: API_SERVICE,
              country: countryCode,
              operator: rule.target_operator || 'any'
            }
          });

          const data = res.data;
          
          if (data && data.phone && data.activationId) {
            let wholesaleCost = Number(data.activationCost);
            if (rule.target_api === 'vsim' && countryCode === '12' && serviceCode === 'go') {
                if (wholesaleCost < 0.188) wholesaleCost = 0.188;
            }
            const retailCost = Number((wholesaleCost + PROFIT_MARGIN).toFixed(3));

            if (userBalance < retailCost) {
              await axios.get(TARGET_API_URL, { params: { api_key: TARGET_API_KEY, action: 'setStatus', id: data.activationId, status: 8 }});
              return NextResponse.json({ text: '? Insufficient balance for this specific number route.' });
            }

            const { data: balRes, error: balErr } = await supabaseAdmin.rpc('deduct_balance', {
              user_id: profile.id,
              amount: retailCost
            });

            if (balErr) {
               await axios.get(TARGET_API_URL, { params: { api_key: TARGET_API_KEY, action: 'setStatus', id: data.activationId, status: 8 }});
               return NextResponse.json({ text: '? Failed to process payment securely. Order cancelled.' });
            }

            await supabaseAdmin.from('activations').insert({
              user_id: profile.id,
              vsim_activation_id: `${rule.target_api}::${data.activationId}`,
              country: countryCode,
              service: serviceCode,
              phone_number: data.phone.toString(),
              cost: retailCost,
              status: 'PENDING'
            });

            return NextResponse.json({ 
              text: `? <b>Number Purchased!</b>\n\nService: ${serviceStr.toUpperCase()}\nCountry: ${countryStr.toUpperCase()}\nNumber: <code>+${data.phone}</code>\nCost: $${retailCost.toFixed(2)}\n\n? Waiting for SMS code... (I will message you instantly when it arrives!)`,
              activationId: data.activationId 
            });
          } else {
             lastError = data.error || 'Out of stock';
          }
        } catch (e: any) {
           lastError = 'API Error';
        }
      }

      return NextResponse.json({ text: `? All routes for ${serviceStr.toUpperCase()} in ${countryStr.toUpperCase()} are currently out of stock. Please try again later!` });
    }

    // Unknown Command
    return NextResponse.json({ text: '? Unknown core command forwarded.' });

  } catch (error: any) {
    return NextResponse.json({ text: `? Internal Server Error: ${error.message}` });
  }
}
