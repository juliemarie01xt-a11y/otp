# 🌐 Domain Migration Guide

If you ever decide to change your domain name (currently `swiftotp.store`) to something else (like `newdomain.com`), you need to update several services across your project. 

Follow this checklist step-by-step to ensure your website, emails, bot, and payments continue working perfectly.

---

## 1. Codebase Updates (GitHub)
You will need to search and replace the old domain with the new domain in these specific files:

**A. Edge Functions (Supabase)**
- `supabase/functions/send-auth-email/index.ts`
  - Update `siteUrl`: `const siteUrl = 'https://newdomain.com';`
  - Update sender email: `from: 'SwiftOTP Security <noreply@newdomain.com>',`

**B. Next.js API Routes**
- `src/app/api/user/send-link-otp/route.ts`
  - Update sender email: `from: 'SwiftOTP Security <noreply@newdomain.com>',`
- `src/app/api/bot/command/route.ts`
  - Update the fallback host: `const host = headersList.get('host') || 'newdomain.com';`
  - Update any hardcoded links in the Welcome message HTML.
- `src/app/api/deposit/route.ts`
  - Update the fallback host: `const host = request.headers.get('host') || 'newdomain.com';`

*After changing these files, commit and push them to GitHub so Vercel can rebuild the site.*
*Don't forget to redeploy your edge function: `supabase functions deploy send-auth-email --no-verify-jwt`*

---

## 2. Vercel Configuration
1. Go to your project on [Vercel](https://vercel.com).
2. Click **Settings** > **Domains**.
3. Type in your `newdomain.com` and click **Add**.
4. Vercel will give you the DNS records (usually an `A` record or `CNAME`). 
5. Go to your Domain Registrar (Namecheap, GoDaddy, etc.) and add those DNS records.
6. Wait for Vercel to issue the SSL certificate.

---

## 3. Supabase Configuration
Supabase needs to know your new domain so it can redirect users securely after login.

1. Go to **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2. **Site URL:** Change this to `https://newdomain.com`.
3. **Redirect URLs:** Click "Add URL" and type exactly: `https://newdomain.com/**`
4. Click Save.

---

## 4. Resend (Email Delivery)
You cannot send emails from `@swiftotp.store` if your website is `newdomain.com`. You must verify the new domain.

1. Go to [Resend Dashboard](https://resend.com/domains).
2. Click **Add Domain** and enter `newdomain.com`.
3. Resend will generate several DNS records (TXT, MX).
4. Go to your Domain Registrar and add ALL of these records.
5. Wait for the domain to say **"Verified"** in Resend.
*(Once verified, the codebase updates in Step 1 will automatically start sending from this new domain).*

---

## 5. Plisio (Crypto Payments)
Plisio needs to know where to send successful payment notifications.

1. Go to your [Plisio Dashboard](https://plisio.net).
2. Go to **API / Store Settings**.
3. Find the **White Label / Webhook URL** field.
4. Update it to: `https://newdomain.com/api/plisio/webhook`
5. Save changes.

---

## 6. Telegram Bot Webhook
Telegram is currently sending all bot messages to `swiftotp.store`. You must tell Telegram to send them to the new domain.

Open your web browser and paste this EXACT link (replace the placeholders):

`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://newdomain.com/api/bot/command&secret_token=<YOUR_SECRET_TOKEN>`

If successful, the browser will say: `{"ok":true,"result":true,"description":"Webhook was set"}`.

---

### 🎉 Migration Complete
Once you have completed these 6 steps, your entire infrastructure is fully migrated to the new domain!
