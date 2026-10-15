# ZUU AI Studio Database Migrations

This folder contains the database migrations for **ZUU AI Studio** on Supabase.

## Tables Included:
- `system_settings`: JSON Key-Value store for cloud syncing user preferences, active models, and cached states.
- `chat_conversations`: Multi-turn chat sessions with system prompts and model configurations.
- `chat_messages`: User and AI messages, including reasoning chain-of-thought tokens and image attachments.
- `generated_images`: Full history of synthesized images with styles, models, and aspect ratios.
- `generated_videos`: HeyGen and AI motion video generation logs with scripts and video URLs.

## How to Apply:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to your project -> **SQL Editor**.
3. Copy the contents of `20261015000001_zuu_ai_studio_init.sql` and click **Run**.
4. The tables and RLS policies will be created immediately.
