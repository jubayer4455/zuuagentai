# Supabase Database Migrations & Schema Architecture

This directory contains the sequential SQL migrations for **Zuu Agent — Universal Multi-Agent AI Automation Platform**.

---

## 📋 Migration Sequence

Execute migrations in numerical order:

| File | Description | Key Tables & Entities |
|---|---|---|
| `20261012000001_initial_schema.sql` | Core schema (32 tables) | `organizations`, `profiles`, `ai_providers`, `agents`, `jobs`, `executions`, `schedules`, `tool_registry` |
| `20261012000002_rls_policies.sql` | Row Level Security policies | RBAC rules for `master_admin`, `admin`, `operator`, `reviewer`, `viewer` |
| `20261012000003_seed_data.sql` | Base seed fixtures | Default providers (`gemini`, `openai`), default models, seed agents (`Trollogiya`) |
| `20261012000004_auth_bootstrap_and_persistence.sql` | First-admin auto-bootstrap | Profile triggers, `handle_new_user()`, system settings persistence |
| `20261013000005_social_posts_and_hardening.sql` | Social post tracking & deduplication | `public.social_posts`, content hashing, idempotency indexes |
| `20261013000006_parity_tables.sql` | n8n Full Parity tables & atomic job engine | `generated_content`, `publishing_accounts`, `google_sheets_integrations`, `application_settings`, `claim_due_jobs()` |

---

## 🚀 How to Apply Migrations

### Method 1: Supabase CLI (Recommended for DevOps)
1. Link your Supabase project:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
2. Push all pending migrations:
   ```bash
   npx supabase db push
   ```

### Method 2: Supabase Dashboard SQL Editor
1. Log in to [supabase.com/dashboard](https://supabase.com/dashboard) and select your project.
2. Navigate to **SQL Editor** -> **New Query**.
3. Paste the contents of each file from `001` to `006` in sequential order and click **Run**.

---

## 🔒 Security & Least Privilege

- **Row Level Security (RLS)** is enabled on all tables.
- **Service Role Key:** Only server-side Edge Functions and authenticated backend API routes run under `service_role` to claim jobs and mutate external integrations.
- **Anon Public Access:** Restricted to read-only summary metrics on public dashboards. Sensitive secrets, tokens, and system settings are strictly blocked.
- **Admins & Operators:** Write access to `agents`, `schedules`, `publishing_accounts`, and `google_sheets_integrations` requires an authenticated profile with `master_admin` or `admin` role.
