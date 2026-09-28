import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Admin Credentials' }, { status: 401 });
  }
  try {
    const { country_id, internal_service, target_api, target_service_code, target_operator, target_provider, tier = 'premium' } = await request.json();

    // 1. Check if this exact route already exists in this tier
    let query = supabaseAdmin.from('routing_rules')
      .select('id')
      .eq('country_id', country_id)
      .eq('internal_service', internal_service)
      .eq('target_api', target_api)
      .eq('target_service_code', target_service_code)
      .eq('tier', tier);
      
    if (target_operator) query = query.eq('target_operator', target_operator);
    else query = query.is('target_operator', null);
    
    if (target_provider) query = query.eq('target_provider', target_provider);
    else query = query.is('target_provider', null);

    const { data: existing } = await query;

    if (existing && existing.length > 0) {
      // Toggle OFF (Delete it)
      const { error: delError } = await supabaseAdmin.from('routing_rules').delete().eq('id', existing[0].id);
      if (delError) throw delError;
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Toggle ON (Insert it)
      const { error: insError } = await supabaseAdmin.from('routing_rules').insert({
        country_id,
        internal_service,
        target_api,
        target_service_code,
        target_operator: target_operator || null,
        target_provider: target_provider || null,
        tier
      });
      if (insError) throw insError;
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Admin Credentials' }, { status: 401 });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('routing_rules')
      .select('*');
      
    if (error) throw error;
    
    return NextResponse.json({ rules: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
