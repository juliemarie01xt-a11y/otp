import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUserId } from '@/lib/auth';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch current telegram ID so we can send the goodbye message
    const { data: profile } = await supabaseAdmin.from('profiles').select('telegram_id').eq('id', userId).single();
    const telegramId = profile?.telegram_id;

    // 2. Unlink the account in the database
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ telegram_id: null })
      .eq('id', userId);

    if (error) throw error;

    // 3. Ping the bot if they had an ID
    if (telegramId) {
      try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        if (BOT_TOKEN) {
           await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
             chat_id: telegramId,
             parse_mode: 'HTML',
             text: `🔌 <b>Account Disconnected</b>\n\nYour SwiftOTP account has been securely unlinked from this Telegram chat.\n\nIf you ever want to connect again, just use the /start command!`
           });
        }
      } catch (e) {
        console.error("Failed to send unlink ping", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
