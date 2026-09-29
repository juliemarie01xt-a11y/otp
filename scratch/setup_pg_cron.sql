-- Enable the necessary extensions if they aren't already
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Schedule Check SMS (Every 1 minute)
SELECT cron.schedule(
  'cron-check-sms',
  '* * * * *',
  $$
    SELECT net.http_get(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-check-sms'
    );
  $$
);

-- 2. Schedule Cleanup (Every 5 minutes)
SELECT cron.schedule(
  'cron-cleanup',
  '*/5 * * * *',
  $$
    SELECT net.http_get(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-cleanup',
      headers:='{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    );
  $$
);

-- 3. Schedule Sync Prices (Every 12 hours)
SELECT cron.schedule(
  'cron-sync-prices',
  '0 */12 * * *',
  $$
    SELECT net.http_get(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-sync-prices',
      headers:='{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    );
  $$
);
