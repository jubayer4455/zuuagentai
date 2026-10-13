-- ==============================================================================
-- Zuu Agent Migration 006: n8n Parity Tables, Integrations, and Atomic Job Engine
-- Description: Creates explicit parity tables for full-stack n8n workflow migration:
--              - profiles (ensured/verified)
--              - agents, agent_tools, schedules, jobs, executions (enhanced fields)
--              - generated_content
--              - publishing_accounts
--              - google_sheets_integrations
--              - application_settings
--              - claim_due_jobs() atomic claiming function with FOR UPDATE SKIP LOCKED
-- ==============================================================================

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enhanced columns on 'jobs' table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'scheduled_at') THEN
    ALTER TABLE public.jobs ADD COLUMN scheduled_at TIMESTAMPTZ DEFAULT NOW();
    UPDATE public.jobs SET scheduled_at = scheduled_for WHERE scheduled_at IS NULL AND scheduled_for IS NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'attempts') THEN
    ALTER TABLE public.jobs ADD COLUMN attempts INT DEFAULT 0;
    UPDATE public.jobs SET attempts = attempt_count WHERE attempts IS NULL AND attempt_count IS NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'started_at') THEN
    ALTER TABLE public.jobs ADD COLUMN started_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'completed_at') THEN
    ALTER TABLE public.jobs ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Enhanced columns on 'executions' table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'executions' AND column_name = 'job_id') THEN
    ALTER TABLE public.executions ADD COLUMN job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'executions' AND column_name = 'input_summary') THEN
    ALTER TABLE public.executions ADD COLUMN input_summary TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'executions' AND column_name = 'output_summary') THEN
    ALTER TABLE public.executions ADD COLUMN output_summary TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'executions' AND column_name = 'error_message') THEN
    ALTER TABLE public.executions ADD COLUMN error_message TEXT;
    UPDATE public.executions SET error_message = error_summary WHERE error_message IS NULL AND error_summary IS NOT NULL;
  END IF;
END $$;

-- 4. generated_content table
CREATE TABLE IF NOT EXISTS public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.executions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'published')),
  published_post_id VARCHAR(255),
  published_post_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_content_agent ON public.generated_content(agent_id);
CREATE INDEX IF NOT EXISTS idx_gen_content_approval ON public.generated_content(approval_status);
CREATE INDEX IF NOT EXISTS idx_gen_content_created ON public.generated_content(created_at DESC);

-- 5. publishing_accounts table
CREATE TABLE IF NOT EXISTS public.publishing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL DEFAULT 'facebook',
  account_identifier VARCHAR(255) NOT NULL, -- Facebook Page ID
  account_name VARCHAR(255) NOT NULL,
  page_access_token_vault_key VARCHAR(255),
  encrypted_token TEXT,
  app_secret_vault_key VARCHAR(255),
  scopes TEXT[] DEFAULT ARRAY['pages_manage_posts', 'pages_read_engagement', 'pages_show_list']::text[],
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_verified_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, account_identifier)
);

CREATE INDEX IF NOT EXISTS idx_pub_accounts_platform ON public.publishing_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_pub_accounts_active ON public.publishing_accounts(is_active);

-- 6. google_sheets_integrations table
CREATE TABLE IF NOT EXISTS public.google_sheets_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Social Media Log Sheet',
  spreadsheet_id VARCHAR(255) NOT NULL,
  sheet_name VARCHAR(255) NOT NULL DEFAULT 'Sheet1',
  auth_type VARCHAR(50) NOT NULL DEFAULT 'service_account' CHECK (auth_type IN ('service_account', 'oauth2')),
  credentials_vault_key VARCHAR(255),
  encrypted_credentials TEXT,
  column_mapping JSONB DEFAULT '{
    "timestamp": "A",
    "agent_name": "B",
    "content": "C",
    "status": "D",
    "facebook_post_id": "E",
    "error_details": "F"
  }'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gsheets_agent ON public.google_sheets_integrations(agent_id);
CREATE INDEX IF NOT EXISTS idx_gsheets_active ON public.google_sheets_integrations(is_active);

-- 7. application_settings table
CREATE TABLE IF NOT EXISTS public.application_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default application settings
INSERT INTO public.application_settings (setting_key, setting_value, description)
VALUES 
  ('timezone', '"Asia/Dhaka"'::jsonb, 'Default platform operational timezone'),
  ('global_dry_run', 'true'::jsonb, 'Global dry-run switch preventing external mutations'),
  ('max_daily_posts', '5'::jsonb, 'Default max daily social posts per agent'),
  ('log_retention_days', '30'::jsonb, 'Execution logs retention window for free-tier storage optimization')
ON CONFLICT (setting_key) DO NOTHING;

-- 8. Atomic Job Claiming Procedure: claim_due_jobs
CREATE OR REPLACE FUNCTION public.claim_due_jobs(
  p_worker_id TEXT DEFAULT 'worker-edge-1',
  p_batch_size INT DEFAULT 5
)
RETURNS TABLE (
  job_id UUID,
  agent_id UUID,
  schedule_id UUID,
  task_type VARCHAR,
  payload JSONB,
  idempotency_key VARCHAR,
  attempts INT,
  scheduled_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH candidate_jobs AS (
    SELECT j.id
    FROM public.jobs j
    WHERE (j.status = 'queued' OR j.status = 'pending')
      AND COALESCE(j.scheduled_at, j.scheduled_for, NOW()) <= NOW()
    ORDER BY COALESCE(j.scheduled_at, j.scheduled_for) ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.jobs j
  SET 
    status = 'locked',
    locked_by = p_worker_id,
    locked_at = NOW(),
    started_at = COALESCE(j.started_at, NOW()),
    attempt_count = COALESCE(j.attempt_count, 0) + 1,
    attempts = COALESCE(j.attempts, 0) + 1,
    updated_at = NOW()
  FROM candidate_jobs
  WHERE j.id = candidate_jobs.id
  RETURNING 
    j.id,
    j.agent_id,
    j.schedule_id,
    j.task_type,
    j.payload,
    j.idempotency_key,
    COALESCE(j.attempts, j.attempt_count),
    COALESCE(j.scheduled_at, j.scheduled_for);
END;
$$;

-- 9. Row Level Security (RLS) on newly created tables
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheets_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;

-- Service Role Key has full unrestricted access
CREATE POLICY "Service role full access on generated_content" ON public.generated_content FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on publishing_accounts" ON public.publishing_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on google_sheets_integrations" ON public.google_sheets_integrations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on application_settings" ON public.application_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated Users Policies (Admin write, Operator read)
CREATE POLICY "Auth users can view generated_content" ON public.generated_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert/update generated_content" ON public.generated_content FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND system_role IN ('master_admin', 'admin', 'operator', 'reviewer'))
);

CREATE POLICY "Auth users can view publishing_accounts" ON public.publishing_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage publishing_accounts" ON public.publishing_accounts FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND system_role IN ('master_admin', 'admin'))
);

CREATE POLICY "Auth users can view google_sheets_integrations" ON public.google_sheets_integrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage google_sheets_integrations" ON public.google_sheets_integrations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND system_role IN ('master_admin', 'admin'))
);

CREATE POLICY "Auth users can view application_settings" ON public.application_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage application_settings" ON public.application_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND system_role IN ('master_admin', 'admin'))
);

-- Public / Anon safe read policies for Overview dashboards
CREATE POLICY "Anon can view public application_settings" ON public.application_settings FOR SELECT TO anon USING (is_encrypted = FALSE);
CREATE POLICY "Anon can view generated_content" ON public.generated_content FOR SELECT TO anon USING (true);
