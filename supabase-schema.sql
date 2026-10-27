-- ========================================================
-- 👑 রাস্তার রাজা (Rastar Raja) · Supabase Database Schema
-- Creator: Abdul Al Jubayer
-- Project URL: https://ufnvwytkdvqcbzedkqmc.supabase.co
-- ========================================================

-- 1. Leaderboard Table
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
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

-- 3. Row Level Security (RLS) Setup
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Leaderboard policies (Idempotent)
DROP POLICY IF EXISTS "Allow public read on leaderboard" ON public.leaderboard;
CREATE POLICY "Allow public read on leaderboard"
    ON public.leaderboard FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert/update on leaderboard" ON public.leaderboard;
CREATE POLICY "Allow public insert/update on leaderboard"
    ON public.leaderboard FOR ALL
    USING (true)
    WITH CHECK (true);

-- Subscribers policies (Idempotent)
DROP POLICY IF EXISTS "Allow public insert on subscribers" ON public.subscribers;
CREATE POLICY "Allow public insert on subscribers"
    ON public.subscribers FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access on subscribers" ON public.subscribers;
CREATE POLICY "Allow service role full access on subscribers"
    ON public.subscribers FOR ALL
    USING (true);

-- 4. Seed initial top drivers if table is empty
INSERT INTO public.leaderboard (id, name, loss, all_time_best)
VALUES 
    ('1eaefa1d27fb', 'Abdul Al Jubayer', 25000000, 25000000),
    ('80f43c1df30d', 'রাস্তার রাজা (King)', 18500000, 18500000),
    ('3026728d4a27', 'বিকাশ ওস্তাদ', 16200000, 16200000),
    ('2f06c9618c89', 'লেগুনা রকেট', 14500000, 14500000),
    ('e9202009a2e0', 'সিএনজি সেলিম', 13200000, 13200000),
    ('be9a502f4ce7', 'টেসলা ড্রাইভার', 12400000, 12400000),
    ('eae75c8303eb', 'মিরপুর এক্সপ্রেস', 11800000, 11800000),
    ('5a4f4248366e', 'ফার্মগেট ফ্লাইয়ার', 10900000, 10900000),
    ('03dc97e616d6', 'গুলিস্তান বুলেট', 10500000, 10500000),
    ('a99afa069ac8', 'শাহবাগ ড্রিপ্টার', 10100000, 10100000)
ON CONFLICT (id) DO NOTHING;
