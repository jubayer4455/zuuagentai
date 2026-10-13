-- ==============================================================================
-- Zuu Agent Migration 007: Supabase pg_cron & pg_net Automated Dispatcher
-- Description: Enables pg_cron and pg_net extensions and configures recurring
--              invocations to the protected dispatch-jobs Edge Function.
-- ==============================================================================

-- 1. Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Clean up any existing Zuu Agent cron jobs to prevent duplicates
SELECT cron.unschedule('zuu-agent-hourly-dispatcher')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'zuu-agent-hourly-dispatcher');

SELECT cron.unschedule('zuu-agent-daily-prime-dhaka')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'zuu-agent-daily-prime-dhaka');

-- 3. Schedule Recurring Job Dispatcher
-- Note: Replace YOUR_PROJECT_REF and YOUR_CRON_SECRET_TOKEN with your actual project details
-- in production.
-- Schedule 1: Periodic dispatcher (Every 15 minutes or hourly)
SELECT cron.schedule(
  'zuu-agent-hourly-dispatcher',
  '0 * * * *', -- At minute 0 of every hour
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('request.headers', true)::json->>'host' || '/functions/v1/dispatch-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.cron_secret', true), 'internal_cron_secret')
    ),
    body := '{"source": "pg_cron"}'::jsonb
  );
  $$
);

-- Schedule 2: Daily Prime Afternoon Slot (2:00 PM Asia/Dhaka = 08:00 AM UTC)
SELECT cron.schedule(
  'zuu-agent-daily-prime-dhaka',
  '0 8 * * *', -- 08:00 UTC = 14:00 Dhaka (UTC+6)
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('request.headers', true)::json->>'host' || '/functions/v1/dispatch-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.cron_secret', true), 'internal_cron_secret')
    ),
    body := '{"slot": "afternoon_dhaka", "source": "pg_cron"}'::jsonb
  );
  $$
);

-- 4. Stale Lock Recovery Stored Procedure
CREATE OR REPLACE FUNCTION public.recover_stale_job_locks(p_stale_interval INTERVAL DEFAULT INTERVAL '10 minutes')
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recovered INT;
BEGIN
  UPDATE public.jobs
  SET 
    status = 'pending',
    locked_by = NULL,
    locked_at = NULL,
    updated_at = NOW()
  WHERE status = 'locked'
    AND locked_at < (NOW() - p_stale_interval);

  GET DIAGNOSTICS v_recovered = ROW_COUNT;
  RETURN v_recovered;
END;
$$;
