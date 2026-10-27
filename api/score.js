import crypto from 'crypto';
import { memoryStore, getWeekString, sha256Hex12, getLeaderboard, syncScoreToSupabase } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { t, loss } = body;
    let { device, pass } = body;

    const runInfo = memoryStore.activeRuns[t];
    if (runInfo) {
      device = runInfo.device;
      pass = runInfo.pass;
      delete memoryStore.activeRuns[t];
    }

    if (!device || !memoryStore.users[device]) {
      device = device || crypto.randomUUID();
      pass = pass || crypto.randomBytes(16).toString('hex');
      memoryStore.users[device] = { pass, name: '', weekScores: {}, allTimeBest: 0 };
    }

    const currentWeek = getWeekString();
    const user = memoryStore.users[device];
    const userLoss = Number(loss) || 0;

    user.weekScores = user.weekScores || {};
    const prevWeekBest = user.weekScores[currentWeek] || 0;
    if (userLoss > prevWeekBest) {
      user.weekScores[currentWeek] = userLoss;
    }
    if (userLoss > (user.allTimeBest || 0)) {
      user.allTimeBest = userLoss;
    }

    const myId = sha256Hex12(device);
    syncScoreToSupabase({
      id: myId,
      name: user.name || '',
      loss: userLoss
    });

    const board = await getLeaderboard();
    const rankIndex = board.top.findIndex(x => x.id === myId);
    const rank = rankIndex !== -1 ? rankIndex + 1 : null;
    const need = rank ? 0 : Math.max(0, board.cut + 50 - userLoss);

    return res.status(200).json({
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
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
