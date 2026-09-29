import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // 1. Get the user's email from Supabase Auth
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Failed to retrieve user email' }, { status: 500 });
    }

    // 2. Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Store the OTP in the profiles table with a 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ link_otp: otp, link_otp_expires: expiresAt })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 4. Send the OTP email via Resend
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #09090b; padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px; text-align: center; }
        .content h2 { color: #09090b; margin-top: 0; font-size: 20px; }
        .content p { color: #52525b; font-size: 16px; line-height: 1.6; }
        .otp-box { display: inline-block; background-color: #f4f4f5; border: 2px solid #e4e4e7; border-radius: 12px; padding: 20px 40px; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #09090b; font-family: monospace; }
        .warning { color: #a1a1aa; font-size: 13px; margin-top: 16px; }
        .footer { padding: 24px 40px; text-align: center; background-color: #fafafa; border-top: 1px solid #e4e4e7; }
        .footer p { color: #a1a1aa; font-size: 14px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SwiftOTP</h1>
        </div>
        <div class="content">
          <h2>Telegram Link Verification</h2>
          <p>Use the code below to verify your Telegram connection. This code expires in <strong>5 minutes</strong>.</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="warning">If you did not request this, please ignore this email. Do not share this code with anyone.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 SwiftOTP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SwiftOTP Security <noreply@swiftotp.store>',
        to: user.email,
        subject: 'SwiftOTP - Telegram Link Verification Code',
        html: html
      })
    });

    if (!res.ok) {
      const errData = await res.text();
      console.error("Resend Error:", errData);
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    // Mask the email for the frontend (show only first 3 chars + domain)
    const emailParts = user.email.split('@');
    const maskedEmail = emailParts[0].substring(0, 3) + '***@' + emailParts[1];

    return NextResponse.json({ success: true, email: maskedEmail });

  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
