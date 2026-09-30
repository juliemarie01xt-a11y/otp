import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, telegram_id, balance, is_email_verified, trust_score, is_banned, ban_reason, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Attempt to get emails from auth.users (Optional, since profiles doesn't directly have email unless mirrored)
    // We can just rely on IDs and Telegram for now.
    
    return NextResponse.json({ users: profiles || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
