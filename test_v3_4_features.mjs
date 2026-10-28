import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\scratch\\edge-v34-' + Date.now();
const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0e176e79-5071-45e8-b342-981733a1c359';

const proc = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9261',
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
        http.get('http://127.0.0.1:9261/json', r => {
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
  console.log('Clicking Play...');
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

  // TEST 1: First-Person Cockpit View (FPP Camera)
  console.log('\n--- 1. Testing First-Person Cockpit View ---');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const camBtn = document.getElementById('camToggleBtn');
        if (camBtn) camBtn.click();
        else if (window.RastarRaja && window.RastarRaja.FirstPersonCockpitCameraSystem) {
          window.RastarRaja.FirstPersonCockpitCameraSystem.toggle();
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const cockpitState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sys = window.RastarRaja && window.RastarRaja.FirstPersonCockpitCameraSystem;
        const overlay = document.getElementById('cockpitOverlay');
        const cord = document.getElementById('talismanCord');
        const camBtn = document.getElementById('camToggleBtn');
        return {
          sysActive: sys ? sys.active : false,
          overlayVisible: overlay ? overlay.style.display !== 'none' : false,
          hasTalisman: !!cord,
          camBtnActive: camBtn ? camBtn.classList.contains('active') : false
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Cockpit View State:', cockpitState.result.value);

  const ssCockpit = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_cockpit_view.png'), Buffer.from(ssCockpit.data, 'base64'));
  console.log('Saved v3_cockpit_view.png');

  // Toggle back to Chase Camera for subsequent world tests
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        if (window.RastarRaja && window.RastarRaja.FirstPersonCockpitCameraSystem) {
          window.RastarRaja.FirstPersonCockpitCameraSystem.toggle();
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 300));

  // TEST 2: Monsoon Waterlogging & Spray
  console.log('\n--- 2. Testing Monsoon Waterlogging & Spray System ---');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        if (at && at.P) {
          at.P.alive = true;
          at.G.state = 'play';
          at.P.z = -520; // inside puddle (-500 +/- 100m)
          at.P.v = 14;
        }
        const sys = window.RastarRaja && window.RastarRaja.MonsoonWaterloggingSystem;
        if (sys) {
          for (let i = 0; i < 12; i++) sys.addScreenDrop();
          sys.triggerWiper();
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const waterState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sys = window.RastarRaja && window.RastarRaja.MonsoonWaterloggingSystem;
        const cv = document.getElementById('lensDropsCanvas');
        return {
          sysInit: sys ? sys.initialized : false,
          puddlesCount: sys ? sys.puddles.length : 0,
          hasDropsCanvas: !!cv,
          dropsCount: sys ? sys.drops.length : 0,
          wiperActive: sys ? sys.wiperActive : false
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Waterlogging State:', waterState.result.value);

  const ssWater = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_waterlogging_and_wiper.png'), Buffer.from(ssWater.data, 'base64'));
  console.log('Saved v3_waterlogging_and_wiper.png');

  // TEST 3: Active Railway Level Crossing & BR Train
  console.log('\n--- 3. Testing Active Railway Level Crossing & BR Train ---');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        if (at && at.P) {
          at.P.alive = true;
          at.G.state = 'play';
          at.P.z = -1530; // 70m from crossing at -1600
          at.P.v = 10;
        }
        const sys = window.RastarRaja && window.RastarRaja.RailwayLevelCrossingSystem;
        if (sys) {
          sys.state = 'TRAIN_CROSSING';
          sys.trainX = 8; // Train right across middle of road!
          if (sys.trainGroup) sys.trainGroup.position.x = 8;
          if (sys.barrierLeft) sys.barrierLeft.rotation.z = 0;
          if (sys.barrierRight) sys.barrierRight.rotation.z = 0;
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const trainState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sys = window.RastarRaja && window.RastarRaja.RailwayLevelCrossingSystem;
        return {
          sysInit: sys ? sys.initialized : false,
          state: sys ? sys.state : null,
          trainX: sys ? sys.trainX : null,
          hasTrainGroup: !!(sys && sys.trainGroup)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Railway Crossing State:', trainState.result.value);

  const ssTrain = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_railway_level_crossing.png'), Buffer.from(ssTrain.data, 'base64'));
  console.log('Saved v3_railway_level_crossing.png');

  // TEST 4: Dhaka Passenger Pickup & Fare Mission System
  console.log('\n--- 4. Testing Passenger Pickup & Fare Mission ---');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        if (at && at.P) {
          at.P.alive = true;
          at.G.state = 'play';
          at.P.z = -350; // near passenger
          at.P.v = 2.0; // slowed down to pick up
        }
        const sys = window.RastarRaja && window.RastarRaja.DhakaPassengerMissionSystem;
        if (sys) {
          sys.hasPassenger = true;
          sys.destLandmark = 'নীলক্ষেত মোড়';
          sys.destZ = -750;
          sys.fareReward = 80;
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const passengerState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sys = window.RastarRaja && window.RastarRaja.DhakaPassengerMissionSystem;
        const pill = document.getElementById('passengerHUDPill');
        return {
          hasPassenger: sys ? sys.hasPassenger : false,
          destLandmark: sys ? sys.destLandmark : null,
          fareReward: sys ? sys.fareReward : null,
          pillDisplay: pill ? pill.style.display : null,
          pillText: pill ? pill.textContent : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Passenger Mission State:', passengerState.result.value);

  const ssPassenger = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_passenger_mission.png'), Buffer.from(ssPassenger.data, 'base64'));
  console.log('Saved v3_passenger_mission.png');

  // TEST 5: Traffic Police Sergeant Speed Trap Checkpost (ZERO POPUP VERIFICATION)
  console.log('\n--- 5. Testing Traffic Police Speed Trap Checkpost (Zero Popup Verification) ---');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const at = window.__at;
        if (at && at.P) {
          at.P.alive = true;
          at.G.state = 'play';
          at.P.z = -2560; // 40m approaching checkpost at -2600
          at.P.v = 15; // > 55 km/h
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const policeState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sys = window.RastarRaja && window.RastarRaja.PoliceCheckpostSystem;
        const prompt = document.getElementById('policeTrapPrompt');
        return {
          sysInit: sys ? sys.initialized : false,
          promptExists: !!prompt,
          hasBribeBtn: !!document.getElementById('trapBribeBtn'),
          hasSmashBtn: !!document.getElementById('trapSmashBtn'),
          trapNotified: sys ? sys.trapNotified : false
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Police Speed Trap State (No Popup):', policeState.result.value);

  const ssPolice = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_police_speed_trap.png'), Buffer.from(ssPolice.data, 'base64'));
  console.log('Saved v3_police_speed_trap.png');
  await new Promise(r => setTimeout(r, 300));

  // TEST 6: Mobile Ergonomics & Clean Organized UI/UX
  console.log('\n--- 6. Testing Mobile App Viewport & Clean UI/UX ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 600));

  const mobileState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const gauge = document.getElementById('cockpitGauge');
        const touch = document.getElementById('touch');
        const fsBtn = document.getElementById('rajaFullscreenBtn');
        const camBtn = document.getElementById('camToggleBtn');
        const gaugeComputed = gauge ? window.getComputedStyle(gauge).display : null;
        return {
          gaugeDisplay: gaugeComputed, // must be 'none' so no overlap!
          touchHidden: touch ? touch.hidden : null,
          hasFullscreenBtn: !!fsBtn,
          hasCamBtn: !!camBtn
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Mobile Layout State:', mobileState.result.value);

  const ssMobile = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(artifactDir, 'v3_mobile_app_experience.png'), Buffer.from(ssMobile.data, 'base64'));
  console.log('Saved v3_mobile_app_experience.png');

  console.log('\n=============================================');
  console.log('TEST SUMMARY:');
  console.log('Console Errors Detected:', errors.length);
  if (errors.length > 0) {
    console.error('Errors:', errors);
  } else {
    console.log('🎉 100% CLEAN - ZERO ERRORS!');
  }
  console.log('=============================================');

} catch (e) {
  console.error('Test execution failed:', e);
} finally {
  try { proc.kill(); } catch (_) {}
}
