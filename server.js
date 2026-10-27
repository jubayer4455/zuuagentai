import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Bangladesh week calculator: Sat 00:00 UTC+6
function getWeekString(timestamp = Date.now()) {
  const t = Math.floor((timestamp + 216e5) / 864e5);
  return new Date((t - ((t + 5) % 7)) * 864e5).toISOString().slice(0, 10);
}

function sha256Hex12(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 12);
}

// Initial leaderboard seeds matching baperrasta.com
const DEFAULT_TOP = [
  { id: "1eaefa1d27fb", name: "MUHEDUL ISLAM R.", loss: 20455500 },
  { id: "80f43c1df30d", name: "ShakirMesbah", loss: 14437200 },
  { id: "3026728d4a27", name: "negroponte", loss: 12842400 },
  { id: "2f06c9618c89", name: "Racist", loss: 12550350 },
  { id: "e9202009a2e0", name: "ShakirMesbah", loss: 11116750 },
  { id: "be9a502f4ce7", name: "ShakirMesbah", loss: 11099000 },
  { id: "eae75c8303eb", name: "ShakirMesbah", loss: 10740300 },
  { id: "5a4f4248366e", name: "kim jong un", loss: 10424900 },
  { id: "03dc97e616d6", name: "ifte the pilot", loss: 10314700 },
  { id: "a99afa069ac8", name: "ShakirMesbah", loss: 10303300 },
  { id: "0c447eace196", name: "mist er tazbir", loss: 7067050 },
  { id: "4f8729c795dd", name: "MINHAZUL AREFIN", loss: 6339000 },
  { id: "920adbffb51f", name: "sinister sm", loss: 5731000 },
  { id: "14ba1f545855", name: "lutuputu", loss: 5690600 },
  { id: "b85b0e5286ba", name: "Ramisha i love.", loss: 5648700 },
  { id: "3ec3bc9dcfbc", name: "Deshi Driver", loss: 5162050 },
  { id: "8b593f8f92ac", name: "Kalo Rickshaw C.", loss: 5093300 },
  { id: "988ae63759e4", name: "Speedy Vooter", loss: 4955550 },
  { id: "4da5c15ac4d3", name: "Artho rickshaw", loss: 4894850 },
  { id: "39de0f616692", name: "Meheher", loss: 4863450 }
];

let db = {
  currentWeek: getWeekString(),
  users: {}, // device -> { pass, name, weekScores: { [week]: bestLoss }, allTimeBest: bestLoss }
  activeRuns: {} // token -> { device, pass, startTime }
};

if (fs.existsSync(LEADERBOARD_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed reading leaderboard file, using fresh db');
  }
}

function saveDb() {
  fs.writeFile(LEADERBOARD_FILE, JSON.stringify(db, null, 2), () => {});
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

function getLeaderboard() {
  const currentWeek = getWeekString();
  const weekList = [];
  const allList = [];

  for (const [device, u] of Object.entries(db.users)) {
    const id = sha256Hex12(device);
    const name = u.name || '';
    const weekLoss = (u.weekScores && u.weekScores[currentWeek]) || 0;
    const allLoss = u.allTimeBest || 0;

    if (weekLoss > 0) {
      weekList.push({ id, name, loss: weekLoss });
    }
    if (allLoss > 0) {
      allList.push({ id, name, loss: allLoss });
    }
  }

  // Merge default seeds if empty or sparse
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

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Handle API routes
  if (pathname === '/api/board') {
    return sendJson(res, 200, getLeaderboard());
  }

  if (pathname === '/api/run' && req.method === 'POST') {
    const body = await readBody(req);
    let device = body.device;
    let pass = body.pass;

    if (!device || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(device)) {
      device = crypto.randomUUID();
    }
    if (!pass) {
      pass = crypto.randomBytes(16).toString('hex');
    }

    if (!db.users[device]) {
      db.users[device] = { pass, name: '', weekScores: {}, allTimeBest: 0 };
      saveDb();
    }

    const token = crypto.randomBytes(16).toString('hex');
    db.activeRuns[token] = { device, pass, start: Date.now() };

    return sendJson(res, 200, {
      ok: true,
      t: token,
      device,
      pass
    });
  }

  if (pathname === '/api/score' && req.method === 'POST') {
    const body = await readBody(req);
    const { t, loss, crashes, secs } = body;
    let { device, pass } = body;

    const runInfo = db.activeRuns[t];
    if (runInfo) {
      device = runInfo.device;
      pass = runInfo.pass;
      delete db.activeRuns[t];
    }

    if (!device || !db.users[device]) {
      device = device || crypto.randomUUID();
      pass = pass || crypto.randomBytes(16).toString('hex');
      db.users[device] = { pass, name: '', weekScores: {}, allTimeBest: 0 };
    }

    const currentWeek = getWeekString();
    const user = db.users[device];
    const userLoss = Number(loss) || 0;

    user.weekScores = user.weekScores || {};
    const prevWeekBest = user.weekScores[currentWeek] || 0;
    if (userLoss > prevWeekBest) {
      user.weekScores[currentWeek] = userLoss;
    }
    if (userLoss > (user.allTimeBest || 0)) {
      user.allTimeBest = userLoss;
    }
    saveDb();

    const board = getLeaderboard();
    const myId = sha256Hex12(device);
    const rankIndex = board.top.findIndex(x => x.id === myId);
    const rank = rankIndex !== -1 ? rankIndex + 1 : null;
    const need = rank ? 0 : Math.max(0, board.cut + 50 - userLoss);

    return sendJson(res, 200, {
      ok: true,
      week: currentWeek,
      cut: board.cut,
      best: user.weekScores[currentWeek] || userLoss,
      rank,
      need,
      named: !!user.name,
      device,
      pass
    });
  }

  if (pathname === '/api/name' && req.method === 'POST') {
    const body = await readBody(req);
    const { device, pass, name } = body;

    if (!device || !db.users[device]) {
      return sendJson(res, 400, { ok: false, error: 'unknown_device' });
    }

    const cleanName = String(name || '').trim().slice(0, 40);
    db.users[device].name = cleanName;
    saveDb();

    return sendJson(res, 200, {
      ok: true,
      name: cleanName,
      device,
      pass
    });
  }

  if (pathname === '/api/subscribe' && req.method === 'POST') {
    const body = await readBody(req);
    const subscribers = fs.existsSync(SUBSCRIBERS_FILE)
      ? JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8') || '[]')
      : [];
    subscribers.push({ email: body.email, date: new Date().toISOString() });
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
    return sendJson(res, 200, { ok: true });
  }

  // Static file serving
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(path.join(__dirname, pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (!safePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for navigation or 404
      if (!path.extname(safePath)) {
        return serveFile(path.join(__dirname, 'index.html'), req, res);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }
    serveFile(safePath, req, res, stats);
  });
});

function serveFile(filePath, req, res, stats) {
  if (!stats) {
    try {
      stats = fs.statSync(filePath);
    } catch (e) {
      res.writeHead(404);
      return res.end('Not Found');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const range = req.headers.range;

  // Partial Content for MP3 audio and video
  if (range && (ext === '.mp3' || ext === '.mp4')) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stats.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  🚗 বাপের রাস্তা (Baper Rasta) Server`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`========================================\n`);
});
