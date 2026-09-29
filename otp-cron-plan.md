# Automated OTP Forwarding Plan

To implement the Automated OTP Forwarding with a 1-Minute Cron and Manual Button support, we need to ensure that **no matter who checks for the OTP (the Cron or the User clicking a button)**, the Telegram Bot always gets notified instantly.

Here is the step-by-step plan:

### 1. Centralize the Telegram Ping Logic
Right now, `src/app/api/vsim/status/route.ts` is the master endpoint that checks if an OTP has arrived from the telecom providers. 
I will modify this file so that when it detects `STATUS_OK:<code>`, it will:
1. Update the database to `COMPLETED`.
2. Look up the user's `telegram_id` in the database.
3. If they have a linked Telegram account, it will instantly ping them with the OTP using the Telegram API!

Because we are centralizing this logic, **if the user clicks "Check SMS" manually on the website, they will instantly receive the code on Telegram too!**

### 2. Create a "Check Active" Bot Command
I will add a new button/command to the Telegram Bot (e.g., `/active`).
When the user clicks this, the Bot Brain (`src/app/api/bot/command/route.ts`) will loop through all their `PENDING` activations and call the centralized status checker. This acts as the "Manual Button" for the Telegram Bot!

### 3. Build the Supabase Edge Function Cron Job
Finally, I will create a brand new Supabase Edge Function (e.g., `otp-cron`). 
This function will run every 1 minute.
It will:
1. Query the database for all `PENDING` activations across ALL users.
2. For each pending activation, it will trigger the centralized `/api/vsim/status?id=...` check.
3. Because the logic is centralized (Step 1), the API will handle checking the telecom provider, updating the DB, and automatically firing off the Telegram notifications if an OTP is found!

### Summary
By updating the core status API route, the Website, the Telegram Bot Button, and the Cron Job will all share the exact same logic. You will never have a race condition where a code is found but the bot doesn't send it!

**Shall I begin implementing Step 1?**
