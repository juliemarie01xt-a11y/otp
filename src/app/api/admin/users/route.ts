import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id, telegram_id, balance, is_email_verified, trust_score, is_banned, ban_reason, created_at,
        activations ( status, updated_at )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process the data to calculate cancellation metrics
    const now = Date.now();
    const processedUsers = (profiles || []).map((p: any) => {
      const acts = p.activations || [];
      const total_cancels = acts.filter((a: any) => a.status === 'CANCELLED').length;
      const recent_cancels_24h = acts.filter((a: any) => 
        a.status === 'CANCELLED' && 
        a.updated_at && 
        (now - new Date(a.updated_at).getTime() < 86400000)
      ).length;
      const total_completed = acts.filter((a: any) => a.status === 'COMPLETED').length;

      // Remove raw activations array to save bandwidth
      delete p.activations;
      
      return {
        ...p,
        total_cancels,
        recent_cancels_24h,
        total_completed
      };
    });
    
    return NextResponse.json({ users: processedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
