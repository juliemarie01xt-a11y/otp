import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;
    if (!PLISIO_SECRET_KEY) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // 1. Parse the body — handle both JSON and form-data
    //    We pass ?json=true in callback_url so Plisio sends JSON.
    //    But handle form-data as a safety fallback.
    const contentType = request.headers.get('content-type') || '';
    let data: Record<string, any>;

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      // multipart/form-data or application/x-www-form-urlencoded fallback
      const formData = await request.formData();
      data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
    }

    // 2. Verify Plisio Signature — EXACT algorithm from official Plisio Node.js docs:
    //    https://plisio.net/documentation/endpoints/create-an-invoice#verification-example
    //    1) Copy object, remove verify_hash
    //    2) JSON.stringify (NO sorting for JSON callbacks)
    //    3) HMAC-SHA1 with SECRET_KEY
    //    4) Compare hex digest
    if (!data.verify_hash) {
      console.error('Plisio webhook missing verify_hash');
      return NextResponse.json({ error: 'Missing verify_hash' }, { status: 401 });
    }

    const receivedHash = data.verify_hash;
    const ordered = { ...data };
    delete ordered.verify_hash;
    const stringToHash = JSON.stringify(ordered);

    const expectedHash = crypto
      .createHmac('sha1', PLISIO_SECRET_KEY)
      .update(stringToHash)
      .digest('hex');

    if (expectedHash !== receivedHash) {
      console.error('Plisio webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Process completed (paid in full), mismatch (overpaid), or expired (partial payment).
    //    Per Plisio docs: mismatch = overpaid, expired = may have partial payment.
    if (data.status !== 'completed' && data.status !== 'mismatch' && data.status !== 'expired') {
      return NextResponse.json({ success: true, message: `Status '${data.status}' ignored` });
    }

    // 4. Extract order data
    const orderId = data.order_number;
    const amountPaidStr = data.source_amount;

    if (!orderId || !amountPaidStr) {
      return NextResponse.json({ error: 'Missing order_number or source_amount' }, { status: 400 });
    }
    
    // If it expired, verify they actually paid something. If $0, ignore it.
    if (data.status === 'expired' && Number(amountPaidStr) <= 0) {
      return NextResponse.json({ success: true, message: 'Expired with no payment, ignored' });
    }

    // 5. ATOMIC LOCK: Update the pending deposit to COMPLETED.
    //    By filtering on status = 'PENDING', this guarantees the credit
    //    happens exactly ONCE even if Plisio fires duplicate webhooks.
    const { data: updatedDeposit, error: depError } = await supabaseAdmin
      .from('deposits')
      .update({
        status: 'COMPLETED',
        txn_id: data.txn_id || 'plisio'
      })
      .eq('id', orderId)
      .eq('status', 'PENDING')
      .select()
      .single();

    if (depError || !updatedDeposit) {
      // Already processed or doesn't exist — return 200 so Plisio stops retrying
      return NextResponse.json({ success: true, message: 'Deposit already processed or not found' });
    }

    // 6. Credit the user's wallet ATOMICALLY using SQL RPC
    //    We deduct the 0.5% profit cut we added upfront (divide by 1.005)
    let addedAmount = Number(amountPaidStr) / 1.005;
    
    // Round to 4 decimal places to prevent infinite fraction floating point errors
    addedAmount = Number(addedAmount.toFixed(4));
    
    if (addedAmount > 0) {
      await supabaseAdmin.rpc('credit_balance', {
        p_user_id: updatedDeposit.user_id,
        p_amount: addedAmount
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Plisio Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
