import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { telegramId } = await request.json();

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ telegram_id: telegramId || null })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
