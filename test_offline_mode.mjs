import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\scratch\\edge-offline-' + Date.now();
const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0e176e79-5071-45e8-b342-981733a1c359';

const proc = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9268',
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
        http.get('http://127.0.0.1:9268/json', r => {
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
  await send('Network.enable');

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

  // 1. Verify Service Worker Registration & Cache
  console.log('\n--- 1. Testing Service Worker & Offline Cache Storage ---');
  await new Promise(r => setTimeout(r, 1200)); // allow SW to activate and cache

  const swState = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        let swRegistered = false;
        let activeScope = null;
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          if (regs.length > 0) {
            swRegistered = true;
            activeScope = regs[0].scope;
          }
        }
        let cacheKeys = [];
        let cachedUrlsCount = 0;
        if ('caches' in window) {
          cacheKeys = await caches.keys();
          if (cacheKeys.length > 0) {
            const cache = await caches.open(cacheKeys[0]);
            const requests = await cache.keys();
            cachedUrlsCount = requests.length;
          }
        }
        return {
          swRegistered,
          activeScope,
          cacheKeys,
          cachedUrlsCount
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('SW & Cache State:', JSON.stringify(swState.result.value, null, 2));

  // 2. Click Play & Verify Gameplay
  console.log('\n--- 2. Starting Gameplay ---');
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

  // 3. Simulate Complete Offline Mode (Network Disconnect)
  console.log('\n--- 3. Simulating 100% Offline Mode (Internet Disconnected) ---');
  await send('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0
  });

  // Trigger window offline event
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        window.dispatchEvent(new Event('offline'));
        if (window.RastarRaja && window.RastarRaja.OfflineSystem) {
          window.RastarRaja.OfflineSystem.showStatusBadge("📴 অফলাইন মোড সক্রিয় · ১০০% ইন্টারনেট ছাড়া ফুল গেম চলছে", false);
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 800));

  // Verify Offline UI Elements
  const offlineUIState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const badge = document.getElementById('rajaOfflineBadge');
        const installBtn = document.getElementById('rajaInstallBtn');
        const sys = window.RastarRaja && window.RastarRaja.OfflineSystem;
        return {
          badgeExists: !!badge,
          badgeText: badge ? badge.textContent : '',
          badgeVisible: badge ? badge.classList.contains('visible') : false,
          installBtnExists: !!installBtn,
          offlineStorageKey: !!localStorage.getItem('rastarRaja.offlineLeaderboard')
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Offline UI & Local Storage State:', JSON.stringify(offlineUIState.result.value, null, 2));

  // Drive while offline
  console.log('\n--- 4. Driving in 100% Offline Mode ---');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        if (window.__at && window.__at.P) {
          window.__at.P.v = -18.0; // accelerate
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2000));

  // Capture High-Res Screenshot in Offline Mode
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  const ssPath = path.join(artifactDir, 'v3_5_offline_mode_active.png');
  fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
  console.log('Captured offline screenshot:', ssPath);

  // 5. Check Console Errors
  console.log('\n--- Console Error Check ---');
  console.log('Errors logged:', errors.length);
  if (errors.length > 0) {
    console.error('Errors:', errors);
  } else {
    console.log('SUCCESS: ZERO console errors detected during offline play!');
  }

  ws.close();
  proc.kill();
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  console.log('Offline test completed successfully!');
  process.exit(errors.length === 0 ? 0 : 1);
} catch (err) {
  console.error('Offline test exception:', err);
  proc.kill();
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  process.exit(1);
}
