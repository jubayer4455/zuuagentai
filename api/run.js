import crypto from 'crypto';
import { memoryStore } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    let device = body.device;
    let pass = body.pass;

    if (!device || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(device)) {
      device = crypto.randomUUID();
    }
    if (!pass) {
      pass = crypto.randomBytes(16).toString('hex');
    }

    if (!memoryStore.users[device]) {
      memoryStore.users[device] = { pass, name: '', weekScores: {}, allTimeBest: 0 };
    }

    const token = crypto.randomBytes(16).toString('hex');
    memoryStore.activeRuns[token] = { device, pass, start: Date.now() };

    return res.status(200).json({
      ok: true,
      t: token,
      device,
      pass
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
