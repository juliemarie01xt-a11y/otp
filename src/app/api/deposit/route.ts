import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUserId } from '@/lib/auth';

const PLISIO_API_URL = 'https://api.plisio.net/api/v1';

// Simple in-memory rate limiter: max 5 deposits per user per minute
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) || []).filter(t => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return false;
}

export async function POST(request: Request) {
  try {
    // 1. VERIFY AUTH — extract userId from JWT, never trust the body
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Minimum deposit is $1' }, { status: 400 });
    }

    // 2. Rate limit check
    if (isRateLimited(userId)) {
      return NextResponse.json({ error: 'Too many deposit requests. Please wait a minute.' }, { status: 429 });
    }

    const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;
    if (!PLISIO_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    // 3. Create a pending deposit in the database
    const { data: deposit, error: dbError } = await supabaseAdmin
      .from('deposits')
      .insert({
        user_id: userId,
        amount: amount,
        status: 'PENDING'
      })
      .select('id')
      .single();

    if (dbError || !deposit) {
      return NextResponse.json({ error: 'Failed to initialize deposit' }, { status: 500 });
    }

    // 4. Build callback URL with ?json=true so Plisio sends JSON
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const callbackUrl = `${protocol}://${host}/api/webhooks/plisio?json=true`;
    const successUrl = `${protocol}://${host}/dashboard/success`;
    const failUrl = `${protocol}://${host}/dashboard/failed`;

    // 5. Request an invoice from Plisio
    const response = await axios.get(`${PLISIO_API_URL}/invoices/new`, {
      params: {
        source_currency: 'USD',
        source_amount: (amount * (1.015 / 1.01)).toFixed(4), // Target 1.5% total fee (accounting for Plisio's 1%)
        order_name: `Wallet Top-Up`,
        order_number: deposit.id,
        callback_url: callbackUrl,
        success_invoice_url: successUrl,
        fail_invoice_url: failUrl,
        api_key: PLISIO_SECRET_KEY
      }
    });

    if (response.data && response.data.status === 'success') {
      return NextResponse.json({ 
        success: true, 
        invoice_url: response.data.data.invoice_url 
      });
    } else {
      return NextResponse.json({ error: 'Failed to generate crypto invoice' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Deposit error:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
