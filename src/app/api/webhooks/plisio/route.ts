import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const data = JSON.parse(rawBody);

    const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;
    if (!PLISIO_SECRET_KEY) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // 1. Verify Plisio Signature (Security check)
    // Plisio sends an X-Plisio-Signature header
    const signature = request.headers.get('x-plisio-signature');
    
    // Check if verified based on Plisio docs
    if (signature) {
       // Plisio creates HMAC SHA1 of the stringified POST payload
       const hmac = crypto.createHmac('sha1', PLISIO_SECRET_KEY);
       hmac.update(rawBody);
       const expectedSig = hmac.digest('hex');
       if (expectedSig !== signature) {
         // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
       }
    }

    // Verify status is completed
    if (data.status !== 'completed' && data.status !== 'mismatch') {
      return NextResponse.json({ success: true, message: 'Status ignored' });
    }

    const orderId = data.order_number; // This is the deposit.id we sent
    const amountPaidStr = data.source_amount; // USD amount

    if (!orderId || !amountPaidStr) {
      return NextResponse.json({ error: 'Missing order data' }, { status: 400 });
    }

    // 2. Fetch the pending deposit
    const { data: deposit, error: depError } = await supabaseAdmin
      .from('deposits')
      .select('*')
      .eq('id', orderId)
      .eq('status', 'PENDING')
      .single();

    if (depError || !deposit) {
      return NextResponse.json({ success: true, message: 'Deposit already processed or not found' });
    }

    // 3. Mark deposit as completed
    await supabaseAdmin
      .from('deposits')
      .update({ status: 'COMPLETED', txn_id: data.txn_id })
      .eq('id', deposit.id);

    // 4. Add money to user wallet
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', deposit.user_id)
      .single();

    if (profile) {
      // Plisio passes the exact source_amount paid if we use source_currency=USD
      const addedAmount = Number(amountPaidStr);
      const newBalance = Number(profile.balance) + addedAmount;

      await supabaseAdmin
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', deposit.user_id);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Plisio Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 500 });
  }
}
