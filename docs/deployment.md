# Zuu Agent — Production Deployment & DevOps Guide

> **Universal Multi-Agent AI Automation Platform**  
> **Target Infrastructure:** Vercel (Frontend & Serverless API) • Supabase (PostgreSQL, pg_cron & Deno Edge Functions) • GitHub  
> **Official APIs:** Google Gemini REST API • Meta Graph API v21.0 • Google Sheets API v4

---

## 1. Environment Variable Architecture & Security

Sensitive server secrets must **NEVER** be committed to GitHub or exposed to client-side bundles.

| Variable Name | Required Scope | Hosting Environment | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Public / Client | Vercel (All) & Local `.env` | Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Public / Client | Vercel (All) & Local `.env` | Supabase Anon Public API Key with RLS enforcement |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret / Server Only** | Vercel & Supabase Edge Secrets | Elevated service role key for job claiming & worker mutations |
| `GEMINI_API_KEY` | **Secret / Server Only** | Vercel & Supabase Edge Secrets | Google AI Studio Gemini API Key |
| `FB_PAGE_ID` | Server / Dashboard | Vercel & Supabase Secrets | Target Facebook Page ID (e.g. `109847291834910`) |
| `FB_PAGE_ACCESS_TOKEN` | **Secret / Server Only** | Vercel & Supabase Secrets | Permanent never-expiring Facebook Page Access Token |
| `GOOGLE_SPREADSHEET_ID` | Server / Dashboard | Vercel & Supabase Secrets | Target Google Spreadsheet ID |
| `GOOGLE_SHEETS_ACCESS_TOKEN` | **Secret / Server Only** | Vercel & Supabase Secrets | Google OAuth or Service Account token |
| `CRON_SECRET_TOKEN` | **Secret / Server Only** | Vercel & Supabase Secrets | Bearer token authenticating pg_cron calls to `/functions/v1/dispatch-jobs` |
| `APP_ENCRYPTION_KEY` | **Secret / Server Only** | Vercel & Supabase Secrets | 32-byte hex key for encrypting stored secrets at rest |

---

## 2. Supabase Database Deployment

### Step 2.1: Run SQL Migrations in Order
In your Supabase project dashboard, navigate to **SQL Editor** -> **New Query** and execute:
1. `supabase/migrations/20261012000001_initial_schema.sql` (Core 32 normalized tables)
2. `supabase/migrations/20261012000002_rls_policies.sql` (Role-based access controls)
3. `supabase/migrations/20261012000003_seed_data.sql` (Default models and seed agents)
4. `supabase/migrations/20261012000004_auth_bootstrap_and_persistence.sql` (Master Admin auto-provisioning)
5. `supabase/migrations/20261013000005_social_posts_and_hardening.sql` (Social posts, hashing, deduplication)
6. `supabase/migrations/20261013000006_parity_tables.sql` (n8n parity tables, `claim_due_jobs` procedure)
7. `supabase/migrations/20261013000007_pg_cron_setup.sql` (Supabase pg_cron and pg_net dispatcher)

---

## 3. Supabase Edge Functions Deployment

Deploy Deno-compatible Edge Functions to your Supabase project:

```bash
# 1. Login to Supabase CLI
npx supabase login

# 2. Link your remote project
npx supabase link --project-ref your-project-ref

# 3. Set remote secrets in Supabase Vault
npx supabase secrets set \
  GEMINI_API_KEY="AIzaSy..." \
  FB_PAGE_ID="109847291834910" \
  FB_PAGE_ACCESS_TOKEN="EAA..." \
  GOOGLE_SPREADSHEET_ID="1BxiMVs..." \
  GOOGLE_SHEETS_ACCESS_TOKEN="ya29.a0..." \
  CRON_SECRET_TOKEN="your_secure_32_char_token"

# 4. Deploy Edge Functions
npx supabase functions deploy run-agent --no-verify-jwt
npx supabase functions deploy dispatch-jobs --no-verify-jwt
```

---

## 4. Vercel Deployment (Frontend & Serverless API)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat(parity): implement full-stack n8n parity architecture"
   git push origin main
   ```
2. Navigate to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository (`zuuagent`).
4. Set Build Settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Configure the Environment Variables listed in Section 1 in the Vercel dashboard.
6. Click **Deploy**.

---

## 5. API Setup Instructions

### Google Gemini API Setup
1. Visit [aistudio.google.com](https://aistudio.google.com) and sign in.
2. Click **Get API key** -> **Create API key in new project**.
3. Copy the key (`AIzaSy...`) and add it as `GEMINI_API_KEY` in Vercel and Supabase Secrets.

### Meta Graph API Setup
1. Create a Business App at [developers.facebook.com](https://developers.facebook.com).
2. Add **Facebook Login for Business** and **Graph API** products.
3. In Graph API Explorer, request `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`.
4. Exchange for a long-lived Page Token via:
   ```bash
   GET https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}
   ```
5. Call `GET /me/accounts` to retrieve your permanent Page Access Token.

### Google Sheets API Setup
1. Go to [console.cloud.google.com](https://console.cloud.google.com) and enable the **Google Sheets API**.
2. Create a **Service Account** and download its JSON key.
3. Share your target Google Spreadsheet with the service account email as **Editor**.
4. Configure the Spreadsheet ID and tab name in Zuu Agent's **Google Sheets Integration** dashboard.

---

## 6. Backup, Recovery & Maintenance

- **Configuration Backup:** Use the **Backup & Restore** dashboard tab (`/backup-restore`) to download a zero-secret JSON snapshot of your agent configurations, prompt templates, and schedules.
- **Stale Lock Recovery:** If an Edge worker is terminated mid-flight, stale locks are automatically recovered after 10 minutes via `SELECT public.recover_stale_job_locks();`.
- **Log Pruning:** Free-tier database size is kept under 500 MB by the automatic 30-day retention cleanup window configured in `application_settings`.
