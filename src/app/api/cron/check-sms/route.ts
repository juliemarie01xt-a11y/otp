export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { data: pendingActs, error } = await supabaseAdmin
      .from('activations')
      .select('vsim_activation_id')
      .eq('status', 'PENDING');

    if (error) throw error;
    
    if (!pendingActs || pendingActs.length === 0) {
      return NextResponse.json({ success: true, checked: 0 });
    }

    const host = request.headers.get('host') || 'swiftotp.store';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    let checkCount = 0;
    
    const promises = pendingActs.map(act => {
       checkCount++;
       return fetch(`${baseUrl}/api/vsim/status?id=${act.vsim_activation_id}`).catch(() => null);
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true, checked: checkCount });
  } catch (err: any) {
    console.error("Cron Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
