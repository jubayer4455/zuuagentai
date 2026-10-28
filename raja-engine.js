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
      oldTitle.innerHTML = `<img src="logo.svg" alt="রাস্তার রাজা · Rastar Raja" style="width: 100%; max-width: 320px; height: auto; display: block; margin: 0 auto; filter: drop-shadow(0 4px 14px rgba(0,0,0,0.85));">`;
    }
    if (oldSub) oldSub.remove();
    if (oldTag) {
      oldTag.innerHTML = `★ ঢাকার রাজপথের আসল রাজা ★ · নো লাইসেন্স, নো ব্রেক!`;
      oldTag.style.color = '#ffcb1f';
      oldTag.style.fontWeight = 'bold';
      oldTag.style.letterSpacing = '0.5px';
      oldTag.style.fontSize = '14px';
    }
    if (oldHow) {
      oldHow.style.display = 'none'; // Keep clean and uncluttered; rules are inside help drawer
    }

    // Add Garage Vehicle Selection (Sleek Horizontal Segmented Carousel)
    if (!document.getElementById('garageBox')) {
      const garageBox = document.createElement('div');
      garageBox.id = 'garageBox';
      garageBox.className = 'raja-garage-bar';
      const curVeh = window.RastarRaja.vehicle || 'auto';
      const curCfg = VEHICLE_CONFIGS[curVeh] || VEHICLE_CONFIGS.auto;
      garageBox.innerHTML = `
        <div class="raja-bar-title">🚗 আপনার বাহন বেছে নিন:</div>
        <div class="v-strip">
          ${Object.entries(VEHICLE_CONFIGS).map(([k, v]) => `
            <button type="button" class="v-pill ${curVeh === k ? 'active' : ''}" data-vehicle="${k}" title="${v.name}: ${v.subtitle}">
              <span class="v-ic">${v.icon}</span>
              <span class="v-name">${v.name.split(' ')[0]}</span>
            </button>
          `).join('')}
        </div>
        <div id="vSpecBadge" class="v-spec-badge">
          ⚡ ${curCfg.name} · ${curCfg.subtitle}
        </div>
      `;
      menuMain.insertBefore(garageBox, document.querySelector('.play-row'));

      garageBox.querySelectorAll('.v-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX) {
            window.RastarRaja.DhakaAudioSFX.playClickSound();
          }
          garageBox.querySelectorAll('.v-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const v = btn.getAttribute('data-vehicle');
          window.RastarRaja.vehicle = v;
          localStorage.setItem('rastarRaja.vehicle', v);
          window.__PLAYER_VEHICLE = v;
          const cfg = VEHICLE_CONFIGS[v] || VEHICLE_CONFIGS.auto;
          const badge = document.getElementById('vSpecBadge');
          if (badge) badge.textContent = `⚡ ${cfg.name} · ${cfg.subtitle}`;
          applyVehicleToPlayer(v);
        });
      });
    }

    // Add Time & Weather Selector (Compact Horizontal Row)
    if (!document.getElementById('envBox')) {
      const envBox = document.createElement('div');
      envBox.id = 'envBox';
      envBox.className = 'raja-env-bar';
      envBox.innerHTML = `
        <div class="env-strip">
          <button type="button" class="env-pill ${window.RastarRaja.time === 'morning' ? 'active' : ''}" data-time="morning">☀️ দিন</button>
          <button type="button" class="env-pill ${window.RastarRaja.time === 'dusk' ? 'active' : ''}" data-time="dusk">🌅 গোধূলি</button>
          <button type="button" class="env-pill ${window.RastarRaja.time === 'night' ? 'active' : ''}" data-time="night">🌙 রাত</button>
          <button type="button" class="env-pill ${window.RastarRaja.rain ? 'active' : ''}" id="rajaRainBtn">🌧️ বৃষ্টি: ${window.RastarRaja.rain ? 'চালু' : 'বন্ধ'}</button>
        </div>
      `;
      menuMain.insertBefore(envBox, document.querySelector('.play-row'));

      envBox.querySelectorAll('[data-time]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX) {
            window.RastarRaja.DhakaAudioSFX.playClickSound();
          }
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
        if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX) {
          window.RastarRaja.DhakaAudioSFX.playClickSound();
        }
        window.RastarRaja.rain = !window.RastarRaja.rain;
        localStorage.setItem('rastarRaja.rain', window.RastarRaja.rain ? '1' : '0');
        rainBtn.classList.toggle('active', window.RastarRaja.rain);
        rainBtn.textContent = `🌧️ বৃষ্টি: ${window.RastarRaja.rain ? 'চালু' : 'বন্ধ'}`;
        toggleRain(window.RastarRaja.rain);
      });
    }

    // Ensure Help drawer doesn't clutter the initial screen
    const help = document.getElementById('help');
    if (help) {
      help.open = false; // Clean presentation; one-click expand for rules
    }

    // Add FM Radio button to HUD
    const battBox = document.getElementById('battBox');
    if (battBox && !document.getElementById('radioBtn')) {
      const radioBtn = document.createElement('button');
      radioBtn.id = 'radioBtn';
      radioBtn.type = 'button';
      radioBtn.title = 'রেট্রো ঢাকা ট্যাক্সি রেডিও (FM)';
      radioBtn.innerHTML = `📻 <span>এফএম</span>`;
      battBox.appendChild(radioBtn);

      radioBtn.addEventListener('click', () => {
        window.RastarRaja.radio = !window.RastarRaja.radio;
        radioBtn.classList.toggle('active', window.RastarRaja.radio);
        radioBtn.innerHTML = window.RastarRaja.radio ? `🔊 <span>বাজছে</span>` : `📻 <span>এফএম</span>`;
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
      /* ============================================================ */
      /* RASTAR RAJA v2.9: CLEAN 4-CORNER HUD & SLEEK MENU OVERHAUL  */
      /* ============================================================ */

      /* 1. Menu Layout & Segmented Bars */
      #menu:not([hidden]) {
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 16px !important;
        padding-bottom: 60px !important;
        overflow-y: auto !important;
      }
      #menu[hidden] {
        display: none !important;
      }
      .menu-card {
        max-width: 580px !important;
        width: 100% !important;
        margin: auto !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
        gap: 10px !important;
      }
      .menu-main {
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 8px !important;
      }
      .tagline {
        font-size: 14px !important;
        color: #ffcb1f !important;
        margin: 0 !important;
        letter-spacing: 0.5px !important;
        font-weight: 700 !important;
      }
      .how {
        display: none !important; /* Rules kept in help drawer to avoid screen clutter */
      }

      /* Vehicle Segmented Bar */
      .raja-garage-bar {
        width: 100% !important;
        background: rgba(14, 18, 26, 0.9) !important;
        border: 1.5px solid rgba(255, 203, 31, 0.45) !important;
        border-radius: 14px !important;
        padding: 8px 10px !important;
        backdrop-filter: blur(12px) !important;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.55) !important;
        box-sizing: border-box !important;
      }
      .raja-bar-title {
        font-size: 11px !important;
        font-weight: 800 !important;
        color: #ffcb1f !important;
        letter-spacing: 0.5px !important;
        margin-bottom: 6px !important;
        text-align: left !important;
      }
      .v-strip {
        display: flex !important;
        gap: 6px !important;
        overflow-x: auto !important;
        padding-bottom: 2px !important;
        scrollbar-width: none !important;
      }
      .v-strip::-webkit-scrollbar {
        display: none !important;
      }
      .v-pill {
        flex: 1 1 0 !important;
        min-width: 70px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;
        padding: 6px 4px !important;
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1px solid rgba(255, 255, 255, 0.16) !important;
        border-radius: 8px !important;
        color: #f1f5f9 !important;
        font-family: inherit !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        white-space: nowrap !important;
      }
      .v-pill:hover {
        background: rgba(255, 203, 31, 0.2) !important;
        border-color: #ffcb1f !important;
      }
      .v-pill.active {
        background: linear-gradient(135deg, #ffd400, #ff9900) !important;
        color: #0b0f19 !important;
        border-color: #ffd400 !important;
        font-weight: 900 !important;
        box-shadow: 0 0 14px rgba(255, 212, 0, 0.6) !important;
        transform: translateY(-1px) !important;
      }
      .v-pill .v-ic {
        font-size: 16px !important;
      }
      .v-spec-badge {
        font-size: 11px !important;
        color: #cfd8dc !important;
        margin-top: 5px !important;
        padding-top: 4px !important;
        border-top: 1px dashed rgba(255, 203, 31, 0.25) !important;
        text-align: center !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      /* Environment Bar */
      .raja-env-bar {
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .env-strip {
        display: flex !important;
        gap: 6px !important;
        width: 100% !important;
      }
      .env-pill {
        flex: 1 1 0 !important;
        padding: 6px 8px !important;
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1px solid rgba(255, 255, 255, 0.16) !important;
        border-radius: 8px !important;
        color: #f1f5f9 !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        text-align: center !important;
        white-space: nowrap !important;
      }
      .env-pill:hover {
        background: rgba(46, 230, 255, 0.2) !important;
        border-color: #2ee6ff !important;
      }
      .env-pill.active {
        background: rgba(46, 230, 255, 0.25) !important;
        border-color: #2ee6ff !important;
        color: #2ee6ff !important;
        box-shadow: 0 0 10px rgba(46, 230, 255, 0.4) !important;
      }
      #rajaRainBtn.active {
        background: rgba(0, 180, 255, 0.3) !important;
        border-color: #00d2ff !important;
        color: #00d2ff !important;
        box-shadow: 0 0 10px rgba(0, 210, 255, 0.4) !important;
      }

      /* Play Row CTA */
      .play-row {
        margin-top: 4px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 14px !important;
      }
      .cta {
        font-size: 26px !important;
        padding: 12px 38px 10px !important;
        border-radius: 50px !important;
        background: linear-gradient(135deg, #ffd400 0%, #ff9900 100%) !important;
        color: #0d1117 !important;
        border: 0 !important;
        box-shadow: 0 0 24px rgba(255, 203, 31, 0.6), 0 5px 0 #9c7400 !important;
        cursor: pointer !important;
        transition: transform 0.08s, box-shadow 0.15s !important;
        font-weight: 800 !important;
      }
      .cta:hover {
        box-shadow: 0 0 32px rgba(255, 203, 31, 0.8), 0 5px 0 #9c7400 !important;
        transform: translateY(-2px) !important;
      }
      .cta:active {
        transform: translateY(3px) !important;
        box-shadow: 0 0 12px rgba(255, 203, 31, 0.4), 0 2px 0 #9c7400 !important;
      }

      /* Help Drawer */
      .help {
        max-width: 580px !important;
        width: 100% !important;
        background: rgba(14, 18, 26, 0.75) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        border-radius: 12px !important;
        padding: 6px 12px !important;
        margin-top: 4px !important;
        box-sizing: border-box !important;
      }
      .help summary {
        font-size: 13px !important;
        font-weight: 700 !important;
        color: #ffcb1f !important;
        cursor: pointer !important;
        padding: 4px 0 !important;
        text-align: center !important;
      }

      /* 2. IN-GAME HUD 4-CORNER ARCHITECTURE */

      /* TOP-LEFT: Consolidated Player Vitals Capsule */
      .hud-top {
        position: fixed !important;
        top: calc(env(safe-area-inset-top, 0px) + 12px) !important;
        left: 12px !important;
        right: auto !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
        padding: 0 !important;
        pointer-events: none !important;
        z-index: 92 !important;
      }
      #lossBox {
        background: rgba(11, 17, 32, 0.88) !important;
        border: 1.5px solid rgba(255, 203, 31, 0.5) !important;
        border-radius: 12px !important;
        padding: 6px 12px !important;
        backdrop-filter: blur(10px) !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6) !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 2px !important;
        min-width: 160px !important;
        pointer-events: none !important;
      }
      #lossBox .lbl {
        font-size: 11px !important;
        font-weight: 800 !important;
        color: #ffcb1f !important;
        background: transparent !important;
        padding: 0 !important;
        box-shadow: none !important;
        letter-spacing: 0.5px !important;
      }
      .loss-row {
        display: flex !important;
        align-items: baseline !important;
        gap: 6px !important;
      }
      #loss {
        font-size: 24px !important;
        color: #ffcb1f !important;
        line-height: 1.1 !important;
        text-shadow: 0 0 10px rgba(255, 203, 31, 0.6) !important;
      }
      #combo {
        font-size: 14px !important;
        background: #ff0055 !important;
        color: #fff !important;
        padding: 1px 6px !important;
        border-radius: 6px !important;
      }
      .raja-fare-inline {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        border-top: 1px dashed rgba(255, 203, 31, 0.25) !important;
        padding-top: 3px !important;
        margin-top: 2px !important;
      }
      .raja-fare-inline .fare-badge {
        font-size: 11px !important;
        color: #a8ff78 !important;
        font-weight: 700 !important;
      }
      .raja-fare-inline .fare-num {
        font-size: 14px !important;
        color: #38ef7d !important;
        font-weight: 800 !important;
        font-family: 'Baloo Da 2', monospace !important;
      }

      #battBox {
        background: rgba(11, 17, 32, 0.88) !important;
        border: 1.5px solid rgba(46, 230, 255, 0.4) !important;
        border-radius: 12px !important;
        padding: 5px 8px !important;
        backdrop-filter: blur(10px) !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6) !important;
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        gap: 4px 6px !important;
        max-width: 175px !important;
        pointer-events: auto !important;
        box-sizing: border-box !important;
      }
      #battBox .battery-label {
        font-size: 11px !important;
        font-weight: 700 !important;
        color: #4fc3f7 !important;
        white-space: nowrap !important;
      }
      #battBox .bar {
        width: 50px !important;
        height: 7px !important;
        background: rgba(0, 0, 0, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        border-radius: 4px !important;
        margin: 0 !important;
      }
      #battBox #chargeHint {
        width: 100% !important;
        font-size: 10px !important;
        padding: 1px 6px !important;
        box-sizing: border-box !important;
        margin-top: 2px !important;
      }
      #battBox #minimap {
        display: none !important; /* Hide old redundant minimap */
      }
      #battBox #muteBtn {
        width: 26px !important;
        height: 26px !important;
        margin: 0 !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        background: rgba(255, 255, 255, 0.1) !important;
        border-radius: 50% !important;
        display: grid !important;
        place-items: center !important;
        cursor: pointer !important;
      }
      #battBox #muteBtn svg {
        width: 14px !important;
        height: 14px !important;
      }
      #radioBtn {
        margin: 0 !important;
        padding: 3px 8px !important;
        font-size: 11px !important;
        height: 26px !important;
        border-radius: 6px !important;
        display: inline-flex !important;
        align-items: center !important;
        cursor: pointer !important;
        background: rgba(15, 43, 99, 0.85) !important;
        border: 1.5px solid #2ee6ff !important;
        color: #fff !important;
      }
      #radioBtn.active {
        background: #2ee6ff !important;
        color: #0a1128 !important;
        box-shadow: 0 0 14px rgba(46, 230, 255, 0.7) !important;
      }
      #fareMeter, .raja-fare-meter {
        display: none !important; /* Integrated into #lossBox */
      }

      /* TOP-RIGHT: Dedicated Mini-Map Cyber Radar */
      .mini-map-radar {
        position: fixed !important;
        top: calc(env(safe-area-inset-top, 0px) + 12px) !important;
        right: 12px !important;
        left: auto !important;
        width: auto !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        background: rgba(11, 17, 32, 0.9) !important;
        border: 2px solid #00f0ff !important;
        border-radius: 14px !important;
        padding: 6px 8px !important;
        box-shadow: 0 0 20px rgba(0, 240, 255, 0.4), 0 8px 32px rgba(0, 0, 0, 0.8) !important;
        backdrop-filter: blur(10px) !important;
        z-index: 92 !important;
        cursor: pointer !important;
        pointer-events: auto !important;
        transition: transform 0.2s ease !important;
      }
      .mini-map-radar:hover {
        transform: scale(1.04) !important;
      }
      .mini-map-radar.minimized #radarCanvas,
      .mini-map-radar.minimized .radar-gps-hint {
        display: none !important;
      }
      .radar-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 100% !important;
        margin-bottom: 4px !important;
        padding: 0 2px !important;
      }
      .radar-live-dot {
        width: 7px !important;
        height: 7px !important;
        background: #00f0ff !important;
        border-radius: 50% !important;
        box-shadow: 0 0 8px #00f0ff !important;
        animation: recBlink 0.9s infinite alternate !important;
      }
      .radar-title {
        font-family: inherit !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        color: #00f0ff !important;
        letter-spacing: 0.5px !important;
      }
      .radar-heading {
        font-family: monospace !important;
        font-size: 11px !important;
        font-weight: 900 !important;
        color: #ffd400 !important;
      }
      #radarCanvas {
        border-radius: 50% !important;
        background: #070d18 !important;
      }
      .radar-gps-hint {
        font-size: 10.5px !important;
        font-weight: 700 !important;
        color: #ffd400 !important;
        margin-top: 3px !important;
        text-shadow: 0 1px 4px rgba(0,0,0,0.9) !important;
      }

      /* TOP-CENTER: Wanted Stars & Contextual Bribe */
      .raja-stars-box {
        position: fixed !important;
        top: calc(env(safe-area-inset-top, 0px) + 12px) !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        background: rgba(11, 17, 32, 0.88) !important;
        border: 1.5px solid rgba(255, 203, 31, 0.4) !important;
        padding: 3px 12px !important;
        border-radius: 20px !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6) !important;
        z-index: 92 !important;
        pointer-events: none !important;
        transition: all 0.3s ease !important;
      }
      .raja-stars-box .stars-label {
        font-size: 10px !important;
        font-weight: 800 !important;
        letter-spacing: 2px !important;
        color: #ffcb1f !important;
        margin-bottom: -2px !important;
      }
      .raja-stars-box .stars-row {
        display: flex !important;
        gap: 3px !important;
      }
      .raja-stars-box .star {
        font-size: 18px !important;
        color: rgba(255, 255, 255, 0.22) !important;
        transition: color 0.2s, transform 0.2s !important;
      }
      .raja-stars-box .star.lit {
        color: #ffd400 !important;
        text-shadow: 0 0 10px #ffd400, 0 0 20px #ff9900 !important;
        transform: scale(1.15) !important;
      }
      .raja-stars-box.chase .star.lit {
        animation: starChaseFlash 0.4s infinite alternate !important;
      }
      @keyframes starChaseFlash {
        0% { color: #ff0055 !important; text-shadow: 0 0 12px #ff0055 !important; }
        100% { color: #0088ff !important; text-shadow: 0 0 12px #0088ff !important; }
      }

      .bribe-btn {
        position: fixed !important;
        top: calc(env(safe-area-inset-top, 0px) + 58px) !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: linear-gradient(135deg, #e0242b, #8b0000) !important;
        color: #fff !important;
        font-family: inherit !important;
        font-weight: 800 !important;
        font-size: 13px !important;
        padding: 6px 18px !important;
        border-radius: 30px !important;
        border: 2px solid #ffd400 !important;
        box-shadow: 0 4px 20px rgba(224, 36, 43, 0.8) !important;
        cursor: pointer !important;
        z-index: 96 !important;
        display: none; /* Controlled dynamically by WantedSystem */
        align-items: center !important;
        gap: 6px !important;
        animation: bribePulse 0.9s infinite alternate !important;
      }
      .bribe-btn:hover {
        transform: translateX(-50%) scale(1.05) !important;
      }
      @keyframes bribePulse {
        0% { box-shadow: 0 0 12px rgba(255, 212, 0, 0.6) !important; }
        100% { box-shadow: 0 0 26px rgba(224, 36, 43, 0.9) !important; }
      }

      /* Alerts Container */
      #alerts {
        position: fixed !important;
        top: calc(env(safe-area-inset-top, 0px) + 54px) !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 91 !important;
      }

      /* BOTTOM-RIGHT: Digital Cockpit Speedometer Gauge (Desktop Only) */
      .raja-gauge {
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        left: auto !important;
        width: 108px !important;
        height: 108px !important;
        background: rgba(11, 17, 32, 0.88) !important;
        border: 2px solid rgba(255, 203, 31, 0.45) !important;
        border-radius: 50% !important;
        backdrop-filter: blur(10px) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7) !important;
        z-index: 90 !important;
        pointer-events: none !important;
        transition: border-color 0.3s, box-shadow 0.3s !important;
      }
      @media (max-width: 899px) {
        .raja-gauge {
          display: none !important; /* Hide on mobile so it never covers touch controls! */
        }
      }
      .raja-gauge.overspeed {
        border-color: #ff0055 !important;
        box-shadow: 0 0 25px rgba(255, 0, 85, 0.8) !important;
      }
      .gauge-svg {
        width: 100% !important;
        height: 100% !important;
      }
      .gauge-bg {
        fill: none !important;
        stroke: rgba(255, 255, 255, 0.08) !important;
        stroke-width: 8 !important;
      }
      .gauge-arc {
        fill: none !important;
        stroke: url(#gaugeGrad) !important;
        stroke-width: 8 !important;
        stroke-linecap: round !important;
      }
      .gauge-needle {
        stroke: #ffd400 !important;
        stroke-width: 3.5 !important;
        stroke-linecap: round !important;
        filter: drop-shadow(0 0 6px #ffd400) !important;
        transition: transform 0.08s ease-out !important;
      }
      .gauge-readout {
        position: absolute !important;
        bottom: 20px !important;
        left: 0 !important;
        right: 0 !important;
        text-align: center !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
      }
      .speed-number {
        font-family: 'Baloo Da 2', monospace !important;
        font-weight: 800 !important;
        font-size: 22px !important;
        color: #fff !important;
        line-height: 1 !important;
        text-shadow: 0 0 10px rgba(255, 203, 31, 0.8) !important;
      }
      .speed-unit {
        font-size: 8.5px !important;
        font-weight: 700 !important;
        letter-spacing: 1px !important;
        color: #4fc3f7 !important;
      }

      /* Heritage Architectural Announcement Card */
      .heritage-announcement-card {
        position: fixed !important;
        top: calc(env(safe-area-inset-top, 0px) + 68px) !important;
        left: 50% !important;
        transform: translateX(-50%) translateY(-20px) scale(0.92) !important;
        background: rgba(15, 23, 42, 0.94) !important;
        border: 2px solid #ffd400 !important;
        border-radius: 20px !important;
        padding: 10px 24px !important;
        box-shadow: 0 0 30px rgba(255, 212, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.85) !important;
        backdrop-filter: blur(14px) !important;
        z-index: 95 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 2px !important;
        pointer-events: none !important;
        opacity: 0 !important;
        transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      }
      .heritage-announcement-card.active {
        opacity: 1 !important;
        transform: translateX(-50%) translateY(0) scale(1) !important;
      }
      .heritage-announcement-card .h-badge {
        font-size: 11px !important;
        font-weight: 800 !important;
        color: #38bdf8 !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
      }
      .heritage-announcement-card .h-title {
        font-size: 20px !important;
        font-weight: 900 !important;
        color: #ffd400 !important;
        text-shadow: 0 0 14px rgba(255, 212, 0, 0.8) !important;
      }
      .heritage-announcement-card .h-sub {
        font-size: 12.5px !important;
        color: #f1f5f9 !important;
        font-weight: 600 !important;
      }

      /* International Modern Touch Controls */
      #touch {
        pointer-events: none !important;
      }
      #touch .tbtn, #touch .pedal {
        pointer-events: auto !important;
        background: rgba(15, 23, 42, 0.55) !important;
        border: 1.5px solid rgba(0, 240, 255, 0.4) !important;
        border-radius: 18px !important;
        backdrop-filter: blur(12px) !important;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6) !important;
        transition: transform 0.08s, background 0.12s, border-color 0.12s, box-shadow 0.12s !important;
      }
      #touch .tbtn:active, #touch .pedal:active {
        transform: scale(0.92) !important;
        background: rgba(0, 240, 255, 0.35) !important;
        border-color: #00f0ff !important;
        box-shadow: 0 0 24px rgba(0, 240, 255, 0.8) !important;
      }
      #tBoost {
        border-color: rgba(255, 0, 128, 0.6) !important;
        background: rgba(40, 10, 30, 0.55) !important;
      }
      #tBoost:active {
        background: rgba(255, 0, 128, 0.45) !important;
        border-color: #ff0080 !important;
        box-shadow: 0 0 26px rgba(255, 0, 128, 0.9) !important;
      }
      #tGas {
        border-color: rgba(77, 255, 149, 0.5) !important;
      }
      #tGas:active {
        background: rgba(77, 255, 149, 0.35) !important;
        border-color: #4dff95 !important;
        box-shadow: 0 0 24px rgba(77, 255, 149, 0.8) !important;
      }
      #tBrake {
        border-color: rgba(255, 51, 68, 0.55) !important;
      }
      #tBrake:active {
        background: rgba(255, 51, 68, 0.35) !important;
        border-color: #ff3344 !important;
        box-shadow: 0 0 24px rgba(255, 51, 68, 0.8) !important;
      }

      /* Motion Blur Wind Streaks Canvas */
      .speed-streaks-canvas {
        position: fixed !important;
        inset: 0 !important;
        pointer-events: none !important;
        z-index: 75 !important;
      }

      /* Police Flashing Screen Vignette */
      .police-vignette {
        position: fixed !important;
        inset: 0 !important;
        pointer-events: none !important;
        z-index: 80 !important;
        opacity: 0 !important;
        transition: opacity 0.3s !important;
      }
      .police-vignette.active {
        opacity: 1 !important;
        animation: policeFlash 0.4s infinite alternate !important;
      }
      @keyframes policeFlash {
        0% { box-shadow: inset 0 0 90px rgba(255, 0, 0, 0.55) !important; }
        100% { box-shadow: inset 0 0 90px rgba(0, 100, 255, 0.55) !important; }
      }

      /* Rain Canvas Overlay */
      #rainCanvas {
        position: fixed !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 10 !important;
      }

      /* Near-Miss Cinematic Flash Banner */
      .near-miss-toast {
        position: fixed !important;
        top: 22% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) scale(0.6) !important;
        background: linear-gradient(135deg, rgba(255, 51, 68, 0.95), rgba(255, 153, 0, 0.95)) !important;
        color: #ffffff !important;
        font-family: inherit !important;
        font-size: clamp(16px, 4vw, 24px) !important;
        font-weight: 900 !important;
        padding: 8px 24px !important;
        border-radius: 30px !important;
        border: 2px solid #ffd400 !important;
        box-shadow: 0 0 25px rgba(255, 203, 31, 0.9), 0 4px 20px rgba(0, 0, 0, 0.8) !important;
        pointer-events: none !important;
        z-index: 100 !important;
        opacity: 0 !important;
        transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      }
      .near-miss-toast.active {
        opacity: 1 !important;
        transform: translate(-50%, -50%) scale(1.15) !important;
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
        font-family: inherit !important;
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
        font-family: inherit !important;
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
        position: fixed !important;
        inset: 0 !important;
        background: #ffffff !important;
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: 99999 !important;
      }
      .tv-camera-flash.flashing {
        animation: cameraFlashAnim 0.35s ease-out !important;
      }
      @keyframes cameraFlashAnim {
        0% { opacity: 0.92 !important; }
        25% { opacity: 0 !important; }
        45% { opacity: 0.85 !important; }
        100% { opacity: 0 !important; }
      }

      /* TV Photo Overlays & CRT Scanlines */
      .tv-photo-overlay {
        position: absolute !important;
        inset: 0 !important;
        pointer-events: none !important;
      }
      .tv-live-pill {
        position: absolute !important;
        top: 8px !important;
        left: 8px !important;
        background: rgba(224, 36, 43, 0.95) !important;
        color: #ffffff !important;
        padding: 3px 8px !important;
        border-radius: 4px !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        box-shadow: 0 0 10px rgba(224, 36, 43, 0.8) !important;
        display: flex !important;
        align-items: center !important;
        gap: 5px !important;
        z-index: 2 !important;
        letter-spacing: 0.5px !important;
      }
      .rec-blink {
        width: 7px !important;
        height: 7px !important;
        background: #ffffff !important;
        border-radius: 50% !important;
        animation: recBlink 0.8s infinite alternate !important;
      }
      @keyframes recBlink {
        0% { opacity: 1 !important; }
        100% { opacity: 0.2 !important; }
      }
      .tv-rec-time {
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        background: rgba(15, 23, 42, 0.85) !important;
        color: #ffd400 !important;
        padding: 3px 8px !important;
        border-radius: 4px !important;
        font-size: 11px !important;
        font-family: monospace !important;
        font-weight: 700 !important;
        z-index: 2 !important;
        border: 1px solid rgba(255, 212, 0, 0.3) !important;
      }
      .tv-scanlines {
        position: absolute !important;
        inset: 0 !important;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%) !important;
        background-size: 100% 4px !important;
        z-index: 1 !important;
      }

      /* Police FIR Challan Docket */
      .police-fir-box {
        background: rgba(15, 23, 42, 0.92) !important;
        border: 2px solid #ffcb1f !important;
        border-radius: 10px !important;
        padding: 12px 14px !important;
        margin: 12px 0 !important;
        box-shadow: inset 0 0 15px rgba(255, 203, 31, 0.15), 0 4px 18px rgba(0, 0, 0, 0.6) !important;
        font-family: inherit !important;
      }
      .fir-top-bar {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-bottom: 1.5px solid rgba(255, 203, 31, 0.4) !important;
        padding-bottom: 6px !important;
        margin-bottom: 8px !important;
      }
      .fir-emblem {
        color: #ffcb1f !important;
        font-weight: 800 !important;
        font-size: 13px !important;
        letter-spacing: 0.5px !important;
      }
      .fir-doc-badge {
        background: #e0242b !important;
        color: #ffffff !important;
        padding: 2px 8px !important;
        border-radius: 4px !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        letter-spacing: 0.5px !important;
      }
      .fir-meta-row {
        display: flex !important;
        justify-content: space-between !important;
        font-size: 12px !important;
        color: #94a3b8 !important;
        margin-bottom: 10px !important;
      }
      .fir-details-grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 8px 14px !important;
      }
      .fir-grid-item small {
        display: block !important;
        font-size: 11px !important;
        color: #94a3b8 !important;
        margin-bottom: 2px !important;
      }
      .fir-grid-item strong {
        display: block !important;
        font-size: 13px !important;
        color: #f8fafc !important;
        line-height: 1.3 !important;
      }
      .fir-grid-item .fir-amount {
        color: #ff3344 !important;
        font-size: 18px !important;
        font-weight: 900 !important;
        text-shadow: 0 0 12px rgba(255, 51, 68, 0.6) !important;
      }
      .fir-seal-banner {
        margin-top: 10px !important;
        text-align: center !important;
        border-top: 1px dashed rgba(255, 203, 31, 0.3) !important;
        padding-top: 6px !important;
      }
      .fir-seal-badge {
        color: #38ef7d !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        letter-spacing: 0.5px !important;
      }

      /* Bottom TV Breaking News Marquee Scroller */
      .tv-breaking-ticker {
        background: #0b1120 !important;
        border-top: 2px solid #e0242b !important;
        border-bottom: 2px solid #ffd400 !important;
        display: flex !important;
        align-items: center !important;
        overflow: hidden !important;
        padding: 6px 0 !important;
        border-radius: 0 0 14px 14px !important;
        margin-top: 12px !important;
      }
      .ticker-badge {
        background: #e0242b !important;
        color: #ffffff !important;
        font-weight: 900 !important;
        padding: 4px 12px !important;
        font-size: 12px !important;
        white-space: nowrap !important;
        margin-left: 8px !important;
        margin-right: 10px !important;
        border-radius: 4px !important;
        box-shadow: 0 0 10px rgba(224, 36, 43, 0.8) !important;
        flex-shrink: 0 !important;
      }
      .ticker-marquee-wrap {
        overflow: hidden !important;
        white-space: nowrap !important;
        width: 100% !important;
      }
      .ticker-marquee-track {
        display: inline-block !important;
        padding-left: 100% !important;
        animation: tickerScroll 20s linear infinite !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        color: #ffd400 !important;
        letter-spacing: 0.5px !important;
      }
      @keyframes tickerScroll {
        0% { transform: translateX(0) !important; }
        100% { transform: translateX(-100%) !important; }
      }

      /* MOBILE RESPONSIVE OVERRIDES (PERFECT TOUCH CLEARANCE) */
      @media (max-width: 768px) {
        .hud-top {
          top: calc(env(safe-area-inset-top, 0px) + 8px) !important;
          left: 8px !important;
          gap: 4px !important;
        }
        #lossBox {
          padding: 4px 8px !important;
          min-width: 135px !important;
        }
        #loss {
          font-size: 19px !important;
        }
        #battBox {
          padding: 3px 8px !important;
          gap: 6px !important;
        }
        #battBox .bar {
          width: 48px !important;
        }
        .mini-map-radar {
          top: calc(env(safe-area-inset-top, 0px) + 8px) !important;
          right: 8px !important;
          padding: 4px 6px !important;
          transform: scale(0.85) !important;
          transform-origin: top right !important;
        }
        .raja-stars-box {
          top: calc(env(safe-area-inset-top, 0px) + 8px) !important;
          padding: 2px 8px !important;
          transform: translateX(-50%) scale(0.85) !important;
        }
        #controls {
          display: none !important; /* Hide keyboard helper on touch screens */
        }
        .bribe-btn {
          top: calc(env(safe-area-inset-top, 0px) + 240px) !important;
          font-size: 12px !important;
          padding: 6px 16px !important;
          white-space: nowrap !important;
        }
        /* Speedometer lifted safely above left steering touch pedals */
        .raja-gauge {
          bottom: calc(var(--band) + 148px) !important;
          left: 10px !important;
          width: 72px !important;
          height: 72px !important;
          transform: none !important;
        }
        .speed-number {
          font-size: 18px !important;
        }
        .gauge-readout {
          bottom: 14px !important;
        }
        .cta {
          font-size: 22px !important;
          padding: 10px 30px !important;
        }
        #touch .tbtn {
          touch-action: manipulation !important;
          -webkit-tap-highlight-color: transparent !important;
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

      /* ============================================================ */
      /* RASTAR RAJA v3.0: ZONE TOAST, SPEED BLUR & ROAD MICRO TOASTS */
      /* ============================================================ */
      #zoneToast {
        position: fixed;
        top: calc(env(safe-area-inset-top, 0px) + 68px);
        left: 50%;
        transform: translateX(-50%) translateY(-30px);
        opacity: 0;
        pointer-events: none;
        z-index: 920;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 9px 24px;
        border-radius: 9999px;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 2px solid #00f0ff;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.65), 0 0 24px rgba(0, 240, 255, 0.4);
        transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease;
        text-align: center;
        max-width: 90vw;
      }
      #zoneToast.active {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      .zone-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: 0.3px;
        white-space: nowrap;
      }
      .zone-icon {
        font-size: 20px;
        filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6));
      }
      .zone-title {
        font-family: 'Tiro Bangla', sans-serif;
      }
      .zone-sub {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        letter-spacing: 0.2px;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 82vw;
      }

      /* High-Speed Radial Motion Blur Overlay */
      #speedBlurOverlay {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 38;
        opacity: 0;
        transition: opacity 0.15s ease;
        background: radial-gradient(ellipse at center, transparent 48%, rgba(0, 240, 255, 0.08) 82%, rgba(15, 23, 42, 0.5) 100%);
      }
      #speedBlurOverlay.nitro-streak {
        background: radial-gradient(ellipse at center, transparent 36%, rgba(0, 240, 255, 0.18) 72%, rgba(255, 0, 128, 0.32) 100%);
      }

      /* Micro Toasts (Manhole Thump, Dog Bark, Pigeon Scatter) */
      .micro-toast {
        position: fixed;
        pointer-events: none;
        z-index: 960;
        font-size: 13px;
        font-weight: 800;
        color: #ffd400;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9), 0 0 10px rgba(255, 212, 0, 0.6);
        background: rgba(15, 23, 42, 0.88);
        padding: 4px 12px;
        border-radius: 9999px;
        border: 1px solid rgba(255, 212, 0, 0.5);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        animation: microFloat 1.25s ease-out forwards;
      }
      @keyframes microFloat {
        0% { opacity: 0; transform: translateY(0) scale(0.85); }
        15% { opacity: 1; transform: translateY(-8px) scale(1.05); }
        75% { opacity: 1; transform: translateY(-24px) scale(1.0); }
        100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
      }

      @media (max-width: 768px) {
        #zoneToast {
          top: calc(env(safe-area-inset-top, 0px) + 54px);
          padding: 7px 16px;
        }
        .zone-header {
          font-size: 13px;
        }
        .zone-icon {
          font-size: 17px;
        }
        .zone-sub {
          font-size: 10px;
        }
      }

      /* 15. Dhaka Humorous Comic Speech Bubble System */
      .dhaka-humor-box {
        position: fixed;
        top: 76px;
        left: 50%;
        transform: translateX(-50%) translateY(-22px) scale(0.85);
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98));
        border: 2px solid #00f0ff;
        border-radius: 20px;
        padding: 9px 20px;
        color: #ffffff;
        font-family: 'Tiro Bangla', sans-serif;
        font-size: 15px;
        font-weight: 700;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 240, 255, 0.4);
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 9999;
        text-align: center;
        max-width: 90vw;
        white-space: nowrap;
      }
      .dhaka-humor-box.active {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0) scale(1);
      }
      .dhaka-humor-box.horn {
        border-color: #ffd400;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 212, 0, 0.5);
      }
      .dhaka-humor-box.warning {
        border-color: #ff3344;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 51, 68, 0.5);
      }
      .dhaka-humor-box.speed {
        border-color: #a855f7;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(168, 85, 247, 0.5);
      }
      .dhaka-humor-tail {
        position: absolute;
        bottom: -9px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 9px solid transparent;
        border-right: 9px solid transparent;
        border-top: 9px solid #00f0ff;
      }
      .dhaka-humor-box.horn .dhaka-humor-tail { border-top-color: #ffd400; }
      .dhaka-humor-box.warning .dhaka-humor-tail { border-top-color: #ff3344; }
      .dhaka-humor-box.speed .dhaka-humor-tail { border-top-color: #a855f7; }

      /* 16. Mobile Fullscreen Mode & Native App Polish */
      .raja-fs-btn {
        position: fixed;
        top: 14px;
        right: 120px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(0, 240, 255, 0.45);
        border-radius: 999px;
        padding: 6px 12px;
        color: #00f0ff;
        font-family: 'Tiro Bangla', sans-serif;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        transition: all 0.2s ease;
        user-select: none;
        touch-action: manipulation;
      }
      .raja-fs-btn:active {
        transform: scale(0.92);
        background: #00f0ff;
        color: #000;
      }
      @media (max-width: 640px) {
        .raja-fs-btn {
          top: 8px;
          right: 106px;
          padding: 5px 9px;
          font-size: 11px;
        }
        .dhaka-humor-box {
          top: 68px;
          font-size: 13px;
          padding: 8px 16px;
        }
      }

      /* ============================================================ */
      /* RASTAR RAJA v3.4: COCKPIT FPP, PASSENGER HUD & POLICE TRAP   */
      /* ============================================================ */

      /* Camera View Toggle Button (Desktop & Mobile) */
      .raja-cam-btn {
        position: fixed !important;
        top: 14px !important;
        right: 215px !important;
        z-index: 1000 !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        background: rgba(15, 23, 42, 0.88) !important;
        border: 1px solid rgba(255, 203, 31, 0.5) !important;
        border-radius: 999px !important;
        padding: 6px 12px !important;
        color: #ffcb1f !important;
        font-family: inherit !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        backdrop-filter: blur(8px) !important;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
        transition: all 0.2s ease !important;
        touch-action: manipulation !important;
      }
      .raja-cam-btn:hover {
        background: rgba(255, 203, 31, 0.2) !important;
        border-color: #ffd400 !important;
      }
      .raja-cam-btn.active {
        background: #ffd400 !important;
        color: #0b0f19 !important;
        box-shadow: 0 0 16px rgba(255, 212, 0, 0.7) !important;
      }
      @media (max-width: 640px) {
        .raja-cam-btn {
          top: 8px !important;
          right: 175px !important;
          padding: 5px 9px !important;
          font-size: 11px !important;
        }
      }

      /* First Person Cockpit Overlay & Dash */
      .raja-cockpit-overlay {
        position: fixed !important;
        inset: 0 !important;
        pointer-events: none !important;
        z-index: 76 !important;
      }
      .cockpit-glass-frame {
        position: absolute;
        inset: 0;
        box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.65);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 40%);
      }
      .cockpit-dash {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 180px;
        display: flex;
        justify-content: center;
        align-items: flex-end;
      }
      .handlebar-container {
        position: relative;
        width: 360px;
        height: 140px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .handlebar-stem {
        position: absolute;
        bottom: 0;
        width: 28px;
        height: 75px;
        background: linear-gradient(90deg, #334155, #64748b, #1e293b);
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(0,0,0,0.8);
      }
      .handlebar-bar {
        position: absolute;
        bottom: 60px;
        width: 320px;
        height: 18px;
        background: linear-gradient(180deg, #cbd5e1, #64748b, #334155);
        border-radius: 9px;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 8px;
        box-sizing: border-box;
      }
      .grip-left, .grip-right {
        width: 65px;
        height: 28px;
        background: repeating-linear-gradient(90deg, #0f172a, #0f172a 4px, #1e293b 4px, #1e293b 8px);
        border-radius: 8px;
        border: 2px solid #334155;
      }
      .cycle-bell {
        position: absolute;
        left: 80px;
        top: -24px;
        font-size: 24px;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.8));
      }
      /* Swinging Chili-Lemon Amulet */
      .talisman-cord {
        position: absolute;
        left: 50%;
        top: 14px;
        transform-origin: top center;
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.7));
        transition: transform 0.05s ease-out;
      }
      .talisman-beads {
        width: 3px;
        height: 24px;
        background: repeating-linear-gradient(180deg, #dc2626, #dc2626 3px, #000 3px, #000 6px);
      }
      .chili-bundle {
        font-size: 20px;
        letter-spacing: -6px;
        line-height: 1;
        margin-top: -4px;
      }
      .lemon-charm {
        font-size: 22px;
        line-height: 1;
        margin-top: -2px;
      }
      @media (max-width: 640px) {
        .handlebar-container {
          width: 280px;
          transform: scale(0.85);
          transform-origin: bottom center;
        }
      }

      /* Passenger Trip Mission Capsule in Top Status Bar */
      .raja-passenger-hud-pill {
        position: fixed !important;
        top: calc(env(safe-area-inset-top, 0px) + 12px) !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: rgba(11, 17, 32, 0.92) !important;
        border: 1.5px solid #10b981 !important;
        border-radius: 20px !important;
        padding: 5px 16px !important;
        color: #f1f5f9 !important;
        font-family: inherit !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        backdrop-filter: blur(12px) !important;
        box-shadow: 0 0 16px rgba(16, 185, 129, 0.4), 0 4px 16px rgba(0, 0, 0, 0.7) !important;
        z-index: 93 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        white-space: nowrap !important;
      }
      @media (max-width: 768px) {
        .raja-passenger-hud-pill {
          top: calc(env(safe-area-inset-top, 0px) + 48px) !important;
          font-size: 11px !important;
          padding: 3px 10px !important;
        }
      }

      html, body, #touch, .tbtn, .pedal {
        touch-action: manipulation !important;
        overscroll-behavior: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
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
        bribe.style.display = 'none';
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
        bribeBtn.style.display = num >= 2 ? 'flex' : 'none';
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

      // Integrate Fare readout into #lossBox for zero-clutter top-left status capsule
      const lossBox = document.getElementById('lossBox');
      if (lossBox && !document.getElementById('fareVal')) {
        const fareRow = document.createElement('div');
        fareRow.id = 'rajaFareRow';
        fareRow.className = 'raja-fare-inline';
        fareRow.innerHTML = `<span class="fare-badge">🚖 ভাড়া:</span> <strong id="fareVal" class="fare-num">৳০</strong>`;
        lossBox.appendChild(fareRow);
      }

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
        p.bumpY = 0.28;
        p.v *= 0.82;

        if (window.__at) {
          if (window.__at.sfx && window.__at.sfx.bump) window.__at.sfx.bump();
          if (window.__at.FX && window.__at.FX.shake) window.__at.FX.shake(0.35);
        }

        if (typeof DhakaStreetHumorSystem !== 'undefined' && DhakaStreetHumorSystem.say) {
          DhakaStreetHumorSystem.say("💥 ওরে বাবারে! স্পিড ব্রেকার দেখেন না?! রিকশা উড়ায় দিলেন!");
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

      const flyY = window.__flyoverElevation || 0;

      // 1. Update Neon Underglow
      if (this.underglowMesh) {
        this.underglowMesh.visible = inPlay && p.alive;
        if (this.underglowMesh.visible) {
          this.underglowMesh.position.set(p.x, flyY + 0.04, p.z);
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
          this.headlightGroup.position.set(p.x, flyY + 0.05, p.z);
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
          this.exhaustMesh.position.set(tx, flyY + 0.32, tz);
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

        if (typeof LivingCitySystem !== 'undefined' && LivingCitySystem.onHornBlast) {
          LivingCitySystem.onHornBlast(p);
        }

        if (typeof DhakaStreetHumorSystem !== 'undefined' && DhakaStreetHumorSystem.sayRandom) {
          DhakaStreetHumorSystem.sayRandom(DhakaStreetHumorSystem.hornDialogues, 'horn');
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
      const rollFactor = kind === 'cng' ? 0.45 : kind === 'leguna' ? 0.48 : kind === 'bus' ? 0.20 : 0.35;

      let targetPitch = 0;
      if (accel > 1.2 || p.boost) {
        // Acceleration / Nitro squat (rear dips, nose lifts)
        targetPitch = -0.14 - (p.boost ? 0.08 : 0);
      } else if (accel < -2.2) {
        // Heavy braking dive (front nose dips down)
        targetPitch = 0.20 + Math.min(0.14, Math.abs(accel) * 0.018);
      }
      this.pitchAngle += (targetPitch - this.pitchAngle) * Math.min(1, dt * 9.0);

      // Realistic Centrifugal Body Roll (Steering right leans chassis left)
      const targetRoll = - p.steer * Math.min(1.4, Math.abs(p.v) / 7.5) * rollFactor;
      this.rollAngle += (targetRoll - this.rollAngle) * Math.min(1, dt * 8.5);

      // Subtle high-speed road vibration micro-bounce
      this.bounceY = Math.sin(performance.now() * 0.022 * Math.abs(p.v)) * 0.016;

      if (at && at.PLAYER && at.PLAYER.beat) {
        at.PLAYER.beat.pitch = this.pitchAngle;
        at.PLAYER.beat.roll = this.rollAngle;
        at.PLAYER.beat.y = this.bounceY;
      }

      // Tire Skid Marks, Squeal Audio & Smoke Particles
      const isSkidding = (accel < -3.0 && p.v > 3.8) || (Math.abs(p.steer) > 0.38 && p.v > 5.0);
      if (isSkidding) {
        const rearDist = (p.len || 2.6) * 0.44;
        const halfWid = (p.wid || 1.3) * 0.46;
        const leftX = p.x - p.rx * halfWid + p.fx * rearDist;
        const leftZ = p.z - p.rz * halfWid + p.fz * rearDist;
        const rightX = p.x + p.rx * halfWid + p.fx * rearDist;
        const rightZ = p.z + p.rz * halfWid + p.fz * rearDist;
        this.spawnSkid(leftX, leftZ, p.yaw);
        this.spawnSkid(rightX, rightZ, p.yaw);

        // Sound & Smoke
        if (DhakaAudioSFX && typeof DhakaAudioSFX.playSkidSqueal === 'function') {
          DhakaAudioSFX.playSkidSqueal();
        }
        if (at && at.FX && typeof at.FX.sparks === 'function' && Math.random() < 0.25) {
          at.FX.sparks(leftX, 0.05, leftZ, 2);
          at.FX.sparks(rightX, 0.05, rightZ, 2);
        }
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
      this.container.style.display = 'none'; // Initially hidden when not playing
      this.container.innerHTML = `
        <div class="radar-header">
          <span class="radar-live-dot"></span>
          <span class="radar-title">রাডার জিপিএস</span>
          <span class="radar-heading" id="radarHeading">N</span>
        </div>
        <canvas id="radarCanvas" width="96" height="96"></canvas>
        <div class="radar-gps-hint" id="radarGpsHint">🛣️ রাজপথ ক্লিয়ার, টানেন!</div>
      `;
      const hud = document.getElementById('hud');
      if (hud) hud.appendChild(this.container);
      else document.body.appendChild(this.container);

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
      const w = 96, h = 96;
      const cx = 48, cy = 48;
      const scale = 0.44;

      ctx.clearRect(0, 0, w, h);

      // Radar disc
      ctx.beginPath();
      ctx.arc(cx, cy, 45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(11, 17, 32, 0.88)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#00f0ff';
      ctx.stroke();

      // Range Rings
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;
      [16, 30, 44].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, 4); ctx.lineTo(cx, 92);
      ctx.moveTo(4, cy); ctx.lineTo(92, cy);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.stroke();

      // Forward Road Track Corridor on Radar (Smooth vs Broken Road 25% vs Flyover)
      const isBroken = window.__isBrokenRoad || false;
      const isFlyover = (window.__flyoverElevation || 0) > 0.5;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - 10, cy - 42, 20, 84);
      ctx.clip();

      // Road background lane
      ctx.fillStyle = isBroken ? 'rgba(255, 51, 68, 0.22)' : isFlyover ? 'rgba(255, 212, 0, 0.18)' : 'rgba(0, 240, 255, 0.12)';
      ctx.fillRect(cx - 8, cy - 40, 16, 80);

      // Road boundaries
      ctx.strokeStyle = isBroken ? '#ff3344' : isFlyover ? '#ffd400' : '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 40); ctx.lineTo(cx - 8, cy + 40);
      ctx.moveTo(cx + 8, cy - 40); ctx.lineTo(cx + 8, cy + 40);
      ctx.stroke();

      // Center dashed line
      ctx.strokeStyle = isBroken ? '#ffcb1f' : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - 40); ctx.lineTo(cx, cy + 40);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

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

      if (typeof DhakaStreetHumorSystem !== 'undefined' && DhakaStreetHumorSystem.sayRandom) {
        DhakaStreetHumorSystem.sayRandom(DhakaStreetHumorSystem.nearMissDialogues, 'normal');
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
  // 21. Dhaka Unified Environmental Audio Synthesizer
  // ----------------------------------------------------
  const DhakaAudioSFX = {
    getCtx() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!window.RastarRaja.audioCtx) window.RastarRaja.audioCtx = new AudioCtx();
        const ctx = window.RastarRaja.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
      } catch (e) {
        return null;
      }
    },

    // Zone Fanfare Chime
    playZoneChime(zoneId) {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const chords = {
          old_dhaka: [392.00, 493.88, 587.33], // G4, B4, D5 (Warm Vintage)
          hatirjheel: [440.00, 554.37, 659.25], // A4, C#5, E5 (Airy Modern)
          gulshan: [523.25, 659.25, 783.99]    // C5, E5, G5 (Cyber Arpeggio)
        };
        const freqs = chords[zoneId] || chords.old_dhaka;
        const waveType = zoneId === 'gulshan' ? 'sawtooth' : zoneId === 'hatirjheel' ? 'sine' : 'triangle';

        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.09;
          osc.type = waveType;
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.01, t + 0.45);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.6);
        });
      } catch (e) {}
    },

    // WASA Manhole Metallic Clack (Dual Wheel Thump)
    playManholeClack() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [0, 0.065].forEach(delay => {
          const t = now + delay;
          // Low suspension thump
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(85, t);
          osc.frequency.exponentialRampToValueAtTime(32, t + 0.08);
          oscGain.gain.setValueAtTime(0.24, t);
          oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
          osc.connect(oscGain);
          oscGain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.1);

          // Metallic cast-iron clack
          const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 820;
          filter.Q.value = 5.0;

          const metalGain = ctx.createGain();
          metalGain.gain.setValueAtTime(0.18, t);
          metalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

          whiteNoise.connect(filter);
          filter.connect(metalGain);
          metalGain.connect(ctx.destination);
          whiteNoise.start(t);
          whiteNoise.stop(t + 0.06);
        });
      } catch (e) {}
    },

    // Pigeon Flutter Flapping Sound
    playPigeonFlutter() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        for (let i = 0; i < 7; i++) {
          const t = now + i * 0.052;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
          osc.frequency.exponentialRampToValueAtTime(60, t + 0.038);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.14, t + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.045);
        }
      } catch (e) {}
    },

    // Sidewalk Street Dog Bark
    playDogBark() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [0, 0.16].forEach(delay => {
          const t = now + delay;
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(410, t);
          osc.frequency.exponentialRampToValueAtTime(170, t + 0.11);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(680, t);
          filter.Q.value = 3.5;

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.22, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.13);
        });
      } catch (e) {}
    },

    // Tactile UI Mechanical Click
    playClickSound() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.024);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.032);
      } catch (e) {}
    },

    // Hazard Road Warning Chime (2-tone Beep)
    playRoadWarning() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [0, 0.09].forEach((delay, idx) => {
          const t = now + delay;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(idx === 0 ? 740 : 580, t);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.08);
        });
      } catch (e) {}
    },

    // Landmark Announcement Chime (Rich Dual-Tone Crystal Bell)
    playChimeSound() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [587.33, 880.00].forEach((freq, idx) => {
          const t = now + idx * 0.12;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + 0.6);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.75);
        });
      } catch (e) {}
    },

    // Asphalt Rubber Tire Skid Squeal
    playSkidSqueal() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(850 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.22);
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 6.0;
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    },

    // Continuous Loose Gravel Rumble on Broken Road
    gravelNode: null,
    gravelGain: null,
    playGravelRumble(speed, dt) {
      const ctx = this.getCtx();
      if (!ctx || speed < 2.0) {
        if (this.gravelGain && ctx) {
          this.gravelGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        }
        return;
      }
      try {
        const now = ctx.currentTime;
        if (!this.gravelNode) {
          const bufferSize = Math.floor(ctx.sampleRate * 0.45);
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 340;
          filter.Q.value = 2.4;

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.0001, now);

          whiteNoise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          whiteNoise.start();

          this.gravelNode = whiteNoise;
          this.gravelGain = gain;
        }

        const targetGain = Math.min(0.22, 0.03 + (speed / 18.0) * 0.15);
        this.gravelGain.gain.setValueAtTime(targetGain, now);
      } catch (e) {}
    },

    stopGravelRumble() {
      if (this.gravelGain) {
        try {
          const ctx = this.getCtx();
          if (ctx) this.gravelGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        } catch (e) {}
      }
    },

    // Comic Dialogue Bubble Pop Synthesizer
    playDialoguePop() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(860, now + 0.08);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } catch (e) {}
    },

    // 1. Waterlogged Road Puddle Aquatic Splash Sound
    playWaterSplash() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        // Low aquatic plunge thump
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.28);
        oscGain.gain.setValueAtTime(0.25, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);

        // Filtered white noise water spray plume
        const bufferSize = Math.floor(ctx.sampleRate * 0.35);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.frequency.exponentialRampToValueAtTime(260, now + 0.32);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(0.24, now + 0.04);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.36);
      } catch (e) {}
    },

    // 2. Authentic Bangladesh Railway Diesel Locomotive Horn (D#4, F#4, A4)
    playTrainHorn() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const notes = [311.13, 369.99, 440.00];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = idx === 0 ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.linearRampToValueAtTime(freq * 1.008, now + 1.2);

          filter.type = 'bandpass';
          filter.frequency.value = freq * 1.8;
          filter.Q.value = 2.0;

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.22, now + 0.12);
          gain.gain.setValueAtTime(0.20, now + 0.9);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.45);
        });
      } catch (e) {}
    },

    // 3. Level Crossing Metallic Warning Bell
    playTrainGateBell() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [880, 1760].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(idx === 0 ? 0.22 : 0.11, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.24);
        });
      } catch (e) {}
    },

    // 4. Traffic Police Sergeant Pea Whistle Trill (18Hz Flutter)
    playPoliceWhistle() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [2850, 3180].forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);

          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = 18;
          lfoGain.gain.value = 45;
          lfo.connect(osc.frequency);
          lfo.start(now);
          lfo.stop(now + 0.45);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
          gain.gain.setValueAtTime(0.13, now + 0.38);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.46);
        });
      } catch (e) {}
    },

    // 5. Cash Register Double Crystal Chime for Passenger Drop-off
    playCashChime() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [1318.5, 1975.5].forEach((freq, idx) => {
          const t = now + idx * 0.09;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.24, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.42);
        });
      } catch (e) {}
    },

    // 6. Windshield Rubber Wiper Blade Friction Sweep Sound
    playWiperSweep() {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.22);
        filter.type = 'bandpass';
        filter.frequency.value = 1600;
        filter.Q.value = 3.5;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }
  };

  // ----------------------------------------------------
  // 22. Dynamic Zone Progression System
  // ----------------------------------------------------
  const ZoneProgressionSystem = {
    initialized: false,
    toastEl: null,
    toastTimer: null,
    currentZoneIdx: -1,
    oldDhakaGroup: null,
    hatirjheelGroup: null,
    gulshanGroup: null,
    bridgeRibs: [],
    ledBillboards: [],
    activeLedFrame: 0,
    lastLedCycleT: 0,

    zones: [
      {
        id: 'old_dhaka',
        name: 'পুরান ঢাকা হেরিটেজ রোড',
        en: 'Old Dhaka Heritage Corridor',
        subtitle: 'চকবাজার মোড় ও সাকরাইন গলি · ওভারহেড তারের জাল ও রিকশা আর্ট',
        icon: '🏛️',
        color: '#f59e0b',
        border: 'rgba(245, 158, 11, 0.65)',
        glow: 'rgba(245, 158, 11, 0.35)'
      },
      {
        id: 'hatirjheel',
        name: 'হাতিরঝিল লেকফ্রন্ট এক্সপ্রেসওয়ে',
        en: 'Hatirjheel Waterfront Expressway',
        subtitle: 'ওয়াটারফ্রন্ট ওভারপাস · রেইনবো আর্চ ব্রিজ ও ওয়াটার ট্যাক্সি',
        icon: '🌊',
        color: '#06b6d4',
        border: 'rgba(6, 182, 212, 0.7)',
        glow: 'rgba(6, 182, 212, 0.4)'
      },
      {
        id: 'gulshan',
        name: 'গুলশান-বনানী ডিজিটাল ডাউনটাউন',
        en: 'Gulshan Cyber Commercial Hub',
        subtitle: 'গ্লাস স্কাইস্ক্র্যাপার · অ্যানিমেটেড ডিজিটাল ভিডিও বিলবোর্ড',
        icon: '🏙️',
        color: '#8b5cf6',
        border: 'rgba(139, 92, 246, 0.7)',
        glow: 'rgba(139, 92, 246, 0.4)'
      }
    ],

    init(THREE, scene) {
      // Create Zone Toast DOM element
      if (!this.toastEl) {
        this.toastEl = document.createElement('div');
        this.toastEl.id = 'zoneToast';
        this.toastEl.innerHTML = `
          <div class="zone-header">
            <span class="zone-icon" id="zIcon">🏛️</span>
            <span class="zone-title" id="zTitle">পুরান ঢাকা হেরিটেজ রোড</span>
          </div>
          <div class="zone-sub" id="zSub">চকবাজার মোড় · ঐতিহ্যবাহী সাকরাইন</div>
        `;
        document.body.appendChild(this.toastEl);
      }

      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        // --- 1. Old Dhaka Heritage 3D Props (Overhead Tangled Cables & Food Boards) ---
        this.oldDhakaGroup = new THREE.Group();
        const wireMat = new THREE.BasicMat({ color: 0x18181b });
        const poleMat = new THREE.StandardMat({ color: 0x52525b, roughness: 0.9 });

        // Utility poles and crisscrossing wires (safely positioned on sidewalks at |X| = 9.4m)
        for (let z = -20; z >= -1180; z -= 55) {
          const poleGeo = new THREE.ct();
          poleGeo.box(-9.4, 3.2, z, 0.28, 6.4, 0.28, null);
          poleGeo.box(9.4, 3.2, z, 0.28, 6.4, 0.28, null);
          poleGeo.box(-9.4, 5.9, z, 1.4, 0.12, 0.12, null);
          poleGeo.box(9.4, 5.9, z, 1.4, 0.12, 0.12, null);
          const pMesh = new THREE.Mesh(poleGeo.build(), poleMat);
          this.oldDhakaGroup.add(pMesh);

          // Sagging wire spans across the street
          const wireGeo = new THREE.ct();
          wireGeo.box(0, 5.75, z, 18.8, 0.035, 0.035, null);
          wireGeo.box(0, 5.95, z, 18.8, 0.035, 0.035, null);
          wireGeo.box(0, 5.45, z + 6, 18.8, 0.03, 0.03, null);
          const wMesh = new THREE.Mesh(wireGeo.build(), wireMat);
          this.oldDhakaGroup.add(wMesh);
        }

        // Old Dhaka Parody Billboards (safely mounted on footpaths at |X| = 10.8m)
        const odBoards = [
          { title: "হাজী কাচ্চি ঘরাণা", sub: "খাঁটি ঘি ও বাসমতি চাল · রায়সাহেব বাজার", bg: "#78350f" },
          { title: "বাকরখানি পয়েন্ট", sub: "লালবাগ কেল্লা মোড় · গরম মুচমুচে বাকরখানি", bg: "#831843" },
          { title: "রূপচাঁদা সরিষার তেল", sub: "স্বাদে ও ঝাঁজে আসল খাঁটি তেল", bg: "#ca8a04" },
          { title: "নবাবী লাবাং ও মাঠা", sub: "পুরান ঢাকার ঐতিহ্যবাহী ঠান্ডা লাবাং", bg: "#047857" }
        ];

        odBoards.forEach((b, idx) => {
          const cv = document.createElement('canvas');
          cv.width = 256; cv.height = 128;
          const ctx = cv.getContext('2d');
          ctx.fillStyle = b.bg;
          ctx.fillRect(0, 0, 256, 128);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 6;
          ctx.strokeRect(4, 4, 248, 120);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px "Tiro Bangla", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b.title, 128, 48);

          ctx.fillStyle = '#fef08a';
          ctx.font = '13px "Tiro Bangla", sans-serif';
          ctx.fillText(b.sub, 128, 86);

          const tex = new THREE.Tex.glow.constructor(cv);
          tex.needsUpdate = true;
          const bGeo = new THREE.ct();
          const side = idx % 2 === 0 ? -10.8 : 10.8;
          const bZ = -120 - idx * 260;
          bGeo.box(side, 6.2, bZ, 0.2, 2.8, 5.4, null);
          bGeo.box(side, 2.4, bZ, 0.25, 4.8, 0.25, null);
          const bMat = new THREE.BasicMat({ map: tex });
          const bMesh = new THREE.Mesh(bGeo.build(), bMat);
          this.oldDhakaGroup.add(bMesh);
        });

        scene.add(this.oldDhakaGroup);

        // --- 2. Hatirjheel Lakefront 3D Props (Water Geometry & Rainbow Arch Bridges) ---
        this.hatirjheelGroup = new THREE.Group();

        // Waterfront Lake Geometry (Left & Right)
        const waterGeoL = new THREE.Plane(50, 1400);
        waterGeoL.rotateX(-THREE.PI / 2);
        const waterGeoR = new THREE.Plane(50, 1400);
        waterGeoR.rotateX(-THREE.PI / 2);

        // Procedural rippling water texture
        const wCanvas = document.createElement('canvas');
        wCanvas.width = 128; wCanvas.height = 128;
        const wCtx = wCanvas.getContext('2d');
        const wGrad = wCtx.createLinearGradient(0, 0, 128, 128);
        wGrad.addColorStop(0, '#0284c7');
        wGrad.addColorStop(0.5, '#0369a1');
        wGrad.addColorStop(1, '#0c4a6e');
        wCtx.fillStyle = wGrad;
        wCtx.fillRect(0, 0, 128, 128);
        wCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        wCtx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          wCtx.beginPath();
          wCtx.arc(64, i * 24, 40, 0, Math.PI);
          wCtx.stroke();
        }

        const waterTex = new THREE.Tex.glow.constructor(wCanvas);
        waterTex.needsUpdate = true;
        const waterMat = new THREE.BasicMat({
          map: waterTex,
          transparent: true,
          opacity: 0.82
        });

        const waterMeshL = new THREE.Mesh(waterGeoL, waterMat);
        waterMeshL.position.set(-34, -0.05, -1800);
        const waterMeshR = new THREE.Mesh(waterGeoR, waterMat);
        waterMeshR.position.set(34, -0.05, -1800);
        this.hatirjheelGroup.add(waterMeshL, waterMeshR);

        // Stylized Water Taxis cruising in Hatirjheel
        const taxiMat = new THREE.StandardMat({ color: 0x0284c7, roughness: 0.5 });
        const taxiCabMat = new THREE.BasicMat({ color: 0xfef08a });
        [-1500, -1850, -2200].forEach((tz, i) => {
          const tSide = i % 2 === 0 ? -24 : 24;
          const tGeo = new THREE.ct();
          tGeo.box(tSide, 0.35, tz, 2.2, 0.6, 5.0, null);
          tGeo.box(tSide, 0.85, tz - 0.3, 1.8, 0.55, 3.2, null);
          const tMesh = new THREE.Mesh(tGeo.build(), taxiMat);
          this.hatirjheelGroup.add(tMesh);
        });

        // 2 Rainbow Arched Expressway Bridges spanning over road (Z = -1450, -2150)
        [-1450, -2150].forEach(bz => {
          const archGeo = new THREE.ct();
          // Tubular segmented arch spanning X = -8 to +8 at height Y = 9.2
          const segs = 14;
          for (let s = 0; s < segs; s++) {
            const t1 = s / segs;
            const t2 = (s + 1) / segs;
            const x1 = -8 + t1 * 16;
            const x2 = -8 + t2 * 16;
            const y1 = Math.sin(t1 * Math.PI) * 9.2;
            const y2 = Math.sin(t2 * Math.PI) * 9.2;
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            archGeo.box(cx, cy, bz, (16 / segs) * 1.05, 0.5, 0.5, null);
            archGeo.box(cx, cy, bz + 4.5, (16 / segs) * 1.05, 0.5, 0.5, null);
            // Vertical hanger cables
            if (s > 1 && s < segs - 1) {
              archGeo.box(cx, cy / 2, bz, 0.08, cy, 0.08, null);
              archGeo.box(cx, cy / 2, bz + 4.5, 0.08, cy, 0.08, null);
            }
          }

          // Illuminated LED neon rib on arch
          const ribMat = new THREE.BasicMat({ color: 0x00f0ff });
          const archMesh = new THREE.Mesh(archGeo.build(), ribMat);
          this.hatirjheelGroup.add(archMesh);
          this.bridgeRibs.push(ribMat);
        });

        scene.add(this.hatirjheelGroup);

        // --- 3. Gulshan-Banani Cyber Downtown (Skyscrapers & Animated LED Billboards) ---
        this.gulshanGroup = new THREE.Group();
        const glassMat = new THREE.StandardMat({ color: 0x1e1b4b, roughness: 0.2, metalness: 0.85 });

        // Glass Skyscraper Facades towering along Gulshan
        for (let z = -2500; z >= -3500; z -= 140) {
          const skyGeoL = new THREE.ct();
          skyGeoL.box(-18, 18, z, 12, 36, 42, null);
          const skyMeshL = new THREE.Mesh(skyGeoL.build(), glassMat);

          const skyGeoR = new THREE.ct();
          skyGeoR.box(18, 22, z - 30, 14, 44, 48, null);
          const skyMeshR = new THREE.Mesh(skyGeoR.build(), glassMat);

          this.gulshanGroup.add(skyMeshL, skyMeshR);
        }

        // Animated LED Digital Video Billboards (Gantry overhead at Z = -2650, -3150)
        const ads = [
          { tag: "bKash · এক ট্যাপেই সব লেনদেন", sub: "QR কোড স্ক্যান করুন ও ক্যাশব্যাক পান", color: "#ec4899" },
          { tag: "GP 5G Ultra · গতিতে দেশ জয়", sub: "সবার জন্য আল্ট্রা-ফাস্ট ইন্টারনেট", color: "#06b6d4" },
          { tag: "Tesla Dhaka · বিদ্যুৎ গতি", sub: "স্মার্ট ঢাকার ১০০% ক্লিন এনার্জি বাহন", color: "#ef4444" },
          { tag: "Smart Bangladesh 2041", sub: "ডিজিটাল ঢাকা থেকে স্মার্ট বাংলাদেশ", color: "#10b981" }
        ];

        [-2680, -3180].forEach((bz, idx) => {
          const cv = document.createElement('canvas');
          cv.width = 256; cv.height = 128;
          const tex = new THREE.Tex.glow.constructor(cv);
          tex.needsUpdate = true;

          const gantryGeo = new THREE.ct();
          // Overhead bridge spanning road (pillars safely positioned on sidewalks at |X| = 9.2m)
          gantryGeo.box(0, 6.8, bz, 19.2, 3.2, 0.4, null);
          gantryGeo.box(-9.2, 3.4, bz, 0.5, 6.8, 0.5, null);
          gantryGeo.box(9.2, 3.4, bz, 0.5, 6.8, 0.5, null);

          const gMat = new THREE.BasicMat({ map: tex });
          const gMesh = new THREE.Mesh(gantryGeo.build(), gMat);
          this.gulshanGroup.add(gMesh);

          this.ledBillboards.push({
            canvas: cv,
            ctx: cv.getContext('2d'),
            tex: tex,
            ads: ads,
            adIdx: idx % ads.length
          });
        });

        scene.add(this.gulshanGroup);
      } catch (err) {
        console.warn('ZoneProgressionSystem 3D error:', err);
      }
    },

    showToast(zone) {
      if (!this.toastEl) return;
      const zIcon = document.getElementById('zIcon');
      const zTitle = document.getElementById('zTitle');
      const zSub = document.getElementById('zSub');

      if (zIcon) zIcon.textContent = zone.icon;
      if (zTitle) zTitle.textContent = zone.name;
      if (zSub) zSub.textContent = zone.subtitle;

      this.toastEl.style.borderColor = zone.color;
      this.toastEl.style.boxShadow = `0 8px 32px rgba(0,0,0,0.65), 0 0 24px ${zone.glow}`;

      this.toastEl.classList.remove('active');
      void this.toastEl.offsetWidth;
      this.toastEl.classList.add('active');

      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        if (this.toastEl) this.toastEl.classList.remove('active');
      }, 4200);
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p) return;

      const pDist = Math.abs(p.z);
      const zoneMod = pDist % 3600;
      let targetZoneIdx = 0;
      if (zoneMod >= 2400) targetZoneIdx = 2; // Gulshan
      else if (zoneMod >= 1200) targetZoneIdx = 1; // Hatirjheel
      else targetZoneIdx = 0; // Old Dhaka

      if (targetZoneIdx !== this.currentZoneIdx) {
        this.currentZoneIdx = targetZoneIdx;
        const currentZone = this.zones[targetZoneIdx];
        this.showToast(currentZone);
        DhakaAudioSFX.playZoneChime(currentZone.id);
      }

      // Reposition 3D groups along cyclical infinite road
      const cycleOffset = Math.floor(pDist / 3600) * 3600;
      if (this.oldDhakaGroup) this.oldDhakaGroup.position.z = -cycleOffset;
      if (this.hatirjheelGroup) this.hatirjheelGroup.position.z = -cycleOffset;
      if (this.gulshanGroup) this.gulshanGroup.position.z = -cycleOffset;

      // Animate Rainbow Arch Bridges (cycling colors)
      const now = performance.now();
      const hue = (now * 0.05) % 360;
      for (const rib of this.bridgeRibs) {
        if (rib && rib.color) {
          rib.color.setHSL(hue / 360, 0.95, 0.55);
        }
      }

      // Animate LED Video Billboards in Gulshan
      if (now - this.lastLedCycleT > 3200) {
        this.lastLedCycleT = now;
        this.activeLedFrame++;
        for (const bb of this.ledBillboards) {
          const ad = bb.ads[(this.activeLedFrame + bb.adIdx) % bb.ads.length];
          const ctx = bb.ctx;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 256, 128);

          // Glowing border
          ctx.strokeStyle = ad.color;
          ctx.lineWidth = 6;
          ctx.strokeRect(3, 3, 250, 122);

          // Scanlines
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          for (let y = 0; y < 128; y += 4) {
            ctx.fillRect(0, y, 256, 2);
          }

          // Text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px "Tiro Bangla", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(ad.tag, 128, 48);

          ctx.fillStyle = ad.color;
          ctx.font = '12px "Tiro Bangla", sans-serif';
          ctx.fillText(ad.sub, 128, 86);

          bb.tex.needsUpdate = true;
        }
      }
    }
  };

  // ----------------------------------------------------
  // 23. Mayor Mohammad Hanif Overhead Expressway Viaduct System
  // ----------------------------------------------------
  const FlyoverElevationSystem = {
    initialized: false,
    flyoverGroup: null,
    gantryGroup: null,
    currentElevation: 0,
    currentPitch: 0,
    cycleDist: 2400,
    rampUpStart: 600,
    deckLen: 650,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.flyoverGroup = new THREE.Group();

        const deckMat = new THREE.StandardMat({ color: 0x1e293b, roughness: 0.85 });
        const pierMat = new THREE.StandardMat({ color: 0x475569, roughness: 0.9 });
        const barrierMat = new THREE.BasicMat({ color: 0x1e3a8a });
        const reflectorMat = new THREE.BasicMat({ color: 0xfacc15 });

        // 1. Overhead Expressway Deck spanning above street at Y = 7.2m
        const deckGeo = new THREE.ct();
        deckGeo.box(0, 7.2, - (this.deckLen / 2), 15.2, 0.65, this.deckLen, null);
        // Side Jersey Crash Barriers
        deckGeo.box(-7.4, 7.9, - (this.deckLen / 2), 0.4, 0.9, this.deckLen, null);
        deckGeo.box(7.4, 7.9, - (this.deckLen / 2), 0.4, 0.9, this.deckLen, null);
        const deckMesh = new THREE.Mesh(deckGeo.build(), deckMat);
        this.flyoverGroup.add(deckMesh);

        // Reflectors on barriers every 18m
        const refGeo = new THREE.ct();
        for (let rz = 0; rz < this.deckLen; rz += 18) {
          refGeo.box(-7.2, 8.1, -rz, 0.08, 0.14, 0.3, null);
          refGeo.box(7.2, 8.1, -rz, 0.08, 0.14, 0.3, null);
        }
        this.flyoverGroup.add(new THREE.Mesh(refGeo.build(), reflectorMat));

        // Massive Concrete Support Portals (Side Piers + Overhead Crossbeam across road)
        const pierGeo = new THREE.ct();
        for (let pz = 20; pz < this.deckLen; pz += 50) {
          const curZ = -pz;
          // Left Sidewalk Pier (safely on sidewalk at |X| = 9.2m)
          pierGeo.box(-9.2, 3.4, curZ, 1.4, 6.8, 1.4, null);
          // Right Sidewalk Pier (safely on sidewalk at |X| = 9.2m)
          pierGeo.box(9.2, 3.4, curZ, 1.4, 6.8, 1.4, null);
          // Heavy Overhead Crossbeam supporting the deck
          pierGeo.box(0, 6.7, curZ, 19.8, 0.75, 1.8, null);
        }
        this.flyoverGroup.add(new THREE.Mesh(pierGeo.build(), pierMat));

        // 2. Overhead Highway Entrance Gantry
        const cv = document.createElement('canvas');
        cv.width = 256; cv.height = 128;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#065f46';
        ctx.fillRect(0, 0, 256, 128);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 248, 120);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Tiro Bangla", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("⬆️ মেয়র মোহাম্মদ হানিফ ফ্লাইওভার", 128, 44);

        ctx.font = '12px "Tiro Bangla", sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText("যাত্রাবাড়ী - সায়েদাবাদ লিঙ্ক · গতিসীমা ৬০ কিমি/ঘ", 128, 80);

        const gTex = new THREE.Tex.glow.constructor(cv);
        gTex.needsUpdate = true;
        const gMat = new THREE.BasicMat({ map: gTex });

        const gGeo = new THREE.ct();
        gGeo.box(0, 6.2, 10, 19.2, 2.0, 0.3, null);
        gGeo.box(-9.2, 3.1, 10, 0.4, 6.2, 0.4, null);
        gGeo.box(9.2, 3.1, 10, 0.4, 6.2, 0.4, null);
        const gMesh = new THREE.Mesh(gGeo.build(), gMat);
        this.flyoverGroup.add(gMesh);

        scene.add(this.flyoverGroup);
      } catch (e) {
        console.warn('FlyoverElevationSystem init error:', e);
      }
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p) return;

      const pDist = Math.abs(p.z);
      const cycle = Math.floor(pDist / this.cycleDist);

      // Position overhead flyover viaduct for current cycle
      if (this.flyoverGroup) {
        this.flyoverGroup.position.z = - (cycle * this.cycleDist + this.rampUpStart);
      }

      // Vehicles strictly drive on the asphalt road — zero airborne elevation!
      this.currentElevation = 0;
      this.currentPitch = 0;
      window.__flyoverElevation = 0;

      if (!p.jump) {
        p.air = 0;
      }
      if (at && at.PLAYER && at.PLAYER.beat) {
        at.PLAYER.beat.y = 0;
        at.PLAYER.beat.pitch = 0;
      }
      if (at && at.PLAYER && at.PLAYER.o && at.PLAYER.o.position) {
        at.PLAYER.o.position.y = (p.jump ? p.jump.y : 0) + (p.bumpY || 0);
      }
    }
  };

  // ----------------------------------------------------
  // 24. Bangladesh Heritage & Iconic Architecture System
  // ----------------------------------------------------
  const BangladeshHeritageLandmarksSystem = {
    initialized: false,
    group: null,
    landmarks: [],
    cycleDist: 5000,
    lastAnnouncedLandmark: null,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.group = new THREE.Group();

        // High quality PBR architectural materials
        const concreteMat = new THREE.StandardMat({ color: 0xe2e8f0, roughness: 0.85 }); // Monument white concrete
        const kahnConcreteMat = new THREE.StandardMat({ color: 0x94a3b8, roughness: 0.92 }); // Parliament grey concrete
        const redBrickMat = new THREE.StandardMat({ color: 0x991b1b, roughness: 0.88 }); // Terracotta Mughal red brick
        const curzonBrickMat = new THREE.StandardMat({ color: 0x881337, roughness: 0.85 }); // Curzon Hall deep wine brick
        const ahsanPinkMat = new THREE.StandardMat({ color: 0xec4899, roughness: 0.78 }); // Ahsan Manzil rose pink
        const ahsanDarkPink = new THREE.StandardMat({ color: 0xdb2777, roughness: 0.82 });
        const marbleWhiteMat = new THREE.StandardMat({ color: 0xffffff, roughness: 0.35 }); // Polished marble
        const sunRedMat = new THREE.BasicMat({ color: 0xdc2626 }); // Rising Red Sun
        const waterMat = new THREE.StandardMat({ color: 0x0284c7, roughness: 0.15, metalness: 0.25 }); // Reflecting pools
        const brassMat = new THREE.StandardMat({ color: 0xd97706, roughness: 0.35, metalness: 0.6 }); // Minaret brass
        const grassGreenMat = new THREE.StandardMat({ color: 0x15803d, roughness: 0.95 }); // Lawns
        const darkPlinthMat = new THREE.StandardMat({ color: 0x1e293b, roughness: 0.85 });

        // Helper function: Create illuminated monument plaque
        const createLandmarkSign = (title, sub, width = 8.5, height = 2.4) => {
          const cv = document.createElement('canvas');
          cv.width = 512; cv.height = 160;
          const ctx = cv.getContext('2d');
          ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
          ctx.fillRect(0, 0, 512, 160);
          ctx.strokeStyle = '#ffd400';
          ctx.lineWidth = 6;
          ctx.strokeRect(6, 6, 500, 148);

          ctx.fillStyle = '#ffd400';
          ctx.font = 'bold 28px "Tiro Bangla", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(title, 256, 58);

          ctx.fillStyle = '#f8fafc';
          ctx.font = '20px "Tiro Bangla", sans-serif';
          ctx.fillText(sub, 256, 104);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 15px "Tiro Bangla", sans-serif';
          ctx.fillText('🇧🇩 বাংলাদেশের ঐতিহাসিক জাতীয় স্থাপত্য নিদর্শন', 256, 138);

          const tex = new THREE.Tex.glow.constructor(cv);
          tex.needsUpdate = true;
          const mat = new THREE.BasicMat({ map: tex });
          const geo = new THREE.ct();
          geo.box(0, height * 0.5 + 0.4, 0, width, height, 0.25, null);
          geo.box(-width * 0.42, height * 0.25, 0, 0.35, height * 0.5, 0.25, null);
          geo.box(width * 0.42, height * 0.25, 0, 0.35, height * 0.5, 0.25, null);
          return new THREE.Mesh(geo.build(), mat);
        };

        // ------------------------------------------------------------------
        // 1. জাতীয় স্মৃতিসৌধ (National Martyrs' Memorial, Savar) at Z = -600m
        // ------------------------------------------------------------------
        const sritiGroup = new THREE.Group();
        sritiGroup.position.set(26, 0, -600);

        const sPlazaGeo = new THREE.ct();
        sPlazaGeo.box(0, 0.3, 0, 28, 0.6, 36, null);
        sritiGroup.add(new THREE.Mesh(sPlazaGeo.build(), redBrickMat));

        const sWaterGeo = new THREE.ct();
        sWaterGeo.box(0, 0.62, 4, 18, 0.1, 16, null);
        sritiGroup.add(new THREE.Mesh(sWaterGeo.build(), waterMat));

        const sLawnGeo = new THREE.ct();
        sLawnGeo.box(0, 0.1, 0, 36, 0.2, 46, null);
        sritiGroup.add(new THREE.Mesh(sLawnGeo.build(), grassGreenMat));

        // 7 pairs of soaring triangular concrete wall prisms
        const sPylonsGeo = new THREE.ct();
        const pHeights = [34, 28, 22, 17, 13, 9.5, 6.5];
        const pWidths  = [3.2, 4.0, 4.6, 5.2, 5.8, 6.4, 7.0];
        for (let i = 0; i < 7; i++) {
          const h = pHeights[i];
          const w = pWidths[i];
          const zStep = -6 + i * 1.8;
          const xOffset = 0.9 + i * 1.35;
          sPylonsGeo.box(-xOffset, h * 0.5, zStep, 0.7, h, w * 0.45, null);
          sPylonsGeo.box(xOffset, h * 0.5, zStep, 0.7, h, w * 0.45, null);
        }
        sritiGroup.add(new THREE.Mesh(sPylonsGeo.build(), concreteMat));

        const sSign = createLandmarkSign('জাতীয় স্মৃতিসৌধ (১৯৭১)', 'সাভার · স্থপতি সৈয়দ মাইনুল হোসেন');
        sSign.position.set(0, 0, 15);
        sSign.rotation.y = -0.3;
        sritiGroup.add(sSign);

        this.group.add(sritiGroup);
        this.landmarks.push({
          id: 'sriti',
          name: 'জাতীয় স্মৃতিসৌধ (১৯৭১)',
          sub: 'বীর শহীদদের স্মরণে সাভারে নির্মিত জাতীয় সৌধ',
          z: -600,
          group: sritiGroup
        });

        // ------------------------------------------------------------------
        // 2. জাতীয় সংসদ ভবন (National Parliament House, Louis Kahn) at Z = -1350m
        // ------------------------------------------------------------------
        const sangsadGroup = new THREE.Group();
        sangsadGroup.position.set(-28, 0, -1350);

        const sangWaterGeo = new THREE.ct();
        sangWaterGeo.box(0, 0.4, 0, 44, 0.4, 38, null);
        sangsadGroup.add(new THREE.Mesh(sangWaterGeo.build(), waterMat));

        const sangGeo = new THREE.ct();
        sangGeo.box(0, 9.0, 0, 26, 18.0, 22, null);
        sangGeo.box(-12, 10.0, -10, 4.5, 20.0, 4.5, null);
        sangGeo.box(12, 10.0, -10, 4.5, 20.0, 4.5, null);
        sangGeo.box(-12, 10.0, 10, 4.5, 20.0, 4.5, null);
        sangGeo.box(12, 10.0, 10, 4.5, 20.0, 4.5, null);
        // Cutouts
        sangGeo.box(0, 11.0, 11.2, 8.0, 8.0, 0.4, null);
        sangGeo.box(-7.0, 6.0, 11.2, 4.2, 6.0, 0.4, null);
        sangGeo.box(7.0, 6.0, 11.2, 4.2, 6.0, 0.4, null);
        sangsadGroup.add(new THREE.Mesh(sangGeo.build(), kahnConcreteMat));

        // Marble bands
        const sangBandsGeo = new THREE.ct();
        for (let yb = 3; yb < 18; yb += 3.5) {
          sangBandsGeo.box(0, yb, 11.1, 26.2, 0.35, 0.2, null);
        }
        sangsadGroup.add(new THREE.Mesh(sangBandsGeo.build(), marbleWhiteMat));

        const sangSign = createLandmarkSign('জাতীয় সংসদ ভবন', 'শের-ই-বাংলা নগর · স্থপতি লুই কান (Louis Kahn)');
        sangSign.position.set(0, 0, 16);
        sangSign.rotation.y = 0.35;
        sangsadGroup.add(sangSign);

        this.group.add(sangsadGroup);
        this.landmarks.push({
          id: 'sangsad',
          name: 'জাতীয় সংসদ ভবন (লুই কান)',
          sub: 'বিশ্বখ্যাত স্থাপত্যকলা ও বাংলাদেশের জাতীয় সংসদ',
          z: -1350,
          group: sangsadGroup
        });

        // ------------------------------------------------------------------
        // 3. আহসান মঞ্জিল (Ahsan Manzil - Pink Palace, 1872) at Z = -2100m
        // ------------------------------------------------------------------
        const ahsanGroup = new THREE.Group();
        ahsanGroup.position.set(28, 0, -2100);

        const ahsanBaseGeo = new THREE.ct();
        ahsanBaseGeo.box(0, 1.2, 0, 32, 2.4, 20, null);
        for (let s = 0; s < 8; s++) {
          ahsanBaseGeo.box(0, s * 0.28, 10 + (8 - s) * 0.65, 10, 0.3, 0.7, null);
        }
        ahsanGroup.add(new THREE.Mesh(ahsanBaseGeo.build(), darkPlinthMat));

        const ahsanGeo = new THREE.ct();
        ahsanGeo.box(0, 6.8, 0, 30, 8.8, 16, null);
        ahsanGeo.box(0, 5.0, 8.5, 12, 5.2, 2.5, null);
        for (let c = -5; c <= 5; c += 2.5) {
          ahsanGeo.box(c, 5.0, 9.8, 0.5, 5.2, 0.5, null);
        }
        ahsanGeo.box(0, 11.6, 8.0, 30.5, 0.9, 0.4, null);
        ahsanGroup.add(new THREE.Mesh(ahsanGeo.build(), ahsanPinkMat));

        const domeDrumGeo = new THREE.ct();
        domeDrumGeo.box(0, 13.0, 0, 7.5, 4.0, 7.5, null);
        domeDrumGeo.box(0, 16.2, 0, 5.8, 2.8, 5.8, null);
        domeDrumGeo.box(0, 18.2, 0, 1.0, 1.6, 1.0, null);
        ahsanGroup.add(new THREE.Mesh(domeDrumGeo.build(), ahsanDarkPink));

        const ahsanSign = createLandmarkSign('আহসান মঞ্জিল (১৮৭২)', 'বুড়িগঙ্গার তীরে নবাবদের গোলাপি প্রাসাদ');
        ahsanSign.position.set(0, 0, 16);
        ahsanSign.rotation.y = -0.3;
        ahsanGroup.add(ahsanSign);

        this.group.add(ahsanGroup);
        this.landmarks.push({
          id: 'ahsan',
          name: 'আহসান মঞ্জিল (Pink Palace)',
          sub: 'ঢাকার ঐতিহাসিক নবাব প্যালেস ও বুড়িগঙ্গা ঐতিহ্য',
          z: -2100,
          group: ahsanGroup
        });

        // ------------------------------------------------------------------
        // 4. লালবাগ কেল্লা (Lalbagh Mughal Fort, 1678) at Z = -2850m
        // ------------------------------------------------------------------
        const lalbaghGroup = new THREE.Group();
        lalbaghGroup.position.set(-27, 0, -2850);

        const lalGeo = new THREE.ct();
        lalGeo.box(0, 6.0, 0, 24, 12.0, 10, null);
        lalGeo.box(-16, 4.5, 0, 10, 9.0, 6, null);
        lalGeo.box(16, 4.5, 0, 10, 9.0, 6, null);
        lalGeo.box(0, 4.0, 4.8, 5.5, 8.0, 1.0, null);
        for (let m = -20; m <= 20; m += 2.2) {
          lalGeo.box(m, 12.4, 4.8, 1.2, 0.9, 0.4, null);
        }
        lalbaghGroup.add(new THREE.Mesh(lalGeo.build(), redBrickMat));

        const minGeo = new THREE.ct();
        minGeo.box(-11.5, 8.0, 4.5, 1.6, 16.0, 1.6, null);
        minGeo.box(11.5, 8.0, 4.5, 1.6, 16.0, 1.6, null);
        minGeo.box(-11.5, 16.5, 4.5, 2.2, 1.2, 2.2, null);
        minGeo.box(11.5, 16.5, 4.5, 2.2, 1.2, 2.2, null);
        lalbaghGroup.add(new THREE.Mesh(minGeo.build(), brassMat));

        const pariGeo = new THREE.ct();
        pariGeo.box(0, 3.5, -8, 8, 7.0, 8, null);
        pariGeo.box(0, 8.0, -8, 4.5, 2.2, 4.5, null);
        lalbaghGroup.add(new THREE.Mesh(pariGeo.build(), marbleWhiteMat));

        const lalSign = createLandmarkSign('লালবাগ কেল্লা (১৬৭৮)', 'মুঘল সুবাদার মুহাম্মদ আজম শাহের দুর্গ');
        lalSign.position.set(0, 0, 14);
        lalSign.rotation.y = 0.35;
        lalbaghGroup.add(lalSign);

        this.group.add(lalbaghGroup);
        this.landmarks.push({
          id: 'lalbagh',
          name: 'লালবাগ কেল্লা (Lalbagh Fort)',
          sub: 'মুঘল স্থাপত্যের ঐতিহাসিক দুর্গ ও পরী বিবির মাজার',
          z: -2850,
          group: lalbaghGroup
        });

        // ------------------------------------------------------------------
        // 5. কেন্দ্রীয় শহীদ মিনার (Central Shaheed Minar, 1952) at Z = -3600m
        // ------------------------------------------------------------------
        const shaheedGroup = new THREE.Group();
        shaheedGroup.position.set(25, 0, -3600);

        const shBaseGeo = new THREE.ct();
        shBaseGeo.box(0, 0.4, 0, 18, 0.8, 16, null);
        shaheedGroup.add(new THREE.Mesh(shBaseGeo.build(), redBrickMat));

        const shPylonGeo = new THREE.ct();
        shPylonGeo.box(0, 7.0, -1.5, 2.6, 14.0, 0.6, null);
        shPylonGeo.box(0, 13.8, 0.2, 2.6, 0.6, 2.8, null);
        shPylonGeo.box(-3.8, 4.5, -1.5, 1.8, 9.0, 0.5, null);
        shPylonGeo.box(-3.8, 8.8, -0.4, 1.8, 0.5, 1.8, null);
        shPylonGeo.box(3.8, 4.5, -1.5, 1.8, 9.0, 0.5, null);
        shPylonGeo.box(3.8, 8.8, -0.4, 1.8, 0.5, 1.8, null);
        shaheedGroup.add(new THREE.Mesh(shPylonGeo.build(), marbleWhiteMat));

        const sunGeo = new THREE.ct();
        sunGeo.box(0, 7.5, -2.2, 7.2, 7.2, 0.2, null);
        shaheedGroup.add(new THREE.Mesh(sunGeo.build(), sunRedMat));

        const shSign = createLandmarkSign('কেন্দ্রীয় শহীদ মিনার', 'অমর একুশে ও আন্তর্জাতিক মাতৃভাষা দিবস');
        shSign.position.set(0, 0, 12);
        shSign.rotation.y = -0.28;
        shaheedGroup.add(shSign);

        this.group.add(shaheedGroup);
        this.landmarks.push({
          id: 'shaheed',
          name: 'কেন্দ্রীয় শহীদ মিনার',
          sub: 'ভাষা আন্দোলনের অমর স্মৃতি ও ২১শে ফেব্রুয়ারি',
          z: -3600,
          group: shaheedGroup
        });

        // ------------------------------------------------------------------
        // 6. কার্জন হল (Curzon Hall, University of Dhaka, 1904) at Z = -4350m
        // ------------------------------------------------------------------
        const curzonGroup = new THREE.Group();
        curzonGroup.position.set(-28, 0, -4350);

        const curGeo = new THREE.ct();
        curGeo.box(0, 7.5, 0, 32, 15.0, 16, null);
        curGeo.box(-20, 6.0, 0, 12, 12.0, 12, null);
        curGeo.box(20, 6.0, 0, 12, 12.0, 12, null);
        curGeo.box(0, 5.0, 7.8, 6.0, 8.0, 0.8, null);
        for (let w = -12; w <= 12; w += 4.5) {
          if (w !== 0) curGeo.box(w, 5.5, 7.8, 2.2, 4.5, 0.6, null);
        }
        curzonGroup.add(new THREE.Mesh(curGeo.build(), curzonBrickMat));

        const curTrimsGeo = new THREE.ct();
        curTrimsGeo.box(-20, 13.0, 0, 4.0, 2.5, 4.0, null);
        curTrimsGeo.box(20, 13.0, 0, 4.0, 2.5, 4.0, null);
        curTrimsGeo.box(0, 16.0, 0, 6.0, 3.0, 6.0, null);
        curTrimsGeo.box(0, 14.8, 8.2, 33, 0.5, 1.2, null);
        curzonGroup.add(new THREE.Mesh(curTrimsGeo.build(), marbleWhiteMat));

        const curSign = createLandmarkSign('কার্জন হল (১৯০৪)', 'ঢাকা বিশ্ববিদ্যালয়ের লাল ইটের রাজকীয় স্থাপত্য');
        curSign.position.set(0, 0, 14);
        curSign.rotation.y = 0.32;
        curzonGroup.add(curSign);

        this.group.add(curzonGroup);
        this.landmarks.push({
          id: 'curzon',
          name: 'কার্জন হল (Curzon Hall)',
          sub: 'ঢাকা বিশ্ববিদ্যালয়ের শতাব্দী প্রাচীন ইন্দো-ইউরোপীয় স্থাপত্য',
          z: -4350,
          group: curzonGroup
        });

        scene.add(this.group);
      } catch (e) {
        console.warn('BangladeshHeritageLandmarksSystem init error:', e);
      }
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p) return;

      // Recycle landmarks smoothly along infinite road
      for (const lm of this.landmarks) {
        while (lm.group.position.z > p.z + 200) {
          lm.group.position.z -= this.cycleDist;
        }
        while (lm.group.position.z < p.z - (this.cycleDist - 200)) {
          lm.group.position.z += this.cycleDist;
        }

        // Proximity detection for on-screen landmark announcement card
        const dist = Math.abs(p.z - lm.group.position.z);
        if (dist < 75 && this.lastAnnouncedLandmark !== lm.id) {
          this.lastAnnouncedLandmark = lm.id;
          this.showLandmarkAnnouncement(lm.name, lm.sub);
        }
      }
    },

    showLandmarkAnnouncement(name, sub) {
      try {
        let card = document.getElementById('heritageCard');
        if (!card) {
          card = document.createElement('div');
          card.id = 'heritageCard';
          card.className = 'heritage-announcement-card';
          document.body.appendChild(card);
        }
        card.innerHTML = `
          <div class="h-badge">🏛️ ঐতিহাসিক দর্শনীয় স্থান</div>
          <div class="h-title">${name}</div>
          <div class="h-sub">${sub}</div>
        `;
        card.classList.add('active');
        if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playChimeSound === 'function') {
          window.RastarRaja.DhakaAudioSFX.playChimeSound();
        }
        setTimeout(() => {
          if (card) card.classList.remove('active');
        }, 4500);
      } catch (_) {}
    }
  };

  // ----------------------------------------------------
  // 24. Road Micro-Details System (WASA Manholes & Wear)
  // ----------------------------------------------------
  const RoadMicroDetailsSystem = {
    initialized: false,
    detailsGroup: null,
    manholes: [],
    patches: [],
    zebras: [],
    lastThumpT: 0,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.detailsGroup = new THREE.Group();

        // 1. Procedural 3D WASA Cast-Iron Manhole Cover
        const mhCanvas = document.createElement('canvas');
        mhCanvas.width = 128; mhCanvas.height = 128;
        const mCtx = mhCanvas.getContext('2d');

        // Cast iron rim & concentric ribs
        mCtx.fillStyle = '#1c1917';
        mCtx.beginPath(); mCtx.arc(64, 64, 60, 0, Math.PI * 2); mCtx.fill();
        mCtx.strokeStyle = '#44403c';
        mCtx.lineWidth = 5; mCtx.stroke();

        mCtx.strokeStyle = '#292524';
        mCtx.lineWidth = 3;
        mCtx.beginPath();
        mCtx.arc(64, 64, 44, 0, Math.PI * 2);
        mCtx.arc(64, 64, 28, 0, Math.PI * 2);
        mCtx.arc(64, 64, 12, 0, Math.PI * 2);
        mCtx.stroke();

        // Stamped Dhaka WASA lettering
        mCtx.fillStyle = '#78716c';
        mCtx.font = 'bold 11px "Tiro Bangla", sans-serif';
        mCtx.textAlign = 'center';
        mCtx.fillText("ওয়াসা ঢাকা", 64, 48);
        mCtx.font = '9px sans-serif';
        mCtx.fillText("WASA · 2026", 64, 84);

        const mhTex = new THREE.Tex.glow.constructor(mhCanvas);
        mhTex.needsUpdate = true;
        const mhGeo = new THREE.Plane(1.35, 1.35);
        mhGeo.rotateX(-THREE.PI / 2);
        const mhMat = new THREE.BasicMat({ map: mhTex, transparent: true });

        // Spawn 16 manholes distributed along the lanes
        const laneOffsets = [-4.2, -1.8, 1.8, 4.2];
        for (let i = 0; i < 16; i++) {
          const mh = new THREE.Mesh(mhGeo, mhMat);
          const laneX = laneOffsets[i % laneOffsets.length];
          const zPos = - (i * 45 + 30);
          mh.position.set(laneX, 0.024, zPos);
          this.detailsGroup.add(mh);
          this.manholes.push(mh);
        }

        // 2. Dark Bituminous Asphalt Patchworks
        const pGeo = new THREE.Plane(2.6, 4.2);
        pGeo.rotateX(-THREE.PI / 2);
        const pMat = new THREE.BasicMat({
          color: 0x09090b,
          transparent: true,
          opacity: 0.55
        });
        for (let i = 0; i < 12; i++) {
          const pm = new THREE.Mesh(pGeo, pMat);
          const px = (i % 2 === 0 ? -1 : 1) * (2.0 + (i % 3) * 1.5);
          pm.position.set(px, 0.015, - (i * 65 + 40));
          this.detailsGroup.add(pm);
          this.patches.push(pm);
        }

        // 3. High-Contrast White Zebra Crossings
        const zCanvas = document.createElement('canvas');
        zCanvas.width = 128; zCanvas.height = 128;
        const zCtx = zCanvas.getContext('2d');
        zCtx.fillStyle = '#ffffff';
        for (let y = 8; y < 128; y += 24) {
          zCtx.fillRect(4, y, 120, 14);
        }
        const zTex = new THREE.Tex.glow.constructor(zCanvas);
        zTex.needsUpdate = true;
        const zGeo = new THREE.Plane(14.0, 5.0);
        zGeo.rotateX(-THREE.PI / 2);
        const zMat = new THREE.BasicMat({
          map: zTex,
          transparent: true,
          opacity: 0.75
        });

        for (let i = 0; i < 4; i++) {
          const zm = new THREE.Mesh(zGeo, zMat);
          zm.position.set(0, 0.018, - (i * 240 + 120));
          this.detailsGroup.add(zm);
          this.zebras.push(zm);
        }

        scene.add(this.detailsGroup);
      } catch (e) {
        console.warn('RoadMicroDetailsSystem init error:', e);
      }
    },

    spawnMicroToast(text) {
      try {
        const toast = document.createElement('div');
        toast.className = 'micro-toast';
        toast.textContent = text;
        const rx = window.innerWidth / 2 + (Math.random() - 0.5) * 120;
        const ry = window.innerHeight * 0.65;
        toast.style.left = `${rx}px`;
        toast.style.top = `${ry}px`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1250);
      } catch (e) {}
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p || !p.alive) return;

      const now = performance.now();
      const halfWid = (p.wid || 1.3) * 0.48;
      const leftWheelX = p.x - halfWid;
      const rightWheelX = p.x + halfWid;

      // Recycle and detect wheel collisions with WASA Manholes
      for (const mh of this.manholes) {
        // Recycle around player
        if (mh.position.z > p.z + 40) {
          mh.position.z -= 720;
        } else if (mh.position.z < p.z - 680) {
          mh.position.z += 720;
        }

        // Wheel collision detection
        const dz = Math.abs(p.z - mh.position.z);
        if (dz < 0.85 && now - this.lastThumpT > 280) {
          const dLeft = Math.abs(leftWheelX - mh.position.x);
          const dRight = Math.abs(rightWheelX - mh.position.x);
          if (dLeft < 0.68 || dRight < 0.68) {
            this.lastThumpT = now;
            DhakaAudioSFX.playManholeClack();
            p.bumpY = Math.min(0.24, 0.08 + (Math.abs(p.v) / 18.0) * 0.16);
            this.spawnMicroToast("⚡ থপ-থপ! (ওয়াসা ম্যানহোল)");
          }
        }
      }

      // Recycle Asphalt Patches
      for (const pt of this.patches) {
        if (pt.position.z > p.z + 40) pt.position.z -= 780;
        else if (pt.position.z < p.z - 740) pt.position.z += 780;
      }

      // Recycle Zebra Crossings
      for (const zm of this.zebras) {
        if (zm.position.z > p.z + 50) zm.position.z -= 960;
        else if (zm.position.z < p.z - 910) zm.position.z += 960;
      }
    }
  };

  // ----------------------------------------------------
  // 24B. Dhaka Road Condition & Environment System
  // (25% Broken Road / খানাখন্দ vs 75% Smooth Road + Overbridges & Tea Stalls)
  // ----------------------------------------------------
  const DhakaRoadEnvironmentSystem = {
    initialized: false,
    brokenRoadGroup: null,
    overbridgeGroup: null,
    teaStallGroup: null,
    isBrokenRoad: false,
    lastWarningCycle: -1,
    lastPuffT: 0,
    cycleDist: 800,
    brokenStart: 600,
    brokenLen: 200,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.brokenRoadGroup = new THREE.Group();
        this.overbridgeGroup = new THREE.Group();
        this.teaStallGroup = new THREE.Group();

        // 1. Procedural 200m Broken Road Canvas Texture (Bitumen, Cracks, Red Brick খোয়া, Potholes)
        const brCanvas = document.createElement('canvas');
        brCanvas.width = 256; brCanvas.height = 256;
        const bCtx = brCanvas.getContext('2d');

        // Dark weathered bitumen base
        bCtx.fillStyle = '#1c1917';
        bCtx.fillRect(0, 0, 256, 256);

        // Asphalt cracks and jagged fissures
        bCtx.strokeStyle = '#0c0a09';
        bCtx.lineWidth = 3;
        for (let i = 0; i < 18; i++) {
          bCtx.beginPath();
          let cx = (i * 27) % 256;
          let cy = (i * 43) % 256;
          bCtx.moveTo(cx, cy);
          for (let j = 0; j < 4; j++) {
            cx += (Math.random() - 0.5) * 45;
            cy += (Math.random() - 0.5) * 45;
            bCtx.lineTo(cx, cy);
          }
          bCtx.stroke();
        }

        // Red brick aggregate / খোয়া patches (authentic Dhaka road construction)
        for (let i = 0; i < 90; i++) {
          const rx = Math.random() * 256;
          const ry = Math.random() * 256;
          const rw = 4 + Math.random() * 8;
          const rh = 3 + Math.random() * 6;
          bCtx.fillStyle = (i % 3 === 0) ? '#991b1b' : (i % 3 === 1) ? '#b45309' : '#44403c';
          bCtx.fillRect(rx, ry, rw, rh);
        }

        // Deep potholes with wet glossy sheen centers
        const potholes = [
          { x: 65, y: 75, r: 24 },
          { x: 190, y: 130, r: 28 },
          { x: 105, y: 195, r: 22 }
        ];
        potholes.forEach(ph => {
          bCtx.fillStyle = '#0a0a0c';
          bCtx.beginPath();
          bCtx.arc(ph.x, ph.y, ph.r, 0, Math.PI * 2);
          bCtx.fill();
          bCtx.strokeStyle = '#78350f';
          bCtx.lineWidth = 4;
          bCtx.stroke();
          // Puddle reflection highlight
          bCtx.fillStyle = 'rgba(125, 211, 252, 0.4)';
          bCtx.beginPath();
          bCtx.arc(ph.x - 4, ph.y - 4, ph.r * 0.45, 0, Math.PI * 2);
          bCtx.fill();
        });

        const brTex = new THREE.Tex.glow.constructor(brCanvas);
        brTex.needsUpdate = true;
        const brGeo = new THREE.Plane(14.6, 200);
        brGeo.rotateX(-THREE.PI / 2);
        const brMat = new THREE.BasicMat({ map: brTex, transparent: true, opacity: 0.94 });
        const brMesh = new THREE.Mesh(brGeo, brMat);
        brMesh.position.set(0, 0.016, -100);
        this.brokenRoadGroup.add(brMesh);

        // 3D Road-Work Safety Drums (8 pairs along lanes)
        const drumMat = new THREE.StandardMat({ color: 0xdc2626, roughness: 0.6 });
        const drumWhiteMat = new THREE.BasicMat({ color: 0xffffff });
        const drumGeo = new THREE.ct();
        for (let bz = -15; bz >= -185; bz -= 25) {
          drumGeo.box(-6.4, 0.45, bz, 0.65, 0.9, 0.65, null);
          drumGeo.box(6.4, 0.45, bz, 0.65, 0.9, 0.65, null);
        }
        const drumMesh = new THREE.Mesh(drumGeo.build(), drumMat);
        this.brokenRoadGroup.add(drumMesh);

        // Reflective white safety stripes on drums
        const stripeGeo = new THREE.ct();
        for (let bz = -15; bz >= -185; bz -= 25) {
          stripeGeo.box(-6.4, 0.45, bz, 0.68, 0.25, 0.68, null);
          stripeGeo.box(6.4, 0.45, bz, 0.68, 0.25, 0.68, null);
        }
        const stripeMesh = new THREE.Mesh(stripeGeo.build(), drumWhiteMat);
        this.brokenRoadGroup.add(stripeMesh);

        // Road Work Entrance Warning Signboard
        const rwc = document.createElement('canvas');
        rwc.width = 256; rwc.height = 128;
        const rwCtx = rwc.getContext('2d');
        rwCtx.fillStyle = '#dc2626';
        rwCtx.fillRect(0, 0, 256, 128);
        rwCtx.strokeStyle = '#fef08a';
        rwCtx.lineWidth = 6;
        rwCtx.strokeRect(4, 4, 248, 120);

        rwCtx.fillStyle = '#ffffff';
        rwCtx.font = 'bold 16px "Tiro Bangla", sans-serif';
        rwCtx.textAlign = 'center';
        rwCtx.fillText("⚠️ সাবধান! সড়ক সংস্কার কাজ", 128, 44);

        rwCtx.fillStyle = '#fef08a';
        rwCtx.font = '12px "Tiro Bangla", sans-serif';
        rwCtx.fillText("সামনে ২০০ মি. ভাঙা রাস্তা · গতি কমান!", 128, 80);

        const rwTex = new THREE.Tex.glow.constructor(rwc);
        rwTex.needsUpdate = true;
        const rwGeo = new THREE.ct();
        rwGeo.box(0, 5.0, -5, 19.2, 2.0, 0.3, null);
        rwGeo.box(-9.2, 2.5, -5, 0.4, 5.0, 0.4, null);
        rwGeo.box(9.2, 2.5, -5, 0.4, 5.0, 0.4, null);
        const rwMesh = new THREE.Mesh(rwGeo.build(), new THREE.BasicMat({ map: rwTex }));
        this.brokenRoadGroup.add(rwMesh);

        scene.add(this.brokenRoadGroup);

        // 2. Pedestrian Foot-Overbridge (পদচারী ফুটওভার ব্রিজ safely spanning above road)
        const fobGeo = new THREE.ct();
        const fobMat = new THREE.StandardMat({ color: 0x2563eb, roughness: 0.65 });

        // Overpass bridge structure spanning road
        fobGeo.box(0, 6.4, 0, 19.6, 0.35, 3.2, null);
        fobGeo.box(0, 7.4, 0, 19.6, 0.08, 3.4, null); // Roof canopy
        fobGeo.box(0, 6.9, -1.5, 19.6, 0.7, 0.1, null); // Railings
        fobGeo.box(0, 6.9, 1.5, 19.6, 0.7, 0.1, null);
        // Vertical support pillars & staircases on sidewalks (|X| >= 9.2m)
        fobGeo.box(-9.2, 3.2, 0, 0.5, 6.4, 0.5, null);
        fobGeo.box(9.2, 3.2, 0, 0.5, 6.4, 0.5, null);
        fobGeo.box(-10.2, 3.2, 2.2, 1.5, 6.4, 2.0, null);
        fobGeo.box(10.2, 3.2, 2.2, 1.5, 6.4, 2.0, null);

        const fobMesh = new THREE.Mesh(fobGeo.build(), fobMat);
        this.overbridgeGroup.add(fobMesh);

        // Municipal Overbridge Banner
        const fbc = document.createElement('canvas');
        fbc.width = 256; fbc.height = 64;
        const fbCtx = fbc.getContext('2d');
        fbCtx.fillStyle = '#1e3a8a';
        fbCtx.fillRect(0, 0, 256, 64);
        fbCtx.fillStyle = '#ffffff';
        fbCtx.font = 'bold 14px "Tiro Bangla", sans-serif';
        fbCtx.textAlign = 'center';
        fbCtx.fillText("🚶 পদচারী ফুটওভার ব্রিজ ব্যবহার করুন", 128, 28);
        fbCtx.fillStyle = '#67e8f9';
        fbCtx.font = '11px sans-serif';
        fbCtx.fillText("Dhaka North City Corporation · DNCC", 128, 50);

        const fbTex = new THREE.Tex.glow.constructor(fbc);
        fbTex.needsUpdate = true;
        const fbSignGeo = new THREE.ct();
        fbSignGeo.box(0, 6.4, -1.6, 12.0, 1.2, 0.1, null);
        const fbSignMesh = new THREE.Mesh(fbSignGeo.build(), new THREE.BasicMat({ map: fbTex }));
        this.overbridgeGroup.add(fbSignMesh);

        scene.add(this.overbridgeGroup);

        // 3. Roadside Dhaka Tea Stalls (টং দোকান safely on sidewalks at |X| = 10.5m)
        const tsGeo = new THREE.ct();
        const tsWoodMat = new THREE.StandardMat({ color: 0x78350f, roughness: 0.9 });

        // Left sidewalk Tong stall
        tsGeo.box(-10.5, 1.1, 0, 2.6, 2.2, 2.2, null);
        tsGeo.box(-10.5, 2.25, 0, 2.9, 0.1, 2.5, null); // Blue tarp roof
        tsGeo.box(-9.2, 0.85, 0, 0.4, 0.8, 2.0, null); // Wooden counter
        tsGeo.box(-9.2, 1.35, 0, 0.35, 0.35, 0.35, null); // Aluminium kettle

        // Right sidewalk Tong stall
        tsGeo.box(10.5, 1.1, -40, 2.6, 2.2, 2.2, null);
        tsGeo.box(10.5, 2.25, -40, 2.9, 0.1, 2.5, null);
        tsGeo.box(9.2, 0.85, -40, 0.4, 0.8, 2.0, null);
        tsGeo.box(9.2, 1.35, -40, 0.35, 0.35, 0.35, null);

        const tsMesh = new THREE.Mesh(tsGeo.build(), tsWoodMat);
        this.teaStallGroup.add(tsMesh);

        scene.add(this.teaStallGroup);
      } catch (err) {
        console.warn('DhakaRoadEnvironmentSystem init error:', err);
      }
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p) {
        if (DhakaAudioSFX.stopGravelRumble) DhakaAudioSFX.stopGravelRumble();
        return;
      }

      const pDist = Math.abs(p.z);
      const cycle = Math.floor(pDist / this.cycleDist);
      const localZ = pDist % this.cycleDist;

      // Position broken road structure for active cycle
      if (this.brokenRoadGroup) {
        this.brokenRoadGroup.position.z = - (cycle * this.cycleDist + this.brokenStart);
      }

      // Position overbridge and tea stalls along road
      if (this.overbridgeGroup) {
        this.overbridgeGroup.position.z = - (cycle * this.cycleDist + 420);
      }
      if (this.teaStallGroup) {
        this.teaStallGroup.position.z = - (cycle * this.cycleDist + 220);
      }

      // 25% Broken Road check (600m to 800m of every 800m cycle)
      const now = performance.now();
      const isBroken = (localZ >= this.brokenStart && localZ < this.brokenStart + this.brokenLen);
      this.isBrokenRoad = isBroken;
      window.__isBrokenRoad = isBroken;

      const speed = Math.abs(p.v || 0);

      if (isBroken) {
        // Warning chime on initial entry
        if (this.lastWarningCycle !== cycle) {
          this.lastWarningCycle = cycle;
          DhakaAudioSFX.playRoadWarning();
          if (typeof RoadMicroDetailsSystem !== 'undefined' && RoadMicroDetailsSystem.spawnMicroToast) {
            RoadMicroDetailsSystem.spawnMicroToast("⚠️ সাবধান: সামনে ২০০ মি. ভাঙা সড়ক!");
          }
          if (typeof DhakaStreetHumorSystem !== 'undefined' && DhakaStreetHumorSystem.sayRandom) {
            DhakaStreetHumorSystem.sayRandom(DhakaStreetHumorSystem.brokenRoadDialogues, 'warning');
          }
        }

        // 1. Suspension Micro-Bumping (Haptics)
        const rumbleFreq = Math.max(14, speed * 2.2);
        const rumbleAmp = Math.min(0.20, 0.06 + (speed / 18.0) * 0.12);
        const microJitter = (Math.random() - 0.5) * 0.05;
        const curBump = (typeof p.bumpY === 'number' && !isNaN(p.bumpY)) ? p.bumpY : 0;
        p.bumpY = Math.max(curBump, Math.abs(Math.sin(now * 0.001 * rumbleFreq * Math.PI * 2)) * rumbleAmp + 0.02 + microJitter);

        // 2. Loose Gravel Traction Drag & Steering Wander
        if (speed > 3.0) {
          p.yawRate += (Math.random() - 0.5) * 0.026;
          p.v *= (1 - dt * 0.038);
        }

        // 3. Tire Dust Cloud Emission
        if (at && at.FX && speed > 4.5 && now - this.lastPuffT > 90) {
          this.lastPuffT = now;
          const halfWid = (p.wid || 1.3) * 0.46;
          const rearDist = (p.len || 2.6) * 0.44;
          const t1x = p.x - p.rx * halfWid + p.fx * rearDist;
          const t1z = p.z - p.rz * halfWid + p.fz * rearDist;
          const t2x = p.x + p.rx * halfWid + p.fx * rearDist;
          const t2z = p.z + p.rz * halfWid + p.fz * rearDist;
          at.FX.puff(t1x, 0.08, t1z, 1.1, 0.32, 0x8d6e63);
          at.FX.puff(t2x, 0.08, t2z, 1.1, 0.32, 0x8d6e63);
        }

        // 4. Loose Gravel Rumble Sound
        DhakaAudioSFX.playGravelRumble(speed, dt);
      } else {
        DhakaAudioSFX.stopGravelRumble();
      }

      // Update Mini-Map Radar & HUD Road Status
      const gpsHint = document.getElementById('radarGpsHint');
      if (gpsHint) {
        if (isBroken) {
          gpsHint.innerHTML = `<span style="color:#ff3344; font-weight:800;">⚠️ ভাঙা সড়ক (২৫%)</span> · খানাখন্দ ও খোয়া`;
          gpsHint.classList.add('hazard');
        } else if (window.__flyoverElevation > 0.5) {
          gpsHint.innerHTML = `<span style="color:#ffd400; font-weight:800;">🌉 হানিফ ফ্লাইওভার</span> · উচ্চতা +৪.৬ মি.`;
          gpsHint.classList.remove('hazard');
        } else {
          gpsHint.innerHTML = `<span style="color:#38ef7d; font-weight:700;">🛣️ মসৃণ পিচ (৭৫%)</span> · ফুল গ্রিপ`;
          gpsHint.classList.remove('hazard');
        }
      }
    }
  };

  // ----------------------------------------------------
  // 25. Living City Life & Dynamic Props System
  // ----------------------------------------------------
  const LivingCitySystem = {
    initialized: false,
    pigeons: [],
    dogs: [],
    lastFlutterT: 0,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        // 1. Flocks of Dhaka Pigeons (3 Flocks of 8 Birds)
        const pBodyMat = new THREE.BasicMat({ color: 0x475569 });
        const pWingMat = new THREE.BasicMat({ color: 0x64748b });

        for (let f = 0; f < 3; f++) {
          const fCenterZ = - (140 + f * 240);
          const fCenterX = (f % 2 === 0 ? -1 : 1) * (1.8 + (f % 3) * 1.2);

          for (let i = 0; i < 8; i++) {
            const pGrp = new THREE.Group();
            const birdGeo = new THREE.ct();
            // Tiny low-poly pigeon body & tail
            birdGeo.box(0, 0.12, 0, 0.22, 0.18, 0.36, null);
            birdGeo.box(0, 0.22, -0.16, 0.14, 0.14, 0.14, null); // Head
            birdGeo.box(0, 0.10, 0.24, 0.18, 0.04, 0.22, null); // Tail
            const bMesh = new THREE.Mesh(birdGeo.build(), pBodyMat);
            pGrp.add(bMesh);

            // Flapping Wing Planes (Left & Right)
            const wGeo = new THREE.Plane(0.35, 0.24);
            const wMeshL = new THREE.Mesh(wGeo, pWingMat);
            wMeshL.position.set(-0.20, 0.18, 0);
            wMeshL.rotation.y = Math.PI / 2;
            const wMeshR = new THREE.Mesh(wGeo, pWingMat);
            wMeshR.position.set(0.20, 0.18, 0);
            wMeshR.rotation.y = -Math.PI / 2;
            pGrp.add(wMeshL, wMeshR);

            const ox = (Math.random() - 0.5) * 2.8;
            const oz = (Math.random() - 0.5) * 2.8;
            pGrp.position.set(fCenterX + ox, 0.04, fCenterZ + oz);
            scene.add(pGrp);

            this.pigeons.push({
              grp: pGrp,
              wingL: wMeshL,
              wingR: wMeshR,
              baseX: fCenterX + ox,
              baseZ: fCenterZ + oz,
              flockId: f,
              state: 'pecking', // 'pecking', 'scattering', 'soaring'
              vy: 0,
              vx: 0,
              vz: 0,
              peckT: Math.random() * 5,
              scatterT: 0
            });
          }
        }

        // 2. Sidewalk Street Dogs (6 Dogs stationing along Dhaka sidewalks)
        const dogMat = new THREE.StandardMat({ color: 0x92400e, roughness: 0.85 });
        const dogEarMat = new THREE.BasicMat({ color: 0x78350f });

        for (let i = 0; i < 6; i++) {
          const dGrp = new THREE.Group();
          const dGeo = new THREE.ct();
          const sideX = (i % 2 === 0 ? -1 : 1) * 6.8;
          const dZ = - (80 + i * 160);

          // Stylized low-poly dog torso, head, and tail
          dGeo.box(0, 0.38, 0, 0.42, 0.44, 0.95, null);
          dGeo.box(0, 0.65, -0.42, 0.34, 0.36, 0.42, null); // Head & snout
          dGeo.box(0, 0.52, 0.48, 0.10, 0.35, 0.10, null);  // Upright tail
          // 4 Legs
          dGeo.box(-0.16, 0.16, -0.28, 0.10, 0.32, 0.10, null);
          dGeo.box(0.16, 0.16, -0.28, 0.10, 0.32, 0.10, null);
          dGeo.box(-0.16, 0.16, 0.28, 0.10, 0.32, 0.10, null);
          dGeo.box(0.16, 0.16, 0.28, 0.10, 0.32, 0.10, null);

          const dMesh = new THREE.Mesh(dGeo.build(), dogMat);
          dGrp.add(dMesh);
          dGrp.position.set(sideX, 0.02, dZ);
          scene.add(dGrp);

          this.dogs.push({
            grp: dGrp,
            baseX: sideX,
            baseZ: dZ,
            barkT: 0
          });
        }
      } catch (e) {
        console.warn('LivingCitySystem init error:', e);
      }
    },

    onHornBlast(p) {
      if (!p) return;
      const now = performance.now();

      // Trigger Pigeon Flock Panic
      let flutterTriggered = false;
      for (const pg of this.pigeons) {
        const dist = Math.hypot(p.x - pg.grp.position.x, p.z - pg.grp.position.z);
        if (dist < 42 && pg.state === 'pecking') {
          pg.state = 'scattering';
          pg.vy = 5.5 + Math.random() * 3.5;
          pg.vx = (pg.grp.position.x - p.x) * 1.8 + (Math.random() - 0.5) * 4.0;
          pg.vz = p.v * 0.5 - (3.5 + Math.random() * 4.0);
          flutterTriggered = true;
        }
      }
      if (flutterTriggered && now - this.lastFlutterT > 800) {
        this.lastFlutterT = now;
        DhakaAudioSFX.playPigeonFlutter();
      }

      // Trigger Sidewalk Street Dog Bark
      for (const dog of this.dogs) {
        const dist = Math.hypot(p.x - dog.grp.position.x, p.z - dog.grp.position.z);
        if (dist < 40 && now - dog.barkT > 3200) {
          dog.barkT = now;
          DhakaAudioSFX.playDogBark();
          dog.grp.rotation.y = (dog.grp.position.x > p.x) ? -Math.PI / 2 : Math.PI / 2;
          RoadMicroDetailsSystem.spawnMicroToast("🐕 ঘেউ ঘেউ!");
        }
      }
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p || !p.alive) return;

      const now = performance.now();

      // 1. Update Pigeons (Pecking, Scattering, Flying)
      for (const pg of this.pigeons) {
        const grp = pg.grp;

        // Auto-recycle pigeons if player drove past or moved far
        const relZ = grp.position.z - p.z;
        if (relZ > 40 || relZ < -550) {
          pg.state = 'pecking';
          pg.scatterT = 0;
          grp.position.y = 0.04;
          grp.position.z = p.z - 45 - Math.random() * 220;
          grp.position.x = (Math.random() - 0.5) * 8.5;
          pg.wingL.rotation.z = 0;
          pg.wingR.rotation.z = 0;
        }

        // Auto Panic trigger when player car approaches within 26m
        const dist = Math.hypot(p.x - grp.position.x, p.z - grp.position.z);
        if (dist < 26 && pg.state === 'pecking') {
          pg.state = 'scattering';
          pg.vy = 6.2 + Math.random() * 3.2;
          pg.vx = (grp.position.x - p.x) * 1.6 + (Math.random() - 0.5) * 3.5;
          pg.vz = p.v * 0.5 - (3.0 + Math.random() * 4.0);
          if (now - this.lastFlutterT > 600) {
            this.lastFlutterT = now;
            DhakaAudioSFX.playPigeonFlutter();
          }
        }

        if (pg.state === 'pecking') {
          // Subtle head bob & hops
          pg.peckT += dt * 5.0;
          grp.rotation.y = Math.sin(pg.peckT * 0.8) * 0.35;
          grp.position.y = 0.04 + Math.max(0, Math.sin(pg.peckT * 3.0) * 0.04);
        } else if (pg.state === 'scattering') {
          // Rapid wing flapping at 18 Hz
          pg.scatterT += dt;
          const flap = Math.sin(pg.scatterT * 38) * 0.82;
          pg.wingL.rotation.z = flap;
          pg.wingR.rotation.z = -flap;

          // Ascend and disperse radially
          grp.position.y += pg.vy * dt;
          grp.position.x += pg.vx * dt;
          grp.position.z += pg.vz * dt;
          pg.vy = Math.max(0.5, pg.vy - dt * 2.2);

          // Recycle ahead when passed
          if (grp.position.z > p.z + 30 || grp.position.y > 14.0) {
            pg.state = 'pecking';
            pg.scatterT = 0;
            grp.position.y = 0.04;
            grp.position.z = p.z - 80 - Math.random() * 160;
            grp.position.x = (Math.random() - 0.5) * 9;
            pg.wingL.rotation.z = 0;
            pg.wingR.rotation.z = 0;
          }
        }
      }

      // 2. Recycle Sidewalk Dogs along road
      for (const dog of this.dogs) {
        const relZ = dog.grp.position.z - p.z;
        if (relZ > 40 || relZ < -650) {
          dog.grp.position.z = p.z - 30 - Math.random() * 300;
        }
      }
    }
  };

  // ----------------------------------------------------
  // 26. Next-Gen Graphics & Visual Shaders
  // ----------------------------------------------------
  const NextGenGraphicsSystem = {
    initialized: false,
    speedBlurEl: null,
    groundDecalMesh: null,
    dustParticles: [],

    init(THREE, scene) {
      // Create Fullscreen Radial Speed Blur Overlay
      if (!this.speedBlurEl) {
        this.speedBlurEl = document.createElement('div');
        this.speedBlurEl.id = 'speedBlurOverlay';
        document.body.appendChild(this.speedBlurEl);
      }

      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        // Forward Volumetric Headlight Ground Illumination Decal
        const decCanvas = document.createElement('canvas');
        decCanvas.width = 128; decCanvas.height = 128;
        const dCtx = decCanvas.getContext('2d');
        const grad = dCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
        grad.addColorStop(0, 'rgba(255, 250, 220, 0.55)');
        grad.addColorStop(0.5, 'rgba(255, 240, 180, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        dCtx.fillStyle = grad;
        dCtx.fillRect(0, 0, 128, 128);

        const decTex = new THREE.Tex.glow.constructor(decCanvas);
        decTex.needsUpdate = true;
        const decGeo = new THREE.Plane(5.5, 14.0);
        decGeo.rotateX(-THREE.PI / 2);
        const decMat = new THREE.BasicMat({
          map: decTex,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        this.groundDecalMesh = new THREE.Mesh(decGeo, decMat);
        this.groundDecalMesh.position.set(0, 0.028, 0);
        this.groundDecalMesh.visible = false;
        scene.add(this.groundDecalMesh);

        // Volumetric Dust / Mist Motes catching the headlights
        const dGeo = new THREE.Plane(0.08, 0.08);
        const dMat = new THREE.BasicMat({
          color: 0xffffff,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending
        });

        for (let i = 0; i < 24; i++) {
          const dm = new THREE.Mesh(dGeo, dMat);
          dm.position.set((Math.random() - 0.5) * 4.0, 0.4 + Math.random() * 1.2, - (4.0 + Math.random() * 12.0));
          scene.add(dm);
          this.dustParticles.push({
            mesh: dm,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.2,
            relX: (Math.random() - 0.5) * 3.5,
            relY: 0.35 + Math.random() * 1.1,
            relZ: - (3.5 + Math.random() * 14.0)
          });
        }
      } catch (e) {
        console.warn('NextGenGraphicsSystem init error:', e);
      }
    },

    update(p, dt, inPlay, isNight, isRain) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized) return;

      const flyY = window.__flyoverElevation || 0;
      const speedKmh = p ? Math.abs(p.v) * 7.5 : 0;

      // 1. High-Speed Radial Motion Blur
      if (this.speedBlurEl) {
        if (inPlay && p && p.alive && (speedKmh > 70 || p.boost)) {
          const blurOpacity = p.boost ? 0.95 : Math.min(0.9, (speedKmh - 70) / 45);
          this.speedBlurEl.style.opacity = blurOpacity.toFixed(2);
          this.speedBlurEl.classList.toggle('nitro-streak', p.boost || speedKmh > 100);
        } else {
          this.speedBlurEl.style.opacity = '0';
          this.speedBlurEl.classList.remove('nitro-streak');
        }
      }

      // 2. Volumetric Headlight Ground Illumination Decal
      if (this.groundDecalMesh) {
        this.groundDecalMesh.visible = inPlay && p && p.alive && (isNight || isRain);
        if (this.groundDecalMesh.visible) {
          const forwardDist = 8.5;
          const gx = p.x - p.fx * forwardDist;
          const gz = p.z - p.fz * forwardDist;
          this.groundDecalMesh.position.set(gx, flyY + 0.028, gz);
          this.groundDecalMesh.rotation.y = p.yaw;
        }
      }

      // 3. Volumetric Headlight Dust / Mist Motes
      if (this.dustParticles.length > 0 && p) {
        const showDust = inPlay && p.alive && (isNight || isRain);
        for (const dp of this.dustParticles) {
          dp.mesh.visible = showDust;
          if (showDust) {
            const worldX = p.x - p.fx * Math.abs(dp.relZ) + p.rx * dp.relX;
            const worldZ = p.z - p.fz * Math.abs(dp.relZ) + p.rz * dp.relX;
            dp.mesh.position.set(worldX, flyY + dp.relY, worldZ);
            dp.relX += dp.vx * dt;
            dp.relY += dp.vy * dt;
            if (Math.abs(dp.relX) > 2.8) dp.vx *= -1;
            if (dp.relY < 0.2 || dp.relY > 1.8) dp.vy *= -1;
          }
        }
      }
    }
  };

  // ----------------------------------------------------
  // 27. Dhaka Roadside Posters, Banners & Wall Graffiti
  // (Mounted 100% on Footpaths at |X| = 10.8m with 18 Funny Dhaka Pop-Culture Posters)
  // ----------------------------------------------------
  const DhakaRoadsideBannersSystem = {
    initialized: false,
    bannersGroup: null,
    banners: [],
    cycleDist: 864,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.bannersGroup = new THREE.Group();

        // 18 Authentic, Hilarious Dhaka Posters & Street Banners
        const postersData = [
          { text: "🎬 তুফান ৪: শাকিব খানের তাণ্ডব!\nসারা বাংলায় সুনামি ধামাকা!", bg: "#450a0a", fg: "#fbbf24", border: "#dc2626" },
          { text: "💥 অনন্ত জলিল:\n'অসম্ভবকে সম্ভব করাই অনন্তর কাজ!'", bg: "#1e1b4b", fg: "#38bdf8", border: "#818cf8" },
          { text: "🎙️ হিরো আলম মেগা কনসার্ট!\nপুরান ঢাকা কাঁপাতে আসিছি!", bg: "#581c87", fg: "#fde047", border: "#c084fc" },
          { text: "☕ মামা টং স্টল: বাকির শর্ত\nবাকি চাহিয়া লজ্জা পাইবেন না!", bg: "#78350f", fg: "#fef08a", border: "#451a03" },
          { text: "📱 বিকাশ ও নগদ ক্যাশআউট\nরাত ১২টার পর জিএফকে ফ্লেক্সিলোড!", bg: "#831843", fg: "#fbcfe8", border: "#db2777" },
          { text: "🦷 ডেন্টিস্ট কদম আলী (এমবিবিএস ছাড়া)\nবিনা ব্যথায় হাত দিয়া দাঁত তোলা হয়!", bg: "#065f46", fg: "#a7f3d0", border: "#34d399" },
          { text: "🔮 কবিরাজ রতন খাঁ: প্রেমের ব্যর্থতা\nও জিন-পরী তাড়াতে ১০০% গ্যারান্টি!", bg: "#312e81", fg: "#facc15", border: "#a855f7" },
          { text: "👑 ব্রেক ছাড়া গাড়ি, লাইসেন্স ছাড়া বাড়ি\n— রাস্তার আসল রাজা!", bg: "#0f172a", fg: "#38bdf8", border: "#f59e0b" },
          { text: "🚌 লোকাল বাস ও লেগুনা:\nচাপেন চাপেন, ভেতরে আরো ১৬ সিট খালি!", bg: "#ea580c", fg: "#ffffff", border: "#fef08a" },
          { text: "🛺 সিএনজি ও অটো ডেকোরেশন:\nহর্ন দিয়া লাভ নাই, ড্রাইভার কানে কালা!", bg: "#14532d", fg: "#fef08a", border: "#22c55e" },
          { text: "⚠️ সাবধান! ময়লা ফেলা নিষেধ!\nফেললে কুত্তা দিয়া খাওয়ানো হইবে!", bg: "#fef08a", fg: "#dc2626", border: "#b91c1c" },
          { text: "🚦 মিরপুর ১০ জ্যাম:\nবসে থেকে লাভ নাই, হেটে যান দ্রুত পৌঁছাবেন!", bg: "#b91c1c", fg: "#ffffff", border: "#fef08a" },
          { text: "🍲 হাজী কাচ্চি ঘরাণা:\nআসল খাসির বিরিয়ানি — স্বাদ না পাইলে টাকা ফেরত!", bg: "#854d0e", fg: "#fef9c3", border: "#ca8a04" },
          { text: "✂️ নিউ ঢাকা ডিসকো সেলুন:\nহিরো আলম কাটিং ও শাকিব কাটিং দেওয়া হয়!", bg: "#1e3a8a", fg: "#93c5fd", border: "#3b82f6" },
          { text: "🚨 ওস্তাদ ডাইনে চাপেন,\nবামে ১০০ হাত গভীর খাদ!", bg: "#991b1b", fg: "#ffffff", border: "#facc15" },
          { text: "👑 মা-বাবার দোয়া স্পেশাল:\n১০ বছর ধইরা চলতাছে, ব্রেক একটু কম ধরে!", bg: "#111827", fg: "#4ade80", border: "#22c55e" },
          { text: "📶 ফ্রি হাইস্পিড ওয়াইফাই!\nতবে আগে ২ কাপ মালাই চা খাইতে হইব", bg: "#064e3b", fg: "#6ee7b7", border: "#10b981" },
          { text: "🏋️‍♂️ ভাই ভাই সিক্স-প্যাক জিম:\n৬ মাসে বডি না হইলে ডাবল টাকা ফেরত!", bg: "#701a75", fg: "#f472b6", border: "#ec4899" }
        ];

        const frameMat = new THREE.StandardMat({ color: 0x1e293b, roughness: 0.7 });

        postersData.forEach((item, idx) => {
          const cvs = document.createElement('canvas');
          cvs.width = 256; cvs.height = 128;
          const ctx = cvs.getContext('2d');

          ctx.fillStyle = item.bg;
          ctx.fillRect(0, 0, 256, 128);

          ctx.lineWidth = 6;
          ctx.strokeStyle = item.border;
          ctx.strokeRect(4, 4, 248, 120);

          ctx.fillStyle = item.fg;
          ctx.textAlign = 'center';

          const lines = item.text.split('\n');
          if (lines.length > 1) {
            ctx.font = 'bold 15px "Tiro Bangla", sans-serif';
            ctx.fillText(lines[0], 128, 48);
            ctx.font = 'bold 13px "Tiro Bangla", sans-serif';
            ctx.fillText(lines[1], 128, 86);
          } else {
            ctx.font = 'bold 15px "Tiro Bangla", sans-serif';
            ctx.fillText(item.text, 128, 68);
          }

          const tex = new THREE.Tex.glow.constructor(cvs);
          tex.needsUpdate = true;
          const bMat = new THREE.BasicMat({ map: tex });

          const bGroup = new THREE.Group();

          // Billboard frame & posts with footpath mounting base
          const boardGeo = new THREE.ct();
          // Main signboard backing and frame
          boardGeo.box(0, 3.2, 0, 3.8, 1.9, 0.14, null);
          boardGeo.box(0, 3.2, -0.08, 4.0, 2.1, 0.08, null);
          // Vertical support pillars
          boardGeo.box(-1.4, 1.6, 0, 0.16, 3.2, 0.16, null);
          boardGeo.box(1.4, 1.6, 0, 0.16, 3.2, 0.16, null);
          // Footpath mounting foundation concrete blocks
          boardGeo.box(-1.4, 0.15, 0, 0.5, 0.3, 0.5, null);
          boardGeo.box(1.4, 0.15, 0, 0.5, 0.3, 0.5, null);
          // Overhead spotlight fixture brackets
          boardGeo.box(-1.0, 4.25, 0.45, 0.1, 0.1, 0.8, null);
          boardGeo.box(1.0, 4.25, 0.45, 0.1, 0.1, 0.8, null);
          boardGeo.box(0, 4.25, 0.85, 2.2, 0.12, 0.15, null);

          const boardMesh = new THREE.Mesh(boardGeo.build(), frameMat);
          bGroup.add(boardMesh);

          const signGeo = new THREE.Plane(3.7, 1.8);
          const signMesh = new THREE.Mesh(signGeo, bMat);
          signMesh.position.set(0, 3.2, 0.08);
          bGroup.add(signMesh);

          // Position alternating left and right sidewalks (safely on footpaths at |X| = 10.8m)
          const side = (idx % 2 === 0) ? -10.8 : 10.8;
          const rotY = (idx % 2 === 0) ? 0.38 : -0.38;
          const zPos = - (30 + idx * 48);

          bGroup.position.set(side, 0, zPos);
          bGroup.rotation.y = rotY;

          this.bannersGroup.add(bGroup);
          this.banners.push({ grp: bGroup, baseZ: zPos, side });
        });

        scene.add(this.bannersGroup);
      } catch (err) {
        console.warn('DhakaRoadsideBannersSystem init error:', err);
      }
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p) return;

      const totalSpan = this.banners.length * 48; // 864m
      // Recycle banners smoothly along road
      for (const b of this.banners) {
        if (b.grp.position.z > p.z + 40) {
          b.grp.position.z -= totalSpan;
        } else if (b.grp.position.z < p.z - (totalSpan - 60)) {
          b.grp.position.z += totalSpan;
        }
      }
    }
  };

  // ----------------------------------------------------
  // 27B. Dhaka Expressway Graphics Upgrade System
  // (3D Curbs, Modern Streetlamps, Krishnachura & Palm Trees, Lane Markings & Cat's Eyes)
  // ----------------------------------------------------
  const DhakaExpresswayVisualsSystem = {
    initialized: false,
    group: null,
    chunks: [],
    numChunks: 12,
    chunkLen: 60, // 12 * 60 = 720m total loop
    streetLamps: [],
    lampDecals: [],

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.group = new THREE.Group();

        // 1. High-Performance Materials
        const curbYellowMat = new THREE.StandardMat({ color: 0xfacc15, roughness: 0.55 });
        const curbDarkMat   = new THREE.StandardMat({ color: 0x1e293b, roughness: 0.75 });
        const pavementMat   = new THREE.StandardMat({ color: 0x94a3b8, roughness: 0.88 });
        const tactileMat    = new THREE.StandardMat({ color: 0xd97706, roughness: 0.65 });
        const steelMat      = new THREE.StandardMat({ color: 0x64748b, metalness: 0.5, roughness: 0.45 });
        const luminaireMat  = new THREE.StandardMat({ color: 0x334155, roughness: 0.5 });
        const lampGlowMat   = new THREE.BasicMat({ color: 0xfffbeb });
        const barkMat       = new THREE.StandardMat({ color: 0x57534e, roughness: 0.9 });
        const greenMat      = new THREE.StandardMat({ color: 0x15803d, roughness: 0.85 });
        const redFlowerMat  = new THREE.StandardMat({ color: 0xdc2626, roughness: 0.7 });
        const orangeFlwMat  = new THREE.StandardMat({ color: 0xea580c, roughness: 0.7 });
        const yellowLineMat = new THREE.BasicMat({ color: 0xffd400 });
        const whiteLineMat  = new THREE.BasicMat({ color: 0xf8fafc });
        const catsEyeAmber  = new THREE.BasicMat({ color: 0xf59e0b });
        const catsEyeWhite  = new THREE.BasicMat({ color: 0xffffff });

        // Lamppost ground pool illumination decal texture
        const lampCvs = document.createElement('canvas');
        lampCvs.width = 128; lampCvs.height = 128;
        const lCtx = lampCvs.getContext('2d');
        const lGrad = lCtx.createRadialGradient(64, 64, 6, 64, 64, 58);
        lGrad.addColorStop(0, 'rgba(255, 245, 200, 0.48)');
        lGrad.addColorStop(0.4, 'rgba(255, 230, 160, 0.22)');
        lGrad.addColorStop(0.8, 'rgba(255, 210, 120, 0.08)');
        lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        lCtx.fillStyle = lGrad;
        lCtx.fillRect(0, 0, 128, 128);

        const lampDecalTex = new THREE.Tex.glow.constructor(lampCvs);
        lampDecalTex.needsUpdate = true;
        const lampDecalMat = new THREE.BasicMat({
          map: lampDecalTex,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        // 2. Build 12 Modular Repeating Chunks
        for (let c = 0; c < this.numChunks; c++) {
          const chunkGroup = new THREE.Group();
          const chunkZ = - c * this.chunkLen;

          // A. 3D Segmented Curbs (Alternating safety yellow and dark slate blocks along |X| = 7.45m)
          const curbYGeo = new THREE.ct();
          const curbDGeo = new THREE.ct();
          const blockLen = 2.0;
          const numBlocks = Math.floor(this.chunkLen / blockLen); // 30 blocks

          for (let b = 0; b < numBlocks; b++) {
            const bz = - (b * blockLen + blockLen * 0.5);
            const targetGeo = (b % 2 === 0) ? curbYGeo : curbDGeo;
            // Left Curb (X = -7.45m)
            targetGeo.box(-7.45, 0.11, bz, 0.35, 0.22, blockLen - 0.04, null);
            // Right Curb (X = +7.45m)
            targetGeo.box(7.45, 0.11, bz, 0.35, 0.22, blockLen - 0.04, null);
          }
          chunkGroup.add(new THREE.Mesh(curbYGeo.build(), curbYellowMat));
          chunkGroup.add(new THREE.Mesh(curbDGeo.build(), curbDarkMat));

          // B. Raised Footpath Pavements (Left & Right sidewalks)
          const paveGeo = new THREE.ct();
          // Left Footpath Slab (|X|: 7.6m to 12.4m, width 4.8m)
          paveGeo.box(-10.0, 0.09, - this.chunkLen * 0.5, 4.8, 0.18, this.chunkLen, null);
          // Right Footpath Slab (|X|: 7.6m to 12.4m, width 4.8m)
          paveGeo.box(10.0, 0.09, - this.chunkLen * 0.5, 4.8, 0.18, this.chunkLen, null);
          chunkGroup.add(new THREE.Mesh(paveGeo.build(), pavementMat));

          // Tactile guidance warning paver strip down sidewalk center
          const tactileGeo = new THREE.ct();
          tactileGeo.box(-10.0, 0.19, - this.chunkLen * 0.5, 0.45, 0.02, this.chunkLen, null);
          tactileGeo.box(10.0, 0.19, - this.chunkLen * 0.5, 0.45, 0.02, this.chunkLen, null);
          chunkGroup.add(new THREE.Mesh(tactileGeo.build(), tactileMat));

          // C. Expressway Centerline Double Yellow Lines
          const yLineGeo = new THREE.ct();
          yLineGeo.box(-0.12, 0.022, - this.chunkLen * 0.5, 0.12, 0.005, this.chunkLen, null);
          yLineGeo.box(0.12, 0.022, - this.chunkLen * 0.5, 0.12, 0.005, this.chunkLen, null);
          chunkGroup.add(new THREE.Mesh(yLineGeo.build(), yellowLineMat));

          // D. White Lane Divider Dashes and Outer Fog Lines
          const wLineGeo = new THREE.ct();
          // Solid outer edge fog lines
          wLineGeo.box(-7.2, 0.022, - this.chunkLen * 0.5, 0.14, 0.005, this.chunkLen, null);
          wLineGeo.box(7.2, 0.022, - this.chunkLen * 0.5, 0.14, 0.005, this.chunkLen, null);
          // Dashed white lane dividers (4m dash, 4m gap)
          for (let lz = 2; lz < this.chunkLen; lz += 8) {
            wLineGeo.box(-3.7, 0.022, - lz, 0.14, 0.005, 4.0, null);
            wLineGeo.box(3.7, 0.022, - lz, 0.14, 0.005, 4.0, null);
          }
          chunkGroup.add(new THREE.Mesh(wLineGeo.build(), whiteLineMat));

          // E. 3D Cat's Eye Road Stud Reflectors (ক্যাটস আই)
          const ceAmbGeo = new THREE.ct();
          const ceWhtGeo = new THREE.ct();
          for (let cz = 5; cz < this.chunkLen; cz += 10) {
            ceAmbGeo.box(0, 0.035, - cz, 0.15, 0.04, 0.15, null);
            ceWhtGeo.box(-7.2, 0.035, - cz, 0.12, 0.04, 0.12, null);
            ceWhtGeo.box(7.2, 0.035, - cz, 0.12, 0.04, 0.12, null);
          }
          chunkGroup.add(new THREE.Mesh(ceAmbGeo.build(), catsEyeAmber));
          chunkGroup.add(new THREE.Mesh(ceWhtGeo.build(), catsEyeWhite));

          // F. Modern Arched Expressway Streetlamps (Left & Right at Z = -15m)
          const lampGeo = new THREE.ct();
          const lumGeo = new THREE.ct();
          const glowGeo = new THREE.ct();

          [-1, 1].forEach(sideMult => {
            const lx = sideMult * 8.9;
            const lz = -15;

            // Concrete base footing on sidewalk
            lampGeo.box(lx, 0.25, lz, 0.55, 0.5, 0.55, null);
            // Vertical steel post
            lampGeo.box(lx, 4.0, lz, 0.18, 7.5, 0.18, null);
            // Arched curved arm extending over road shoulder
            const armLen = 2.7;
            const armX = lx - sideMult * (armLen * 0.5);
            lampGeo.box(armX, 7.6, lz, armLen, 0.14, 0.14, null);
            lampGeo.box(lx - sideMult * (armLen * 0.85), 7.4, lz, 0.14, 0.45, 0.14, null);

            // Aerodynamic luminaire head
            const headX = lx - sideMult * armLen;
            lumGeo.box(headX, 7.45, lz, 0.7, 0.2, 0.35, null);
            // Glowing LED lens face
            glowGeo.box(headX, 7.34, lz, 0.58, 0.04, 0.28, null);

            // Ground light pool decal on asphalt
            const decPlane = new THREE.Plane(7.0, 7.0);
            decPlane.rotateX(-THREE.PI / 2);
            const decMesh = new THREE.Mesh(decPlane, lampDecalMat);
            decMesh.position.set(headX, 0.024, lz);
            chunkGroup.add(decMesh);
            this.lampDecals.push(decMesh);
          });

          chunkGroup.add(new THREE.Mesh(lampGeo.build(), steelMat));
          chunkGroup.add(new THREE.Mesh(lumGeo.build(), luminaireMat));
          const glowMesh = new THREE.Mesh(glowGeo.build(), lampGlowMat);
          chunkGroup.add(glowMesh);
          this.streetLamps.push(glowMesh);

          // G. Roadside Lush Krishnachura & Palm Trees (Stationed at |X| = 11.6m on outer sidewalk)
          const treeTrunkGeo = new THREE.ct();
          const treeCrownGeo = new THREE.ct();
          const treeRedGeo   = new THREE.ct();
          const treeOrgGeo   = new THREE.ct();

          // Left Tree at Z = -35m (Krishnachura)
          const kx = -11.6, kz = -35;
          // Trunk & spreading branches
          treeTrunkGeo.box(kx, 2.4, kz, 0.45, 4.8, 0.45, null);
          treeTrunkGeo.box(kx + 0.5, 4.5, kz - 0.4, 0.25, 2.0, 0.25, null);
          treeTrunkGeo.box(kx - 0.5, 4.3, kz + 0.4, 0.25, 2.0, 0.25, null);
          // Green monsoon canopy layers
          treeCrownGeo.box(kx, 5.5, kz, 4.4, 1.8, 4.4, null);
          treeCrownGeo.box(kx + 0.4, 6.4, kz - 0.3, 3.6, 1.6, 3.6, null);
          // Krishnachura fiery red flower clusters
          treeRedGeo.box(kx - 0.6, 5.8, kz + 0.5, 2.6, 1.4, 2.6, null);
          treeRedGeo.box(kx + 0.8, 6.2, kz - 0.5, 2.4, 1.3, 2.4, null);
          // Orange flower accents
          treeOrgGeo.box(kx + 0.2, 6.7, kz + 0.2, 2.0, 1.0, 2.0, null);

          // Right Tree at Z = -42m (Tropical Dhaka Palm Tree)
          const px = 11.6, pz = -42;
          // Ringed palm trunk
          treeTrunkGeo.box(px, 3.5, pz, 0.35, 7.0, 0.35, null);
          // Radiating fan palm fronds
          treeCrownGeo.box(px, 7.2, pz, 3.8, 0.3, 1.4, null);
          treeCrownGeo.box(px, 7.2, pz, 1.4, 0.3, 3.8, null);
          treeCrownGeo.box(px, 7.0, pz, 3.2, 0.4, 3.2, null);

          chunkGroup.add(new THREE.Mesh(treeTrunkGeo.build(), barkMat));
          chunkGroup.add(new THREE.Mesh(treeCrownGeo.build(), greenMat));
          chunkGroup.add(new THREE.Mesh(treeRedGeo.build(), redFlowerMat));
          chunkGroup.add(new THREE.Mesh(treeOrgGeo.build(), orangeFlwMat));

          chunkGroup.position.set(0, 0, chunkZ);
          this.group.add(chunkGroup);
          this.chunks.push(chunkGroup);
        }

        scene.add(this.group);
      } catch (err) {
        console.warn('DhakaExpresswayVisualsSystem init error:', err);
      }
    },

    update(p, dt, inPlay, isNight, isRain) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p) return;

      const totalSpan = this.numChunks * this.chunkLen; // 720m

      // Seamlessly recycle chunks around player along Z
      for (const chunk of this.chunks) {
        if (chunk.position.z > p.z + 60) {
          chunk.position.z -= totalSpan;
        } else if (chunk.position.z < p.z - (totalSpan - 60)) {
          chunk.position.z += totalSpan;
        }
      }

      // Boost streetlight glow and ground pools at Night & Rain
      const lampIntensity = (isNight || isRain) ? 0.95 : 0.35;
      for (const decal of this.lampDecals) {
        decal.material.opacity = lampIntensity;
      }
    }
  };

  // ----------------------------------------------------
  // 28. Dhaka Street Humor & Funny Dialogues System
  // ----------------------------------------------------
  const DhakaStreetHumorSystem = {
    initialized: false,
    boxEl: null,
    textEl: null,
    hideTimer: null,
    lastSayT: 0,
    lastSpeedToastT: 0,

    init() {
      if (this.initialized) return;
      this.initialized = true;

      const el = document.createElement('div');
      el.id = 'dhakaHumorBox';
      el.className = 'dhaka-humor-box';
      el.innerHTML = `
        <div class="dhaka-humor-tail"></div>
        <div class="dhaka-humor-content" id="dhakaHumorText"></div>
      `;
      document.body.appendChild(el);
      this.boxEl = el;
      this.textEl = document.getElementById('dhakaHumorText');
    },

    say(msg, category = 'normal') {
      if (!this.initialized) this.init();
      const now = performance.now();
      if (now - this.lastSayT < 1800 && category !== 'important') return;
      this.lastSayT = now;

      if (this.textEl && this.boxEl) {
        this.textEl.textContent = msg;
        this.boxEl.classList.remove('active', 'horn', 'warning', 'speed');
        void this.boxEl.offsetWidth; // trigger CSS animation reflow
        this.boxEl.classList.add('active');
        if (category && category !== 'normal') this.boxEl.classList.add(category);

        if (DhakaAudioSFX.playDialoguePop) DhakaAudioSFX.playDialoguePop();

        if (this.hideTimer) clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
          if (this.boxEl) this.boxEl.classList.remove('active');
        }, 2600);
      }
    },

    sayRandom(list, category) {
      if (!list || list.length === 0) return;
      const idx = Math.floor(Math.random() * list.length);
      this.say(list[idx], category);
    },

    hornDialogues: [
      "📢 এই মামা দেইখা চালান! বাপের রাস্তা পাইসেন নাকি?!",
      "📢 আরে ওস্তাদ, ডাইনে ইন্ডিকেটর দিয়া বামে কাটেন ক্যান?!",
      "📢 হর্ন কম বাজান মামা, কানের পর্দা ফাইটা যাইতাছে!",
      "📢 রাস্তার রাজা হইসো তো কি হইসে, সামনে ট্রাফিক সার্জেন্ট খাড়ায়া!",
      "📢 বিকাশ পরিবহনের লগে হর্নের পাল্লা দিতে আইসো না!"
    ],

    nearMissDialogues: [
      "🏎️ উফফ! একটুর লাইগা বাঁচলি রে ভাই, নাইলে সোজা ঢাকা মেডিকেল!",
      "🏎️ চাচা, দুইশো টাকা জরিমানা দেন, নাইলে গাড়ি সোজা ডাম্পিং!",
      "🏎️ বিকাশ পরিবহনের লগে ওভারটেক?! কলিজা তো লোহার তৈরি!",
      "🏎️ ধুর মিয়া, লেগুনার পেছনে কি হানিমুনে যাইতেছেন?!",
      "🏎️ আরে ভাই, রিকশা কি আকাশে উড়ায়া দিবেন নাকি?!"
    ],

    brokenRoadDialogues: [
      "⚠️ ওরে বাবারে! হাড্ডি-গুড্ডি সব ভাইঙ্গা গেলো এই ভাঙা রাস্তায়!",
      "⚠️ খানাখন্দ দেইখা চালান ওস্তাদ, চাকা কিন্তু ড্রেনে ঢুকব!",
      "⚠️ রাস্তার যে অবস্থা, গাড়ির নাট-বোল্ট সব খুইলা পইড়া যাইব!",
      "⚠️ খোয়া আর লাল ইট! গাড়ি তো মনে হয় না আস্ত বাসায় যাইব!"
    ],

    nitroDialogues: [
      "🚀 স্পিড ১২০ কিমি! পাইলট সাব, বিমান কি টেক-অফ করব?!",
      "🚀 ধোঁয়া উড়ায়া দিলা মামা! ঢাকার রাস্তায় নতুন ডন!",
      "🚀 বাপরে বাপ! রকেট গতিতে ছুটতাছে!"
    ],

    flyoverDialogues: [
      "🌉 মেয়র হানিফ ফ্লাইওভারে উঠছি! ঢাকার জ্যাম সব নিচে পইড়া রইল!",
      "🌉 ফ্লাইওভার দিয়া টানেন ওস্তাদ! সোজা সাই সাই কইরা যান!"
    ],

    update(p, dt, inPlay) {
      if (!inPlay || !p || !p.alive) return;
      const now = performance.now();
      const speedKmh = Math.abs(p.v || 0) * 7.5;

      // High-speed nitro dialogue
      if (speedKmh > 115 && p.boost && now - this.lastSpeedToastT > 12000) {
        this.lastSpeedToastT = now;
        this.sayRandom(this.nitroDialogues, 'speed');
      }
    }
  };

  // ----------------------------------------------------
  // 29. Monsoon Waterlogging & Spray System (বর্ষার জলাবদ্ধতা ও স্প্রে)
  // ----------------------------------------------------
  const MonsoonWaterloggingSystem = {
    initialized: false,
    group: null,
    puddles: [],
    cycleDist: 1800,
    puddleLength: 200,
    dropsCanvas: null,
    dropsCtx: null,
    drops: [],
    wiperAngle: -0.7,
    wiperActive: false,
    wiperDir: 1,
    lastSplashT: 0,
    lastWiperT: 0,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.group = new THREE.Group();

        // High realism dark water material with reflective sheen
        const waterMat = new THREE.StandardMat({
          color: 0x0f2742,
          roughness: 0.08,
          metalness: 0.65
        });

        // Curb water froth / mud edge material
        const foamMat = new THREE.StandardMat({
          color: 0x64748b,
          roughness: 0.6
        });

        // Create 2 waterlogged sections per cycle (at Z = -500m and Z = -1400m)
        const offsets = [-500, -1400];
        offsets.forEach((zOffset, idx) => {
          const puddleGrp = new THREE.Group();
          puddleGrp.position.set(0, 0.02, zOffset);

          // Water surface plane (14.2m road width, 200m length)
          const pGeo = new THREE.ct();
          pGeo.box(0, 0, 0, 14.2, 0.03, this.puddleLength, null);
          // Foam / muddy splash borders along roadside curbs
          pGeo.box(-7.0, 0.02, 0, 0.8, 0.04, this.puddleLength, null);
          pGeo.box(7.0, 0.02, 0, 0.8, 0.04, this.puddleLength, null);

          puddleGrp.add(new THREE.Mesh(pGeo.build(), waterMat));

          this.group.add(puddleGrp);
          this.puddles.push({
            id: 'puddle_' + idx,
            baseZ: zOffset,
            group: puddleGrp
          });
        });

        scene.add(this.group);
      } catch (e) {
        console.warn('MonsoonWaterloggingSystem init error:', e);
      }

      this.initScreenWiper();
    },

    initScreenWiper() {
      if (document.getElementById('lensDropsCanvas')) return;
      const cv = document.createElement('canvas');
      cv.id = 'lensDropsCanvas';
      cv.className = 'lens-drops-canvas';
      cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:78;';
      document.body.appendChild(cv);
      this.dropsCanvas = cv;
      this.dropsCtx = cv.getContext('2d');

      const onResize = () => {
        if (this.dropsCanvas) {
          this.dropsCanvas.width = window.innerWidth;
          this.dropsCanvas.height = window.innerHeight;
        }
      };
      window.addEventListener('resize', onResize);
      onResize();
    },

    addScreenDrop() {
      if (!this.dropsCanvas || this.drops.length > 45) return;
      const w = this.dropsCanvas.width;
      const h = this.dropsCanvas.height;
      this.drops.push({
        x: Math.random() * w,
        y: Math.random() * (h * 0.85),
        r: 3 + Math.random() * 8,
        alpha: 0.65 + Math.random() * 0.25,
        speed: 0.2 + Math.random() * 0.5
      });
    },

    triggerWiper() {
      if (this.wiperActive) return;
      this.wiperActive = true;
      this.wiperAngle = -0.7;
      this.wiperDir = 1;
      if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playWiperSweep === 'function') {
        window.RastarRaja.DhakaAudioSFX.playWiperSweep();
      }
    },

    update(p, dt, inPlay, isRain) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized) return;

      const now = performance.now();
      let inWater = false;

      if (inPlay && p) {
        // Recycle puddles around player
        for (const pud of this.puddles) {
          while (pud.group.position.z > p.z + 150) {
            pud.group.position.z -= this.cycleDist;
          }
          while (pud.group.position.z < p.z - (this.cycleDist - 150)) {
            pud.group.position.z += this.cycleDist;
          }

          // Check if player is driving through this puddle
          const dz = Math.abs(p.z - pud.group.position.z);
          if (dz < (this.puddleLength * 0.5)) {
            inWater = true;
          }
        }

        // Apply water resistance drag and spray physics
        if (inWater && p.alive) {
          // Dynamic water drag
          p.v *= (1.0 - 0.08 * dt);

          // Periodic splash sound
          if (now - this.lastSplashT > 550 && Math.abs(p.v) > 3.0) {
            this.lastSplashT = now;
            if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playWaterSplash === 'function') {
              window.RastarRaja.DhakaAudioSFX.playWaterSplash();
            }
            // Screen splash droplets
            for (let i = 0; i < 4; i++) this.addScreenDrop();
          }

          // Trigger wiper if screen has droplets
          if (this.drops.length >= 8 && now - this.lastWiperT > 2500) {
            this.lastWiperT = now;
            this.triggerWiper();
          }

          // Tire spray sparks/mist
          if (at.FX && typeof at.FX.sparks === 'function' && Math.random() < 0.35) {
            at.FX.sparks(p.x - 0.7, 0.05, p.z + 0.8, 3);
            at.FX.sparks(p.x + 0.7, 0.05, p.z + 0.8, 3);
          }
        }

        // When rain toggle is on, also add occasional droplets
        if (isRain && Math.random() < 0.15) {
          this.addScreenDrop();
          if (this.drops.length >= 14 && now - this.lastWiperT > 2200) {
            this.lastWiperT = now;
            this.triggerWiper();
          }
        }
      }

      // Render Screen Droplets and Wiper Animation
      if (this.dropsCtx && this.dropsCanvas) {
        const ctx = this.dropsCtx;
        const w = this.dropsCanvas.width;
        const h = this.dropsCanvas.height;
        ctx.clearRect(0, 0, w, h);

        // Update & draw droplets
        for (let i = this.drops.length - 1; i >= 0; i--) {
          const d = this.drops[i];
          d.y += d.speed;
          d.alpha -= 0.002;

          ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();

          // Droplet highlight
          ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha * 0.85})`;
          ctx.beginPath();
          ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.3, 0, Math.PI * 2);
          ctx.fill();

          if (d.alpha <= 0 || d.y > h) {
            this.drops.splice(i, 1);
          }
        }

        // Wiper Blade Animation
        if (this.wiperActive) {
          this.wiperAngle += this.wiperDir * dt * 3.8;
          if (this.wiperAngle > 0.7) {
            this.wiperDir = -1;
            if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playWiperSweep === 'function') {
              window.RastarRaja.DhakaAudioSFX.playWiperSweep();
            }
          } else if (this.wiperAngle < -0.7 && this.wiperDir === -1) {
            this.wiperActive = false;
            this.wiperAngle = -0.7;
            this.drops = []; // Clean screen!
          }

          // Draw wiper arm and rubber blade
          const pivotX = w * 0.5;
          const pivotY = h + 10;
          const bladeLen = Math.max(w, h) * 0.95;

          ctx.save();
          ctx.translate(pivotX, pivotY);
          ctx.rotate(this.wiperAngle);

          // Wiper steel arm
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -bladeLen);
          ctx.stroke();

          // Rubber squeegee blade
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 16;
          ctx.beginPath();
          ctx.moveTo(-4, -bladeLen * 0.3);
          ctx.lineTo(-4, -bladeLen);
          ctx.stroke();

          ctx.restore();
        }
      }
    }
  };

  // ----------------------------------------------------
  // 30. Active Railway Level Crossing & BR Train System (সক্রিয় রেলগেট ও বাংলাদেশ রেলওয়ে ট্রেন)
  // ----------------------------------------------------
  const RailwayLevelCrossingSystem = {
    initialized: false,
    group: null,
    crossingZ: -1600,
    cycleDist: 3200,
    barrierLeft: null,
    barrierRight: null,
    trainGroup: null,
    trainX: 120, // Moves from +120 to -120 across road
    trainSpeed: 45, // m/s
    state: 'OPEN', // OPEN, CLOSING, TRAIN_CROSSING, OPENING
    stateTimer: 0,
    lastBellT: 0,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.group = new THREE.Group();
        this.group.position.set(0, 0, this.crossingZ);

        // Materials
        const steelRailMat = new THREE.StandardMat({ color: 0x94a3b8, roughness: 0.35, metalness: 0.9 });
        const sleeperWoodMat = new THREE.StandardMat({ color: 0x3e2723, roughness: 0.95 });
        const ballastStoneMat = new THREE.StandardMat({ color: 0x475569, roughness: 0.98 });
        const barrierPostMat = new THREE.StandardMat({ color: 0x1e293b, roughness: 0.7 });
        const hazardStripeMat = new THREE.BasicMat({ color: 0xdc2626 });
        const whiteStripeMat = new THREE.BasicMat({ color: 0xffffff });

        // 1. Crushed Stone Ballast Bed across road
        const ballastGeo = new THREE.ct();
        ballastGeo.box(0, 0.015, 0, 48, 0.04, 5.5, null);
        this.group.add(new THREE.Mesh(ballastGeo.build(), ballastStoneMat));

        // 2. Wooden Sleepers (Ties) spaced along tracks
        const tiesGeo = new THREE.ct();
        for (let x = -23; x <= 23; x += 1.3) {
          tiesGeo.box(x, 0.025, 0, 0.45, 0.05, 4.2, null);
        }
        this.group.add(new THREE.Mesh(tiesGeo.build(), sleeperWoodMat));

        // 3. Steel Rails (Double Track)
        const railsGeo = new THREE.ct();
        railsGeo.box(0, 0.05, -1.2, 48, 0.06, 0.12, null);
        railsGeo.box(0, 0.05, 0.3, 48, 0.06, 0.12, null);
        railsGeo.box(0, 0.05, 1.2, 48, 0.06, 0.12, null);
        railsGeo.box(0, 0.05, 2.7, 48, 0.06, 0.12, null);
        this.group.add(new THREE.Mesh(railsGeo.build(), steelRailMat));

        // 4. Boom Barrier Gates (Left & Right)
        const makeGateAssembly = (posX, isLeft) => {
          const gateGrp = new THREE.Group();
          gateGrp.position.set(posX, 0, isLeft ? -4.2 : 4.2);

          // Vertical gate post
          const postGeo = new THREE.ct();
          postGeo.box(0, 1.6, 0, 0.6, 3.2, 0.6, null);
          postGeo.box(0, 0.25, 0, 1.1, 0.5, 1.1, null);
          gateGrp.add(new THREE.Mesh(postGeo.build(), barrierPostMat));

          // Moving Boom Barrier Arm (Pivot at Y = 1.8)
          const armPivot = new THREE.Group();
          armPivot.position.set(0, 1.8, 0);

          const dir = isLeft ? 1 : -1;
          for (let s = 0; s < 7; s++) {
            const mat = (s % 2 === 0) ? hazardStripeMat : whiteStripeMat;
            const segGeo = new THREE.ct();
            segGeo.box((s * 1.2 + 0.6) * dir, 0, 0, 1.2, 0.22, 0.14, null);
            armPivot.add(new THREE.Mesh(segGeo.build(), mat));
          }

          gateGrp.add(armPivot);
          return { gateGrp, armPivot };
        };

        const leftGate = makeGateAssembly(-8.2, true);
        const rightGate = makeGateAssembly(8.2, false);
        this.barrierLeft = leftGate.armPivot;
        this.barrierRight = rightGate.armPivot;
        this.group.add(leftGate.gateGrp);
        this.group.add(rightGate.gateGrp);

        // 5. Bangladesh Railway Locomotive & Passenger Coaches
        this.trainGroup = new THREE.Group();
        this.trainGroup.position.set(this.trainX, 0, 0);

        const trainGreenMat = new THREE.StandardMat({ color: 0x006a4e, roughness: 0.45, metalness: 0.35 });
        const trainRedMat = new THREE.BasicMat({ color: 0xdc2626 });
        const trainGoldMat = new THREE.BasicMat({ color: 0xffcb1f });
        const trainWindowMat = new THREE.BasicMat({ color: 0xfef08a });

        // Locomotive Body
        const locoGeo = new THREE.ct();
        locoGeo.box(0, 2.2, 0, 18, 3.2, 3.3, null);
        locoGeo.box(-8.5, 2.1, 0, 1.2, 2.4, 3.2, null); // Cab nose
        locoGeo.box(-8.9, 0.5, 0, 0.6, 0.8, 3.4, null); // Cowcatcher
        locoGeo.box(0, 3.9, 0, 14, 0.4, 3.1, null);    // Roof
        this.trainGroup.add(new THREE.Mesh(locoGeo.build(), trainGreenMat));

        // Red & Yellow Stripes on Locomotive
        const stripeGeo = new THREE.ct();
        stripeGeo.box(0, 1.8, 1.68, 18.2, 0.35, 0.05, null);
        stripeGeo.box(0, 1.8, -1.68, 18.2, 0.35, 0.05, null);
        this.trainGroup.add(new THREE.Mesh(stripeGeo.build(), trainRedMat));

        const goldGeo = new THREE.ct();
        goldGeo.box(0, 2.3, 1.68, 18.2, 0.2, 0.05, null);
        goldGeo.box(0, 2.3, -1.68, 18.2, 0.2, 0.05, null);
        goldGeo.box(-9.0, 1.8, 0, 0.05, 0.8, 2.4, null);
        this.trainGroup.add(new THREE.Mesh(goldGeo.build(), trainGoldMat));

        // Dual Headlights
        const headGeo = new THREE.ct();
        headGeo.box(-9.1, 2.4, -0.7, 0.2, 0.45, 0.45, null);
        headGeo.box(-9.1, 2.4, 0.7, 0.2, 0.45, 0.45, null);
        this.trainGroup.add(new THREE.Mesh(headGeo.build(), new THREE.BasicMat({ color: 0xffffff })));

        // Passenger Coaches
        [22, 42].forEach(offset => {
          const coachGeo = new THREE.ct();
          coachGeo.box(offset, 2.2, 0, 18, 3.1, 3.2, null);
          this.trainGroup.add(new THREE.Mesh(coachGeo.build(), trainGreenMat));

          const cStripeGeo = new THREE.ct();
          cStripeGeo.box(offset, 1.8, 1.63, 18.2, 0.4, 0.05, null);
          cStripeGeo.box(offset, 1.8, -1.63, 18.2, 0.4, 0.05, null);
          this.trainGroup.add(new THREE.Mesh(cStripeGeo.build(), trainRedMat));

          // Lit windows along coach
          const winGeo = new THREE.ct();
          for (let wx = offset - 7; wx <= offset + 7; wx += 2.4) {
            winGeo.box(wx, 2.4, 1.64, 1.4, 0.8, 0.05, null);
            winGeo.box(wx, 2.4, -1.64, 1.4, 0.8, 0.05, null);
          }
          this.trainGroup.add(new THREE.Mesh(winGeo.build(), trainWindowMat));
        });

        this.group.add(this.trainGroup);
        scene.add(this.group);
      } catch (e) {
        console.warn('RailwayLevelCrossingSystem init error:', e);
      }
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p) return;

      const now = performance.now();

      // Recycle Level Crossing with player along road
      while (this.group.position.z > p.z + 180) {
        this.group.position.z -= this.cycleDist;
        this.resetCrossing();
      }
      while (this.group.position.z < p.z - (this.cycleDist - 180)) {
        this.group.position.z += this.cycleDist;
        this.resetCrossing();
      }

      const distToCrossing = Math.abs(p.z - this.group.position.z);
      const isApproaching = (p.z > this.group.position.z) && (p.z - this.group.position.z < 160);

      // Level Crossing State Machine
      if (this.state === 'OPEN') {
        if (this.barrierLeft) this.barrierLeft.rotation.z = Math.PI * 0.45;
        if (this.barrierRight) this.barrierRight.rotation.z = -Math.PI * 0.45;

        if (isApproaching && distToCrossing < 145) {
          this.state = 'CLOSING';
          this.stateTimer = 0;
          RoadMicroDetailsSystem.spawnMicroToast("🚂 সাবধান! বাংলাদেশ রেলওয়ে এক্সপ্রেস আসছে! গেট নামছে!");
        }
      } else if (this.state === 'CLOSING') {
        this.stateTimer += dt;
        const prog = Math.min(1.0, this.stateTimer / 2.0);
        if (this.barrierLeft) this.barrierLeft.rotation.z = (Math.PI * 0.45) * (1.0 - prog);
        if (this.barrierRight) this.barrierRight.rotation.z = (-Math.PI * 0.45) * (1.0 - prog);

        if (now - this.lastBellT > 380) {
          this.lastBellT = now;
          if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playTrainGateBell === 'function') {
            window.RastarRaja.DhakaAudioSFX.playTrainGateBell();
          }
        }

        if (this.stateTimer >= 2.0) {
          this.state = 'TRAIN_CROSSING';
          this.stateTimer = 0;
          this.trainX = 110;
          if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playTrainHorn === 'function') {
            window.RastarRaja.DhakaAudioSFX.playTrainHorn();
          }
        }
      } else if (this.state === 'TRAIN_CROSSING') {
        this.stateTimer += dt;
        this.trainX -= this.trainSpeed * dt;
        if (this.trainGroup) this.trainGroup.position.x = this.trainX;

        if (now - this.lastBellT > 380) {
          this.lastBellT = now;
          if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playTrainGateBell === 'function') {
            window.RastarRaja.DhakaAudioSFX.playTrainGateBell();
          }
        }

        // Severe Train Collision if player drives onto tracks while train crosses!
        if (distToCrossing < 4.0 && Math.abs(p.x - this.trainX) < 18.0) {
          if (at.G && typeof at.G.smash === 'function') {
            at.G.smash(25000);
          }
          p.v = -8.0;
          RoadMicroDetailsSystem.spawnMicroToast("💥 ট্রেনের সাথে পাঙ্গা লইছেন?! রিকশা দিয়া রেলরে ধাক্কা?!");
        }

        if (this.trainX < -110 || this.stateTimer > 5.5) {
          this.state = 'OPENING';
          this.stateTimer = 0;
          RoadMicroDetailsSystem.spawnMicroToast("✅ ট্রেন পার হয়েছে! রেলগেট খোলা হচ্ছে!");
        }
      } else if (this.state === 'OPENING') {
        this.stateTimer += dt;
        const prog = Math.min(1.0, this.stateTimer / 1.8);
        if (this.barrierLeft) this.barrierLeft.rotation.z = (Math.PI * 0.45) * prog;
        if (this.barrierRight) this.barrierRight.rotation.z = (-Math.PI * 0.45) * prog;

        if (this.stateTimer >= 1.8) {
          this.state = 'OPEN';
        }
      }
    },

    resetCrossing() {
      this.state = 'OPEN';
      this.stateTimer = 0;
      this.trainX = 120;
      if (this.trainGroup) this.trainGroup.position.x = 120;
      if (this.barrierLeft) this.barrierLeft.rotation.z = Math.PI * 0.45;
      if (this.barrierRight) this.barrierRight.rotation.z = -Math.PI * 0.45;
    }
  };

  // ----------------------------------------------------
  // 31. Dhaka Passenger Pickup & Fare Mission System (ঢাকা প্যাসেঞ্জার ট্রিপ ও ভাড়া মিশন)
  // ----------------------------------------------------
  const DhakaPassengerMissionSystem = {
    initialized: false,
    group: null,
    passengerMesh: null,
    dropoffZoneMesh: null,
    hasPassenger: false,
    curPassenger: null,
    fareReward: 70,
    destLandmark: 'নীলক্ষেত মোড়',
    destZ: -9999,
    spawnZ: -350,
    cycleDist: 900,
    lastScreamT: 0,
    wavingArm: null,
    hudPill: null,

    passengersInfo: [
      {
        id: 'student',
        name: 'ভার্সিটির ছাত্র',
        dest: 'নীলক্ষেত মোড়',
        fare: 60,
        intro: 'মামা নীলক্ষেত চলেন! ভার্সিটির ক্লাস আছে, ডাবল ভাড়া দিমু!',
        screams: [
          'আরে ও মামা আস্তে চালান! জানটা গেলো!',
          'ভাই ভাই সামনে দেইখা! ব্রেক মারেন!',
          'আমার কালকে সেমিস্টার ফাইনাল মামা, মাইরেন না!'
        ]
      },
      {
        id: 'uncle',
        name: 'পুরান ঢাকার হাজী সাহেব',
        dest: 'চকবাজার জামে মসজিদ',
        fare: 80,
        intro: 'বাবা চকবাজার জামে মসজিদে নামায়া দিবা? বিশ টাকা বেশি দিবানে!',
        screams: [
          'বাপরে বাপ! এ তো সাক্ষাৎ যমদূত!',
          'আস্তে বাবা আস্তে! আমার ডায়াবেটিস ও প্রেসার দুইটাই বেশি!',
          'আল্লাহ আল্লাহ জপতে জপতে জান শেষ!'
        ]
      },
      {
        id: 'corporate',
        name: 'অফিসযাত্রী আপা',
        dest: 'মতিঝিল শাপলা চত্বর',
        fare: 90,
        intro: 'ভাই মতিঝিল তাড়াতাড়ি চলেন, ১০টায় জরুরি মিটিং আছে!',
        screams: [
          'ও ভাইয়া আস্তে! হ্যান্ডব্যাগ পড়ে যাবে!',
          'সামনে ট্রাক! ব্রেক করেন এক্ষুণি!',
          'আল্লাহ ভরসা! এইটা রিকশা না বুলেট ট্রেন?!'
        ]
      }
    ],

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.group = new THREE.Group();

        // 1. Roadside Passenger 3D Model
        this.passengerMesh = new THREE.Group();
        this.passengerMesh.position.set(-6.2, 0, this.spawnZ);

        const bodyGeo = new THREE.ct();
        bodyGeo.box(0, 0.8, 0, 0.65, 0.95, 0.45, null);
        bodyGeo.box(0, 1.5, 0, 0.4, 0.45, 0.4, null); // Head
        bodyGeo.box(-0.2, 0.25, 0, 0.22, 0.5, 0.22, null);
        bodyGeo.box(0.2, 0.25, 0, 0.22, 0.5, 0.22, null);
        const bodyMesh = new THREE.Mesh(bodyGeo.build(), new THREE.StandardMat({ color: 0x3b82f6, roughness: 0.8 }));
        this.passengerMesh.add(bodyMesh);

        // Animated Waving Arm
        const armGeo = new THREE.ct();
        armGeo.box(0, 0.35, 0, 0.18, 0.7, 0.18, null);
        this.wavingArm = new THREE.Mesh(armGeo.build(), new THREE.StandardMat({ color: 0xf59e0b, roughness: 0.7 }));
        this.wavingArm.position.set(-0.45, 1.1, 0);
        this.passengerMesh.add(this.wavingArm);

        // Floating Passenger Beacon Icon
        const beaconCanvas = document.createElement('canvas');
        beaconCanvas.width = 256; beaconCanvas.height = 128;
        const bCtx = beaconCanvas.getContext('2d');
        bCtx.fillStyle = '#ffd400';
        bCtx.fillRect(8, 8, 240, 112);
        bCtx.fillStyle = '#0f172a';
        bCtx.font = 'bold 36px "Baloo Da 2", sans-serif';
        bCtx.textAlign = 'center';
        bCtx.fillText('🚖 যাত্রী ভাড়া', 128, 72);

        const tex = new THREE.Tex.glow.constructor(beaconCanvas);
        tex.needsUpdate = true;
        const bGeo = new THREE.ct();
        bGeo.box(0, 2.3, 0, 2.2, 1.1, 0.1, null);
        this.passengerMesh.add(new THREE.Mesh(bGeo.build(), new THREE.BasicMat({ map: tex })));

        this.group.add(this.passengerMesh);

        // 2. Glowing Green Drop-off Zone Mesh
        this.dropoffZoneMesh = new THREE.Group();
        this.dropoffZoneMesh.position.set(-5.8, 0.03, -9999);

        const zoneGeo = new THREE.ct();
        zoneGeo.box(0, 0, 0, 4.2, 0.05, 14.0, null);
        const zoneMat = new THREE.StandardMat({ color: 0x10b981, roughness: 0.2, metalness: 0.6 });
        this.dropoffZoneMesh.add(new THREE.Mesh(zoneGeo.build(), zoneMat));

        // Floating Target Beacon
        const dropCanvas = document.createElement('canvas');
        dropCanvas.width = 256; dropCanvas.height = 128;
        const dCtx = dropCanvas.getContext('2d');
        dCtx.fillStyle = '#10b981';
        dCtx.fillRect(8, 8, 240, 112);
        dCtx.fillStyle = '#ffffff';
        dCtx.font = 'bold 34px "Baloo Da 2", sans-serif';
        dCtx.textAlign = 'center';
        dCtx.fillText('🎯 নামার স্থান', 128, 72);

        const dTex = new THREE.Tex.glow.constructor(dropCanvas);
        dTex.needsUpdate = true;
        const dSignGeo = new THREE.ct();
        dSignGeo.box(0, 2.4, 0, 2.4, 1.2, 0.1, null);
        this.dropoffZoneMesh.add(new THREE.Mesh(dSignGeo.build(), new THREE.BasicMat({ map: dTex })));

        this.group.add(this.dropoffZoneMesh);
        scene.add(this.group);
      } catch (e) {
        console.warn('DhakaPassengerMissionSystem init error:', e);
      }

      this.initHUDPill();
    },

    initHUDPill() {
      if (document.getElementById('passengerHUDPill')) return;
      const el = document.createElement('div');
      el.id = 'passengerHUDPill';
      el.className = 'raja-passenger-hud-pill';
      el.style.display = 'none';
      document.body.appendChild(el);
      this.hudPill = el;
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p) return;

      const now = performance.now();

      // Waving arm animation on sidewalk
      if (this.wavingArm && !this.hasPassenger) {
        this.wavingArm.rotation.z = Math.sin(now * 0.008) * 0.45 + 0.35;
      }

      // STATE A: Searching for Passenger
      if (!this.hasPassenger) {
        if (this.hudPill) this.hudPill.style.display = 'none';

        // Move roadside passenger ahead of player along road
        while (this.passengerMesh.position.z > p.z + 50) {
          this.passengerMesh.position.z -= this.cycleDist;
          this.curPassenger = this.passengersInfo[Math.floor(Math.random() * this.passengersInfo.length)];
        }
        while (this.passengerMesh.position.z < p.z - (this.cycleDist - 50)) {
          this.passengerMesh.position.z += this.cycleDist;
          this.curPassenger = this.passengersInfo[Math.floor(Math.random() * this.passengersInfo.length)];
        }

        // Proximity Pickup Detection
        const dist = Math.hypot(p.x - this.passengerMesh.position.x, p.z - this.passengerMesh.position.z);
        const isSlowEnough = Math.abs(p.v || 0) < 4.5; // < 16 km/h

        if (dist < 4.2 && isSlowEnough && p.alive) {
          this.hasPassenger = true;
          this.passengerMesh.visible = false;
          if (!this.curPassenger) this.curPassenger = this.passengersInfo[0];
          this.destLandmark = this.curPassenger.dest;
          this.fareReward = this.curPassenger.fare;
          this.destZ = p.z - (380 + Math.random() * 140);
          this.dropoffZoneMesh.position.set(-5.8, 0.03, this.destZ);
          this.dropoffZoneMesh.visible = true;

          if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playClickSound === 'function') {
            window.RastarRaja.DhakaAudioSFX.playClickSound();
          }
          if (DhakaStreetHumorSystem && DhakaStreetHumorSystem.boxEl) {
            DhakaStreetHumorSystem.sayRandom([`🚖 ${this.curPassenger.name}: "${this.curPassenger.intro}"`], 'fare');
          }
        }
      } else {
        // STATE B: Passenger In-Transit
        this.passengerMesh.visible = false;
        const distRem = Math.max(0, Math.round(p.z - this.destZ));

        // Update HUD Mission Pill
        if (this.hudPill) {
          this.hudPill.style.display = 'flex';
          this.hudPill.innerHTML = `🚖 <b>যাত্রী ট্রিপ:</b> ${this.destLandmark} (${distRem} মি.) · ভাড়া: <b style="color:#a8ff78">৳${this.fareReward}</b>`;
        }

        // In-transit Passenger Screams during high speed
        const speedKmh = Math.abs(p.v || 0) * 7.5;
        if (speedKmh > 72 && now - this.lastScreamT > 8000) {
          this.lastScreamT = now;
          if (this.curPassenger && this.curPassenger.screams) {
            const scream = this.curPassenger.screams[Math.floor(Math.random() * this.curPassenger.screams.length)];
            if (DhakaStreetHumorSystem && DhakaStreetHumorSystem.boxEl) {
              DhakaStreetHumorSystem.sayRandom([`😱 ${this.curPassenger.name}: "${scream}"`], 'speed');
            }
          }
        }

        // Destination Drop-off Detection
        const distToDrop = Math.abs(p.z - this.destZ);
        const nearCurb = Math.abs(p.x - (-5.8)) < 3.2;
        const isStopped = Math.abs(p.v || 0) < 4.0;

        if (distToDrop < 10.0 && nearCurb && isStopped) {
          this.hasPassenger = false;
          this.dropoffZoneMesh.visible = false;
          this.passengerMesh.visible = true;
          this.passengerMesh.position.z = p.z - this.cycleDist;

          // Award Cash Bonus
          if (CockpitHUD) {
            CockpitHUD.fareAmount += this.fareReward;
            const fareEl = document.getElementById('fareVal');
            if (fareEl) fareEl.textContent = `৳${Math.floor(CockpitHUD.fareAmount).toLocaleString('bn-BD')}`;
          }
          if (at.G) {
            at.G.loss = Math.max(0, (at.G.loss || 0) + this.fareReward * 10);
          }

          if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playCashChime === 'function') {
            window.RastarRaja.DhakaAudioSFX.playCashChime();
          }

          RoadMicroDetailsSystem.spawnMicroToast(`⭐ যাত্রী নামানো সম্পন্ন! +৳${this.fareReward} ভাড়া আদায়! ⭐`);
          if (DhakaStreetHumorSystem && DhakaStreetHumorSystem.boxEl) {
            DhakaStreetHumorSystem.sayRandom([`💵 ${this.curPassenger.name}: "খুব চমৎকার চালাইছেন মামা! এই নেন বকশিশ সহ ভাড়া!"`], 'fare');
          }
        }
      }
    }
  };

  // ----------------------------------------------------
  // 32. Traffic Police Sergeant Checkpost & Speed Trap (ট্রাফিক পুলিশ সার্জেন্ট চেকপোস্ট)
  // ----------------------------------------------------
  const PoliceCheckpostSystem = {
    initialized: false,
    group: null,
    checkpostZ: -2600,
    cycleDist: 3200,
    barrierArm: null,
    sergeantMesh: null,
    beaconLight: null,
    lastWhistleT: 0,
    trapNotified: false,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      // Clean up any old popup element from DOM if present
      const oldPrompt = document.getElementById('policeTrapPrompt');
      if (oldPrompt) oldPrompt.remove();

      try {
        this.group = new THREE.Group();
        this.group.position.set(0, 0, this.checkpostZ);

        const boothWhiteMat = new THREE.StandardMat({ color: 0xf8fafc, roughness: 0.7 });
        const yellowHazardMat = new THREE.BasicMat({ color: 0xfacc15 });
        const blackStripeMat = new THREE.BasicMat({ color: 0x0f172a });
        const vestLimeMat = new THREE.BasicMat({ color: 0xa3e635 });

        // 1. DMP Police Outpost Shelter
        const boothGeo = new THREE.ct();
        boothGeo.box(-8.5, 1.6, 0, 3.2, 3.2, 3.2, null);
        boothGeo.box(-8.5, 3.4, 0, 3.8, 0.4, 3.8, null);
        this.group.add(new THREE.Mesh(boothGeo.build(), boothWhiteMat));

        // DMP Police Banner
        const bannerCanvas = document.createElement('canvas');
        bannerCanvas.width = 256; bannerCanvas.height = 128;
        const bCtx = bannerCanvas.getContext('2d');
        bCtx.fillStyle = '#1e3a8a';
        bCtx.fillRect(0, 0, 256, 128);
        bCtx.fillStyle = '#facc15';
        bCtx.font = 'bold 32px "Baloo Da 2", sans-serif';
        bCtx.textAlign = 'center';
        bCtx.fillText('👮 ডিএমপি চেকপোস্ট', 128, 56);
        bCtx.font = '22px "Baloo Da 2", sans-serif';
        bCtx.fillText('গতিসীমা ৬০ কিমি/ঘণ্টা', 128, 96);

        const bTex = new THREE.Tex.glow.constructor(bannerCanvas);
        bTex.needsUpdate = true;
        const bSignGeo = new THREE.ct();
        bSignGeo.box(-8.5, 2.0, 1.65, 3.0, 1.2, 0.1, null);
        this.group.add(new THREE.Mesh(bSignGeo.build(), new THREE.BasicMat({ map: bTex })));

        // 2. 3D Traffic Police Sergeant
        this.sergeantMesh = new THREE.Group();
        this.sergeantMesh.position.set(-6.2, 0, 1.2);

        const sGeo = new THREE.ct();
        sGeo.box(0, 0.4, 0, 0.5, 0.8, 0.35, null);
        sGeo.box(0, 1.1, 0, 0.55, 0.7, 0.4, null);
        sGeo.box(0, 1.15, 0, 0.58, 0.65, 0.42, null);
        sGeo.box(0, 1.65, 0, 0.35, 0.4, 0.35, null);
        sGeo.box(0, 1.88, 0.05, 0.48, 0.15, 0.48, null); // Cap
        sGeo.box(0.35, 1.25, 0.3, 0.16, 0.16, 0.45, null); // Radar gun
        this.sergeantMesh.add(new THREE.Mesh(sGeo.build(), vestLimeMat));
        this.group.add(this.sergeantMesh);

        // 3. Police Barricade Arm (Kept open on driving lane for smooth flow)
        const armPivot = new THREE.Group();
        armPivot.position.set(-6.5, 0.75, 0);

        const armGeo = new THREE.ct();
        for (let s = 0; s < 7; s++) {
          const mat = (s % 2 === 0) ? yellowHazardMat : blackStripeMat;
          const segGeo = new THREE.ct();
          segGeo.box(s * 1.6 + 0.8, 0, 0, 1.6, 0.35, 0.12, null);
          armPivot.add(new THREE.Mesh(segGeo.build(), mat));
        }
        this.barrierArm = armPivot;
        this.barrierArm.rotation.y = -Math.PI * 0.48; // Open for road clearance
        this.group.add(armPivot);

        // 4. Flashing Police Beacon
        const beaconGeo = new THREE.ct();
        beaconGeo.box(-8.5, 3.8, 0, 0.4, 0.5, 0.4, null);
        this.beaconLight = new THREE.Mesh(beaconGeo.build(), new THREE.BasicMat({ color: 0x00f0ff }));
        this.group.add(this.beaconLight);

        scene.add(this.group);
      } catch (e) {
        console.warn('PoliceCheckpostSystem init error:', e);
      }
    },

    update(p, dt, inPlay) {
      const THREE = window.__THREE_EXPORTS;
      const at = window.__at;
      if (!this.initialized && THREE && at && at.SCENE) {
        this.init(THREE, at.SCENE);
      }
      if (!this.initialized || !inPlay || !p) return;

      const now = performance.now();

      // Beacon strobe flash
      if (this.beaconLight) {
        const isRed = Math.floor(now * 0.006) % 2 === 0;
        this.beaconLight.material.color.setHex(isRed ? 0xdc2626 : 0x00f0ff);
      }

      // Recycle checkpost along road
      while (this.group.position.z > p.z + 180) {
        this.group.position.z -= this.cycleDist;
        this.trapNotified = false;
      }
      while (this.group.position.z < p.z - (this.cycleDist - 180)) {
        this.group.position.z += this.cycleDist;
        this.trapNotified = false;
      }

      const dist = p.z - this.group.position.z;
      const speedKmh = Math.abs(p.v || 0) * 7.5;

      // Speed Trap Detection (Smooth, non-blocking toast & dialogue - ZERO POPUP!)
      if (dist > 5 && dist < 65 && !this.trapNotified) {
        if (speedKmh > 58) {
          this.trapNotified = true;

          // Sergeant blows whistle
          if (now - this.lastWhistleT > 2000) {
            this.lastWhistleT = now;
            if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playPoliceWhistle === 'function') {
              window.RastarRaja.DhakaAudioSFX.playPoliceWhistle();
            }
          }

          // Non-intrusive floating comic toast
          RoadMicroDetailsSystem.spawnMicroToast(`🚨 স্পিডগান: ${Math.round(speedKmh)} KM/H! গতিসীমা ৬০ কিমি!`);
          if (DhakaStreetHumorSystem && DhakaStreetHumorSystem.boxEl) {
            DhakaStreetHumorSystem.sayRandom([
              '👮 সার্জেন্ট: "এই রিকশা আস্তে চালান! স্পিড লিমিট ৬০!"',
              '👮 সার্জেন্ট: "স্পিডগান ধরছে ওস্তাদ! রিকশা কি আকাশে উড়াবেন?!"',
              '👮 সার্জেন্ট: "বিকাশ পরিবহনের মতো স্পিড দিছেন ক্যান?!"'
            ], 'warning');
          }
        }
      }

      // If player passed checkpost slowly, salute
      if (dist <= 0 && dist > -15 && !this.trapNotified && speedKmh <= 55) {
        this.trapNotified = true;
        RoadMicroDetailsSystem.spawnMicroToast("👮 সার্জেন্ট: ঠিক আছে মামা, গতি নিয়ন্ত্রিত! সাবধানে যান!");
      }
    }
  };

  // ----------------------------------------------------
  // 33. First-Person Interior Cockpit View System (প্রথম ব্যক্তি ককপিট ভিউ)
  // ----------------------------------------------------
  const FirstPersonCockpitCameraSystem = {
    active: false,
    hooked: false,
    talismanAngle: 0,
    cockpitOverlay: null,
    camBtn: null,

    init() {
      this.initOverlay();
      this.hookRenderer();
      this.setupControls();
    },

    initOverlay() {
      if (document.getElementById('cockpitOverlay')) return;
      const el = document.createElement('div');
      el.id = 'cockpitOverlay';
      el.className = 'raja-cockpit-overlay';
      el.style.display = 'none';
      el.innerHTML = `
        <div class="cockpit-glass-frame"></div>
        <div class="cockpit-dash">
          <div class="handlebar-container">
            <div class="handlebar-stem"></div>
            <div class="handlebar-bar">
              <div class="grip-left"></div>
              <div class="cycle-bell" title="টিং টিং সাইকেল বেল">🔔</div>
              <div class="talisman-cord" id="talismanCord">
                <div class="talisman-beads"></div>
                <div class="chili-bundle">🌶️🌶️🌶️</div>
                <div class="lemon-charm">🍋</div>
              </div>
              <div class="grip-right"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(el);
      this.cockpitOverlay = el;
    },

    hookRenderer() {
      const at = window.__at;
      if (!at || !at.RENDERER || this.hooked) return;
      this.hooked = true;

      const origRender = at.RENDERER.render.bind(at.RENDERER);
      const self = this;

      at.RENDERER.render = function(scene, camera) {
        if (self.active && at.P && at.CAM) {
          const p = at.P;
          const bump = p.bumpY || 0;
          const bounce = (SuspensionDynamics && SuspensionDynamics.bounceY) || 0;
          const camY = 1.34 + bump + bounce * 0.35;

          at.CAM.position.set(
            p.x + (p.fx || 0) * 0.32,
            camY,
            p.z + (p.fz || 0) * 0.32
          );

          at.CAM.lookAt(
            p.x + (p.fx || 0) * 35.0,
            1.22 + bump * 0.2,
            p.z + (p.fz || 0) * 35.0
          );

          at.CAM.rotation.z = -(p.steer || 0) * 0.06;
        }

        return origRender(scene, camera);
      };
    },

    setupControls() {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'c' || e.key === 'C') {
          this.toggle();
        }
      });

      if (!document.getElementById('camToggleBtn')) {
        const btn = document.createElement('button');
        btn.id = 'camToggleBtn';
        btn.className = 'raja-cam-btn';
        btn.innerHTML = `🎥 <span>ভিউ</span>`;
        btn.title = "ক্যামেরা মোড পরিবর্তন (ককপিট / ৩য় ব্যক্তি - C)";
        btn.addEventListener('click', () => this.toggle());
        document.body.appendChild(btn);
        this.camBtn = btn;
      }
    },

    toggle() {
      this.active = !this.active;
      if (this.cockpitOverlay) {
        this.cockpitOverlay.style.display = this.active ? 'block' : 'none';
      }
      if (this.camBtn) {
        this.camBtn.classList.toggle('active', this.active);
        this.camBtn.innerHTML = this.active ? `🎥 <span>ককপিট</span>` : `🎥 <span>ভিউ</span>`;
      }
      if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX && typeof window.RastarRaja.DhakaAudioSFX.playClickSound === 'function') {
        window.RastarRaja.DhakaAudioSFX.playClickSound();
      }
      RoadMicroDetailsSystem.spawnMicroToast(this.active ? "🎥 ককপিট ড্রাইভার ভিউ সক্রিয় (First Person)" : "🎥 থার্ড পারসন চেজ ভিউ সক্রিয় (3rd Person)");
    },

    update(p, dt, inPlay) {
      if (!this.hooked) this.hookRenderer();
      if (!this.active || !inPlay || !p) return;

      const targetAngle = -(p.steer || 0) * 28.0;
      this.talismanAngle += (targetAngle - this.talismanAngle) * Math.min(1.0, dt * 8.0);

      const cordEl = document.getElementById('talismanCord');
      if (cordEl) {
        cordEl.style.transform = `rotate(${this.talismanAngle.toFixed(1)}deg)`;
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

      // 100% Grounded Asphalt Physics: Eliminates flying rickshaw & floating vehicle glitch forever!
      at.P.bumpY = Math.max(0, (at.P.bumpY || 0) * 0.82);
      if (!at.P.jump) {
        at.P.air = 0;
      }
      if (at.PLAYER && at.PLAYER.beat) {
        at.PLAYER.beat.y = SuspensionDynamics.bounceY || 0;
      }
      if (at.PLAYER && at.PLAYER.o && at.PLAYER.o.position) {
        at.PLAYER.o.position.y = (at.P.jump ? at.P.jump.y : 0) + (at.P.bumpY || 0);
      }

      // Grounding Watchdog: Pin all traffic NPC rickshaws, cars, CNGs firmly to asphalt
      if (at.TRAFFIC && at.TRAFFIC.list) {
        for (const v of at.TRAFFIC.list) {
          if (v.o && v.o.grp && v.o.grp.position) {
            if (v.o.grp.position.y > 0.35 && v.state !== 'fallen') {
              v.o.grp.position.y = 0.02;
            }
          }
        }
      }
    }

    VisualsFX.update(at.P, dt, inPlay, isNight, isRain);
    HydraulicHorn.update(dt);
    SuperPickups.update(at.P, dt, inPlay);
    MetroRailSystem.update(at.P, dt, inPlay);
    SuspensionDynamics.update(at.P, dt, inPlay);
    BusHelperSystem.update(at.P, dt, inPlay);

    // v3.0 Road Geometry & Elevation (Run before Radar so radar corridor renders correct hazard styling)
    ZoneProgressionSystem.update(at.P, dt, inPlay);
    BangladeshHeritageLandmarksSystem.update(at.P, dt, inPlay);
    FlyoverElevationSystem.update(at.P, dt, inPlay);
    DhakaRoadEnvironmentSystem.update(at.P, dt, inPlay);
    RoadMicroDetailsSystem.update(at.P, dt, inPlay);

    MiniMapRadar.update(at.P, dt, inPlay);
    NearMissSystem.update(at.P, dt, inPlay);
    FallingPetalsSystem.update(at.P, dt, inPlay);
    LivingCitySystem.update(at.P, dt, inPlay);
    NextGenGraphicsSystem.update(at.P, dt, inPlay, isNight, isRain);

    // v3.2 Roadside Posters & Dhaka Street Dialogues
    DhakaRoadsideBannersSystem.update(at.P, dt, inPlay);
    DhakaStreetHumorSystem.update(at.P, dt, inPlay);
    DhakaExpresswayVisualsSystem.update(at.P, dt, inPlay, isNight, isRain);

    // v3.4 Monsoon Waterlogging, Level Crossing, Passenger Trips, Police Checkpost & Cockpit FPP
    MonsoonWaterloggingSystem.update(at.P, dt, inPlay, isRain);
    RailwayLevelCrossingSystem.update(at.P, dt, inPlay);
    DhakaPassengerMissionSystem.update(at.P, dt, inPlay);
    PoliceCheckpostSystem.update(at.P, dt, inPlay);
    FirstPersonCockpitCameraSystem.update(at.P, dt, inPlay);
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
    ZoneProgressionSystem.init();
    NextGenGraphicsSystem.init();
    DhakaStreetHumorSystem.init();
    FirstPersonCockpitCameraSystem.init();
    DhakaExpresswayVisualsSystem.init();

    // Mobile & Desktop Fullscreen Button Toggle
    const fsBtn = document.createElement('button');
    fsBtn.id = 'rajaFullscreenBtn';
    fsBtn.className = 'raja-fs-btn';
    fsBtn.innerHTML = `⛶ <span>ফুলস্ক্রিন</span>`;
    fsBtn.title = "ফুলস্ক্রিন অ্যাপ মোড (Fullscreen App Mode)";
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        fsBtn.innerHTML = `✖ <span>ছোট স্ক্রিন</span>`;
      } else {
        document.exitFullscreen().catch(() => {});
        fsBtn.innerHTML = `⛶ <span>ফুলস্ক্রিন</span>`;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(20); } catch (_) {}
      }
    });
    document.body.appendChild(fsBtn);

    // Mobile Touch Haptic Feedback
    const triggerHaptic = (ms = 18) => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(ms); } catch (_) {}
      }
    };
    ['tGas', 'tBrake', 'tBoost', 'tHorn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('pointerdown', () => triggerHaptic(18), { passive: true });
        el.addEventListener('touchstart', () => triggerHaptic(18), { passive: true });
      }
    });
    document.querySelectorAll('#touch .round').forEach(btn => {
      btn.addEventListener('pointerdown', () => triggerHaptic(15), { passive: true });
      btn.addEventListener('touchstart', () => triggerHaptic(15), { passive: true });
    });

    // Export systems to RastarRaja namespace
    window.RastarRaja.ZoneProgressionSystem = ZoneProgressionSystem;
    window.RastarRaja.BangladeshHeritageLandmarksSystem = BangladeshHeritageLandmarksSystem;
    window.RastarRaja.FlyoverElevationSystem = FlyoverElevationSystem;
    window.RastarRaja.RoadMicroDetailsSystem = RoadMicroDetailsSystem;
    window.RastarRaja.DhakaRoadEnvironmentSystem = DhakaRoadEnvironmentSystem;
    window.RastarRaja.LivingCitySystem = LivingCitySystem;
    window.RastarRaja.NextGenGraphicsSystem = NextGenGraphicsSystem;
    window.RastarRaja.DhakaRoadsideBannersSystem = DhakaRoadsideBannersSystem;
    window.RastarRaja.DhakaExpresswayVisualsSystem = DhakaExpresswayVisualsSystem;
    window.RastarRaja.DhakaStreetHumorSystem = DhakaStreetHumorSystem;
    window.RastarRaja.DhakaAudioSFX = DhakaAudioSFX;
    window.RastarRaja.MonsoonWaterloggingSystem = MonsoonWaterloggingSystem;
    window.RastarRaja.RailwayLevelCrossingSystem = RailwayLevelCrossingSystem;
    window.RastarRaja.DhakaPassengerMissionSystem = DhakaPassengerMissionSystem;
    window.RastarRaja.PoliceCheckpostSystem = PoliceCheckpostSystem;
    window.RastarRaja.FirstPersonCockpitCameraSystem = FirstPersonCockpitCameraSystem;

    // Global User-Gesture Audio Unlocker for Mobile & Desktop
    const unlockAudio = () => {
      if (window.RastarRaja && window.RastarRaja.DhakaAudioSFX) {
        const ctx = window.RastarRaja.DhakaAudioSFX.getCtx();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });

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
