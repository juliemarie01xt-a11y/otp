import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUserId } from '@/lib/auth';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { telegramId } = await request.json();
    if (!telegramId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ telegram_id: telegramId })
      .eq('id', userId);

    if (error) throw error;

    try {
      // Get the user's email to send a personalized confirmation
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = user?.email || 'your account';

      // Ping the user on Telegram instantly
      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      if (BOT_TOKEN) {
         await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
           chat_id: telegramId,
           parse_mode: 'HTML',
           text: `?? <b>Account Successfully Linked!</b>\n\nWelcome aboard! Your <b>SwiftOTP</b> account (<code>${email}</code>) is now securely connected.\n\nYou can now manage your numbers directly from this chat:\n?? <b>/buy</b> - Purchase a new number\n?? <b>/balance</b> - Check your wallet balance\n? <b>/cancel</b> - Cancel an active number\n\n<i>Start by typing /buy to get your first number!</i>`
         });
      }
    } catch (e) {
      console.error("Failed to ping telegram", e);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
