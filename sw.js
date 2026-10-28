// Rastar Raja Complete Offline Service Worker v3.5
// Creator & Concept: Abdul Al Jubayer
// 100% Offline-Capable PWA Cache Architecture
const CACHE_VERSION = 'rastar-raja-offline-v3.5';

const OFFLINE_URLS = [
  './',
  './index.html',
  './raja-engine.js',
  './game.8070c56a37.js',
  './manifest.webmanifest',
  './logo.svg',
  './icon.svg',
  './og.jpg',
  './about.html',
  './privacy.html',
  './disclaimer.html',
  './robots.txt',
  './data/leaderboard.json',

  // Audio Meme Clips
  './clips/cartoon-impact.342c6d67d0.mp3',
  './clips/crash-meme.bd610be0ab.mp3',
  './clips/horn-meme.168251df6a.mp3',
  './clips/laugh.e62c96e6f2.mp3',
  './clips/masud.0bd9f2f209.mp3',
  './clips/mob-shout-1.bf532c5410.mp3',
  './clips/mob-shout-2.b7f33650be.mp3',
  './clips/mob-shout-3.8bdd12b4d2.mp3',
  './clips/punch.4d481891d1.mp3',
  './clips/rag-korla.04fd093dec.mp3',
  './clips/sound-bomb-1.cfb2174540.mp3',
  './clips/sound-bomb-2.7fc51ef4a1.mp3',
  './clips/sound-bomb-3.8a9ab6e6b9.mp3',
  './clips/sound-bomb-4.85f2ce82c4.mp3',
  './clips/technologia.2255588cfe.mp3',
  './clips/yooo.0a7a09d534.mp3',

  // Local Web Fonts
  './fonts/anek-bangla-400-800-bengali.418c763509.woff2',
  './fonts/anek-bangla-400-800-latin.9d14431a27.woff2',
  './fonts/baloo-da-2-600-800-bengali.323d936108.woff2',
  './fonts/baloo-da-2-600-800-latin.074ed9c674.woff2',
  './fonts/galada-400-bengali.22eba75917.woff2',
  './fonts/galada-400-latin.59a0eef638.woff2',
  './fonts/hind-siliguri-700-bengali.b6033f70da.woff2',
  './fonts/hind-siliguri-700-latin.e8f0fc0cab.woff2',
  './fonts/share-tech-mono-400-latin.41e6b9f297.woff2',
  './fonts/tiro-bangla-400-bengali.7132520bbc.woff2',
  './fonts/tiro-bangla-400-latin.bb748ffc6a.woff2',

  // App Icons
  './icons/icon-192.8f96155b92.png',
  './icons/icon-512.39805cca4e.png',
  './icons/apple-touch-icon.9ff36d6707.png',
  './icons/favicon.ecd6bb7b2b.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('📦 Pre-caching offline game assets for Rastar Raja...');
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn('Non-fatal pre-cache warning:', err);
        return Promise.all(
          OFFLINE_URLS.map((url) => cache.add(url).catch(() => {}))
        );
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. API & Cloud database calls: Provide graceful offline mock response if network is down
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(JSON.stringify({
          status: 'offline',
          offline: true,
          message: 'অফলাইন মোড সক্রিয়: স্কোর ডিভাইসে সংরক্ষিত হচ্ছে',
          scores: [
            { name: "ওস্তাদ কালাম (মিরপুর)", score: 980000, date: "আজ" },
            { name: "চকবাজার বুলেট", score: 850000, date: "গতকাল" },
            { name: "সাভার এক্সপ্রেস", score: 720000, date: "৩ দিন আগে" },
            { name: "যাত্রাবাড়ী ত্রাস", score: 640000, date: "৫ দিন আগে" }
          ]
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // 2. Navigation requests: Serve index.html from cache first, fetch network in background
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => {
        const networkFetch = fetch(req).then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('./index.html', clone));
          }
          return res;
        }).catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // 3. Static Assets (JS, CSS, fonts, audio, images):
  // Check cache first (ignoring search query parameters like ?v=2.8.0), fallback to network
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((networkRes) => {
        if (networkRes && networkRes.ok && req.method === 'GET') {
          const clone = networkRes.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(req, clone);
          });
        }
        return networkRes;
      }).catch(() => {
        // Fallback for audio or image if completely offline
        if (req.destination === 'image') return caches.match('./icons/icon-192.8f96155b92.png');
        return new Response('', { status: 408, statusText: 'Offline' });
      });
    })
  );
});
