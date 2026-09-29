import os

base_dir = "supabase/functions"
os.makedirs(os.path.join(base_dir, "cron-check-sms"), exist_ok=True)
os.makedirs(os.path.join(base_dir, "cron-cleanup"), exist_ok=True)
os.makedirs(os.path.join(base_dir, "cron-sync-prices"), exist_ok=True)

# 1. cron-check-sms
check_sms_code = """import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  try {
    const { data: pendingActs, error } = await supabaseAdmin
      .from('activations')
      .select('vsim_activation_id')
      .eq('status', 'PENDING');

    if (error) throw error;
    
    if (!pendingActs || pendingActs.length === 0) {
      return new Response(JSON.stringify({ success: true, checked: 0 }), { headers: { "Content-Type": "application/json" } });
    }

    // Since we are in an edge function, we need to know the frontend URL to ping it.
    // We can use NEXT_PUBLIC_SITE_URL or fallback to swiftotp.store
    const baseUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://swiftotp.store';

    let checkCount = 0;
    
    const promises = pendingActs.map(act => {
       checkCount++;
       return fetch(`${baseUrl}/api/vsim/status?id=${act.vsim_activation_id}`).catch(() => null);
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ success: true, checked: checkCount }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("Cron Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
"""
with open(os.path.join(base_dir, "cron-check-sms", "index.ts"), "w") as f:
    f.write(check_sms_code)


# 2. cron-cleanup
cleanup_code = """import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Strict Security check for Cron
  const CRON_SECRET = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('authorization');
  
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Invalid or missing CRON_SECRET.' }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: expiredActivations, error } = await supabaseAdmin
      .from('activations')
      .select('*')
      .eq('status', 'PENDING')
      .lt('created_at', cutoffTime);

    if (error || !expiredActivations || expiredActivations.length === 0) {
      return new Response(JSON.stringify({ message: 'No expired activations found.', count: 0 }), { headers: { "Content-Type": "application/json" } });
    }

    let processedCount = 0;

    for (const activation of expiredActivations) {
      const parts = activation.vsim_activation_id.split('::');
      const source = parts.length > 1 ? parts[0] : 'vsim';
      const realId = parts.length > 1 ? parts[1] : activation.vsim_activation_id;

      const TARGET_API_URL = source === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
      const TARGET_API_KEY = source === 'smsbower' ? Deno.env.get('SMSBOWER_API_KEY') : Deno.env.get('VSIM_API_KEY');

      if (!TARGET_API_KEY) continue;

      try {
        const url = new URL(TARGET_API_URL);
        url.searchParams.append('api_key', TARGET_API_KEY);
        url.searchParams.append('action', 'setStatus');
        url.searchParams.append('id', realId);
        url.searchParams.append('status', '8');

        const response = await fetch(url.toString());
        const data = await response.text();

        if (data === 'ACCESS_CANCEL' || data === 'ACCESS_CANCEL_ALREADY' || data === 'BAD_STATUS' || data === 'NO_ACTIVATION' || data === 'ACCESS_APPROVED') {
            const refundAmount = Number(activation.cost);
            
            const { data: updatedAct } = await supabaseAdmin
              .from('activations')
              .update({ status: 'CANCELLED' })
              .eq('id', activation.id)
              .eq('status', 'PENDING')
              .select();

            if (updatedAct && updatedAct.length > 0) {
                const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('id', activation.user_id).single();
                if (profile) {
                    const newBalance = Number((Number(profile.balance) + refundAmount).toPrecision(12));
                    await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', activation.user_id);
                }
            }
            processedCount++;
        }
      } catch (err) {
        console.error(`Failed to cleanup activation ${activation.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ message: 'Cleanup complete', processedCount }), { headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
"""
with open(os.path.join(base_dir, "cron-cleanup", "index.ts"), "w") as f:
    f.write(cleanup_code)

# 3. cron-sync-prices
sync_prices_code = """import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const CRON_SECRET = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('authorization');
  
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Invalid or missing CRON_SECRET.' }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { data: rules, error: ruleError } = await supabaseAdmin
      .from('routing_rules')
      .select('*');

    if (ruleError || !rules || rules.length === 0) {
      return new Response(JSON.stringify({ message: 'No active rules to sync.', count: 0 }), { headers: { "Content-Type": "application/json" } });
    }

    let updatedCount = 0;
    const BATCH_SIZE = 15;
    
    for (let i = 0; i < rules.length; i += BATCH_SIZE) {
      const batch = rules.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (rule) => {
        const TARGET_API_URL = rule.target_api === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
        const TARGET_API_KEY = rule.target_api === 'smsbower' ? Deno.env.get('SMSBOWER_API_KEY') : Deno.env.get('VSIM_API_KEY');

        if (!TARGET_API_KEY) return;

        try {
          const url = new URL(TARGET_API_URL);
          url.searchParams.append('api_key', TARGET_API_KEY);
          url.searchParams.append('action', 'getPricesV3');
          url.searchParams.append('country', rule.country_id);
          url.searchParams.append('service', rule.target_service_code);
          
          if (rule.target_api === 'vsim' && rule.target_operator) {
             url.searchParams.append('operator', rule.target_operator);
          }

          const response = await fetch(url.toString());
          const data = await response.json();
          
          let bestPrice: number | null = null;
          let count = 0;
          const country = rule.country_id;
          const service = rule.target_service_code;
          
          if (data && typeof data === 'object' && data[country] && data[country][service]) {
            const sData = data[country][service];
            
            if (sData.providers) {
               Object.values(sData.providers).forEach((p: any) => {
                   if (!rule.target_provider || p.providerIds == rule.target_provider) {
                       const pPrice = parseFloat(p.price[0] || p.price);
                       if (bestPrice === null || pPrice < bestPrice) bestPrice = pPrice;
                       count += parseInt(p.count || 0);
                   }
               });
            }
            else if (rule.target_api === 'smsbower') {
               Object.entries(sData).forEach(([provId, pData]: [string, any]) => {
                   if (!rule.target_provider || provId == rule.target_provider) {
                       const pPrice = parseFloat(pData.price || 0);
                       if (bestPrice === null || pPrice < bestPrice) bestPrice = pPrice;
                       count += parseInt(pData.count || 0);
                   }
               });
            }
            else {
                bestPrice = parseFloat(sData.price);
                count = parseInt(sData.count || 0);
            }
          }
          
          if (bestPrice !== null && count > 0) {
              await supabaseAdmin.from('routing_rules').update({ cached_wholesale_cost: bestPrice }).eq('id', rule.id);
              updatedCount++;
          } else {
              await supabaseAdmin.from('routing_rules').update({ cached_wholesale_cost: 0 }).eq('id', rule.id);
          }
        } catch (e) {
          console.error(`Failed to sync rule ${rule.id}`);
        }
      }));
    }

    return new Response(JSON.stringify({ success: true, updated: updatedCount }), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
"""
with open(os.path.join(base_dir, "cron-sync-prices", "index.ts"), "w") as f:
    f.write(sync_prices_code)

print("Created 3 flawless Deno scripts!")
