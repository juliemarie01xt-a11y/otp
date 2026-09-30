import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id, telegram_id, balance, is_email_verified, trust_score, is_banned, ban_reason, created_at, admin_notes,
        activations ( status, created_at )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const authUsers = authData?.users || [];
    const emailMap = new Map();
    authUsers.forEach(u => emailMap.set(u.id, u.email));

    // Process the data to calculate cancellation metrics
    const now = Date.now();
    const processedUsers = (profiles || []).map((p: any) => {
      const acts = p.activations || [];
      const total_cancels = acts.filter((a: any) => a.status === 'CANCELLED').length;
      const recent_cancels_24h = acts.filter((a: any) => 
        a.status === 'CANCELLED' && 
        a.created_at && 
        (now - new Date(a.created_at).getTime() < 86400000)
      ).length;
      const total_completed = acts.filter((a: any) => a.status === 'COMPLETED').length;
      const total_activity = total_completed + total_cancels;
      const success_rate = total_activity > 0 ? Math.round((total_completed / total_activity) * 100) : 0;

      // Remove raw activations array to save bandwidth
      delete p.activations;
      
      return {
        ...p,
        email: emailMap.get(p.id) || 'Unknown Email',
        total_cancels,
        recent_cancels_24h,
        total_completed,
        success_rate
      };
    });
    
    return NextResponse.json({ users: processedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
