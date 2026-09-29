import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
