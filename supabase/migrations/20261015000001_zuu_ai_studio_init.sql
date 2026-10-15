-- ==============================================================================
-- ZUU AI STUDIO — DATABASE INITIALIZATION MIGRATION
-- Supports: AI Chat Sessions, Generated Images, Generated Videos & App Settings
-- ==============================================================================

-- 1. System Settings & Cloud Sync Store (Key-Value JSON store)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key VARCHAR(150) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chat Conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New Conversation',
  model TEXT NOT NULL DEFAULT 'liquid/lfm-2.5-2.6b:free',
  system_prompt TEXT,
  temperature NUMERIC(3, 2) DEFAULT 0.70,
  max_tokens INT DEFAULT 4096,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  reasoning TEXT,
  model TEXT,
  image_url TEXT,
  tokens INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Generated Images
CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  model TEXT NOT NULL DEFAULT 'flux',
  image_url TEXT NOT NULL,
  width INT DEFAULT 1024,
  height INT DEFAULT 1024,
  aspect_ratio VARCHAR(20) DEFAULT '1:1',
  style VARCHAR(50) DEFAULT 'photorealistic',
  seed BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Generated Videos
CREATE TABLE IF NOT EXISTS public.generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  script TEXT,
  model TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  avatar_id TEXT,
  voice_id TEXT,
  aspect_ratio VARCHAR(20) DEFAULT '16:9',
  status VARCHAR(20) DEFAULT 'completed',
  duration INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated read and write with anon key
DROP POLICY IF EXISTS "Public access to system_settings" ON public.system_settings;
CREATE POLICY "Public access to system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to chat_conversations" ON public.chat_conversations;
CREATE POLICY "Public access to chat_conversations" ON public.chat_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to chat_messages" ON public.chat_messages;
CREATE POLICY "Public access to chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to generated_images" ON public.generated_images;
CREATE POLICY "Public access to generated_images" ON public.generated_images FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to generated_videos" ON public.generated_videos;
CREATE POLICY "Public access to generated_videos" ON public.generated_videos FOR ALL USING (true) WITH CHECK (true);
