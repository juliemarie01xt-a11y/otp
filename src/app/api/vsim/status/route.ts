export const runtime = 'nodejs';
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

  // Handle SMSPin Provider
  if (source === 'smspin') {
    const SMSPIN_API_KEY = process.env.SMSPIN_API_KEY;
    if (!SMSPIN_API_KEY) {
      return NextResponse.json({ error: 'SMSPin API KEY not configured in environment' }, { status: 500 });
    }

    try {
      // 1. Check if already COMPLETED in Supabase
      const { data: existing } = await supabaseAdmin
        .from('activations')
        .select('status, code, phone_number, user_id, service, country')
        .eq('vsim_activation_id', id.toString())
        .single();

      if (existing && existing.status === 'COMPLETED' && existing.code) {
        return NextResponse.json({ status: 'COMPLETED', code: existing.code });
      }

      if (existing && existing.status === 'CANCELLED') {
        return NextResponse.json({ status: 'CANCELLED' });
      }

      const phoneNumber = existing?.phone_number || realId;

      // 2. Call SMSPin user/get_sms.php
      const checkUrl = `https://api.smspinverify.com/user/get_sms.php?customer=${encodeURIComponent(SMSPIN_API_KEY)}&app=googlevoice&country=USA&number=${encodeURIComponent(phoneNumber)}`;
      const response = await fetch(checkUrl);
      const rawText = await response.text();

      let isSuccess = false;
      let message = '';

      try {
        const json = JSON.parse(rawText);
        if (json.success === true) {
          isSuccess = true;
          message = json.data?.sms || json.data?.code || json.message || '';
        } else if (json.error) {
          return NextResponse.json({ status: 'WAITING' });
        }
      } catch (_) {
        const clean = rawText.trim();
        if (clean === '' || clean.toLowerCase().includes('waiting') || clean.toLowerCase().includes('not received') || clean.toLowerCase().includes('wait_code') || clean.toLowerCase().includes('no sms')) {
          return NextResponse.json({ status: 'WAITING' });
        }
        if (clean.toLowerCase().includes('access denied') || clean.toLowerCase().includes('error')) {
          return NextResponse.json({ status: 'WAITING' });
        }
        isSuccess = true;
        message = clean;
      }

      if (isSuccess && message) {
        const codeMatch = message.match(/\b\d{4,8}\b/);
        const code = codeMatch ? codeMatch[0] : message;

        const { data: updatedAct } = await supabaseAdmin
          .from('activations')
          .update({ status: 'COMPLETED', code: code })
          .eq('vsim_activation_id', id.toString())
          .eq('status', 'PENDING')
          .select('user_id, service, country');

        if (updatedAct && updatedAct.length > 0) {
          const actUserId = updatedAct[0].user_id;
          await supabaseAdmin.rpc('reset_hoarder_strikes', { p_user_id: actUserId });

          const { data: profile } = await supabaseAdmin.from('profiles').select('telegram_id').eq('id', actUserId).single();
          if (profile && profile.telegram_id && process.env.TELEGRAM_BOT_TOKEN) {
            try {
              await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: profile.telegram_id,
                  parse_mode: 'HTML',
                  text: `💬 <b>New SMS Received!</b>\n\nService: <b>Google Voice</b>\nCode: <code>${code}</code>\n\n<i>This number is now completed.</i>`
                })
              });
            } catch (e) {
              console.error("TG Ping Error:", e);
            }
          }
        }

        return NextResponse.json({ status: 'COMPLETED', code });
      }

      return NextResponse.json({ status: 'WAITING' });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
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
                
                // Reset Hoarder Strikes because they actually got an SMS!
                await supabaseAdmin.rpc('reset_hoarder_strikes', { p_user_id: userId });
                
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
                
                // ATOMIC REFUND: Use the SQL RPC to add money back securely
                // Prevents race conditions that could erase concurrent crypto deposits
                await supabaseAdmin.rpc('refund_balance', {
                    p_user_id: userId,
                    p_amount: refundAmount
                });
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
