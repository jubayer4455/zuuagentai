-- ========================================================
-- 👑 রাস্তার রাজা (Rastar Raja) · Supabase Database Schema
-- Creator: Abdul Al Jubayer
-- Project: https://zlotgghqdfrbxeuinjjy.supabase.co
-- ========================================================

-- 1. Leaderboard Table
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    loss BIGINT NOT NULL DEFAULT 0,
    week_scores JSONB DEFAULT '{}'::jsonb,
    all_time_best BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Subscribers Table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Leaderboard policies
CREATE POLICY "Allow public read on leaderboard"
    ON public.leaderboard FOR SELECT
    USING (true);

CREATE POLICY "Allow full access with service role on leaderboard"
    ON public.leaderboard FOR ALL
    USING (true);

-- Subscribers policies
CREATE POLICY "Allow public insert on subscribers"
    ON public.subscribers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow full access with service role on subscribers"
    ON public.subscribers FOR ALL
    USING (true);
