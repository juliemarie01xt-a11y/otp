import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
  }

  try {
    const { data: activation, error } = await supabaseAdmin
      .from('activations')
      .select('vsim_activation_id, phone_number, cost, created_at, status, country, service')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !activation) {
      return NextResponse.json({ success: false, message: 'No active orders' });
    }

    return NextResponse.json({
      success: true,
      activationId: activation.vsim_activation_id,
      phoneNumber: activation.phone_number,
      cost: activation.cost,
      country: activation.country,
      service: activation.service,
      createdAt: activation.created_at
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
