import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\scratch\\edge-v3-' + Date.now();
const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0e176e79-5071-45e8-b342-981733a1c359';

const proc = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9260',
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
        http.get('http://127.0.0.1:9260/json', r => {
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
      if (errors.length < 5) console.error('FRAME EXCEPTION:', desc);
      errors.push(desc);
    }
  });

  // Wait for game to boot
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

  // Click Play Button to start game
  console.log('Clicking Play button...');
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

  await new Promise(r => setTimeout(r, 1200));

  // Check state after start
  const stateCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        return {
          gameState: at && at.G ? at.G.state : 'none',
          hasP: !!(at && at.P),
          alive: at && at.P ? at.P.alive : false,
          zoneToast: !!document.getElementById('zoneToast'),
          speedBlur: !!document.getElementById('speedBlurOverlay'),
          flyoverElevation: window.__flyoverElevation || 0
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Initial In-Play State:', stateCheck.result.value);

  // Take Old Dhaka Screenshot
  const ss1 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_zone1_old_dhaka.png'), Buffer.from(ss1.data, 'base64'));
  console.log('Saved v3_zone1_old_dhaka.png');

  // Test 1: Smooth Road (75% Road Condition)
  console.log('Testing Smooth Road (75% Condition)...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        if (at && at.P) {
          at.P.alive = true;
          at.G.state = 'play';
          at.P.z = -250; // within 0 - 600m (smooth section)
          at.P.v = 14;
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));

  const smoothRoadRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sys = window.RastarRaja && window.RastarRaja.DhakaRoadEnvironmentSystem;
        const gpsHint = document.getElementById('radarGpsHint');
        const at = window.__at;
        return {
          sysExists: !!sys,
          sysInit: sys ? sys.initialized : false,
          hasScene: !!(at && at.SCENE),
          hasThree: !!window.__THREE_EXPORTS,
          inPlay: at && at.G ? at.G.state : null,
          alive: at && at.P ? at.P.alive : null,
          z: at && at.P ? at.P.z : null,
          isBrokenRoad: sys ? sys.isBrokenRoad : null,
          gpsHintText: gpsHint ? gpsHint.textContent : '',
          isHazard: gpsHint ? gpsHint.classList.contains('hazard') : false
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Smooth Road (75%) Test:', smoothRoadRes.result.value);

  // Test 2: Broken Road (25% Road Condition with Potholes, Rubble & Construction)
  console.log('Testing Broken Road (25% Condition with Potholes & Construction)...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        if (at && at.P) {
          at.P.alive = true;
          at.G.state = 'play';
          at.P.z = -700; // within 600 - 800m (broken section)
          at.P.v = 12;
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));

  const brokenRoadRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sys = window.RastarRaja && window.RastarRaja.DhakaRoadEnvironmentSystem;
        const gpsHint = document.getElementById('radarGpsHint');
        return {
          z: window.__at.P.z,
          isBrokenRoad: sys ? sys.isBrokenRoad : null,
          bumpY: window.__at.P.bumpY,
          gpsHintText: gpsHint ? gpsHint.textContent : '',
          isHazard: gpsHint ? gpsHint.classList.contains('hazard') : false
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Broken Road (25%) Test:', brokenRoadRes.result.value);

  // Capture Broken Road Screenshot
  const ssBroken = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_broken_road_25.png'), Buffer.from(ssBroken.data, 'base64'));
  console.log('Saved v3_broken_road_25.png');

  // Test 3: Mayor Hanif Flyover Elevation
  console.log('Testing Mayor Hanif Flyover Elevation...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        if (at && at.P) {
          at.P.alive = true;
          at.G.state = 'play';
          at.P.z = -800; // elevated deck
          at.P.v = 22; // ~80 km/h
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400)); // wait for engineLoop frames

  const flyoverRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        return {
          z: at.P.z,
          flyoverElev: window.__flyoverElevation,
          playerElev: at.PLAYER && at.PLAYER.beat ? at.PLAYER.beat.y : null,
          camElev: at.CAM ? at.CAM.position.y : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Flyover Elevation Test:', flyoverRes.result.value);

  const ssFly = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_flyover_elevation.png'), Buffer.from(ssFly.data, 'base64'));
  console.log('Saved v3_flyover_elevation.png');

  // Test Zone 2 (Hatirjheel Expressway)
  console.log('Testing Zone 2: Hatirjheel Expressway...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        if (at && at.P) at.P.z = -1450;
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));

  const zone2Res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return {
          z: window.__at.P.z,
          toastActive: document.getElementById('zoneToast')?.classList.contains('active'),
          toastTitle: document.getElementById('zTitle')?.textContent
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Zone 2 Transition Test:', zone2Res.result.value);

  const ss2 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_zone2_hatirjheel.png'), Buffer.from(ss2.data, 'base64'));
  console.log('Saved v3_zone2_hatirjheel.png');

  // Test Zone 3 (Gulshan Cyber Downtown)
  console.log('Testing Zone 3: Gulshan Cyber Downtown...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        if (at && at.P) at.P.z = -2750;
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));

  const zone3Res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return {
          z: window.__at.P.z,
          toastActive: document.getElementById('zoneToast')?.classList.contains('active'),
          toastTitle: document.getElementById('zTitle')?.textContent
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Zone 3 Transition Test:', zone3Res.result.value);

  const ss3 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_zone3_gulshan.png'), Buffer.from(ss3.data, 'base64'));
  console.log('Saved v3_zone3_gulshan.png');

  // Test Pigeon Scatter & Dog Reaction on Hydraulic Horn
  console.log('Testing Pigeon Flock Scatter & Street Dog Reaction...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        const sys = window.RastarRaja && window.RastarRaja.LivingCitySystem;
        if (at && at.P && sys && sys.pigeons.length > 0) {
          at.P.alive = true;
          at.G.state = 'play';
          const firstPg = sys.pigeons[0];
          at.P.x = firstPg.grp.position.x;
          at.P.z = firstPg.grp.position.z + 18; // 18m behind pigeon
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 200));

  const hornRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        const sys = window.RastarRaja && window.RastarRaja.LivingCitySystem;
        if (sys && at && at.P) {
          sys.onHornBlast(at.P);
        }
        return {
          totalPigeons: sys ? sys.pigeons.length : 0,
          pigeonsScattering: sys ? sys.pigeons.filter(p => p.state === 'scattering').length : 0,
          totalDogs: sys ? sys.dogs.length : 0,
          microToasts: document.querySelectorAll('.micro-toast').length
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Horn & Living City Reaction:', hornRes.result.value);

  // Test WASA Manholes & Road Micro-Details
  console.log('Testing WASA Manholes & Road Micro-Details...');
  const manholeRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sys = window.RastarRaja && window.RastarRaja.RoadMicroDetailsSystem;
        return {
          totalManholes: sys ? sys.manholes.length : 0,
          totalPatches: sys ? sys.patches.length : 0,
          totalZebras: sys ? sys.zebras.length : 0
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Road Micro Details:', manholeRes.result.value);

  // Test High-Speed Motion Blur
  console.log('Testing High-Speed Radial Motion Blur...');
  const blurRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        at.P.alive = true;
        at.G.state = 'play';
        at.P.v = 16.0; // 16 * 7.5 = 120 km/h
        at.P.boost = true;
        const sys = window.RastarRaja && window.RastarRaja.NextGenGraphicsSystem;
        if (sys) sys.update(at.P, 0.016, true, false, false);
        const blurEl = document.getElementById('speedBlurOverlay');
        return {
          speedKmh: Math.abs(at.P.v) * 7.5,
          blurOpacity: blurEl ? blurEl.style.opacity : null,
          hasNitroClass: blurEl ? blurEl.classList.contains('nitro-streak') : false
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Motion Blur Test:', blurRes.result.value);

  console.log('Errors logged during session:', errors);

  ws.close();
} catch (err) {
  console.error('Test error:', err);
} finally {
  proc.kill();
}
