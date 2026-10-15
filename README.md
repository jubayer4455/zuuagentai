# ZUU AI Studio — All-In-One AI Chat, Image & Video Platform

![ZUU AI Studio](public/logo.svg)

> **ZUU AI Studio** is a unified AI production studio that gives you access to 460+ AI models through OpenRouter (Claude 3.5 Sonnet, GPT-4o, DeepSeek R1/V3, Gemini 2.0 Flash, Llama 3.3, and more), high-fidelity AI Image generation (Flux 1.1 Pro & SDXL), and AI Video Generation featuring HeyGen avatar presenters and text-to-video motion.

---

## 🌟 Key Features

### 1. 💬 AI Chat Studio
- **460+ OpenRouter Models**: Chat seamlessly with Anthropic (Claude 3.5 Sonnet / Opus), OpenAI (GPT-4o, o1, GPT-4o Mini), DeepSeek (R1 Reasoning, V3), Google (Gemini 2.0 Flash / Pro), Meta (Llama 3.3 70B), Mistral, Qwen, and free tier models.
- **DeepSeek R1 & o1 Reasoning Accordion**: View the full internal chain-of-thought and thinking tokens in a collapsible dark container.
- **Bilingual English & Bengali (বাংলা)**: Native support for conversational Bengali, translation, scriptwriting, and code generation.
- **Multimodal Vision AI**: Drag & drop or attach images to analyze them with vision models (GPT-4o, Claude 3.5 Sonnet, Gemini Flash).
- **Prompt Enhancer**: One-click AI prompt expansion to enrich instructions into detailed context.
- **Markdown & Code Highlighting**: Syntax-highlighted code blocks with one-click copy buttons.
- **Persistent Chat History**: Automatically saved locally and synchronized with Supabase.

### 2. 🎨 AI Image Studio
- **Flux 1.1 Pro & SDXL Engines**: State-of-the-art text-to-image synthesis powered by Pollinations AI and Flux.
- **Style Presets**: Photorealistic 8K, Cinematic 35mm Film, Cyberpunk Neon, Anime & Manga, 3D Pixar/Unreal Engine 5, Dark Fantasy, and Minimalist Vector.
- **Aspect Ratio Controls**: 1:1 Square, 16:9 Landscape, 9:16 Portrait / Reels, 4:3 Standard, and 21:9 Ultrawide Cinema.
- **AI Prompt Enhancer**: Transforms raw ideas into award-winning photography and lighting prompts.
- **Full Resolution Lightbox & Download**: Instant full-size preview and direct PNG download.

### 3. 🎬 AI Video Studio & HeyGen Presenters
- **HeyGen AI Avatars**: Choose from top executive, business, news anchor, and casual avatars (Wayne, Angela, Tyler, Monica).
- **Multilingual Speaking Voices**: US English, UK English, and Bengali (Nabanita & Pradeep neural voices).
- **AI Video Scriptwriter**: Generate high-converting 15s, 30s, or 60s video scripts with OpenRouter in seconds.
- **AI Motion Video (Text-to-Video)**: Generate dynamic video scenes with camera movements (Cinematic Zoom In, Smooth Pan Right, 360 Orbit Camera, Aerial Drone Shot, Epic Tilt Up).
- **Video Player & MP4 Export**: Built-in video player with looping and direct MP4 file downloads.

### 4. 🧠 OpenRouter Model Explorer
- **Live Directory of 460+ Models**: Search by model name, provider, or architecture.
- **Category Filtering**: Free Models, OpenAI, Anthropic, Google, DeepSeek, Meta, and Vision/Multimodal.
- **Transparent Metrics**: Real-time context window sizes, input/output pricing per 1M tokens, and direct "Chat with this Model" launcher.

### 5. ⚙️ Settings & Security
- **Configured OpenRouter Key**: Built-in default key with live connection validator, daily quota tracker, and custom key override.
- **HeyGen API Key**: Dedicated field with test connection and avatar preview.
- **Supabase Cloud Sync**: Effortless sync with Supabase PostgreSQL or offline localStorage fallback.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Zustand.
- **Backend & Serverless**: Vercel Serverless Functions (`/api/chat`, `/api/models`, `/api/health`).
- **Database & Sync**: Supabase PostgreSQL + Row Level Security (RLS).
- **AI Gateway**: OpenRouter API (`https://openrouter.ai/api/v1/`).
- **Image Engine**: Pollinations AI (Flux 1.1 Pro, SDXL Turbo, Midjourney aesthetic).
- **Video Engine**: HeyGen API v2 & AI Motion Video diffusion.

---

## 🚀 Quick Start & Deployment

### 1. Local Development
```bash
# Clone the repository
git clone https://github.com/jubayer4455/zuuagentai.git
cd zuuagentai

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Environment Variables (.env)
```ini
# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
VITE_OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here

# Supabase Credentials
VITE_SUPABASE_URL=https://zlotgghqdfrbxeuinjjy.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: HeyGen API Key
HEYGEN_API_KEY=your-heygen-api-key
VITE_HEYGEN_API_KEY=your-heygen-api-key
```

### 3. Deploy to Vercel
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and import `zuuagentai`.
3. Add the environment variables from your `.env` file.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Click **Deploy**.

---

## 📄 License
MIT License.
