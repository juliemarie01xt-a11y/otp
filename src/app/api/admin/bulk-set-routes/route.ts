import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { country_id, internal_service, rules } = await request.json();

    const { error: delError } = await supabaseAdmin.from('routing_rules')
      .delete()
      .eq('country_id', country_id)
      .eq('internal_service', internal_service);
      
    if (delError) throw delError;

    if (rules && rules.length > 0) {
      const { error: insError } = await supabaseAdmin.from('routing_rules').insert(
        rules.map((r: any) => ({
          country_id,
          internal_service,
          target_api: r.target_api,
          target_service_code: r.target_service_code,
          target_operator: r.target_operator || null,
          target_provider: r.target_provider || null,
          tier: r.tier
        }))
      );
      if (insError) throw insError;
    }

    const host = request.headers.get('host') || 'swiftotp.store';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    fetch(`${protocol}://${host}/api/cron/sync-prices`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
