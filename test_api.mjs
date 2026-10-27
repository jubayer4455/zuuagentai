import { getLeaderboard } from './api/_db.js';
import indexH from './api/index.js';
import boardH from './api/board.js';
import runH from './api/run.js';
import scoreH from './api/score.js';
import nameH from './api/name.js';
import subscribeH from './api/subscribe.js';

function createMockRes() {
  return {
    headers: {},
    statusCode: 200,
    data: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
    end() { return this; }
  };
}

async function run() {
  console.log('--- TESTING SERVERLESS API ENDPOINTS ---');

  // 1. _db.js getLeaderboard
  const board = await getLeaderboard();
  console.log('[OK] Leaderboard loaded. Top count:', board.top.length, 'Cut:', board.cut);

  // 2. index handler
  const resIndex = createMockRes();
  indexH({}, resIndex);
  console.log('[OK] /api status:', resIndex.statusCode, 'App:', resIndex.data.name);

  // 3. board handler
  const resBoard = createMockRes();
  await boardH({ method: 'GET' }, resBoard);
  console.log('[OK] /api/board status:', resBoard.statusCode, 'Top drivers count:', resBoard.data.top.length);

  // 4. run handler
  const resRun = createMockRes();
  await runH({ method: 'POST', body: {} }, resRun);
  console.log('[OK] /api/run status:', resRun.statusCode, 'Token issued:', resRun.data.t.slice(0, 8) + '...');

  // 5. score handler
  const resScore = createMockRes();
  await scoreH({
    method: 'POST',
    body: {
      t: resRun.data.t,
      loss: 15000000,
      device: resRun.data.device,
      pass: resRun.data.pass
    }
  }, resScore);
  console.log('[OK] /api/score status:', resScore.statusCode, 'Rank:', resScore.data.rank, 'Best:', resScore.data.best);

  // 6. name handler
  const resName = createMockRes();
  await nameH({
    method: 'POST',
    body: {
      device: resRun.data.device,
      pass: resRun.data.pass,
      name: 'সুপার ওস্তাদ'
    }
  }, resName);
  console.log('[OK] /api/name status:', resName.statusCode, 'Saved Name:', resName.data.name);

  // 7. subscribe handler
  const resSub = createMockRes();
  await subscribeH({
    method: 'POST',
    body: { email: 'test_driver@dhaka.com' }
  }, resSub);
  console.log('[OK] /api/subscribe status:', resSub.statusCode, 'Result:', resSub.data.ok);

  console.log('\n=============================================');
  console.log('🎉 ALL VERCEL API ENDPOINTS TESTED SUCCESSFULLY!');
  console.log('=============================================\n');
}

run().catch(err => {
  console.error('API Test Error:', err);
  process.exit(1);
});
