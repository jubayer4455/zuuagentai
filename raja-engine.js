// ========================================================
// 👑 রাস্তার রাজা (Rastar Raja) - Core Engine Extension
// নির্মাতা ও কনসেপ্ট: আব্দুল আল যুবায়ের (Abdul Al Jubayer)
// ========================================================

(function () {
  'use strict';

  // State
  window.RastarRaja = {
    vehicle: localStorage.getItem('rastarRaja.vehicle') || 'auto',
    time: localStorage.getItem('rastarRaja.time') || 'morning',
    rain: localStorage.getItem('rastarRaja.rain') === '1',
    radio: false,
    audioCtx: null,
    radioTimer: null,
    rainSource: null,
    rainGain: null,
    rainAnimId: null
  };

  window.__PLAYER_VEHICLE = window.RastarRaja.vehicle;

  const VEHICLE_CONFIGS = {
    auto: {
      name: 'টেসলা অটো',
      subtitle: 'উড়ন্ত রকেট · স্পিড ৯৫ · লাইটওয়েট',
      icon: '🛺',
      len: 2.6, wid: 1.2, mass: 380,
      cruise: 11.5, boost: 16.5, camScale: 1.0
    },
    cng: {
      name: 'সবুজ দানব',
      subtitle: 'সিএনজি ২৫০ সিসি · স্পিড ১১০ · দ্রুত মোড়',
      icon: '🛺',
      len: 2.6, wid: 1.35, mass: 520,
      cruise: 13.5, boost: 19.5, camScale: 1.1
    },
    leguna: {
      name: 'পাবলিক কফিন',
      subtitle: 'লেগুনা ম্যাক্স প্রো · ধাক্কায় গাড়ি উল্টায়',
      icon: '🚐',
      len: 4.3, wid: 1.7, mass: 1600,
      cruise: 10.5, boost: 15.2, camScale: 1.28
    },
    bus: {
      name: 'বিকাশ পরিবহন',
      subtitle: 'ব্রেক ছাড়া মিনিবাস · ডাইরেক্ট ধ্বংসযজ্ঞ',
      icon: '🚌',
      len: 10.5, wid: 2.5, mass: 7200,
      cruise: 9.5, boost: 14.2, camScale: 1.65
    }
  };

  const FUNNY_QUOTES = [
    "মামা সাইড দেন, ব্রেক নাই!",
    "ধর ধর, গাড়ি আটকাইসে!",
    "এইডা বাপের রাস্তা পাইছস? আমি রাস্তার রাজা!",
    "পুলিশ আইসা গেছে রে, ভাগেন!",
    "ড্রাইভার সাব দেইখা চালান!",
    "আজকে তোর লাইসেন্স ক্যানসেল!",
    "উইড়া উইড়া আইতাছে রে!",
    "ব্রেকের তার ছেঁড়া, আল্লাহ ভরসা!",
    "ডানে সিগনাল দিয়া বামে মোচড়!",
    "সামনে ফাঁকা পাইলেন তো টান দেন!",
    "এই রাস্তায় খালি একখানই রাজা — আমি!",
    "সার্জেন্ট সাব, এক কাপ চা খান!"
  ];

  const DHAKA_LANDMARKS = [
    "মিরপুর ১০ গোলচত্বর",
    "ফার্মগেট ওভারব্রিজ",
    "হাতিরঝিল এক্সপ্রেসওয়ে",
    "গুলিস্তান ফ্লাইওভার",
    "শাহবাগ মোড়",
    "কারওয়ান বাজার জ্যাম পয়েন্ট",
    "ধানমন্ডি ৩২",
    "মেট্রোরেল আগারগাঁও স্টেশন"
  ];

  // ----------------------------------------------------
  // 1. DOM Injections for Menu, HUD & Landmark Banners
  // ----------------------------------------------------
  function injectUI() {
    const menuMain = document.querySelector('.menu-main');
    if (!menuMain) return;

    // Replace header title with Logo
    const oldTitle = menuMain.querySelector('.title');
    const oldSub = menuMain.querySelector('.title-en');
    const oldTag = menuMain.querySelector('.tagline');
    const oldHow = menuMain.querySelector('.how');

    if (oldTitle) {
      oldTitle.innerHTML = `<img src="logo.svg" alt="রাস্তার রাজা · Rastar Raja" style="width: 100%; max-width: 380px; height: auto; display: block; margin: 0 auto; filter: drop-shadow(0 4px 14px rgba(0,0,0,0.8));">`;
    }
    if (oldSub) oldSub.remove();
    if (oldTag) {
      oldTag.innerHTML = `★ ঢাকার রাজপথের আসল রাজা ★`;
      oldTag.style.color = '#ffcb1f';
      oldTag.style.fontWeight = 'bold';
      oldTag.style.letterSpacing = '1px';
    }
    if (oldHow) {
      oldHow.innerHTML = `<em><span>নো লাইসেন্স, নো ব্রেক:</span> <span>রাস্তার রাজা কে?</span></em><span class="dup">ধাক্কায় ক্ষতি বাড়ান। বাস-ট্রাক এড়ান।<br>পাবলিক ধরার আগেই পালান।</span>`;
    }

    // Add Garage Vehicle Selection
    if (!document.getElementById('garageBox')) {
      const garageBox = document.createElement('div');
      garageBox.id = 'garageBox';
      garageBox.className = 'raja-card';
      garageBox.innerHTML = `
        <div class="raja-card-header">
          <span>🚗 আপনার বাহন বেছে নিন (Garage)</span>
        </div>
        <div class="v-grid">
          ${Object.entries(VEHICLE_CONFIGS).map(([k, v]) => `
            <button type="button" class="v-btn ${window.RastarRaja.vehicle === k ? 'active' : ''}" data-vehicle="${k}">
              <span class="v-ic">${v.icon}</span>
              <div class="v-info">
                <b>${v.name}</b>
                <small>${v.subtitle}</small>
              </div>
            </button>
          `).join('')}
        </div>
      `;
      menuMain.insertBefore(garageBox, document.querySelector('.play-row'));

      garageBox.querySelectorAll('.v-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          garageBox.querySelectorAll('.v-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const v = btn.getAttribute('data-vehicle');
          window.RastarRaja.vehicle = v;
          localStorage.setItem('rastarRaja.vehicle', v);
          window.__PLAYER_VEHICLE = v;
          applyVehicleToPlayer(v);
        });
      });
    }

    // Add Time & Weather Selector
    if (!document.getElementById('envBox')) {
      const envBox = document.createElement('div');
      envBox.id = 'envBox';
      envBox.className = 'raja-card';
      envBox.innerHTML = `
        <div class="raja-card-header">
          <span>🌤️ সময় ও আবহাওয়া (Environment)</span>
        </div>
        <div class="env-row">
          <button type="button" class="env-btn ${window.RastarRaja.time === 'morning' ? 'active' : ''}" data-time="morning">☀️ দিন</button>
          <button type="button" class="env-btn ${window.RastarRaja.time === 'dusk' ? 'active' : ''}" data-time="dusk">🌅 গোধূলি</button>
          <button type="button" class="env-btn ${window.RastarRaja.time === 'night' ? 'active' : ''}" data-time="night">🌙 রাত (হেডলাইট)</button>
          <button type="button" class="env-btn ${window.RastarRaja.rain ? 'active' : ''}" id="rajaRainBtn">🌧️ বৃষ্টি: ${window.RastarRaja.rain ? 'চালু' : 'বন্ধ'}</button>
        </div>
      `;
      menuMain.insertBefore(envBox, document.querySelector('.play-row'));

      envBox.querySelectorAll('[data-time]').forEach(btn => {
        btn.addEventListener('click', () => {
          envBox.querySelectorAll('[data-time]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const t = btn.getAttribute('data-time');
          window.RastarRaja.time = t;
          localStorage.setItem('rastarRaja.time', t);
          if (window.__setTime) window.__setTime(t);
        });
      });

      const rainBtn = document.getElementById('rajaRainBtn');
      rainBtn.addEventListener('click', () => {
        window.RastarRaja.rain = !window.RastarRaja.rain;
        localStorage.setItem('rastarRaja.rain', window.RastarRaja.rain ? '1' : '0');
        rainBtn.classList.toggle('active', window.RastarRaja.rain);
        rainBtn.textContent = `🌧️ বৃষ্টি: ${window.RastarRaja.rain ? 'চালু' : 'বন্ধ'}`;
        toggleRain(window.RastarRaja.rain);
      });
    }

    // Add FM Radio button to HUD
    const battBox = document.getElementById('battBox');
    if (battBox && !document.getElementById('radioBtn')) {
      const radioBtn = document.createElement('button');
      radioBtn.id = 'radioBtn';
      radioBtn.type = 'button';
      radioBtn.title = 'রেট্রো ঢাকা ট্যাক্সি রেডিও (FM)';
      radioBtn.innerHTML = `📻 <span>এফএম রেডিও</span>`;
      battBox.appendChild(radioBtn);

      radioBtn.addEventListener('click', () => {
        window.RastarRaja.radio = !window.RastarRaja.radio;
        radioBtn.classList.toggle('active', window.RastarRaja.radio);
        radioBtn.innerHTML = window.RastarRaja.radio ? `🔊 <span>রেডিও বাজছে</span>` : `📻 <span>এফএম রেডিও</span>`;
        toggleRadioMusic(window.RastarRaja.radio);
      });
    }

    // Update Credits to Abdul Al Jubayer
    document.querySelectorAll('.credit, .np-credit').forEach(c => {
      c.innerHTML = `<i class="crown-ic" style="font-size:16px; margin-right:4px;">👑</i> নির্মাতা: <b>Abdul Al Jubayer</b>`;
      c.href = 'about.html';
    });

    // Update Editor Imprint on Paper
    const npImprint = document.querySelector('.np-imprint');
    if (npImprint) {
      npImprint.innerHTML = `তদন্ত কর্মকর্তা &amp; চিফ এডিটর: <a href="about.html" target="_blank" rel="noopener">আব্দুল আল যুবায়ের</a>`;
    }
    const npMast = document.querySelector('.np-mast .np-name');
    if (npMast) {
      npMast.innerHTML = `🔴 ডিটিভি ব্রেকিং নিউজ`;
    }

    // Apply saved weather on start
    if (window.RastarRaja.time && window.__setTime) {
      window.__setTime(window.RastarRaja.time);
    }
    if (window.RastarRaja.rain) {
      toggleRain(true);
    }
  }

  // ----------------------------------------------------
  // 2. Custom Styles Injection
  // ----------------------------------------------------
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .raja-card {
        background: rgba(20, 16, 12, 0.9);
        border: 1.5px solid rgba(255, 203, 31, 0.4);
        border-radius: 12px;
        padding: 10px 12px;
        margin: 10px 0;
        text-align: left;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      }
      .raja-card-header {
        font-size: 13px;
        font-weight: 800;
        color: #ffcb1f;
        margin-bottom: 8px;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .v-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .v-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: rgba(35, 28, 22, 0.8);
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        cursor: pointer;
        color: #fff;
        transition: all 0.15s ease;
        text-align: left;
      }
      .v-btn:hover {
        background: rgba(60, 48, 36, 0.9);
        border-color: #ffcb1f;
      }
      .v-btn.active {
        background: rgba(255, 203, 31, 0.22);
        border-color: #ffcb1f;
        box-shadow: 0 0 12px rgba(255, 203, 31, 0.35);
      }
      .v-ic {
        font-size: 26px;
      }
      .v-info b {
        display: block;
        font-size: 14px;
        color: #fff;
      }
      .v-info small {
        display: block;
        font-size: 11px;
        color: #cfc3ab;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .env-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .env-btn {
        flex: 1 1 auto;
        padding: 7px 12px;
        background: rgba(35, 28, 22, 0.8);
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .env-btn.active {
        background: rgba(46, 230, 255, 0.22);
        border-color: #2ee6ff;
        color: #2ee6ff;
        box-shadow: 0 0 10px rgba(46, 230, 255, 0.35);
      }
      #rajaRainBtn.active {
        background: rgba(0, 180, 255, 0.25);
        border-color: #00d2ff;
        color: #00d2ff;
      }
      #radioBtn {
        pointer-events: auto;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(15, 43, 99, 0.85);
        border: 1.5px solid #2ee6ff;
        color: #fff;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 4px;
      }
      #radioBtn.active {
        background: #2ee6ff;
        color: #0a1128;
        box-shadow: 0 0 14px rgba(46, 230, 255, 0.7);
        animation: radioPulse 1.2s infinite alternate ease-in-out;
      }
      @keyframes radioPulse {
        from { transform: scale(1); }
        to { transform: scale(1.05); }
      }

      /* Rain Canvas Overlay */
      #rainCanvas {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
      }

      /* Live TV Breaking News Styling for Game Over */
      #paper .np {
        background: #0d1117 !important;
        color: #f7efe0 !important;
        border: 2px solid #e0242b !important;
        box-shadow: 0 0 35px rgba(224, 36, 43, 0.6) !important;
      }
      #paper .np-scroll {
        background: transparent !important;
      }
      #paper header {
        border-bottom: 3px solid #e0242b !important;
        background: #1a0809 !important;
        padding: 10px 14px !important;
        border-radius: 8px 8px 0 0;
      }
      #paper .np-mast .np-name {
        color: #ff3344 !important;
        font-size: clamp(24px, 5vw, 36px) !important;
        text-shadow: 0 0 12px rgba(255, 51, 68, 0.8) !important;
        letter-spacing: 1px;
      }
      #paper .np-kicker {
        background: #e0242b;
        color: #fff;
        padding: 2px 12px;
        display: inline-block;
        font-weight: 900;
        border-radius: 4px;
        letter-spacing: 1.5px;
      }
      #paper .np-body {
        border-color: rgba(224, 36, 43, 0.3) !important;
      }
      #paper .np-price {
        background: rgba(224, 36, 43, 0.15) !important;
        border-left: 4px solid #ffcb1f !important;
        padding: 8px 12px !important;
      }
      #paper .np-stamp {
        background: #e0242b !important;
        color: #fff !important;
        box-shadow: 0 0 18px rgba(224, 36, 43, 0.9) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ----------------------------------------------------
  // 3. Rain Particle Overlay & Weather Audio System
  // ----------------------------------------------------
  let rainCanvas = null;
  let rainCtx = null;
  const RAIN_DROPS = [];

  function initRainCanvas() {
    if (rainCanvas) return;
    rainCanvas = document.createElement('canvas');
    rainCanvas.id = 'rainCanvas';
    document.body.appendChild(rainCanvas);
    rainCtx = rainCanvas.getContext('2d');

    function resize() {
      rainCanvas.width = window.innerWidth;
      rainCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Generate rain particles
    for (let i = 0; i < 280; i++) {
      RAIN_DROPS.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        len: 18 + Math.random() * 22,
        speed: 24 + Math.random() * 16,
        alpha: 0.15 + Math.random() * 0.35
      });
    }
  }

  function renderRain() {
    if (!window.RastarRaja.rain) {
      if (rainCtx && rainCanvas) rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
      return;
    }

    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    rainCtx.strokeStyle = 'rgba(180, 225, 255, 0.4)';
    rainCtx.lineWidth = 1.6;

    rainCtx.beginPath();
    for (let i = 0; i < RAIN_DROPS.length; i++) {
      const d = RAIN_DROPS[i];
      rainCtx.moveTo(d.x, d.y);
      rainCtx.lineTo(d.x - 4, d.y + d.len);
      d.y += d.speed;
      d.x -= 3;
      if (d.y > rainCanvas.height) {
        d.y = -d.len;
        d.x = Math.random() * (rainCanvas.width + 100);
      }
    }
    rainCtx.stroke();
    window.RastarRaja.rainAnimId = requestAnimationFrame(renderRain);
  }

  function toggleRain(enable) {
    if (enable) {
      initRainCanvas();
      if (!window.RastarRaja.rainAnimId) {
        window.RastarRaja.rainAnimId = requestAnimationFrame(renderRain);
      }
      playRainAudio(true);
    } else {
      if (window.RastarRaja.rainAnimId) {
        cancelAnimationFrame(window.RastarRaja.rainAnimId);
        window.RastarRaja.rainAnimId = null;
      }
      if (rainCtx && rainCanvas) rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
      playRainAudio(false);
    }
  }

  function playRainAudio(enable) {
    if (!enable) {
      if (window.RastarRaja.rainSource) {
        window.RastarRaja.rainSource.stop();
        window.RastarRaja.rainSource = null;
      }
      return;
    }

    if (!window.RastarRaja.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) window.RastarRaja.audioCtx = new AudioCtx();
    }
    const ctx = window.RastarRaja.audioCtx;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    // Synthesize realistic rain drizzle buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    // Filter to sound like soft road rain
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;

    const gain = ctx.createGain();
    gain.gain.value = 0.08;

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    whiteNoise.start();

    window.RastarRaja.rainSource = whiteNoise;
    window.RastarRaja.rainGain = gain;
  }

  // ----------------------------------------------------
  // 4. Procedural Lo-Fi Desi Retro Taxi Radio
  // ----------------------------------------------------
  function toggleRadioMusic(enable) {
    if (!enable) {
      if (window.RastarRaja.radioTimer) {
        clearInterval(window.RastarRaja.radioTimer);
        window.RastarRaja.radioTimer = null;
      }
      return;
    }

    if (!window.RastarRaja.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) window.RastarRaja.audioCtx = new AudioCtx();
    }
    const ctx = window.RastarRaja.audioCtx;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const notes = [130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0];
    let step = 0;

    window.RastarRaja.radioTimer = setInterval(() => {
      const now = ctx.currentTime;

      // Kick drum
      if (step % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }

      // Snare / Clap
      if (step % 4 === 2) {
        const node = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < buf.length; i++) data[i] = Math.random() * 2 - 1;
        node.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        node.connect(gain);
        gain.connect(ctx.destination);
        node.start(now);
      }

      // Synth Bass / Melodic arpeggio
      if (Math.random() < 0.75) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const note = notes[(step * 3 + Math.floor(Math.random() * 3)) % notes.length];
        osc.type = step % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
      }

      step = (step + 1) % 16;
    }, 150);
  }

  // ----------------------------------------------------
  // 5. Vehicle Application & Scene Hook
  // ----------------------------------------------------
  function applyVehicleToPlayer(kind) {
    window.__PLAYER_VEHICLE = kind;
    const cfg = VEHICLE_CONFIGS[kind] || VEHICLE_CONFIGS.auto;
    window.dispatchEvent(new CustomEvent('raja_vehicle_change', { detail: { kind, cfg } }));
  }

  // ----------------------------------------------------
  // 6. Bengali Voice / Funny Dialogue Manager
  // ----------------------------------------------------
  function triggerFunnyDialogue() {
    const dialogueBox = document.getElementById('dialogue');
    if (!dialogueBox) return;
    const q = FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)];
    dialogueBox.textContent = q;
    dialogueBox.hidden = false;
    dialogueBox.style.animation = 'none';
    setTimeout(() => { dialogueBox.style.animation = ''; }, 10);
    setTimeout(() => { dialogueBox.hidden = true; }, 3200);
  }

  window.addEventListener('raja_funny_say', triggerFunnyDialogue);

  // Random landmark cards popping up
  setInterval(() => {
    const placeCard = document.getElementById('placeCard');
    const hud = document.getElementById('hud');
    if (placeCard && hud && !hud.hidden && Math.random() < 0.3) {
      const landmark = DHAKA_LANDMARKS[Math.floor(Math.random() * DHAKA_LANDMARKS.length)];
      const whereSpan = placeCard.querySelector('.where');
      if (whereSpan) whereSpan.textContent = landmark;
      placeCard.hidden = false;
      setTimeout(() => { placeCard.hidden = true; }, 4000);
    }
  }, 16000);

  // Periodically pop funny dialogues during play
  setInterval(() => {
    const hud = document.getElementById('hud');
    if (hud && !hud.hidden && Math.random() < 0.4) {
      triggerFunnyDialogue();
    }
  }, 10000);

  // Initialize UI once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStyles();
      injectUI();
    });
  } else {
    injectStyles();
    injectUI();
  }
})();
