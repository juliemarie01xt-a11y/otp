import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { user, email_data } = payload;
    
    if (!user || !user.email || !email_data) {
        return new Response("Invalid payload", { status: 400 });
    }

    const email = user.email;
    const actionType = email_data.email_action_type; 
    const tokenHash = email_data.token_hash;
    const siteUrl = 'https://swiftotp.store'; // Hardcoded to bypass Supabase's payload bug
    
    // Redirect securely to our Next.js backend to perform verification
    // This avoids Kong API Gateway issues with missing API keys in the browser
    const verifyUrl = `${siteUrl}/auth/confirm?token_hash=${tokenHash}&type=${actionType}&next=/dashboard`;

    let subject = "Welcome to SwiftOTP";
    let title = "Verify your email";
    let message = "Welcome to SwiftOTP! To complete your registration and start buying secure phone numbers, please verify your email address by clicking the button below.";
    let buttonText = "Verify Email Address";

    if (actionType === 'recovery') {
        subject = "SwiftOTP Password Reset";
        title = "Reset your password";
        message = "We received a request to reset the password for your SwiftOTP account. If you made this request, please click the button below to choose a new password.";
        buttonText = "Reset Password";
    }

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
        .content p { color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
        .button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 16px; transition: background-color 0.2s; }
        .button:hover { background-color: #1d4ed8; }
        .footer { padding: 24px 40px; text-align: center; background-color: #fafafa; border-top: 1px solid #e4e4e7; }
        .footer p { color: #a1a1aa; font-size: 14px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ SwiftOTP</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>${message}</p>
          <a href="${verifyUrl}" class="button" style="color: #ffffff;">${buttonText}</a>
        </div>
        <div class="footer">
          <p>If you didn't request this email, you can safely ignore it.</p>
          <p style="margin-top: 8px;">© 2026 SwiftOTP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    if (!RESEND_API_KEY) {
        throw new Error("Missing RESEND_API_KEY environment variable");
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SwiftOTP Security <noreply@swiftotp.store>',
        to: email,
        subject: subject,
        html: html
      })
    });

    if (!res.ok) {
        const errData = await res.text();
        console.error("Resend Error:", errData);
        return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
