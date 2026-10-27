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

      /* BOTTOM-LEFT: Digital Cockpit Speedometer Gauge */
      .raja-gauge {
        position: fixed !important;
        bottom: 40px !important;
        left: 16px !important;
        width: 104px !important;
        height: 104px !important;
        background: rgba(11, 17, 32, 0.88) !important;
        border: 2px solid rgba(255, 203, 31, 0.4) !important;
        border-radius: 50% !important;
        backdrop-filter: blur(8px) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7) !important;
        z-index: 90 !important;
        pointer-events: none !important;
        transition: border-color 0.3s, box-shadow 0.3s !important;
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

        // Utility poles and crisscrossing wires
        for (let z = -20; z >= -1180; z -= 55) {
          const poleGeo = new THREE.ct();
          poleGeo.box(-7.8, 3.2, z, 0.28, 6.4, 0.28, null);
          poleGeo.box(7.8, 3.2, z, 0.28, 6.4, 0.28, null);
          poleGeo.box(-7.8, 5.9, z, 1.4, 0.12, 0.12, null);
          poleGeo.box(7.8, 5.9, z, 1.4, 0.12, 0.12, null);
          const pMesh = new THREE.Mesh(poleGeo.build(), poleMat);
          this.oldDhakaGroup.add(pMesh);

          // Sagging wire spans across the street
          const wireGeo = new THREE.ct();
          wireGeo.box(0, 5.75, z, 15.6, 0.035, 0.035, null);
          wireGeo.box(0, 5.95, z, 15.6, 0.035, 0.035, null);
          wireGeo.box(0, 5.45, z + 6, 15.6, 0.03, 0.03, null);
          const wMesh = new THREE.Mesh(wireGeo.build(), wireMat);
          this.oldDhakaGroup.add(wMesh);
        }

        // Old Dhaka Parody Billboards
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
          const side = idx % 2 === 0 ? -9.2 : 9.2;
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
          // Overhead bridge spanning road
          gantryGeo.box(0, 6.8, bz, 15.2, 3.2, 0.4, null);
          gantryGeo.box(-7.4, 3.4, bz, 0.5, 6.8, 0.5, null);
          gantryGeo.box(7.4, 3.4, bz, 0.5, 6.8, 0.5, null);

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
  // 23. Mayor Mohammad Hanif Flyover System
  // ----------------------------------------------------
  const FlyoverElevationSystem = {
    initialized: false,
    flyoverGroup: null,
    gantryGroup: null,
    currentElevation: 0,
    currentPitch: 0,
    cycleDist: 2000,
    rampUpStart: 550,
    rampUpLen: 80,
    deckLen: 540,
    rampDownLen: 80,

    init(THREE, scene) {
      if (this.initialized || !THREE || !scene) return;
      this.initialized = true;

      try {
        this.flyoverGroup = new THREE.Group();

        const deckMat = new THREE.StandardMat({ color: 0x334155, roughness: 0.85 });
        const pierMat = new THREE.StandardMat({ color: 0x64748b, roughness: 0.9 });
        const barrierMat = new THREE.BasicMat({ color: 0x1e3a8a });
        const reflectorMat = new THREE.BasicMat({ color: 0xfacc15 });

        // 1. Ramp Up Slab (Stepped smooth rise over 80m from Y=0 to Y=4.6)
        const rampUpGeo = new THREE.ct();
        const steps = 10;
        for (let i = 0; i < steps; i++) {
          const t = i / steps;
          const zRel = - (t * this.rampUpLen);
          const yElev = 4.6 * (1 - Math.cos(Math.PI * t)) / 2;
          const segLen = this.rampUpLen / steps;
          rampUpGeo.box(0, yElev - 0.2, zRel - segLen / 2, 14.5, 0.45, segLen * 1.02, null);
          // Side barriers
          rampUpGeo.box(-7.2, yElev + 0.4, zRel - segLen / 2, 0.35, 0.8, segLen * 1.02, null);
          rampUpGeo.box(7.2, yElev + 0.4, zRel - segLen / 2, 0.35, 0.8, segLen * 1.02, null);
        }
        const rampUpMesh = new THREE.Mesh(rampUpGeo.build(), deckMat);
        this.flyoverGroup.add(rampUpMesh);

        // 2. Elevated Main Deck (Length 540m at Y=4.6m)
        const deckGeo = new THREE.ct();
        deckGeo.box(0, 4.4, - (this.rampUpLen + this.deckLen / 2), 14.5, 0.5, this.deckLen, null);
        // Side Jersey Crash Barriers
        deckGeo.box(-7.2, 5.0, - (this.rampUpLen + this.deckLen / 2), 0.35, 0.8, this.deckLen, null);
        deckGeo.box(7.2, 5.0, - (this.rampUpLen + this.deckLen / 2), 0.35, 0.8, this.deckLen, null);
        const deckMesh = new THREE.Mesh(deckGeo.build(), deckMat);
        this.flyoverGroup.add(deckMesh);

        // Reflectors on barriers every 15m
        const refGeo = new THREE.ct();
        for (let rz = 0; rz < this.deckLen; rz += 15) {
          const curZ = - (this.rampUpLen + rz);
          refGeo.box(-7.0, 5.15, curZ, 0.08, 0.12, 0.25, null);
          refGeo.box(7.0, 5.15, curZ, 0.08, 0.12, 0.25, null);
        }
        const refMesh = new THREE.Mesh(refGeo.build(), reflectorMat);
        this.flyoverGroup.add(refMesh);

        // Solid Concrete T-Piers Supporting Deck every 45m
        const pierGeo = new THREE.ct();
        for (let pz = 15; pz < this.deckLen; pz += 45) {
          const curZ = - (this.rampUpLen + pz);
          pierGeo.box(0, 2.1, curZ, 1.4, 4.2, 1.4, null);
          pierGeo.box(0, 4.0, curZ, 5.4, 0.6, 1.8, null);
        }
        const pierMesh = new THREE.Mesh(pierGeo.build(), pierMat);
        this.flyoverGroup.add(pierMesh);

        // 3. Ramp Down Slab (Stepped smooth descent over 80m from Y=4.6 to Y=0)
        const rampDownGeo = new THREE.ct();
        const startZ = - (this.rampUpLen + this.deckLen);
        for (let i = 0; i < steps; i++) {
          const t = i / steps;
          const zRel = startZ - (t * this.rampDownLen);
          const yElev = 4.6 * (1 + Math.cos(Math.PI * t)) / 2;
          const segLen = this.rampDownLen / steps;
          rampDownGeo.box(0, yElev - 0.2, zRel - segLen / 2, 14.5, 0.45, segLen * 1.02, null);
          rampDownGeo.box(-7.2, yElev + 0.4, zRel - segLen / 2, 0.35, 0.8, segLen * 1.02, null);
          rampDownGeo.box(7.2, yElev + 0.4, zRel - segLen / 2, 0.35, 0.8, segLen * 1.02, null);
        }
        const rampDownMesh = new THREE.Mesh(rampDownGeo.build(), deckMat);
        this.flyoverGroup.add(rampDownMesh);

        // 4. Overhead Highway Entrance Gantry
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
        gGeo.box(0, 4.8, 10, 14.8, 2.2, 0.3, null);
        gGeo.box(-7.2, 2.4, 10, 0.4, 4.8, 0.4, null);
        gGeo.box(7.2, 2.4, 10, 0.4, 4.8, 0.4, null);
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
      const localZ = pDist % this.cycleDist;

      // Position 3D flyover structure for current cycle
      if (this.flyoverGroup) {
        this.flyoverGroup.position.z = - (cycle * this.cycleDist + this.rampUpStart);
      }

      // Calculate Elevation and Pitch
      let yElev = 0;
      let pitch = 0;

      if (localZ >= this.rampUpStart && localZ < this.rampUpStart + this.rampUpLen) {
        // Climbing Ramp Up
        const t = (localZ - this.rampUpStart) / this.rampUpLen;
        yElev = 4.6 * (1 - Math.cos(Math.PI * t)) / 2;
        pitch = 0.16 * Math.sin(Math.PI * t); // Tilt nose up
      } else if (localZ >= this.rampUpStart + this.rampUpLen && localZ < this.rampUpStart + this.rampUpLen + this.deckLen) {
        // Cruising Elevated Deck
        yElev = 4.6;
        pitch = 0;
      } else if (localZ >= this.rampUpStart + this.rampUpLen + this.deckLen && localZ < this.rampUpStart + this.rampUpLen + this.deckLen + this.rampDownLen) {
        // Descending Ramp Down
        const t = (localZ - (this.rampUpStart + this.rampUpLen + this.deckLen)) / this.rampDownLen;
        yElev = 4.6 * (1 + Math.cos(Math.PI * t)) / 2;
        pitch = -0.16 * Math.sin(Math.PI * t); // Tilt nose down
      }

      this.currentElevation = yElev;
      this.currentPitch = pitch;
      window.__flyoverElevation = yElev;

      // Apply Elevation to Player
      if (at && at.PLAYER) {
        if (at.PLAYER.beat) {
          at.PLAYER.beat.y = (at.PLAYER.beat.y || 0) + yElev;
          at.PLAYER.beat.pitch = (at.PLAYER.beat.pitch || 0) + pitch;
        }
        if (at.PLAYER.o) {
          at.PLAYER.o.position.y = yElev + (p.bumpY || 0);
        }
      }

      // Smooth Panoramic Camera Elevation
      if (at && at.CAM && yElev > 0.05) {
        at.CAM.position.y += yElev * 0.82;
        if (at.CAM.target) at.CAM.target.y += yElev * 0.82;
      }
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

    // v3.0 New Systems
    ZoneProgressionSystem.update(at.P, dt, inPlay);
    FlyoverElevationSystem.update(at.P, dt, inPlay);
    RoadMicroDetailsSystem.update(at.P, dt, inPlay);
    LivingCitySystem.update(at.P, dt, inPlay);
    NextGenGraphicsSystem.update(at.P, dt, inPlay, isNight, isRain);
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

    // Export systems to RastarRaja namespace
    window.RastarRaja.ZoneProgressionSystem = ZoneProgressionSystem;
    window.RastarRaja.FlyoverElevationSystem = FlyoverElevationSystem;
    window.RastarRaja.RoadMicroDetailsSystem = RoadMicroDetailsSystem;
    window.RastarRaja.LivingCitySystem = LivingCitySystem;
    window.RastarRaja.NextGenGraphicsSystem = NextGenGraphicsSystem;
    window.RastarRaja.DhakaAudioSFX = DhakaAudioSFX;

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
