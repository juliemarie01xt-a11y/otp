import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('routing_rules')
      .select('country_id, internal_service, cached_wholesale_cost, target_api');
      
    if (error) throw error;
    
    const routes = [...(data || [])];
    (data || []).forEach((r: any) => {
      if (r.country_id === '12') {
        routes.push({ ...r, country_id: '187' });
      } else if (r.country_id === '187') {
        routes.push({ ...r, country_id: '12' });
      }
    });

    return NextResponse.json({ routes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
