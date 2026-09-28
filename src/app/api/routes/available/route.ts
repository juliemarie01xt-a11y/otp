import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('routing_rules')
      .select('country_id, internal_service, cached_wholesale_cost');
      
    if (error) throw error;
    
    return NextResponse.json({ routes: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
