import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';

export async function GET(request: Request) {
  // Strict Security check for Cron
  const CRON_SECRET = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized. Invalid or missing CRON_SECRET.' }, { status: 401 });
  }

  try {
    // 1. Calculate the cutoff time (15 minutes ago)
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // 2. Fetch all PENDING activations older than 15 minutes
    const { data: expiredActivations, error } = await supabaseAdmin
      .from('activations')
      .select('*')
      .eq('status', 'PENDING')
      .lt('created_at', cutoffTime);

    if (error || !expiredActivations || expiredActivations.length === 0) {
      return NextResponse.json({ message: 'No expired activations found.', count: 0 });
    }

    let processedCount = 0;

    // 3. Loop through and cancel/refund each one
    for (const activation of expiredActivations) {
      const parts = activation.vsim_activation_id.split('::');
      const source = parts.length > 1 ? parts[0] : 'vsim';
      const realId = parts.length > 1 ? parts[1] : activation.vsim_activation_id;

      const TARGET_API_URL = source === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
      const TARGET_API_KEY = source === 'smsbower' ? process.env.SMSBOWER_API_KEY : process.env.VSIM_API_KEY;

      if (!TARGET_API_KEY) continue;

      try {
        // Cancel with telecom provider
        const response = await axios.get(TARGET_API_URL, {
          params: {
            api_key: TARGET_API_KEY,
            action: 'setStatus',
            id: realId,
            status: 8 // Cancel status
          }
        });

        const data = response.data;

        // If successfully cancelled on provider end (or already cancelled)
        if (data === 'ACCESS_CANCEL' || data === 'ACCESS_CANCEL_ALREADY' || data === 'BAD_STATUS' || data === 'NO_ACTIVATION' || data === 'ACCESS_APPROVED') {
            const refundAmount = Number(activation.cost);
            
            // ATOMIC LOCK: Try to change status from PENDING to CANCELLED.
            const { data: updatedAct } = await supabaseAdmin
              .from('activations')
              .update({ status: 'CANCELLED' })
              .eq('id', activation.id)
              .eq('status', 'PENDING')
              .select();

            if (updatedAct && updatedAct.length > 0) {
                // Refund the user wallet only if WE won the race
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

    return NextResponse.json({ message: 'Cleanup complete', processedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
