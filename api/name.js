import { memoryStore, sha256Hex12, syncScoreToSupabase } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { device, pass, name } = body;

    if (!device || !memoryStore.users[device]) {
      return res.status(400).json({ ok: false, error: 'unknown_device' });
    }

    const cleanName = String(name || '').trim().slice(0, 40);
    memoryStore.users[device].name = cleanName;

    const myId = sha256Hex12(device);
    syncScoreToSupabase({
      id: myId,
      name: cleanName,
      loss: memoryStore.users[device].allTimeBest || 0
    });

    return res.status(200).json({
      ok: true,
      name: cleanName,
      device,
      pass
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
