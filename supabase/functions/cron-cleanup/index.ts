import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
