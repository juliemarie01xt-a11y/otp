import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUserId } from '@/lib/auth';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { telegramId, otp_code } = await request.json();
    if (!telegramId) return NextResponse.json({ error: 'Missing Telegram ID' }, { status: 400 });
    if (!otp_code) return NextResponse.json({ error: 'Missing verification code' }, { status: 400 });

    // 1. Fetch the stored OTP from the user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('link_otp, link_otp_expires')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }

    // 2. Validate the OTP
    if (!profile.link_otp || !profile.link_otp_expires) {
      return NextResponse.json({ error: 'No verification code was requested. Please request a new code.' }, { status: 400 });
    }

    if (new Date() > new Date(profile.link_otp_expires)) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
    }

    if (profile.link_otp !== otp_code.toString().trim()) {
      return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 });
    }

    // 2.5 Check if this Telegram ID is already linked to another account to prevent hijacking/collisions
    const { data: existingLinked } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .neq('id', userId)
      .limit(1);

    if (existingLinked && existingLinked.length > 0) {
      return NextResponse.json({ error: 'This Telegram account is already linked to another user. Please unlink it first.' }, { status: 400 });
    }

    // 3. OTP is valid! Link the Telegram ID and clear the OTP
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ telegram_id: telegramId, link_otp: null, link_otp_expires: null })
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
           text: `🎉 <b>Account Successfully Linked!</b>\n\nWelcome aboard! Your <b>SwiftOTP</b> account (<code>${email}</code>) is now securely connected.\n\nYou can now manage your numbers directly from this chat:\n🛒 <b>/buy</b> - Purchase a new number\n💰 <b>/balance</b> - Check your wallet balance\n❌ <b>/cancel</b> - Cancel an active number\n\n<i>Start by typing /buy to get your first number!</i>`
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
