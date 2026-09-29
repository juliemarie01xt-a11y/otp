import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  try {
    const { data: pendingActs, error } = await supabaseAdmin
      .from('activations')
      .select('*')
      .eq('status', 'PENDING');

    if (error) throw error;
    
    if (!pendingActs || pendingActs.length === 0) {
      return new Response(JSON.stringify({ success: true, checked: 0 }), { headers: { "Content-Type": "application/json" } });
    }

    let checkCount = 0;
    
    const promises = pendingActs.map(async (act) => {
       checkCount++;
       
       const id = act.vsim_activation_id;
       const parts = id.toString().split('::');
       let source = 'vsim';
       let realId = id.toString();
       if (parts.length > 1) {
         source = parts[0];
         realId = parts[1];
       }

       let TARGET_API_URL = VSIM_API_URL;
       let TARGET_API_KEY = Deno.env.get('VSIM_API_KEY');

       if (source === 'smsbower') {
         TARGET_API_URL = SMSBOWER_API_URL;
         TARGET_API_KEY = Deno.env.get('SMSBOWER_API_KEY');
       }

       if (!TARGET_API_KEY) return;
       
       try {
           const url = new URL(TARGET_API_URL);
           url.searchParams.append('api_key', TARGET_API_KEY);
           url.searchParams.append('action', 'getStatus');
           url.searchParams.append('id', realId);

           const response = await fetch(url.toString());
           const data = await response.text();
           
           if (typeof data === 'string' && data.startsWith('STATUS_OK:')) {
               const code = data.split(':')[1];
               
               // ATOMIC LOCK
               const { data: updatedAct } = await supabaseAdmin
                 .from('activations')
                 .update({ status: 'COMPLETED', code: code })
                 .eq('vsim_activation_id', id.toString())
                 .eq('status', 'PENDING')
                 .select('user_id, service, country');
                 
               if (updatedAct && updatedAct.length > 0) {
                   const userId = updatedAct[0].user_id;
                   const { data: profile } = await supabaseAdmin.from('profiles').select('telegram_id').eq('id', userId).single();
                   
                   if (profile && profile.telegram_id) {
                       const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
                       if (BOT_TOKEN) {
                           try {
                               const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
                               await fetch(tgUrl, {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({
                                       chat_id: profile.telegram_id,
                                       parse_mode: 'HTML',
                                       text: `?? <b>New SMS Received!</b>\n\nService: <b>${updatedAct[0].service}</b>\nCode: <code>${code}</code>\n\n<i>This number is now completed.</i>`
                                   })
                               });
                           } catch (e) {}
                       }
                   }
               }
           }
       } catch (e) {}
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ success: true, checked: checkCount }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
