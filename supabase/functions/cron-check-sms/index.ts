import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
