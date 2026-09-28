import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUserId } from '@/lib/auth';

const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';

export async function POST(request: Request) {
  try {
    // VERIFY AUTH — extract userId from JWT, never trust the body
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, service, maxPrice, rule_id } = await request.json();

    if (!country || !service) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!rule_id) {
      return NextResponse.json({ error: 'Missing rule_id' }, { status: 400 });
    }

    // 1. Get the specific rule selected by the user
    const { data: rule, error: rulesError } = await supabaseAdmin
      .from('routing_rules')
      .select('*')
      .eq('id', rule_id)
      .single();

    if (rulesError || !rule) {
      return NextResponse.json({ error: 'This route is no longer available. Please refresh prices.' }, { status: 404 });
    }
    
    // We put it in an array to keep the rest of the code structure the same, but it only iterates once.
    const rules = [rule];

    // 2. Check User's Wallet Balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to retrieve wallet balance' }, { status: 500 });
    }

    const PROFIT_MARGIN = 0.012;

    const userBalance = Number(profile.balance);

    // LAYER 1 PROTECTION (Instant Block):
    // Check if the user has enough balance for the scanned retail price BEFORE we even touch the telecom APIs.
    if (maxPrice && userBalance < Number(maxPrice)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Your wallet balance is insufficient for this transaction.' 
      }, { status: 402 });
    }

    // Absolute minimum check just in case maxPrice wasn't provided
    if (userBalance <= PROFIT_MARGIN) {
      return NextResponse.json({ success: false, error: 'Your wallet balance is insufficient for this transaction.' }, { status: 402 });
    }

    // Prepare safe fallback limit check (but DO NOT send maxPrice to the API)
    // The user's frontend selected a specific route, we just let the API give us the number naturally.
    
    let lastError = 'Failed to allocate (Out of stock)';

    // 3. Fallback Engine Loop
    for (const rule of rules) {
      const TARGET_API_URL = rule.target_api === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
      const TARGET_API_KEY = rule.target_api === 'smsbower' ? process.env.SMSBOWER_API_KEY : process.env.VSIM_API_KEY;

      if (!TARGET_API_KEY) continue;

      const apiParams: any = {
        api_key: TARGET_API_KEY,
        action: 'getNumberV2',
        country: rule.country_id,
        service: rule.target_service_code
      };
      
      if (rule.target_operator) apiParams.operator = rule.target_operator;
      if (rule.target_provider) apiParams.providerIds = rule.target_provider;

      try {
        const response = await axios.get(TARGET_API_URL, { params: apiParams, validateStatus: (s) => s < 500 });
        const data = response.data;
        
        // If success!
        if (data && data.success !== false && (data.activationId || data.success === true)) {
          // SECURE BILLING (Fix for Price Spoofing):
          // Never trust the frontend's maxPrice. We get the actual wholesale cost from the telecom provider directly.
          const wholesaleCost = Number(data.activationCost);
          
          if (isNaN(wholesaleCost) || wholesaleCost <= 0) {
            // Provider failed to return a price. We cannot safely bill this! Cancel instantly.
            await axios.get(TARGET_API_URL, { params: { api_key: TARGET_API_KEY, action: 'setStatus', id: data.activationId || data.id, status: 8 }});
            lastError = 'Provider API Error: No cost returned. Order cancelled to protect balance.';
            continue;
          }

          let retailCost = Number((wholesaleCost + PROFIT_MARGIN).toPrecision(12));
          
          // HARDCODE: VSIMPRO Google Voice (USA) Minimum Floor Price is $0.20
          if (country === '12' && rule.target_api === 'vsim' && rule.target_service_code === 'lvbv') {
             if (retailCost < 0.20) {
                 retailCost = 0.20;
             }
          }

          const actId = data.activationId || data.id;

          // UX SAFEGUARD: Protect the user from Telecom price spikes!
          // If the live telecom price spiked higher than what the user saw on their screen, cancel it instantly.
          if (maxPrice && retailCost > (Number(maxPrice) + 0.0001)) {
             await axios.get(TARGET_API_URL, { params: { api_key: TARGET_API_KEY, action: 'setStatus', id: actId, status: 8 }});
             lastError = `Price changed! The route now costs $${retailCost}. Order cancelled to protect your wallet. Please refresh prices.`;
             continue;
          }

          // SAFEGUARD: Final sanity check before deducting
          if (retailCost > userBalance) {
             await axios.get(TARGET_API_URL, { params: { api_key: TARGET_API_KEY, action: 'setStatus', id: actId, status: 8 }});
             lastError = 'Your wallet balance is insufficient for this transaction.';
             continue;
          }

          const phone = data.phoneNumber || data.phone;
          const countryStr = country;
          const serviceStr = service;

          // ATOMIC DEDUCTION (Fix for Race Condition):
          // We use the SQL RPC to deduct the balance securely inside Postgres.
          const { data: newBalance, error: rpcError } = await supabaseAdmin.rpc('deduct_balance', {
            p_user_id: userId,
            p_amount: retailCost
          });

          if (rpcError) {
             // The SQL function threw 'Insufficient balance' (or another error) due to concurrent spam clicks.
             // We MUST cancel the telecom number we just generated to get our money back!
             await axios.get(TARGET_API_URL, { params: { api_key: TARGET_API_KEY, action: 'setStatus', id: actId, status: 8 }});
             lastError = 'Insufficient balance (concurrency check). Order cancelled.';
             continue;
          }

          // Log the activation (save the retail cost so refunds give back exactly what they paid)
          await supabaseAdmin
            .from('activations')
            .insert({
              user_id: userId,
              vsim_activation_id: `${rule.target_api}::${actId}`,
              country: countryStr,
              service: serviceStr,
              phone_number: phone.toString(),
              cost: retailCost,
              status: 'PENDING'
            });

          return NextResponse.json({
            success: true,
            activationId: `${rule.target_api}::${actId}`,
            phoneNumber: phone,
            cost: retailCost,
            newBalance: newBalance,
            country: countryStr,
            service: serviceStr,
            operator: data.activationOperator || rule.target_operator || 'unknown',
          });
        } else {
           if (typeof data === 'string') lastError = data;
           else if (data.message) lastError = data.message;
        }
      } catch (err: any) {
         lastError = err.message;
      }
    }

    // 4. If loop finishes and no route succeeded
        let finalError = lastError;
    if (!finalError.includes('balance') && !finalError.includes('Price changed')) {
       finalError = 'This route is currently out of stock or having issues. Please try selecting one of our other available routes above!';
    }
    return NextResponse.json({ success: false, error: finalError }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
