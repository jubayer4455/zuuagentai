import crypto from 'crypto';

// Supabase Cloud Credentials for Rastar Raja
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ufnvwytkdvqcbzedkqmc.supabase.co';
export const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbnZ3eXRrZHZxY2J6ZWRrcW1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzA5ODkxMywiZXhwIjoyMTA4Njc0OTEzfQ.2nNuqs1eDYKrHfSZxCnr_NOK4NcB2GzUrNGarGmVnnI';
export const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbnZ3eXRrZHZxY2J6ZWRrcW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTg5MTMsImV4cCI6MjEwODY3NDkxM30.yeo3equFRJd1VH1c7sH9aTUvzbx8l4-7vOVGoFzEF2g';

export const DEFAULT_TOP = [
  { id: "1eaefa1d27fb", name: "Abdul Al Jubayer", loss: 25000000 },
  { id: "80f43c1df30d", name: "রাস্তার রাজা (King)", loss: 18500000 },
  { id: "3026728d4a27", name: "বিকাশ ওস্তাদ", loss: 16200000 },
  { id: "2f06c9618c89", name: "লেগুনা রকেট", loss: 14500000 },
  { id: "e9202009a2e0", name: "সিএনজি সেলিম", loss: 13200000 },
  { id: "be9a502f4ce7", name: "টেসলা ড্রাইভার", loss: 12400000 },
  { id: "eae75c8303eb", name: "মিরপুর এক্সপ্রেস", loss: 11800000 },
  { id: "5a4f4248366e", name: "ফার্মগেট ফ্লাইয়ার", loss: 10900000 },
  { id: "03dc97e616d6", name: "গুলিস্তান বুলেট", loss: 10500000 },
  { id: "a99afa069ac8", name: "শাহবাগ ড্রিপ্টার", loss: 10100000 },
  { id: "0c447eace196", name: "উড়ন্ত রিকশা", loss: 8700000 },
  { id: "4f8729c795dd", name: "পাবলিক কফিন", loss: 7900000 },
  { id: "920adbffb51f", name: "নো লাইসেন্স নো ব্রেক", loss: 6800000 },
  { id: "14ba1f545855", name: "ট্র্যাফিক দানব", loss: 6200000 },
  { id: "b85b0e5286ba", name: "ওস্তাদ সাব", loss: 5900000 },
  { id: "3ec3bc9dcfbc", name: "ব্রেকের তার ছেঁড়া", loss: 5400000 },
  { id: "8b593f8f92ac", name: "কালো রকেট", loss: 5100000 },
  { id: "988ae63759e4", name: "স্পিডি ভূত", loss: 4900000 },
  { id: "4da5c15ac4d3", name: "অটো সুলতান", loss: 4700000 },
  { id: "39de0f616692", name: "হাতিরঝিল রাইডার", loss: 4500000 }
];

export function getWeekString(timestamp = Date.now()) {
  const t = Math.floor((timestamp + 216e5) / 864e5);
  return new Date((t - ((t + 5) % 7)) * 864e5).toISOString().slice(0, 10);
}

export function sha256Hex12(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 12);
}

// Global in-memory cache for serverless environment
export const memoryStore = {
  users: {},
  activeRuns: {}
};

export async function fetchLeaderboardFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?select=*&order=loss.desc&limit=50`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(r => ({
          id: r.id,
          name: r.name || '',
          loss: Number(r.loss) || 0
        }));
      }
    }
  } catch (_) {
    // Graceful offline fallback
  }
  return null;
}

export async function syncScoreToSupabase(entry) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: entry.id,
        name: entry.name || '',
        loss: entry.loss,
        all_time_best: entry.loss,
        updated_at: new Date().toISOString()
      })
    });
  } catch (_) {
    // Non-blocking graceful fallback
  }
}

export async function syncSubscriberToSupabase(email) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify({ email })
    });
  } catch (_) {
    // Non-blocking graceful fallback
  }
}

export async function getLeaderboard() {
  const currentWeek = getWeekString();
  const weekList = [];
  const allList = [];

  // Try Supabase cloud database first
  const supabaseRows = await fetchLeaderboardFromSupabase();
  if (supabaseRows && supabaseRows.length > 0) {
    for (const row of supabaseRows) {
      weekList.push(row);
      allList.push(row);
    }
  }

  // Merge in-memory users
  for (const [device, u] of Object.entries(memoryStore.users)) {
    const id = sha256Hex12(device);
    const name = u.name || '';
    const weekLoss = (u.weekScores && u.weekScores[currentWeek]) || 0;
    const allLoss = u.allTimeBest || 0;

    if (weekLoss > 0 && !weekList.some(x => x.id === id)) {
      weekList.push({ id, name, loss: weekLoss });
    }
    if (allLoss > 0 && !allList.some(x => x.id === id)) {
      allList.push({ id, name, loss: allLoss });
    }
  }

  // Backfill with DEFAULT_TOP if needed
  if (weekList.length < 20) {
    for (const item of DEFAULT_TOP) {
      if (!weekList.some(x => x.id === item.id)) {
        weekList.push(item);
      }
    }
  }

  if (allList.length < 10) {
    for (const item of DEFAULT_TOP.slice(0, 10)) {
      if (!allList.some(x => x.id === item.id)) {
        allList.push(item);
      }
    }
  }

  weekList.sort((a, b) => b.loss - a.loss);
  allList.sort((a, b) => b.loss - a.loss);

  const top20 = weekList.slice(0, 20);
  const top10All = allList.slice(0, 10);
  const cut = top20.length >= 20 ? top20[top20.length - 1].loss : 50;

  return {
    ok: true,
    week: currentWeek,
    top: top20,
    all: top10All,
    cut
  };
}
