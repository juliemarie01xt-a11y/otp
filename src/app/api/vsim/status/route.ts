export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const VSIM_API_KEY = process.env.VSIM_API_KEY || '';

const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';
const SMSBOWER_API_KEY = process.env.SMSBOWER_API_KEY || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

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

  try {
    const url = new URL(TARGET_API_URL);
    url.searchParams.append('api_key', TARGET_API_KEY);
    url.searchParams.append('action', 'getStatus');
    url.searchParams.append('id', realId);

    const response = await fetch(url.toString());
    const data = await response.text();
    
    // data is typically a string like "STATUS_WAIT_CODE", "STATUS_OK:123456", "STATUS_CANCEL"
    if (typeof data === 'string') {
        if (data.startsWith('STATUS_OK:')) {
            const code = data.split(':')[1];
            
            // ATOMIC LOCK: Try to change status from PENDING to COMPLETED.
            const { data: updatedAct } = await supabaseAdmin
              .from('activations')
              .update({ status: 'COMPLETED', code: code })
              .eq('vsim_activation_id', id.toString())
              .eq('status', 'PENDING')
              .select('user_id, service, country');
              
            // If it was just completed right now (not previously completed by another thread)
            if (updatedAct && updatedAct.length > 0) {
                const userId = updatedAct[0].user_id;
                
                // Fetch user to see if they have a Telegram Bot linked
                const { data: profile } = await supabaseAdmin.from('profiles').select('telegram_id').eq('id', userId).single();
                
                if (profile && profile.telegram_id) {
                    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
                    if (BOT_TOKEN) {
                        try {
                            const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
                            await fetch(tgUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chat_id: profile.telegram_id,
                                    parse_mode: 'HTML',
                                    text: `💬 <b>New SMS Received!</b>\n\nService: <b>${updatedAct[0].service}</b>\nCode: <code>${code}</code>\n\n<i>This number is now completed.</i>`
                                })
                            });
                        } catch (e) {
                            console.error("TG Ping Error:", e);
                        }
                    }
                }
            } else {
                // If the update returned 0 rows, it might already be COMPLETED. We still want to return the code to the frontend!
                const { data: existing } = await supabaseAdmin.from('activations').select('status, code').eq('vsim_activation_id', id.toString()).single();
                if (existing && existing.status === 'COMPLETED' && existing.code) {
                    return NextResponse.json({ status: 'COMPLETED', code: existing.code });
                }
            }
              
            return NextResponse.json({ status: 'COMPLETED', code });
        }
        if (data === 'STATUS_WAIT_CODE') {
            return NextResponse.json({ status: 'WAITING' });
        }
        if (data === 'STATUS_CANCEL') {
            // ATOMIC LOCK: Try to change status from PENDING to CANCELLED.
            // If it's already CANCELLED, this returns empty, preventing double-refunds.
            const { data: updatedAct } = await supabaseAdmin
              .from('activations')
              .update({ status: 'CANCELLED' })
              .eq('vsim_activation_id', id.toString())
              .eq('status', 'PENDING')
              .select('user_id, cost');

            if (updatedAct && updatedAct.length > 0) {
                const refundAmount = Number(updatedAct[0].cost);
                const userId = updatedAct[0].user_id;
                
                // Add money back to user wallet
                const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('id', userId).single();
                if (profile) {
                    const newBalance = Number((Number(profile.balance) + refundAmount).toPrecision(12));
                    await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', userId);
                }
            }
            return NextResponse.json({ status: 'CANCELLED' });
        }
        
        return NextResponse.json({ status: 'ERROR', message: data }, { status: 400 });
    }

    return NextResponse.json({ status: 'UNKNOWN', raw: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
