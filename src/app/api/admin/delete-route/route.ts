import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
       return NextResponse.json({ error: 'Missing route ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('routing_rules')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
