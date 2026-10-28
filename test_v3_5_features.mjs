import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\scratch\\edge-v35-' + Date.now();
const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0e176e79-5071-45e8-b342-981733a1c359';

const proc = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9265',
  '--user-data-dir=' + profileDir,
  '--no-first-run',
  '--window-size=1280,720',
  'http://localhost:3000/'
]);

try {
  let target = null;
  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const data = await new Promise((res, rej) => {
        http.get('http://127.0.0.1:9265/json', r => {
          let buf = '';
          r.on('data', c => buf += c);
          r.on('end', () => res(JSON.parse(buf)));
        }).on('error', rej);
      });
      if (data && data.length > 0) {
        target = data.find(p => p.type === 'page') || data[0];
        break;
      }
    } catch (e) {}
  }

  if (!target) throw new Error('No target found');
  console.log('Target connected:', target.url);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');

  const errors = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
      errors.push(desc);
    }
  });

  // Wait for game boot
  for (let i = 0; i < 40; i++) {
    const b = await send('Runtime.evaluate', {
      expression: '!!window.__booted',
      returnByValue: true
    });
    if (b.result && b.result.value) {
      console.log('Game booted after', (i + 1) * 300, 'ms');
      break;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  // Click Play
  console.log('Starting gameplay...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const playBtn = document.getElementById('play');
        if (playBtn) playBtn.click();
        else if (window.__at && window.__at.G && typeof window.__at.G.start === 'function') {
          window.__at.G.start();
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // TEST 1: DhakaRoadsideBannersSystem Footpath Verification
  console.log('\n--- 1. Testing Relocated Footpath Billboards & Funny Posters ---');
  const bannersState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sys = window.RastarRaja && window.RastarRaja.DhakaRoadsideBannersSystem;
        if (!sys) return { error: 'No banners system' };
        const coords = (sys.banners || []).map(b => ({
          x: Math.round(b.grp.position.x * 10) / 10,
          z: Math.round(b.grp.position.z),
          rotY: Math.round(b.grp.rotation.y * 100) / 100,
          onFootpath: Math.abs(b.grp.position.x) >= 10.0
        }));
        const allOnFootpath = coords.every(c => c.onFootpath);
        return {
          totalBanners: sys.banners ? sys.banners.length : 0,
          allOnFootpath,
          sampleCoords: coords.slice(0, 4)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Billboards Footpath State:', JSON.stringify(bannersState.result.value, null, 2));

  // TEST 2: DhakaExpresswayVisualsSystem Verification
  console.log('\n--- 2. Testing Expressway 3D Curbs, Streetlights & Krishnachura Trees ---');
  const visualsState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sys = window.RastarRaja && window.RastarRaja.DhakaExpresswayVisualsSystem;
        if (!sys) return { error: 'No expressway visuals system' };
        return {
          initialized: sys.initialized,
          chunksCount: sys.chunks ? sys.chunks.length : 0,
          streetLampsCount: sys.streetLamps ? sys.streetLamps.length : 0,
          lampDecalsCount: sys.lampDecals ? sys.lampDecals.length : 0
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Expressway Visuals State:', JSON.stringify(visualsState.result.value, null, 2));

  // TEST 3: Tea Stalls & Overbridge Road Clearances
  console.log('\n--- 3. Testing Tea Stalls & Road Clearance ---');
  const clearancesState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const env = window.RastarRaja && window.RastarRaja.DhakaRoadEnvironmentSystem;
        return {
          envInitialized: env ? env.initialized : false,
          teaStallGroupActive: !!(env && env.teaStallGroup),
          overbridgeGroupActive: !!(env && env.overbridgeGroup)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Clearances State:', JSON.stringify(clearancesState.result.value, null, 2));

  // Drive forward to inspect visuals in motion
  console.log('\n--- Driving forward 3 seconds to test smooth visual streaming ---');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        if (window.__at && window.__at.P) {
          window.__at.P.v = -14.0;
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2500));

  // Capture High-Res In-Game Screenshot
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  const ssPath = path.join(artifactDir, 'v3_5_footpath_billboards_and_graphics.png');
  fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
  console.log('Captured in-game screenshot:', ssPath);

  // Check Console Errors
  console.log('\n--- Console Error Check ---');
  console.log('Errors logged:', errors.length);
  if (errors.length > 0) {
    console.error('Errors:', errors);
  } else {
    console.log('SUCCESS: ZERO console errors detected!');
  }

  ws.close();
  proc.kill();
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  console.log('Test completed successfully!');
  process.exit(errors.length === 0 ? 0 : 1);
} catch (err) {
  console.error('Test script exception:', err);
  proc.kill();
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  process.exit(1);
}
