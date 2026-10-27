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
    },
    micro: {
      name: 'কালা গ্লাস মাইক্রো',
      subtitle: 'নোহা হাইয়েস · স্পিড ১১৫ · ভিআইপি প্রটোকল',
      icon: '🚐',
      len: 4.8, wid: 1.85, mass: 2100,
      cruise: 12.5, boost: 18.0, camScale: 1.35
    },
    police: {
      name: 'হাইওয়ে পুলিশ ভ্যান',
      subtitle: 'র‍্যাব ইন্টারসেপ্টর · স্পিড ১২০ · সাইরেন সহ ধাওয়া',
      icon: '🚓',
      len: 4.6, wid: 1.8, mass: 1900,
      cruise: 14.0, boost: 21.0, camScale: 1.32
    }
  };

  const FUNNY_QUOTES = [
    "মামা সাইড দেন, ব্রেক নাই!",
    "ধর ধর, গাড়ি আটকাইসে!",
    "রাস্তার রাজা আমি! সাইড দে মামা!",
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

      /* GTA Wanted Stars Box */
      .raja-stars-box {
        position: fixed;
        top: 14px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(15, 12, 10, 0.85);
        border: 1.5px solid rgba(255, 203, 31, 0.4);
        padding: 4px 14px;
        border-radius: 20px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        z-index: 92;
        pointer-events: none;
        transition: all 0.3s ease;
      }
      .raja-stars-box .stars-label {
        font-family: 'Hind Siliguri', sans-serif;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 2px;
        color: #ffcb1f;
        text-shadow: 0 0 8px rgba(255, 203, 31, 0.6);
        margin-bottom: -2px;
      }
      .raja-stars-box .stars-row {
        display: flex;
        gap: 4px;
      }
      .raja-stars-box .star {
        font-size: 20px;
        color: rgba(255, 255, 255, 0.2);
        transition: color 0.2s, transform 0.2s;
      }
      .raja-stars-box .star.lit {
        color: #ffd400;
        text-shadow: 0 0 10px #ffd400, 0 0 20px #ff9900;
        transform: scale(1.15);
      }
      .raja-stars-box.chase .star.lit {
        animation: starChaseFlash 0.4s infinite alternate;
      }
      @keyframes starChaseFlash {
        0% { color: #ff0055; text-shadow: 0 0 12px #ff0055; }
        100% { color: #0088ff; text-shadow: 0 0 12px #0088ff; }
      }

      /* Police Flashing Screen Vignette */
      .police-vignette {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 80;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .police-vignette.active {
        opacity: 1;
        animation: policeFlash 0.4s infinite alternate;
      }
      @keyframes policeFlash {
        0% { box-shadow: inset 0 0 90px rgba(255, 0, 0, 0.55); }
        100% { box-shadow: inset 0 0 90px rgba(0, 100, 255, 0.55); }
      }

      /* Bribe Police Button */
      .bribe-btn {
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #e0242b, #8b0000);
        color: #fff;
        font-family: 'Hind Siliguri', sans-serif;
        font-weight: 800;
        font-size: 14px;
        padding: 8px 20px;
        border-radius: 30px;
        border: 2px solid #ffd400;
        box-shadow: 0 4px 20px rgba(224, 36, 43, 0.7);
        cursor: pointer;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: bribePulse 0.9s infinite alternate;
        transition: transform 0.15s, background 0.15s;
      }
      .bribe-btn:hover {
        transform: translateX(-50%) scale(1.06);
        background: linear-gradient(135deg, #ff3333, #a00000);
      }
      @keyframes bribePulse {
        0% { box-shadow: 0 0 12px rgba(255, 212, 0, 0.6); }
        100% { box-shadow: 0 0 26px rgba(224, 36, 43, 0.9); }
      }

      /* Circular SVG Speedometer Gauge */
      .raja-gauge {
        position: fixed;
        bottom: 90px;
        left: 20px;
        width: 124px;
        height: 124px;
        background: rgba(12, 16, 24, 0.88);
        border: 2px solid rgba(255, 203, 31, 0.4);
        border-radius: 50%;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.7), inset 0 0 18px rgba(79, 195, 247, 0.18);
        z-index: 92;
        pointer-events: none;
        transition: border-color 0.3s, box-shadow 0.3s;
      }
      .raja-gauge.overspeed {
        border-color: #ff0055;
        box-shadow: 0 0 25px rgba(255, 0, 85, 0.8), inset 0 0 20px rgba(255, 0, 85, 0.5);
        animation: overspeedPulse 0.4s infinite alternate;
      }
      @keyframes overspeedPulse {
        0% { transform: scale(1); }
        100% { transform: scale(1.04); }
      }
      .gauge-svg {
        width: 100%;
        height: 100%;
      }
      .gauge-bg {
        fill: none;
        stroke: rgba(255, 255, 255, 0.08);
        stroke-width: 8;
      }
      .gauge-arc {
        fill: none;
        stroke: url(#gaugeGrad);
        stroke-width: 8;
        stroke-linecap: round;
        stroke-dasharray: 240;
        stroke-dashoffset: 0;
      }
      .gauge-needle {
        stroke: #ffd400;
        stroke-width: 3.5;
        stroke-linecap: round;
        filter: drop-shadow(0 0 6px #ffd400);
        transition: transform 0.08s ease-out;
      }
      .gauge-readout {
        position: absolute;
        bottom: 24px;
        left: 0;
        right: 0;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .speed-number {
        font-family: 'Baloo Da 2', monospace;
        font-weight: 800;
        font-size: 24px;
        color: #fff;
        line-height: 1;
        text-shadow: 0 0 10px rgba(255, 203, 31, 0.8);
      }
      .speed-unit {
        font-family: sans-serif;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 1px;
        color: #4fc3f7;
      }

      /* Dhaka Taxi Fare Meter */
      .raja-fare-meter {
        position: fixed;
        top: 14px;
        right: 80px;
        background: rgba(10, 15, 22, 0.9);
        border: 1.5px solid #38ef7d;
        padding: 5px 12px;
        border-radius: 10px;
        box-shadow: 0 2px 14px rgba(56, 239, 125, 0.35);
        z-index: 92;
        pointer-events: none;
        text-align: right;
      }
      .fare-badge {
        font-family: 'Hind Siliguri', sans-serif;
        font-size: 11px;
        font-weight: 700;
        color: #a8ff78;
        letter-spacing: 0.5px;
      }
      .fare-num {
        font-family: 'Baloo Da 2', monospace;
        font-size: 18px;
        font-weight: 800;
        color: #38ef7d;
        text-shadow: 0 0 8px rgba(56, 239, 125, 0.6);
        line-height: 1.1;
      }

      /* Motion Blur Wind Speed Streaks */
      .speed-streaks-canvas {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 75;
      }

      /* Live TV News & Police FIR Challan Game Over Screen */
      #paper {
        background: rgba(4, 8, 18, 0.94) !important;
        backdrop-filter: blur(14px) !important;
      }
      .np {
        background: linear-gradient(145deg, #0b1120 0%, #172338 100%) !important;
        border: 2.5px solid #e0242b !important;
        box-shadow: 0 0 40px rgba(224, 36, 43, 0.6), 0 12px 48px rgba(0, 0, 0, 0.9) !important;
        border-radius: 16px !important;
        color: #f1f5f9 !important;
      }
      .np header {
        border-bottom: 2px solid #e0242b !important;
        background: #0f172a !important;
        border-radius: 14px 14px 0 0 !important;
        padding: 12px 16px !important;
      }
      .np-name {
        color: #ffcb1f !important;
        font-family: 'Baloo Da 2', sans-serif !important;
        font-weight: 800 !important;
        font-size: 28px !important;
        letter-spacing: 1.5px !important;
        text-shadow: 0 0 16px rgba(255, 203, 31, 0.8) !important;
      }
      .np-mast {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
      .np-kicker {
        background: #e0242b !important;
        color: #fff !important;
        font-weight: 800 !important;
        display: inline-block !important;
        padding: 5px 16px !important;
        border-radius: 6px !important;
        letter-spacing: 1px !important;
        box-shadow: 0 0 14px rgba(224, 36, 43, 0.9) !important;
      }
      .np h2 {
        color: #ffffff !important;
        font-family: 'Anek Bangla', sans-serif !important;
        font-weight: 800 !important;
        text-shadow: 0 2px 10px rgba(0,0,0,0.9) !important;
      }
      .np-photo {
        border: 2.5px solid #38ef7d !important;
        border-radius: 10px !important;
        overflow: hidden !important;
        position: relative !important;
        box-shadow: 0 6px 24px rgba(0,0,0,0.8) !important;
      }
      .np-stamp {
        background: #e0242b !important;
        color: #ffffff !important;
        border: 2px solid #ffd400 !important;
        border-radius: 8px !important;
        box-shadow: 0 0 22px rgba(224, 36, 43, 0.95) !important;
        padding: 4px 10px !important;
      }
      .np-stamp small {
        color: #ffcb1f !important;
        font-weight: 800 !important;
      }
      .np-body p {
        color: #cbd5e1 !important;
        line-height: 1.65 !important;
      }
      .np-actions .cta {
        background: linear-gradient(135deg, #ffd400, #ff9900) !important;
        color: #111 !important;
        font-weight: 800 !important;
        box-shadow: 0 4px 20px rgba(255, 203, 31, 0.7) !important;
      }

      /* Camera Flash Animation */
      .tv-camera-flash {
        position: fixed;
        inset: 0;
        background: #ffffff;
        opacity: 0;
        pointer-events: none;
        z-index: 99999;
      }
      .tv-camera-flash.flashing {
        animation: cameraFlashAnim 0.35s ease-out;
      }
      @keyframes cameraFlashAnim {
        0% { opacity: 0.92; }
        25% { opacity: 0; }
        45% { opacity: 0.85; }
        100% { opacity: 0; }
      }

      /* TV Photo Overlays & CRT Scanlines */
      .tv-photo-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .tv-live-pill {
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(224, 36, 43, 0.95);
        color: #ffffff;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 800;
        box-shadow: 0 0 10px rgba(224, 36, 43, 0.8);
        display: flex;
        align-items: center;
        gap: 5px;
        z-index: 2;
        letter-spacing: 0.5px;
      }
      .rec-blink {
        width: 7px;
        height: 7px;
        background: #ffffff;
        border-radius: 50%;
        animation: recBlink 0.8s infinite alternate;
      }
      @keyframes recBlink {
        0% { opacity: 1; }
        100% { opacity: 0.2; }
      }
      .tv-rec-time {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(15, 23, 42, 0.85);
        color: #ffd400;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-family: monospace;
        font-weight: 700;
        z-index: 2;
        border: 1px solid rgba(255, 212, 0, 0.3);
      }
      .tv-scanlines {
        position: absolute;
        inset: 0;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%);
        background-size: 100% 4px;
        z-index: 1;
      }

      /* Police FIR Challan Docket */
      .police-fir-box {
        background: rgba(15, 23, 42, 0.92);
        border: 2px solid #ffcb1f;
        border-radius: 10px;
        padding: 12px 14px;
        margin: 12px 0;
        box-shadow: inset 0 0 15px rgba(255, 203, 31, 0.15), 0 4px 18px rgba(0, 0, 0, 0.6);
        font-family: 'Anek Bangla', 'Hind Siliguri', sans-serif;
      }
      .fir-top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1.5px solid rgba(255, 203, 31, 0.4);
        padding-bottom: 6px;
        margin-bottom: 8px;
      }
      .fir-emblem {
        color: #ffcb1f;
        font-weight: 800;
        font-size: 13px;
        letter-spacing: 0.5px;
      }
      .fir-doc-badge {
        background: #e0242b;
        color: #ffffff;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.5px;
      }
      .fir-meta-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 10px;
      }
      .fir-details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 14px;
      }
      .fir-grid-item small {
        display: block;
        font-size: 11px;
        color: #94a3b8;
        margin-bottom: 2px;
      }
      .fir-grid-item strong {
        display: block;
        font-size: 13px;
        color: #f8fafc;
        line-height: 1.3;
      }
      .fir-grid-item .fir-amount {
        color: #ff3344;
        font-size: 18px;
        font-weight: 900;
        text-shadow: 0 0 12px rgba(255, 51, 68, 0.6);
      }
      .fir-seal-banner {
        margin-top: 10px;
        text-align: center;
        border-top: 1px dashed rgba(255, 203, 31, 0.3);
        padding-top: 6px;
      }
      .fir-seal-badge {
        color: #38ef7d;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }

      
      /* Mini-Map Cyber Radar HUD */
      .mini-map-radar {
        position: fixed;
        top: 14px;
        right: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(11, 17, 32, 0.88);
        border: 2px solid #00f0ff;
        border-radius: 14px;
        padding: 6px 8px;
        box-shadow: 0 0 20px rgba(0, 240, 255, 0.4), 0 8px 32px rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 90;
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .mini-map-radar:hover {
        transform: scale(1.04);
      }
      .mini-map-radar.minimized #radarCanvas,
      .mini-map-radar.minimized .radar-gps-hint {
        display: none;
      }
      .radar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 4px;
        padding: 0 4px;
      }
      .radar-live-dot {
        width: 8px;
        height: 8px;
        background: #00f0ff;
        border-radius: 50%;
        box-shadow: 0 0 8px #00f0ff;
        animation: recBlink 0.9s infinite alternate;
      }
      .radar-title {
        font-family: 'Baloo Da 2', 'Anek Bangla', sans-serif;
        font-size: 11px;
        font-weight: 800;
        color: #00f0ff;
        letter-spacing: 0.5px;
      }
      .radar-heading {
        font-family: monospace;
        font-size: 11px;
        font-weight: 900;
        color: #ffd400;
      }
      #radarCanvas {
        border-radius: 50%;
        background: #070d18;
      }
      .radar-gps-hint {
        font-family: 'Anek Bangla', sans-serif;
        font-size: 11px;
        font-weight: 700;
        color: #ffd400;
        margin-top: 4px;
        text-shadow: 0 1px 4px rgba(0,0,0,0.9);
      }

      /* Near-Miss Cinematic Flash Banner */
      .near-miss-toast {
        position: fixed;
        top: 22%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.6);
        background: linear-gradient(135deg, rgba(255, 51, 68, 0.95), rgba(255, 153, 0, 0.95));
        color: #ffffff;
        font-family: 'Baloo Da 2', 'Anek Bangla', sans-serif;
        font-size: clamp(16px, 4vw, 24px);
        font-weight: 900;
        padding: 8px 24px;
        border-radius: 30px;
        border: 2px solid #ffd400;
        box-shadow: 0 0 25px rgba(255, 203, 31, 0.9), 0 4px 20px rgba(0, 0, 0, 0.8);
        pointer-events: none;
        z-index: 100;
        opacity: 0;
        transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .near-miss-toast.active {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.15);
      }

      /* Mobile Perfection: Touch Ergonomics & Responsive UI */
      @media (max-width: 768px) {
        .mini-map-radar {
          top: 8px;
          right: 8px;
          padding: 4px;
          transform: scale(0.85);
          transform-origin: top right;
        }
        .raja-cockpit-hud {
          bottom: 12px !important;
          left: 12px !important;
          transform: scale(0.82) !important;
          transform-origin: bottom left !important;
        }
        .raja-chada-meter {
          top: 8px !important;
          left: 8px !important;
          padding: 4px 10px !important;
          font-size: 12px !important;
        }
        .raja-stars-box {
          top: 8px !important;
          padding: 3px 10px !important;
          transform: translateX(-50%) scale(0.85) !important;
        }
        .bribe-police-btn {
          top: 48px !important;
          font-size: 12px !important;
          padding: 5px 12px !important;
        }
        #touch .tbtn {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        #touch .pedal {
          font-weight: 900 !important;
          letter-spacing: 0.5px !important;
        }
        #touch #tGas {
          border: 2px solid #38ef7d !important;
          box-shadow: 0 0 15px rgba(56, 239, 125, 0.4) !important;
        }
        #touch #tBrake {
          border: 2px solid #ff3344 !important;
          box-shadow: 0 0 15px rgba(255, 51, 68, 0.4) !important;
        }
        #touch #tBoost {
          border: 2px solid #00f0ff !important;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.5) !important;
        }
        #touch #tHorn {
          border: 2px solid #ffd400 !important;
          box-shadow: 0 0 15px rgba(255, 212, 0, 0.4) !important;
        }
      }

      /* Bottom TV Breaking News Marquee Scroller */
      .tv-breaking-ticker {
        background: #0b1120;
        border-top: 2px solid #e0242b;
        border-bottom: 2px solid #ffd400;
        display: flex;
        align-items: center;
        overflow: hidden;
        padding: 6px 0;
        border-radius: 0 0 14px 14px;
        margin-top: 12px;
      }
      .ticker-badge {
        background: #e0242b;
        color: #ffffff;
        font-weight: 900;
        padding: 4px 12px;
        font-size: 12px;
        white-space: nowrap;
        margin-left: 8px;
        margin-right: 10px;
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(224, 36, 43, 0.8);
        flex-shrink: 0;
      }
      .ticker-marquee-wrap {
        overflow: hidden;
        white-space: nowrap;
        width: 100%;
      }
      .ticker-marquee-track {
        display: inline-block;
        padding-left: 100%;
        animation: tickerScroll 20s linear infinite;
        font-size: 13px;
        font-weight: 700;
        color: #ffd400;
        letter-spacing: 0.5px;
      }
      @keyframes tickerScroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-100%); }
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

    // Dynamically rebuild player 3D mesh in Three.js scene
    try {
      const pl = window.__PLAYER_INSTANCE || (window.__at && window.__at.PLAYER);
      if (pl && typeof pl.buildMesh === 'function') {
        const sc = pl.scene || (window.__at && window.__at.SCENE);
        pl.buildMesh(kind, sc);
      }
    } catch (err) {
      console.warn('Vehicle 3D model switch error:', err);
    }

    // Show visual confirmation toast
    const dialogueBox = document.getElementById('dialogue');
    if (dialogueBox) {
      dialogueBox.textContent = `🚗 সিলেক্টেড: ${cfg.name} — ${cfg.subtitle}`;
      dialogueBox.hidden = false;
      setTimeout(() => { dialogueBox.hidden = true; }, 2400);
    }

    // Play subtle engine rev cue
    if (window.RastarRaja.audioCtx) {
      try {
        const ctx = window.RastarRaja.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } catch(e){}
    }
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


  // ----------------------------------------------------
  // 7. GTA Wanted Star System & Police Chase
  // ----------------------------------------------------
  const WantedSystem = {
    stars: 0,
    bribed: false,
    bribedDamage: 0,
    sirenOsc: null,
    sirenGain: null,
    sirenTimer: null,
    lastStarNotice: 0,

    init() {
      const hud = document.getElementById('hud');
      if (!hud || document.getElementById('wantedStarsBox')) return;

      const starBox = document.createElement('div');
      starBox.id = 'wantedStarsBox';
      starBox.className = 'raja-stars-box';
      starBox.innerHTML = `
        <div class="stars-label">WANTED</div>
        <div class="stars-row">
          <span class="star" data-s="1">★</span>
          <span class="star" data-s="2">★</span>
          <span class="star" data-s="3">★</span>
          <span class="star" data-s="4">★</span>
          <span class="star" data-s="5">★</span>
        </div>
      `;
      hud.appendChild(starBox);

      if (!document.getElementById('policeVignette')) {
        const vig = document.createElement('div');
        vig.id = 'policeVignette';
        vig.className = 'police-vignette';
        document.body.appendChild(vig);
      }

      if (!document.getElementById('bribeBtn')) {
        const bribe = document.createElement('button');
        bribe.id = 'bribeBtn';
        bribe.type = 'button';
        bribe.className = 'bribe-btn';
        bribe.innerHTML = `<span>👮 মামা চা-পানি খান (৳১০০ ঘুষ দিন) [B]</span>`;
        bribe.hidden = true;
        bribe.addEventListener('click', () => this.bribePolice());
        hud.appendChild(bribe);

        window.addEventListener('keydown', (e) => {
          if ((e.key === 'b' || e.key === 'B') && this.stars >= 2 && !bribe.hidden) {
            this.bribePolice();
          }
        });
      }
    },

    update(damage, isAlive, inPlay) {
      if (!inPlay || !isAlive) {
        if (this.stars > 0) this.setStars(0);
        return;
      }

      let targetStars = 0;
      if (damage >= 80000) targetStars = 5;
      else if (damage >= 45000) targetStars = 4;
      else if (damage >= 20000) targetStars = 3;
      else if (damage >= 6000) targetStars = 2;
      else if (damage >= 1000) targetStars = 1;

      if (this.bribed) {
        if (damage > this.bribedDamage + 12000) {
          this.bribed = false;
        } else {
          targetStars = Math.max(0, targetStars - 2);
        }
      }

      if (targetStars !== this.stars) {
        this.setStars(targetStars);
      }
    },

    setStars(num) {
      this.stars = num;
      const box = document.getElementById('wantedStarsBox');
      const bribeBtn = document.getElementById('bribeBtn');
      const vig = document.getElementById('policeVignette');

      if (box) {
        box.classList.toggle('active', num > 0);
        box.classList.toggle('chase', num >= 2);
        box.querySelectorAll('.star').forEach(st => {
          const sIdx = parseInt(st.getAttribute('data-s'), 10);
          st.classList.toggle('lit', sIdx <= num);
        });
      }

      if (bribeBtn) {
        bribeBtn.hidden = num < 2;
      }

      if (vig) {
        vig.classList.toggle('active', num >= 2);
      }

      if (num >= 2) {
        this.startSiren();
      } else {
        this.stopSiren();
      }

      const now = Date.now();
      if (num > 0 && now - this.lastStarNotice > 5000) {
        this.lastStarNotice = now;
        const dialogueBox = document.getElementById('dialogue');
        if (dialogueBox) {
          let msg = "⚠️ ট্রাফিক পুলিশ নজর রাখছে!";
          if (num === 2) msg = "🚨 ২ স্টার: ট্রাফিক পুলিশ পিছু নিচ্ছে!";
          else if (num === 3) msg = "🚨 ৩ স্টার: পুলিশের পিকআপ সাইরেন বাজাচ্ছে!";
          else if (num === 4) msg = "🚨 ৪ স্টার: পুলিশ চারপাশ ঘিরে ফেলছে!";
          else if (num === 5) msg = "🔥 ৫ স্টার: সামনে রোড ব্যারিকেড অ্যালার্ট!";
          dialogueBox.textContent = msg;
          dialogueBox.hidden = false;
          setTimeout(() => { dialogueBox.hidden = true; }, 3200);
        }
      }
    },

    startSiren() {
      if (this.sirenOsc) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!window.RastarRaja.audioCtx) window.RastarRaja.audioCtx = new AudioCtx();
        const ctx = window.RastarRaja.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, ctx.currentTime);

        let up = true;
        const sweep = () => {
          if (!this.sirenOsc) return;
          const t = ctx.currentTime;
          if (up) {
            osc.frequency.exponentialRampToValueAtTime(950, t + 0.55);
          } else {
            osc.frequency.exponentialRampToValueAtTime(650, t + 0.55);
          }
          up = !up;
          this.sirenTimer = setTimeout(sweep, 550);
        };
        sweep();

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        this.sirenOsc = osc;
        this.sirenGain = gain;
      } catch (e) {}
    },

    stopSiren() {
      if (this.sirenTimer) {
        clearTimeout(this.sirenTimer);
        this.sirenTimer = null;
      }
      if (this.sirenOsc) {
        try {
          this.sirenGain.gain.exponentialRampToValueAtTime(0.0001, window.RastarRaja.audioCtx.currentTime + 0.2);
          setTimeout(() => {
            try { this.sirenOsc.stop(); this.sirenOsc.disconnect(); } catch(e){}
            this.sirenOsc = null;
            this.sirenGain = null;
          }, 250);
        } catch(e) {
          this.sirenOsc = null;
        }
      }
    },

    bribePolice() {
      this.bribed = true;
      this.bribedDamage = (window.__at && window.__at.G && window.__at.G.loss) || 0;
      this.setStars(0);

      try {
        const ctx = window.RastarRaja.audioCtx;
        if (ctx) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.08);
          g.gain.setValueAtTime(0.3, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.26);
        }
      } catch(e) {}

      const dialogueBox = document.getElementById('dialogue');
      if (dialogueBox) {
        dialogueBox.textContent = "👮 সার্জেন্ট: 'আইচ্ছা যান মামা, চা-পানি পাইসি! এইবার মাফ!'";
        dialogueBox.hidden = false;
        setTimeout(() => { dialogueBox.hidden = true; }, 3500);
      }
    }
  };

  // ----------------------------------------------------
  // 8. Digital Cockpit & Cyber Speedometer HUD
  // ----------------------------------------------------
  const CockpitHUD = {
    fareAmount: 0,
    speedCanvas: null,
    speedCtx: null,
    streaks: [],

    init() {
      const hud = document.getElementById('hud');
      if (!hud || document.getElementById('cockpitGauge')) return;

      const gauge = document.createElement('div');
      gauge.id = 'cockpitGauge';
      gauge.className = 'raja-gauge';
      gauge.innerHTML = `
        <svg class="gauge-svg" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4fc3f7" />
              <stop offset="60%" stop-color="#ffcb1f" />
              <stop offset="100%" stop-color="#ff0055" />
            </linearGradient>
          </defs>
          <circle class="gauge-bg" cx="80" cy="80" r="66"></circle>
          <path class="gauge-arc" d="M 28 126 A 66 66 0 1 1 132 126"></path>
          <g class="gauge-ticks">
            <line x1="28" y1="126" x2="38" y2="116" stroke="#4fc3f7" stroke-width="2"/>
            <line x1="20" y1="80" x2="32" y2="80" stroke="#4fc3f7" stroke-width="2"/>
            <line x1="42" y1="42" x2="50" y2="50" stroke="#4fc3f7" stroke-width="2"/>
            <line x1="80" y1="14" x2="80" y2="28" stroke="#ffcb1f" stroke-width="3"/>
            <line x1="118" y1="42" x2="110" y2="50" stroke="#ff4b4b" stroke-width="2"/>
            <line x1="140" y1="80" x2="128" y2="80" stroke="#ff4b4b" stroke-width="2"/>
            <line x1="132" y1="126" x2="122" y2="116" stroke="#ff0055" stroke-width="3"/>
          </g>
          <line id="gaugeNeedle" class="gauge-needle" x1="80" y1="80" x2="80" y2="24"></line>
          <circle cx="80" cy="80" r="7" fill="#ffd400"></circle>
        </svg>
        <div class="gauge-readout">
          <span id="speedVal" class="speed-number">০</span>
          <span class="speed-unit">KM/H</span>
        </div>
      `;
      hud.appendChild(gauge);

      const fareMeter = document.createElement('div');
      fareMeter.id = 'fareMeter';
      fareMeter.className = 'raja-fare-meter';
      fareMeter.innerHTML = `
        <div class="fare-badge">🚖 চাঁদা ও ভাড়া মিটার</div>
        <div class="fare-num" id="fareVal">৳০</div>
      `;
      hud.appendChild(fareMeter);

      const c = document.createElement('canvas');
      c.id = 'speedCanvas';
      c.className = 'speed-streaks-canvas';
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      document.body.appendChild(c);
      this.speedCanvas = c;
      this.speedCtx = c.getContext('2d');

      window.addEventListener('resize', () => {
        if (this.speedCanvas) {
          this.speedCanvas.width = window.innerWidth;
          this.speedCanvas.height = window.innerHeight;
        }
      });
    },

    update(speedMps, dt, inPlay) {
      if (!inPlay) {
        if (this.speedCtx && this.speedCanvas) {
          this.speedCtx.clearRect(0, 0, this.speedCanvas.width, this.speedCanvas.height);
        }
        return;
      }

      const kmh = Math.round(Math.abs(speedMps) * 7.5);
      const needle = document.getElementById('gaugeNeedle');
      if (needle) {
        const clampedKmh = Math.min(140, kmh);
        const deg = -135 + (clampedKmh / 140) * 270;
        needle.style.transform = `rotate(${deg}deg)`;
        needle.style.transformOrigin = '80px 80px';
      }

      const speedValEl = document.getElementById('speedVal');
      if (speedValEl) {
        speedValEl.textContent = kmh;
      }

      const gaugeEl = document.getElementById('cockpitGauge');
      if (gaugeEl) {
        gaugeEl.classList.toggle('overspeed', kmh >= 90);
      }

      if (kmh > 5) {
        this.fareAmount += (kmh * dt * 0.45);
        const fareEl = document.getElementById('fareVal');
        if (fareEl) {
          fareEl.textContent = `৳${Math.floor(this.fareAmount).toLocaleString('bn-BD')}`;
        }
      }

      this.renderSpeedLines(kmh, dt);
    },

    renderSpeedLines(kmh, dt) {
      if (!this.speedCtx || !this.speedCanvas) return;
      const ctx = this.speedCtx;
      const w = this.speedCanvas.width;
      const h = this.speedCanvas.height;

      ctx.clearRect(0, 0, w, h);
      if (kmh < 85) {
        this.streaks.length = 0;
        return;
      }

      const count = Math.min(25, Math.floor((kmh - 80) * 0.8));
      const cx = w / 2;
      const cy = h / 2;

      while (this.streaks.length < count) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 70 + Math.random() * (w * 0.3);
        this.streaks.push({
          angle,
          dist,
          len: 35 + Math.random() * 80,
          speed: 400 + Math.random() * 600,
          opacity: 0.3 + Math.random() * 0.45
        });
      }

      ctx.lineWidth = 2.5;
      for (let i = this.streaks.length - 1; i >= 0; i--) {
        const st = this.streaks[i];
        st.dist += st.speed * dt;
        if (st.dist > Math.max(w, h)) {
          this.streaks.splice(i, 1);
          continue;
        }

        const x1 = cx + Math.cos(st.angle) * st.dist;
        const y1 = cy + Math.sin(st.angle) * st.dist;
        const x2 = cx + Math.cos(st.angle) * (st.dist + st.len);
        const y2 = cy + Math.sin(st.angle) * (st.dist + st.len);

        ctx.strokeStyle = `rgba(255, 230, 100, ${st.opacity})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  };

  // ----------------------------------------------------
  // 9. Dhaka Speed Bumps Detection & Launch System
  // ----------------------------------------------------
  let lastSpeedBumpZ = -9999;
  function checkSpeedBumps(p, dt) {
    if (!p || !p.alive) return;

    const bumpZ = Math.round(p.z / 120) * 120;
    if (Math.abs(p.z - bumpZ) < 1.4 && Math.abs(p.z - lastSpeedBumpZ) > 12) {
      lastSpeedBumpZ = p.z;

      if (Math.abs(p.v) > 4.5) {
        p.air = Math.max(p.air || 0, 0.45);
        p.bumpY = 0.35;
        p.v *= 0.78;

        if (window.__at) {
          if (window.__at.sfx && window.__at.sfx.bump) window.__at.sfx.bump();
          if (window.__at.FX && window.__at.FX.shake) window.__at.FX.shake(0.35);
        }

        const dialogueBox = document.getElementById('dialogue');
        if (dialogueBox) {
          dialogueBox.textContent = "💥 মামা স্পিড ব্রেকার দেখেন না? গাড়ি উড়ায় দিলেন!";
          dialogueBox.hidden = false;
          setTimeout(() => { dialogueBox.hidden = true; }, 2600);
        }
      }
    }
  }

  // ----------------------------------------------------
  // 10. Advanced Hyper-Realistic Visuals Engine (VisualsFX)
  // ----------------------------------------------------
  const VisualsFX = {
    initialized: false,
    underglowMesh: null,
    headlightGroup: null,
    exhaustMesh: null,
    moonGroup: null,
    puddlesGroup: null,
    propsGroup: null,
    puddleList: [],
    lastSparkT: 0,
    lastSmokeT: 0,
    lastSprayT: 0,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      // --- 1. Neon Underglow Mesh ---
      try {
        const uCanvas = document.createElement('canvas');
        uCanvas.width = 128;
        uCanvas.height = 128;
        const uCtx = uCanvas.getContext('2d');
        const grad = uCtx.createRadialGradient(64, 64, 8, 64, 64, 64);
        grad.addColorStop(0, '#00f0ff');
        grad.addColorStop(0.35, 'rgba(0, 210, 255, 0.8)');
        grad.addColorStop(0.7, 'rgba(0, 150, 255, 0.35)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        uCtx.fillStyle = grad;
        uCtx.fillRect(0, 0, 128, 128);

        const uTex = new THREE.Tex.glow.constructor(uCanvas);
        uTex.needsUpdate = true;

        const uGeo = new THREE.Plane(3.6, 5.2);
        uGeo.rotateX(-THREE.PI / 2);
        const uMat = new THREE.BasicMat({
          map: uTex,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.underglowMesh = new THREE.Mesh(uGeo, uMat);
        this.underglowMesh.position.y = 0.04;
        scene.add(this.underglowMesh);
      } catch(e) { console.warn('Underglow init error:', e); }

      // --- 2. Volumetric 3D Headlight Projection Beams ---
      try {
        this.headlightGroup = new THREE.Group();
        const beamCanvas = document.createElement('canvas');
        beamCanvas.width = 64;
        beamCanvas.height = 256;
        const bCtx = beamCanvas.getContext('2d');
        const bGrad = bCtx.createLinearGradient(0, 0, 0, 256);
        bGrad.addColorStop(0, 'rgba(255, 250, 220, 0.65)');
        bGrad.addColorStop(0.3, 'rgba(255, 240, 180, 0.35)');
        bGrad.addColorStop(0.7, 'rgba(255, 230, 140, 0.12)');
        bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        bCtx.fillStyle = bGrad;
        bCtx.fillRect(0, 0, 64, 256);

        const beamTex = new THREE.Tex.glow.constructor(beamCanvas);
        beamTex.needsUpdate = true;

        const beamGeo = new THREE.Plane(2.8, 14);
        beamGeo.rotateX(-THREE.PI / 2);
        const beamMat = new THREE.BasicMat({
          map: beamTex,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        // Left and Right Headlight Beams
        const leftBeam = new THREE.Mesh(beamGeo, beamMat);
        leftBeam.position.set(-0.55, 0.05, -7.5);
        const rightBeam = new THREE.Mesh(beamGeo, beamMat);
        rightBeam.position.set(0.55, 0.05, -7.5);

        this.headlightGroup.add(leftBeam, rightBeam);
        scene.add(this.headlightGroup);
      } catch(e) { console.warn('Headlight beams init error:', e); }

      // --- 3. Nitro Exhaust Backfire Flame ---
      try {
        const fCanvas = document.createElement('canvas');
        fCanvas.width = 64;
        fCanvas.height = 128;
        const fCtx = fCanvas.getContext('2d');
        const fGrad = fCtx.createLinearGradient(0, 0, 0, 128);
        fGrad.addColorStop(0, '#ffffff');
        fGrad.addColorStop(0.2, '#00d4ff');
        fGrad.addColorStop(0.5, '#ff6600');
        fGrad.addColorStop(0.85, '#ff0033');
        fGrad.addColorStop(1, 'rgba(0,0,0,0)');
        fCtx.fillStyle = fGrad;
        fCtx.beginPath();
        fCtx.moveTo(32, 0);
        fCtx.lineTo(58, 128);
        fCtx.lineTo(6, 128);
        fCtx.closePath();
        fCtx.fill();

        const fTex = new THREE.Tex.glow.constructor(fCanvas);
        fTex.needsUpdate = true;

        const fGeo = new THREE.Plane(0.45, 1.3);
        fGeo.rotateX(THREE.PI / 2);
        const fMat = new THREE.BasicMat({
          map: fTex,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        this.exhaustMesh = new THREE.Mesh(fGeo, fMat);
        this.exhaustMesh.visible = false;
        scene.add(this.exhaustMesh);
      } catch(e) { console.warn('Exhaust flame init error:', e); }

      // --- 4. Night Full Moon & Lunar Halo ---
      try {
        this.moonGroup = new THREE.Group();
        const moonCanvas = document.createElement('canvas');
        moonCanvas.width = 128;
        moonCanvas.height = 128;
        const mCtx = moonCanvas.getContext('2d');

        // Moon disc with craters
        mCtx.fillStyle = '#fffdf0';
        mCtx.beginPath();
        mCtx.arc(64, 64, 52, 0, Math.PI * 2);
        mCtx.fill();

        // Realistic craters
        mCtx.fillStyle = 'rgba(180, 175, 150, 0.45)';
        for (const [cx, cy, cr] of [[50, 48, 14], [72, 70, 18], [42, 76, 10], [78, 44, 12], [62, 85, 8]]) {
          mCtx.beginPath();
          mCtx.arc(cx, cy, cr, 0, Math.PI * 2);
          mCtx.fill();
        }

        const moonTex = new THREE.Tex.glow.constructor(moonCanvas);
        moonTex.needsUpdate = true;

        const moonGeo = new THREE.Plane(18, 18);
        const moonMat = new THREE.BasicMat({
          map: moonTex,
          transparent: true,
          depthWrite: false
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);

        // Soft Lunar Halo
        const haloGeo = new THREE.Plane(45, 45);
        const haloMat = new THREE.BasicMat({
          map: THREE.Tex.glow,
          color: 0xfff3c4,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.position.z = -0.5;

        this.moonGroup.add(haloMesh, moonMesh);
        this.moonGroup.visible = false;
        scene.add(this.moonGroup);
      } catch(e) { console.warn('Moon init error:', e); }

      // --- 5. Road Puddle Reflection Patches ---
      try {
        this.puddlesGroup = new THREE.Group();
        const pudCanvas = document.createElement('canvas');
        pudCanvas.width = 128;
        pudCanvas.height = 128;
        const pCtx = pudCanvas.getContext('2d');
        const pGrad = pCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
        pGrad.addColorStop(0, 'rgba(180, 220, 255, 0.75)');
        pGrad.addColorStop(0.4, 'rgba(80, 140, 200, 0.5)');
        pGrad.addColorStop(0.8, 'rgba(30, 60, 100, 0.25)');
        pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        pCtx.fillStyle = pGrad;
        pCtx.fillRect(0, 0, 128, 128);

        const pudTex = new THREE.Tex.glow.constructor(pudCanvas);
        pudTex.needsUpdate = true;

        const pudMat = new THREE.BasicMat({
          map: pudTex,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        // Spawn 16 shimmering puddle patches along the road
        for (let i = 0; i < 16; i++) {
          const w = 2.4 + (i % 3) * 0.8;
          const l = 3.2 + (i % 4) * 0.9;
          const geo = new THREE.Plane(w, l);
          geo.rotateX(-THREE.PI / 2);
          const pMesh = new THREE.Mesh(geo, pudMat);
          const side = (i % 2 === 0 ? 1 : -1) * (2.5 + (i % 5) * 1.5);
          pMesh.position.set(side, 0.025, -(i * 45 + 15));
          this.puddleList.push(pMesh);
          this.puddlesGroup.add(pMesh);
        }
        this.puddlesGroup.visible = false;
        scene.add(this.puddlesGroup);
      } catch(e) { console.warn('Puddles init error:', e); }

      // --- 6. 3D Cast-Iron Manhole Covers & Traffic Signal Lights ---
      try {
        this.propsGroup = new THREE.Group();
        const mhCanvas = document.createElement('canvas');
        mhCanvas.width = 128;
        mhCanvas.height = 128;
        const mCtx = mhCanvas.getContext('2d');

        // Cast iron manhole texture
        mCtx.fillStyle = '#222222';
        mCtx.beginPath();
        mCtx.arc(64, 64, 60, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.strokeStyle = '#444444';
        mCtx.lineWidth = 4;
        mCtx.stroke();
        mCtx.strokeStyle = '#333333';
        mCtx.lineWidth = 2;
        mCtx.beginPath();
        mCtx.arc(64, 64, 40, 0, Math.PI * 2);
        mCtx.arc(64, 64, 20, 0, Math.PI * 2);
        mCtx.stroke();

        const mhTex = new THREE.Tex.glow.constructor(mhCanvas);
        mhTex.needsUpdate = true;
        const mhGeo = new THREE.Plane(1.4, 1.4);
        mhGeo.rotateX(-THREE.PI / 2);
        const mhMat = new THREE.BasicMat({ map: mhTex, transparent: true });

        // Place manholes along road lanes
        for (let i = 0; i < 12; i++) {
          const mh = new THREE.Mesh(mhGeo, mhMat);
          mh.position.set(i % 2 === 0 ? -4.5 : 4.5, 0.022, -(i * 80 + 25));
          this.propsGroup.add(mh);
        }

        scene.add(this.propsGroup);
      } catch(e) { console.warn('Props3D init error:', e); }
    },

    update(p, dt, inPlay, isNight, isRain) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !p) return;

      const now = performance.now();

      // 1. Update Neon Underglow
      if (this.underglowMesh) {
        this.underglowMesh.visible = inPlay && p.alive;
        if (this.underglowMesh.visible) {
          this.underglowMesh.position.set(p.x, 0.04, p.z);
          this.underglowMesh.rotation.y = p.yaw;
          const sx = (p.wid || 1.3) * 1.6;
          const sz = (p.len || 2.6) * 1.35;
          this.underglowMesh.scale.set(sx, 1, sz);

          // Pulse opacity with acceleration and boost
          const pulse = 0.75 + 0.25 * Math.sin(now * 0.006) + (p.boost ? 0.35 : 0);
          this.underglowMesh.material.opacity = Math.min(1.0, pulse);
        }
      }

      // 2. Update Volumetric Headlight Beams
      if (this.headlightGroup) {
        this.headlightGroup.visible = inPlay && p.alive && (isNight || isRain);
        if (this.headlightGroup.visible) {
          this.headlightGroup.position.set(p.x, 0.05, p.z);
          this.headlightGroup.rotation.y = p.yaw;
        }
      }

      // 3. Update Nitro Exhaust Backfire Flame
      if (this.exhaustMesh) {
        const isBoosting = p.boost || (p.throttle && Math.abs(p.v) > 8);
        this.exhaustMesh.visible = inPlay && p.alive && isBoosting;
        if (this.exhaustMesh.visible) {
          const tailDist = (p.len || 2.6) * 0.52;
          const tx = p.x + p.fx * tailDist;
          const tz = p.z + p.fz * tailDist;
          this.exhaustMesh.position.set(tx, 0.32, tz);
          this.exhaustMesh.rotation.y = p.yaw;

          const fScale = 0.9 + Math.random() * 0.45 + (p.boost ? 0.4 : 0);
          this.exhaustMesh.scale.set(fScale, 1, fScale);

          // Fire sparks on backfire
          if (at && at.FX && now - this.lastSparkT > 90) {
            this.lastSparkT = now;
            at.FX.sparks(tx, 0.32, tz, 2);
          }
        }
      }

      // 4. Update Night Full Moon
      if (this.moonGroup) {
        this.moonGroup.visible = isNight;
        if (isNight) {
          this.moonGroup.position.set(p.x + 120, 85, p.z - 240);
          if (at && at.CAM) {
            this.moonGroup.lookAt(at.CAM.position);
          }
        }
      }

      // 5. Update Puddles & Recycle along road
      if (this.puddlesGroup) {
        this.puddlesGroup.visible = isRain;
        if (isRain) {
          // Recycle puddles to stay around player
          for (const pud of this.puddleList) {
            if (pud.position.z > p.z + 30) {
              pud.position.z -= 720;
            } else if (pud.position.z < p.z - 690) {
              pud.position.z += 720;
            }
          }
        }
      }

      // 6. Drift Smoke & Rain Water Spray
      if (inPlay && p.alive && at && at.FX) {
        const speed = Math.abs(p.v);
        const rearDist = (p.len || 2.6) * 0.42;
        const halfWid = (p.wid || 1.3) * 0.45;

        // Tire contact points
        const t1x = p.x - p.rx * halfWid + p.fx * rearDist;
        const t1z = p.z - p.rz * halfWid + p.fz * rearDist;
        const t2x = p.x + p.rx * halfWid + p.fx * rearDist;
        const t2z = p.z + p.rz * halfWid + p.fz * rearDist;

        // Drift smoke
        if (Math.abs(p.steer) > 0.35 && speed > 5.5 && now - this.lastSmokeT > 100) {
          this.lastSmokeT = now;
          at.FX.puff(t1x, 0.12, t1z, 1.3, 0.4, 0xeeeeee);
          at.FX.puff(t2x, 0.12, t2z, 1.3, 0.4, 0xeeeeee);
        }

        // Water spray in rain
        if (isRain && speed > 3.5 && now - this.lastSprayT > 120) {
          this.lastSprayT = now;
          at.FX.puff(t1x, 0.08, t1z, 0.85, 0.25, 0x90caf9);
          at.FX.puff(t2x, 0.08, t2z, 0.85, 0.25, 0x90caf9);
        }
      }
    }
  };

  // ----------------------------------------------------
  // 12. Hydraulic Bus Horn with 3D Shockwave & Crowd Scatter
  // ----------------------------------------------------
  const HydraulicHorn = {
    shockwaveMesh: null,
    expanding: false,
    waveT: 0,

    init(THREE, scene) {
      if (this.shockwaveMesh || !THREE || !scene) return;
      try {
        const ringGeo = new THREE.Plane(1.2, 1.2);
        ringGeo.rotateX(-THREE.PI / 2);
        const ringCanvas = document.createElement('canvas');
        ringCanvas.width = 128; ringCanvas.height = 128;
        const rCtx = ringCanvas.getContext('2d');
        rCtx.strokeStyle = '#00f0ff';
        rCtx.lineWidth = 14;
        rCtx.beginPath(); rCtx.arc(64, 64, 52, 0, Math.PI * 2); rCtx.stroke();
        rCtx.strokeStyle = '#ffffff';
        rCtx.lineWidth = 4;
        rCtx.beginPath(); rCtx.arc(64, 64, 52, 0, Math.PI * 2); rCtx.stroke();

        const ringTex = new THREE.Tex.glow.constructor(ringCanvas);
        ringTex.needsUpdate = true;
        const ringMat = new THREE.BasicMat({
          map: ringTex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.shockwaveMesh = new THREE.Mesh(ringGeo, ringMat);
        this.shockwaveMesh.position.y = 0.2;
        this.shockwaveMesh.visible = false;
        scene.add(this.shockwaveMesh);
      } catch(e) {}
    },

    blast() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!window.RastarRaja.audioCtx) window.RastarRaja.audioCtx = new AudioCtx();
        const ctx = window.RastarRaja.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(185, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(175, ctx.currentTime + 0.65);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(230, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.65);

        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.72);
        osc2.stop(ctx.currentTime + 0.72);
      } catch(e) {}

      const at = window.__at;
      if (at && at.P && this.shockwaveMesh) {
        const p = at.P;
        this.shockwaveMesh.position.set(p.x - p.fx * 2, 0.25, p.z - p.fz * 2);
        this.shockwaveMesh.rotation.y = p.yaw;
        this.shockwaveMesh.scale.set(1, 1, 1);
        this.shockwaveMesh.material.opacity = 0.9;
        this.shockwaveMesh.visible = true;
        this.expanding = true;
        this.waveT = 0;

        if (at.FX && at.FX.shake) at.FX.shake(0.22);

        if (at.PEOPLE && at.PEOPLE.list) {
          for (const person of at.PEOPLE.list) {
            const dx = person.x - p.x;
            const dz = person.z - p.z;
            const dist = Math.hypot(dx, dz);
            if (dist < 18 && (dx * p.fx + dz * p.fz) < 0) {
              person.mode = 'flee';
              person.speed = 4.5;
            }
          }
        }

        const quotes = [
          "🔊 'মামা সাইড দেন, ব্রেক নাই!'",
          "🔊 'ডানে চাপেন ওস্তাদ! সোজা গাবতলী!'",
          "🔊 'প্যাঁক প্যাঁক প্যাঁক! সামনে থাইকা সরেন!'"
        ];
        const dialogueBox = document.getElementById('dialogue');
        if (dialogueBox) {
          dialogueBox.textContent = quotes[Math.floor(Math.random() * quotes.length)];
          dialogueBox.hidden = false;
          setTimeout(() => { dialogueBox.hidden = true; }, 2600);
        }
      }
    },

    update(dt) {
      if (this.expanding && this.shockwaveMesh) {
        this.waveT += dt * 4.5;
        const s = 1.0 + this.waveT * 8.0;
        this.shockwaveMesh.scale.set(s, 1, s * 1.5);
        this.shockwaveMesh.material.opacity = Math.max(0, 0.9 - this.waveT);
        if (this.waveT >= 0.9) {
          this.expanding = false;
          this.shockwaveMesh.visible = false;
        }
      }
    }
  };

  // ----------------------------------------------------
  // 13. Road Pickups & God Mode Energy Shield
  // ----------------------------------------------------
  const SuperPickups = {
    pickups: [],
    godModeActive: false,
    godModeTimer: 0,
    shieldMesh: null,
    initialized: false,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        const shieldGeo = new THREE.Plane(4.5, 4.5);
        shieldGeo.rotateX(-THREE.PI / 2);
        const sCanvas = document.createElement('canvas');
        sCanvas.width = 128; sCanvas.height = 128;
        const sCtx = sCanvas.getContext('2d');
        const sGrad = sCtx.createRadialGradient(64, 64, 15, 64, 64, 60);
        sGrad.addColorStop(0, 'rgba(0, 240, 255, 0.9)');
        sGrad.addColorStop(0.5, 'rgba(0, 120, 255, 0.6)');
        sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = sGrad;
        sCtx.fillRect(0, 0, 128, 128);

        const sTex = new THREE.Tex.glow.constructor(sCanvas);
        sTex.needsUpdate = true;
        const sMat = new THREE.BasicMat({
          map: sTex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, sMat);
        this.shieldMesh.position.y = 0.5;
        this.shieldMesh.visible = false;
        scene.add(this.shieldMesh);

        const pCanvas = document.createElement('canvas');
        pCanvas.width = 64; pCanvas.height = 64;
        const pCtx = pCanvas.getContext('2d');
        pCtx.fillStyle = '#ffd400';
        pCtx.beginPath(); pCtx.arc(32, 32, 28, 0, Math.PI * 2); pCtx.fill();
        const pTex = new THREE.Tex.glow.constructor(pCanvas);
        pTex.needsUpdate = true;

        const pGeo = new THREE.Plane(1.6, 1.6);
        const types = ['shield', 'battery', 'cash'];
        for (let i = 0; i < 9; i++) {
          const type = types[i % 3];
          const color = type === 'shield' ? 0x00f0ff : type === 'battery' ? 0xffea00 : 0x00e676;
          const mat = new THREE.BasicMat({
            map: pTex,
            color,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
          });
          const mesh = new THREE.Mesh(pGeo, mat);
          mesh.position.set((i % 2 === 0 ? -3.5 : 3.5), 0.9, -(i * 110 + 60));
          scene.add(mesh);
          this.pickups.push({ mesh, type, active: true });
        }
      } catch(e) {}
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
        HydraulicHorn.init(THREE, at.SCENE);
      }
      if (!inPlay || !p) return;

      const now = performance.now();

      for (const pk of this.pickups) {
        if (!pk.active) continue;
        pk.mesh.rotation.y += dt * 3.0;
        pk.mesh.position.y = 0.9 + Math.sin(now * 0.005 + pk.mesh.position.z) * 0.2;

        if (pk.mesh.position.z > p.z + 20) {
          pk.mesh.position.z -= 900;
          pk.active = true;
          pk.mesh.visible = true;
        }

        const dist = Math.hypot(p.x - pk.mesh.position.x, p.z - pk.mesh.position.z);
        if (dist < 2.0 && pk.active) {
          pk.active = false;
          pk.mesh.visible = false;
          this.triggerPickup(pk.type, p);
        }
      }

      if (this.godModeActive) {
        this.godModeTimer -= dt;
        if (this.shieldMesh) {
          this.shieldMesh.position.set(p.x, 0.4, p.z);
          this.shieldMesh.rotation.y += dt * 4;
          const s = 1.0 + 0.15 * Math.sin(now * 0.015);
          this.shieldMesh.scale.set(s, 1, s);
          this.shieldMesh.material.opacity = 0.85;
          this.shieldMesh.visible = true;
        }

        if (at && at.TRAFFIC && at.TRAFFIC.list) {
          for (const v of at.TRAFFIC.list) {
            if (v.dead) continue;
            const dist = Math.hypot(p.x - v.x, p.z - v.z);
            if (dist < 4.2) {
              v.kx = (v.x - p.x) * 12;
              v.kz = (v.z - p.z) * 12;
              v.v = -8;
              at.FX.sparks(v.x, 1, v.z, 8);
              at.FX.shake(0.35);
              if (at.sfx && at.sfx.thud) at.sfx.thud(v.x, v.z, 1.0);
            }
          }
        }

        if (this.godModeTimer <= 0) {
          this.godModeActive = false;
          if (this.shieldMesh) this.shieldMesh.visible = false;
        }
      }
    },

    triggerPickup(type, p) {
      const dialogueBox = document.getElementById('dialogue');
      const at = window.__at;

      if (type === 'shield') {
        this.godModeActive = true;
        this.godModeTimer = 7.0;
        if (dialogueBox) {
          dialogueBox.textContent = "🛡️ রাজার ঢাল অ্যাক্টিভ! যেকোনো গাড়ি উড়িয়ে দিন!";
          dialogueBox.hidden = false;
          setTimeout(() => { dialogueBox.hidden = true; }, 3200);
        }
        if (at && at.sfx && at.sfx.technologia) at.sfx.technologia();
      } else if (type === 'battery') {
        p.charge = 1.0;
        if (dialogueBox) {
          dialogueBox.textContent = "⚡ ফুল চার্জ! ব্যাটারি ১০০% রিচার্জড!";
          dialogueBox.hidden = false;
          setTimeout(() => { dialogueBox.hidden = true; }, 2600);
        }
        if (at && at.sfx && at.sfx.chime) at.sfx.chime();
      } else if (type === 'cash') {
        CockpitHUD.fareAmount += 5000;
        const fareEl = document.getElementById('fareVal');
        if (fareEl) fareEl.textContent = `৳${Math.floor(CockpitHUD.fareAmount).toLocaleString('bn-BD')}`;
        if (dialogueBox) {
          dialogueBox.textContent = "💰 নগদ চাঁদা আদায়: ৳৫,০০০ যোগ হয়েছে!";
          dialogueBox.hidden = false;
          setTimeout(() => { dialogueBox.hidden = true; }, 2600);
        }
      }
    }
  };

  // ----------------------------------------------------
  // 14. Game Over Enhancer (Live TV News & Police FIR Challan)
  // ----------------------------------------------------
  const GameOverEnhancer = {
    initialized: false,
    flashEl: null,

    init() {
      if (this.initialized) return;
      this.initialized = true;

      const paper = document.getElementById('paper');
      if (!paper) return;

      this.flashEl = document.getElementById('tvCameraFlash');
      if (!this.flashEl) {
        this.flashEl = document.createElement('div');
        this.flashEl.id = 'tvCameraFlash';
        this.flashEl.className = 'tv-camera-flash';
        document.body.appendChild(this.flashEl);
      }

      const observer = new MutationObserver(() => {
        const isHidden = paper.hidden || getComputedStyle(paper).display === 'none';
        if (!isHidden && !paper.dataset.enhanced) {
          paper.dataset.enhanced = 'true';
          this.triggerFlash();
          this.enhanceDOM(paper);
        } else if (isHidden) {
          paper.dataset.enhanced = '';
        }
      });
      observer.observe(paper, { attributes: true, attributeFilter: ['hidden', 'style'] });
    },

    triggerFlash() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!window.RastarRaja.audioCtx) window.RastarRaja.audioCtx = new AudioCtx();
        const ctx = window.RastarRaja.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.01));
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.4, now);
        src.connect(g);
        g.connect(ctx.destination);
        src.start(now);
      } catch(e) {}

      if (this.flashEl) {
        this.flashEl.classList.remove('flashing');
        void this.flashEl.offsetWidth;
        this.flashEl.classList.add('flashing');
      }
    },

    enhanceDOM(paper) {
      const npArticle = paper.querySelector('.np');
      const npBody = paper.querySelector('.np-body');
      if (!npArticle || !npBody) return;

      // 1. CRT Scanlines & Live Broadcast Pill on Photo
      const photo = paper.querySelector('.np-photo');
      if (photo && !photo.querySelector('.tv-photo-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'tv-photo-overlay';
        overlay.innerHTML = `
          <div class="tv-live-pill"><span class="rec-blink"></span> LIVE · ডিটিভি HD</div>
          <div class="tv-rec-time">${new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</div>
          <div class="tv-scanlines"></div>
        `;
        photo.appendChild(overlay);
      }

      // 2. Police FIR Challan Docket Card
      let firBox = document.getElementById('policeFirBox');
      const lossVal = document.getElementById('npStamp') ? document.getElementById('npStamp').textContent : '৳০';
      const caseNum = 'DMP-RR-' + (202600 + Math.floor(Math.random() * 8999));

      if (!firBox) {
        firBox = document.createElement('div');
        firBox.id = 'policeFirBox';
        firBox.className = 'police-fir-box';
        const buyBox = paper.querySelector('.np-buy');
        if (buyBox) {
          buyBox.after(firBox);
        } else {
          npBody.appendChild(firBox);
        }
      }

      firBox.innerHTML = `
        <div class="fir-top-bar">
          <div class="fir-emblem">🇧🇩 ঢাকা মেট্রোপলিটন পুলিশ (DMP)</div>
          <div class="fir-doc-badge">ট্রাফিক মামলা ও জব্দ তালিকা</div>
        </div>
        <div class="fir-meta-row">
          <span>কেস নং: <b>${caseNum}</b></span>
          <span>তারিখ: <b>${new Date().toLocaleDateString('bn-BD')}</b></span>
        </div>
        <div class="fir-details-grid">
          <div class="fir-grid-item">
            <small>অভিযুক্ত চালক:</small>
            <strong>"রাস্তার রাজা" (লাইসেন্সবিহীন)</strong>
          </div>
          <div class="fir-grid-item">
            <small>মামলার ধারা:</small>
            <strong>সড়ক পরিবহন আইন ২০১৮ (ধারা ২৭৯/৩৩৮)</strong>
          </div>
          <div class="fir-grid-item">
            <small>দণ্ড / ধার্যকৃত ক্ষতিপূরণ:</small>
            <strong class="fir-amount">${lossVal}</strong>
          </div>
          <div class="fir-grid-item">
            <small>তদন্ত কর্মকর্তা:</small>
            <strong>আব্দুল আল যুবায়ের (চিফ সার্জেন্ট)</strong>
          </div>
        </div>
        <div class="fir-seal-banner">
          <span class="fir-seal-badge">✔ ট্রাফিক সদর দপ্তর কর্তৃক সিলমোহরকৃত ও আদালত প্রদেয় চালান পত্র</span>
        </div>
      `;

      // 3. Bottom TV Breaking News Marquee Scroller
      let ticker = document.getElementById('tvBreakingTicker');
      if (!ticker) {
        ticker = document.createElement('div');
        ticker.id = 'tvBreakingTicker';
        ticker.className = 'tv-breaking-ticker';
        ticker.innerHTML = `
          <div class="ticker-badge">🔴 ব্রেকিং নিউজ</div>
          <div class="ticker-marquee-wrap">
            <div class="ticker-marquee-track">
              🚨 ব্রেকিং: ঢাকার রাজপথে "রাস্তার রাজা"র তাণ্ডব • কোটি টাকার জাতীয় ক্ষয়ক্ষতি • পুলিশি মামলা ও গ্রেফতারি পরোয়ানা জারি • প্রত্যক্ষদর্শীদের ছুটোছুটি • বিস্তারিত সম্প্রচার দেখতে চোখ রাখুন ডিটিভি পর্দায় 🚨
            </div>
          </div>
        `;
        npArticle.appendChild(ticker);
      }
    }
  };

  // ----------------------------------------------------
  // 15. Dhaka Metro Rail (MRT Line 6) Overpass & High-Speed Train
  // ----------------------------------------------------
  const MetroRailSystem = {
    initialized: false,
    trackGroup: null,
    trainGroup: null,
    trainActive: false,
    trainX: 0,
    trainZ: 0,
    trainSpeed: 42.0,
    trainDir: 1,
    spawnTimer: 16.0,
    whistled: false,
    whistleDist: 85,
    carriages: [],

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.trackGroup = new THREE.Group();
        this.trainGroup = new THREE.Group();

        const pierMat = new THREE.StandardMat({ color: 0x8a929a, roughness: 0.85 });
        const railMat = new THREE.BasicMat({ color: 0x334155 });
        const deckMat = new THREE.StandardMat({ color: 0x475569, roughness: 0.9 });

        // Continuous viaduct deck
        const deckGeo = new THREE.ct();
        deckGeo.box(0, 8.2, 0, 5.2, 0.7, 1400, null);
        deckGeo.box(-2.5, 8.8, 0, 0.35, 0.8, 1400, null);
        deckGeo.box(2.5, 8.8, 0, 0.35, 0.8, 1400, null);
        deckGeo.box(-1.2, 8.6, 0, 0.12, 0.1, 1400, null);
        deckGeo.box(-0.4, 8.6, 0, 0.12, 0.1, 1400, null);
        deckGeo.box(0.4, 8.6, 0, 0.12, 0.1, 1400, null);
        deckGeo.box(1.2, 8.6, 0, 0.12, 0.1, 1400, null);

        const deckMesh = new THREE.Mesh(deckGeo.build(), deckMat);
        this.trackGroup.add(deckMesh);

        // T-piers spaced every 65m
        const pierGeo = new THREE.ct();
        for (let z = -700; z <= 700; z += 65) {
          pierGeo.box(0, 4.0, z, 1.2, 7.8, 1.2, null);
          pierGeo.box(0, 7.8, z, 4.8, 0.8, 1.6, null);
        }
        const pierMesh = new THREE.Mesh(pierGeo.build(), pierMat);
        this.trackGroup.add(pierMesh);

        scene.add(this.trackGroup);

        // Build MRT Line 6 Train (5 Cars)
        const trainBodyMat = new THREE.StandardMat({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.6 });
        const greenStripeMat = new THREE.BasicMat({ color: 0x006a4e });
        const carriageLen = 12.0;
        const carriageWid = 2.4;
        const carriageHgt = 2.3;

        for (let i = 0; i < 5; i++) {
          const carGrp = new THREE.Group();
          const carGeo = new THREE.ct();
          const isLead = (i === 0);
          const isTail = (i === 4);

          carGeo.box(0, 1.2, 0, carriageWid, carriageHgt, carriageLen, null);
          carGeo.box(0, 1.1, 0, carriageWid + 0.04, 0.35, carriageLen + 0.02, null);
          carGeo.box(0, 1.4, 0, carriageWid + 0.05, 0.08, carriageLen + 0.03, null);

          // Windows
          for (let wz = -4.5; wz <= 4.5; wz += 2.2) {
            carGeo.box(carriageWid / 2 + 0.03, 1.4, wz, 0.04, 0.65, 1.4, null);
            carGeo.box(-carriageWid / 2 - 0.03, 1.4, wz, 0.04, 0.65, 1.4, null);
          }

          if (isLead) {
            carGeo.box(0, 1.1, -carriageLen / 2 - 0.8, carriageWid * 0.85, carriageHgt * 0.85, 1.6, null);
            carGeo.box(0, 1.6, -carriageLen / 2 - 0.6, carriageWid * 0.75, 0.7, 0.1, null);
            carGeo.box(0.65, 0.6, -carriageLen / 2 - 1.55, 0.3, 0.2, 0.1, null);
            carGeo.box(-0.65, 0.6, -carriageLen / 2 - 1.55, 0.3, 0.2, 0.1, null);
          }
          if (isTail) {
            carGeo.box(0, 1.1, carriageLen / 2 + 0.8, carriageWid * 0.85, carriageHgt * 0.85, 1.6, null);
            carGeo.box(0.65, 0.6, carriageLen / 2 + 1.55, 0.25, 0.18, 0.1, null);
            carGeo.box(-0.65, 0.6, carriageLen / 2 + 1.55, 0.25, 0.18, 0.1, null);
          }

          const carMesh = new THREE.Mesh(carGeo.build(), trainBodyMat);
          carGrp.add(carMesh);

          if (i === 1 || i === 3) {
            const pantoGeo = new THREE.ct();
            pantoGeo.box(0, carriageHgt + 0.4, 0, 1.4, 0.06, 0.8, null);
            pantoGeo.box(0, carriageHgt + 0.7, 0, 1.1, 0.06, 0.06, null);
            const pantoMesh = new THREE.Mesh(pantoGeo.build(), railMat);
            carGrp.add(pantoMesh);
          }

          carGrp.position.z = i * (carriageLen + 0.3);
          this.trainGroup.add(carGrp);
          this.carriages.push(carGrp);
        }

        this.trainGroup.position.set(0.8, 8.6, 9999);
        scene.add(this.trainGroup);
      } catch (err) {
        console.warn('MetroRailSystem error:', err);
      }
    },

    whistle() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!window.RastarRaja.audioCtx) window.RastarRaja.audioCtx = new AudioCtx();
        const ctx = window.RastarRaja.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc1.frequency.exponentialRampToValueAtTime(435, now + 0.8);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(554.37, now);
        osc2.frequency.exponentialRampToValueAtTime(550, now + 0.8);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.9);
        osc2.stop(now + 0.9);

        const dialogueBox = document.getElementById('dialogue');
        if (dialogueBox && Math.random() < 0.6) {
          dialogueBox.textContent = "🚇 'পিপপপপ! মাথার উপর দিয়া মেট্রোরেল ছুটতাছে!'";
          dialogueBox.hidden = false;
          setTimeout(() => { dialogueBox.hidden = true; }, 2600);
        }
      } catch (e) {}
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p) return;

      if (this.trackGroup) {
        const chunkZ = Math.floor(p.z / 65) * 65;
        this.trackGroup.position.z = chunkZ;
      }

      if (!this.trainActive) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.trainActive = true;
          this.whistled = false;
          this.trainDir = Math.random() < 0.5 ? 1 : -1;
          this.trainSpeed = 38 + Math.random() * 8;
          const trackSide = this.trainDir === 1 ? -0.8 : 0.8;
          this.trainX = trackSide;
          this.trainZ = this.trainDir === 1 ? p.z - 350 : p.z + 350;
          this.trainGroup.position.set(this.trainX, 8.6, this.trainZ);
          this.trainGroup.rotation.y = this.trainDir === 1 ? 0 : Math.PI;
        }
      } else {
        this.trainZ += this.trainDir * this.trainSpeed * dt;
        this.trainGroup.position.z = this.trainZ;

        const dist = Math.abs(this.trainZ - p.z);
        if (!this.whistled && dist < this.whistleDist) {
          this.whistled = true;
          this.whistle();
        }

        if (Math.abs(this.trainZ - p.z) > 420) {
          this.trainActive = false;
          this.spawnTimer = 28 + Math.random() * 15;
          this.trainGroup.position.set(0, 8.6, 9999);
        }
      }
    }
  };

  // ----------------------------------------------------
  // 16. Realistic Physical Suspension & Asphalt Tire Skids
  // ----------------------------------------------------
  const SuspensionDynamics = {
    prevV: 0,
    pitchAngle: 0,
    rollAngle: 0,
    bounceY: 0,
    skidPool: [],
    lastSkidT: 0,

    init(THREE, scene) {
      if (!THREE || !scene) return;
      try {
        const sGeo = new THREE.Plane(0.32, 1.8);
        sGeo.rotateX(-THREE.PI / 2);
        const sMat = new THREE.BasicMat({
          color: 0x111115,
          transparent: true,
          opacity: 0.65,
          depthWrite: false
        });

        for (let i = 0; i < 24; i++) {
          const m = new THREE.Mesh(sGeo, sMat);
          m.position.set(0, 0.02, 9999);
          m.visible = false;
          scene.add(m);
          this.skidPool.push({ mesh: m, life: 0 });
        }
      } catch (e) {}
    },

    spawnSkid(x, z, yaw) {
      const now = performance.now();
      if (now - this.lastSkidT < 70) return;
      this.lastSkidT = now;

      const free = this.skidPool.find(s => s.life <= 0);
      if (free) {
        free.mesh.position.set(x, 0.025, z);
        free.mesh.rotation.y = yaw;
        free.mesh.visible = true;
        free.life = 7.0;
      }
    },

    update(p, dt, inPlay) {
      if (!inPlay || !p || !p.alive) return;

      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (this.skidPool.length === 0 && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }

      for (const s of this.skidPool) {
        if (s.life > 0) {
          s.life -= dt;
          s.mesh.material.opacity = Math.max(0, (s.life / 7.0) * 0.65);
          if (s.life <= 0) s.mesh.visible = false;
        }
      }

      const accel = (p.v - this.prevV) / dt;
      this.prevV = p.v;

      const kind = window.__PLAYER_VEHICLE || 'auto';
      const rollFactor = kind === 'cng' ? 0.42 : kind === 'leguna' ? 0.46 : kind === 'bus' ? 0.16 : 0.30;

      let targetPitch = 0;
      if (accel > 1.2 || p.boost) {
        targetPitch = -0.12 - (p.boost ? 0.07 : 0);
      } else if (accel < -2.2) {
        targetPitch = 0.22 + Math.min(0.12, Math.abs(accel) * 0.015);
      }
      this.pitchAngle += (targetPitch - this.pitchAngle) * Math.min(1, dt * 9.0);

      const targetRoll = p.steer * Math.min(1.2, Math.abs(p.v) / 10.0) * rollFactor;
      this.rollAngle += (targetRoll - this.rollAngle) * Math.min(1, dt * 8.0);

      this.bounceY = Math.sin(performance.now() * 0.018 * Math.abs(p.v)) * 0.018;

      if (at && at.PLAYER && at.PLAYER.beat) {
        at.PLAYER.beat.pitch = this.pitchAngle;
        at.PLAYER.beat.roll = this.rollAngle;
        at.PLAYER.beat.y = this.bounceY;
      }

      const isSkidding = (accel < -3.2 && p.v > 4.5) || (Math.abs(p.steer) > 0.42 && p.v > 6.0);
      if (isSkidding) {
        const rearDist = (p.len || 2.6) * 0.44;
        const halfWid = (p.wid || 1.3) * 0.46;
        const leftX = p.x - p.rx * halfWid + p.fx * rearDist;
        const leftZ = p.z - p.rz * halfWid + p.fz * rearDist;
        const rightX = p.x + p.rx * halfWid + p.fx * rearDist;
        const rightZ = p.z + p.rz * halfWid + p.fz * rearDist;
        this.spawnSkid(leftX, leftZ, p.yaw);
        this.spawnSkid(rightX, rightZ, p.yaw);
      }
    }
  };

  // ----------------------------------------------------
  // 17. Animated Dhaka Bus Helper on Traffic Buses
  // ----------------------------------------------------
  const BusHelperSystem = {
    helpers: new Map(),
    lastShoutT: 0,

    initHelper(THREE, bus) {
      if (!THREE || !bus || !bus.grp) return null;
      try {
        const grp = new THREE.Group();
        const shirtMat = new THREE.BasicMat({ color: 0x0284c7 });
        const skinMat = new THREE.BasicMat({ color: 0xb45309 });

        const hGeo = new THREE.ct();
        hGeo.box(0, 1.25, 0, 0.42, 0.55, 0.28, null);
        hGeo.box(0, 1.68, 0, 0.26, 0.28, 0.26, null);
        hGeo.box(0, 1.78, 0, 0.28, 0.08, 0.28, null);
        hGeo.box(0, 0.65, 0, 0.38, 0.68, 0.28, null);
        hGeo.box(-0.25, 1.35, 0.2, 0.1, 0.1, 0.45, null);

        const bodyMesh = new THREE.Mesh(hGeo.build(), shirtMat);
        grp.add(bodyMesh);

        const armGeo = new THREE.ct();
        armGeo.box(0, -0.22, 0, 0.1, 0.44, 0.1, null);
        const armMesh = new THREE.Mesh(armGeo.build(), skinMat);
        armMesh.position.set(0.24, 1.45, 0);
        grp.add(armMesh);
        grp.userData.wavingArm = armMesh;

        const busWid = bus.wid || 2.5;
        const busLen = bus.len || 10.5;
        grp.position.set(-busWid / 2 - 0.15, 0.4, -busLen / 2 + 2.8);
        grp.rotation.y = -0.25;

        bus.grp.add(grp);
        return grp;
      } catch (e) {
        return null;
      }
    },

    update(p, dt, inPlay) {
      if (!inPlay || !p) return;
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!THREE || !at || !at.TRAFFIC || !at.TRAFFIC.list) return;

      const now = performance.now();
      const buses = at.TRAFFIC.list.filter(v => v.kind === 'bus' && !v.dead);

      for (const bus of buses) {
        let helper = this.helpers.get(bus);
        if (!helper) {
          helper = this.initHelper(THREE, bus);
          if (helper) this.helpers.set(bus, helper);
        }

        if (helper && helper.userData.wavingArm) {
          helper.userData.wavingArm.rotation.x = Math.sin(now * 0.008 + bus.z) * 0.65;
          helper.userData.wavingArm.rotation.z = Math.cos(now * 0.007 + bus.z) * 0.35 + 0.4;
        }

        const dist = Math.hypot(p.x - bus.x, p.z - bus.z);
        if (dist < 6.8 && now - this.lastShoutT > 5500) {
          this.lastShoutT = now;
          const dialogueBox = document.getElementById('dialogue');
          if (dialogueBox) {
            const shouts = [
              "🔊 বাস হেলপার: 'ওস্তাদ ডানে চাপেন! মিরপুর ১০! গাবতলী সোজা!'",
              "🔊 বাস হেলপার: 'মামা সাইড দেন! প্যাসেঞ্জার নামবে!'",
              "🔊 বাস হেলপার: 'এই ড্রাইভার দেইখা চালান! ব্রেক নাই নাকি!'"
            ];
            dialogueBox.textContent = shouts[Math.floor(Math.random() * shouts.length)];
            dialogueBox.hidden = false;
            setTimeout(() => { dialogueBox.hidden = true; }, 2600);
          }
        }
      }
    }
  };

  // ----------------------------------------------------
  // 18. Modern 3D Cyberpunk Mini-Map Radar HUD
  // ----------------------------------------------------
  const MiniMapRadar = {
    canvas: null,
    ctx: null,
    container: null,
    initialized: false,

    init() {
      if (this.initialized) return;
      this.initialized = true;

      this.container = document.createElement('div');
      this.container.id = 'miniMapRadar';
      this.container.className = 'mini-map-radar';
      this.container.innerHTML = `
        <div class="radar-header">
          <span class="radar-live-dot"></span>
          <span class="radar-title">রাডার জিপিএস</span>
          <span class="radar-heading" id="radarHeading">N</span>
        </div>
        <canvas id="radarCanvas" width="130" height="130"></canvas>
        <div class="radar-gps-hint" id="radarGpsHint">🛣️ রাজপথ ক্লিয়ার, টানেন!</div>
      `;
      document.body.appendChild(this.container);

      this.canvas = document.getElementById('radarCanvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');

      this.container.addEventListener('click', () => {
        this.container.classList.toggle('minimized');
      });
    },

    update(p, dt, inPlay) {
      if (!this.initialized) this.init();
      if (!this.ctx || !inPlay || !p) {
        if (this.container) this.container.style.display = inPlay ? 'flex' : 'none';
        return;
      }
      this.container.style.display = 'flex';

      const ctx = this.ctx;
      const w = 130, h = 130;
      const cx = 65, cy = 65;
      const scale = 0.58;

      ctx.clearRect(0, 0, w, h);

      // Radar disc
      ctx.beginPath();
      ctx.arc(cx, cy, 62, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(11, 17, 32, 0.88)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#00f0ff';
      ctx.stroke();

      // Range Rings
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;
      [22, 42, 60].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, 5); ctx.lineTo(cx, 125);
      ctx.moveTo(5, cy); ctx.lineTo(125, cy);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.stroke();

      // Traffic Blips
      const at = window.__at;
      if (at && at.TRAFFIC && at.TRAFFIC.list) {
        for (const v of at.TRAFFIC.list) {
          if (v.dead) continue;
          const dx = v.x - p.x;
          const dz = v.z - p.z;
          if (Math.hypot(dx, dz) > 95) continue;

          const cos = Math.cos(-p.yaw);
          const sin = Math.sin(-p.yaw);
          const rx = dx * cos - dz * sin;
          const rz = dx * sin + dz * cos;
          const px = cx + rx * scale;
          const py = cy + rz * scale;

          if (px < 5 || px > 125 || py < 5 || py > 125) continue;

          if (v.kind === 'bus') {
            ctx.fillStyle = '#ff3344';
            ctx.fillRect(px - 3, py - 6, 6, 12);
          } else if (v.kind === 'police') {
            const flash = (performance.now() * 0.008) % 1 < 0.5;
            ctx.fillStyle = flash ? '#ff0044' : '#0088ff';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (v.kind === 'leguna' || v.kind === 'micro') {
            ctx.fillStyle = '#ff9900';
            ctx.fillRect(px - 2.5, py - 4, 5, 8);
          } else {
            ctx.fillStyle = '#38ef7d';
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Pickups on Radar
      if (SuperPickups && SuperPickups.pickups) {
        for (const pk of SuperPickups.pickups) {
          if (!pk.active) continue;
          const dx = pk.mesh.position.x - p.x;
          const dz = pk.mesh.position.z - p.z;
          if (Math.hypot(dx, dz) > 95) continue;

          const cos = Math.cos(-p.yaw);
          const sin = Math.sin(-p.yaw);
          const rx = dx * cos - dz * sin;
          const rz = dx * sin + dz * cos;
          const px = cx + rx * scale;
          const py = cy + rz * scale;

          ctx.fillStyle = pk.type === 'shield' ? '#00f0ff' : pk.type === 'battery' ? '#ffea00' : '#00e676';
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Player Center Arrow
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#ffd400';
      ctx.shadowColor = '#ffd400';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-4.5, 5);
      ctx.lineTo(0, 2.5);
      ctx.lineTo(4.5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Heading
      const headingEl = document.getElementById('radarHeading');
      if (headingEl) {
        const deg = ((-p.yaw * 180 / Math.PI) % 360 + 360) % 360;
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        headingEl.textContent = dirs[Math.floor((deg + 22.5) / 45) % 8];
      }
    }
  };

  // ----------------------------------------------------
  // 19. Cinematic Near-Miss Slow-Mo & Bonus System
  // ----------------------------------------------------
  const NearMissSystem = {
    lastNearMissT: 0,
    toastEl: null,

    init() {
      if (this.toastEl) return;
      this.toastEl = document.createElement('div');
      this.toastEl.id = 'nearMissToast';
      this.toastEl.className = 'near-miss-toast';
      document.body.appendChild(this.toastEl);
    },

    update(p, dt, inPlay) {
      if (!inPlay || !p || !p.alive || Math.abs(p.v) < 8.5) return;
      this.init();

      const at = window.__at;
      if (!at || !at.TRAFFIC || !at.TRAFFIC.list) return;

      const now = performance.now();
      if (now - this.lastNearMissT < 2800) return;

      const pWid = (p.wid || 1.3) * 0.5;
      const pLen = (p.len || 2.6) * 0.5;

      for (const v of at.TRAFFIC.list) {
        if (v.dead) continue;
        const vWid = (v.wid || 1.8) * 0.5;
        const vLen = (v.len || 4.5) * 0.5;

        const dx = Math.abs(p.x - v.x) - (pWid + vWid);
        const dz = Math.abs(p.z - v.z) - (pLen + vLen);

        if (dx > 0.12 && dx < 0.92 && dz < 1.0) {
          this.lastNearMissT = now;
          this.triggerNearMiss(v);
          break;
        }
      }
    },

    triggerNearMiss(vehicle) {
      const at = window.__at;
      if (!at) return;

      if (at.G && typeof at.G.slow === 'function') {
        at.G.slow(0.35, 0.32);
      }

      if (at.sfx && typeof at.sfx.chime === 'function') {
        at.sfx.chime();
      }

      CockpitHUD.fareAmount += 1000;
      const fareEl = document.getElementById('fareVal');
      if (fareEl) {
        fareEl.textContent = `৳${Math.floor(CockpitHUD.fareAmount).toLocaleString('bn-BD')}`;
      }

      if (this.toastEl) {
        this.toastEl.textContent = "🔥 গা ঘেঁষা ওভারটেক! +৳১,০০০";
        this.toastEl.classList.remove('active');
        void this.toastEl.offsetWidth;
        this.toastEl.classList.add('active');
        setTimeout(() => {
          if (this.toastEl) this.toastEl.classList.remove('active');
        }, 1600);
      }
    }
  };

  // ----------------------------------------------------
  // 20. Krishnachura Falling Petals & Contact Shadows
  // ----------------------------------------------------
  const FallingPetalsSystem = {
    petals: [],
    initialized: false,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 32; pCanvas.height = 32;
        const pCtx = pCanvas.getContext('2d');
        pCtx.fillStyle = '#e11d48';
        pCtx.beginPath();
        pCtx.ellipse(16, 16, 14, 7, Math.PI / 4, 0, Math.PI * 2);
        pCtx.fill();

        const pTex = new THREE.Tex.glow.constructor(pCanvas);
        pTex.needsUpdate = true;

        const pGeo = new THREE.Plane(0.35, 0.35);
        const colors = [0xe11d48, 0xf43f5e, 0xfbbf24, 0xd97706];

        for (let i = 0; i < 35; i++) {
          const mat = new THREE.BasicMat({
            map: pTex,
            color: colors[i % colors.length],
            transparent: true,
            opacity: 0.85
          });
          const m = new THREE.Mesh(pGeo, mat);
          m.position.set((Math.random() - 0.5) * 18, 1.5 + Math.random() * 4.5, (Math.random() - 0.5) * 80);
          scene.add(m);
          this.petals.push({
            mesh: m,
            vy: -0.45 - Math.random() * 0.4,
            swayFreq: 2.0 + Math.random() * 2.0,
            swayAmp: 0.6 + Math.random() * 0.5,
            rotSpeed: (Math.random() - 0.5) * 3.0
          });
        }
      } catch (e) {}
    },

    update(p, dt, inPlay) {
      if (!inPlay || !p) return;
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }

      const now = performance.now() * 0.001;

      for (const pt of this.petals) {
        const m = pt.mesh;
        m.position.y += pt.vy * dt;
        m.position.x += Math.sin(now * pt.swayFreq + m.position.z) * pt.swayAmp * dt;
        m.rotation.z += pt.rotSpeed * dt;

        if (m.position.y < 0.08 || Math.abs(m.position.z - p.z) > 65) {
          m.position.y = 4.0 + Math.random() * 3.5;
          m.position.z = p.z - 35 - Math.random() * 45;
          m.position.x = p.x + (Math.random() - 0.5) * 16;
        }

        const dist = Math.hypot(p.x - m.position.x, p.z - m.position.z);
        if (dist < 3.2 && Math.abs(p.v) > 6.0) {
          m.position.y += 1.8 * dt;
          m.position.x += p.rx * 2.5 * dt;
        }
      }
    }
  };

  // ----------------------------------------------------
  // 11. Real-time Engine Loop (Synchronous 60 FPS)
  // ----------------------------------------------------
  let lastTime = performance.now();
  function engineLoop(timestamp) {
    requestAnimationFrame(engineLoop);
    const dt = Math.min(0.05, Math.max(0.001, (timestamp - lastTime) / 1000));
    lastTime = timestamp;

    const at = window.__at;
    if (!at || !at.G) return;

    const inPlay = at.G.state === 'play';
    const isAlive = at.P ? at.P.alive : false;
    const damage = at.G.loss || 0;
    const speed = at.P ? at.P.v : 0;

    const isNight = at.DAY && at.DAY.cur && at.DAY.cur.key === 'night';
    const isRain = !!(window.RastarRaja && window.RastarRaja.rain);

    WantedSystem.update(damage, isAlive, inPlay);
    CockpitHUD.update(speed, dt, inPlay);

    if (inPlay && isAlive && at.P) {
      checkSpeedBumps(at.P, dt);
    }

    VisualsFX.update(at.P, dt, inPlay, isNight, isRain);
    HydraulicHorn.update(dt);
    SuperPickups.update(at.P, dt, inPlay);
    MetroRailSystem.update(at.P, dt, inPlay);
    SuspensionDynamics.update(at.P, dt, inPlay);
    BusHelperSystem.update(at.P, dt, inPlay);
    MiniMapRadar.update(at.P, dt, inPlay);
    NearMissSystem.update(at.P, dt, inPlay);
    FallingPetalsSystem.update(at.P, dt, inPlay);
  }
  requestAnimationFrame(engineLoop);

  function setupInteractiveHooks() {
    injectStyles();
    injectUI();
    WantedSystem.init();
    CockpitHUD.init();
    GameOverEnhancer.init();
    MiniMapRadar.init();
    NearMissSystem.init();

    // Keyboard H or Horn button for Hydraulic Bus Horn
    window.addEventListener('keydown', (e) => {
      if (e.key === 'h' || e.key === 'H') {
        HydraulicHorn.blast();
      }
    });
    const tHornBtn = document.getElementById('tHorn');
    if (tHornBtn) {
      tHornBtn.addEventListener('click', () => HydraulicHorn.blast());
    }
  }

  // Initialize UI once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupInteractiveHooks);
  } else {
    setupInteractiveHooks();
  }
})();
