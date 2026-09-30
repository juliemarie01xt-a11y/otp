import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUserId } from '@/lib/auth';

const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const VSIM_API_KEY = process.env.VSIM_API_KEY || '';

const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';
const SMSBOWER_API_KEY = process.env.SMSBOWER_API_KEY || '';

export async function POST(request: Request) {
  try {
    // VERIFY AUTH — extract userId from JWT, never trust the body
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing activation id' }, { status: 400 });
    }

    // Determine the source and real ID
    const parts = id.toString().split('::');
    let source = 'vsim';
    let realId = id.toString();
    
    if (parts.length > 1) {
      source = parts[0];
      realId = parts[1];
    }

    let TARGET_API_URL = VSIM_API_URL;
    let TARGET_API_KEY = VSIM_API_KEY;

    if (source === 'smsbower') {
      TARGET_API_URL = SMSBOWER_API_URL;
      TARGET_API_KEY = SMSBOWER_API_KEY;
    }

    if (!TARGET_API_KEY) {
      return NextResponse.json({ error: `${source} API KEY not configured` }, { status: 500 });
    }

    // 1. Fetch the activation record
    const { data: activation, error: activationError } = await supabaseAdmin
      .from('activations')
      .select('cost, status')
      .eq('vsim_activation_id', id.toString()) // We stored the FULL id in the DB (source::id)
      .eq('user_id', userId)
      .single();

    if (activationError || !activation) {
      return NextResponse.json({ error: 'Activation not found or unauthorized' }, { status: 404 });
    }
    
    if (activation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Activation is not pending' }, { status: 400 });
    }

    // 2. Call the chosen API to actually cancel
    const response = await axios.get(TARGET_API_URL, {
      params: {
        api_key: TARGET_API_KEY,
        action: 'setStatus',
        id: realId,
        status: 8 // 8 = cancel activation
      }
    });

    const data = response.data;
    
    if (typeof data === 'string') {
        if (data === 'ACCESS_CANCEL' || data === 'ACCESS_CANCEL_ALREADY' || data === 'BAD_STATUS' || data === 'NO_ACTIVATION' || data === 'ACCESS_APPROVED') {
            
            // 3. Process the internal refund
            const refundAmount = Number(activation.cost);
            
            // ATOMIC LOCK: Try to change status from PENDING to CANCELLED.
            // If it's already CANCELLED, this returns empty, preventing double-refunds in a race condition.
            const { data: updatedAct } = await supabaseAdmin
              .from('activations')
              .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
              .eq('vsim_activation_id', id.toString())
              .eq('status', 'PENDING')
              .select();

            let newBalance = 0;
            if (updatedAct && updatedAct.length > 0) {
                // ATOMIC REFUND: Use the SQL RPC to add money back securely
                const { data: rpcBalance, error: rpcError } = await supabaseAdmin.rpc('refund_balance', {
                    p_user_id: userId,
                    p_amount: refundAmount
                });

                if (!rpcError && rpcBalance !== null) {
                    newBalance = rpcBalance;
                }

                // Add a Hoarder Strike using the new Probability Engine!
                await supabaseAdmin.rpc('handle_hoarder_strike', { p_user_id: userId, p_activation_id: id.toString() });
            }

            return NextResponse.json({ success: true, message: data, refundedAmount: refundAmount, newBalance });
        }
        return NextResponse.json({ success: false, error: data }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Failed to cancel', raw: data }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
