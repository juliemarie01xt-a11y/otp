import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase-admin';

const PLISIO_API_URL = 'https://api.plisio.net/api/v1';

export async function POST(request: Request) {
  try {
    const { userId, amount } = await request.json();

    if (!userId || !amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount or user' }, { status: 400 });
    }

    const PLISIO_SECRET_KEY = process.env.PLISIO_SECRET_KEY;
    if (!PLISIO_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    // 1. Create a pending deposit in the database to get an Order ID
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

    // 2. Request an invoice from Plisio
    const response = await axios.get(`${PLISIO_API_URL}/invoices/new`, {
      params: {
        source_currency: 'USD',
        source_amount: amount,
        order_name: `Wallet Top-Up`,
        order_number: deposit.id,
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
