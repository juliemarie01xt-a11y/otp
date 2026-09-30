import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { action, userId, reason } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'ban') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_banned: true, ban_reason: reason || 'Manual Admin Ban', trust_score: 0 })
        .eq('id', userId);
      if (error) throw error;
    } 
    else if (action === 'unban') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_banned: false, ban_reason: null, trust_score: 50 })
        .eq('id', userId);
      if (error) throw error;
    }
    else if (action === 'reset_trust') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ trust_score: 50 })
        .eq('id', userId);
      if (error) throw error;
    }
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
