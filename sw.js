// written by tools/site.mjs; do not edit
// Keeps the whole game on the device. The page is network-first (a new version shows at once; the copy is used after
// 3.5 s without an answer, or offline); everything else has a content hash in its name, so it is cache-first.
const V = 'baper-rasta-5198d65b-a9471144fe';
const KEEP = ["./","clips/cartoon-impact.342c6d67d0.mp3","clips/crash-meme.bd610be0ab.mp3","clips/horn-meme.168251df6a.mp3","clips/laugh.e62c96e6f2.mp3","clips/masud.0bd9f2f209.mp3","clips/mob-shout-1.bf532c5410.mp3","clips/mob-shout-2.b7f33650be.mp3","clips/mob-shout-3.8bdd12b4d2.mp3","clips/punch.4d481891d1.mp3","clips/rag-korla.04fd093dec.mp3","clips/sound-bomb-1.cfb2174540.mp3","clips/sound-bomb-2.7fc51ef4a1.mp3","clips/sound-bomb-3.8a9ab6e6b9.mp3","clips/sound-bomb-4.85f2ce82c4.mp3","clips/technologia.2255588cfe.mp3","clips/yooo.0a7a09d534.mp3","fonts/anek-bangla-400-800-bengali.418c763509.woff2","fonts/anek-bangla-400-800-latin.9d14431a27.woff2","fonts/baloo-da-2-600-800-bengali.323d936108.woff2","fonts/baloo-da-2-600-800-latin.074ed9c674.woff2","fonts/galada-400-bengali.22eba75917.woff2","fonts/galada-400-latin.59a0eef638.woff2","fonts/hind-siliguri-700-bengali.b6033f70da.woff2","fonts/hind-siliguri-700-latin.e8f0fc0cab.woff2","fonts/share-tech-mono-400-latin.41e6b9f297.woff2","fonts/tiro-bangla-400-bengali.7132520bbc.woff2","fonts/tiro-bangla-400-latin.bb748ffc6a.woff2","game.8070c56a37.js","icons/icon-192.8f96155b92.png","icons/icon-512.39805cca4e.png","icons/apple-touch-icon.9ff36d6707.png","icons/favicon.ecd6bb7b2b.png","manifest.webmanifest"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(KEEP)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('baper-rasta-') && k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return; // analytics, the list's functions and the like go straight to the network
  if (req.mode === 'navigate') {
    const net = fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(V).then((c) => c.put('./', copy)); } return r; });
    const slow = new Promise((ok) => setTimeout(ok, 3500)).then(() => caches.match('./'));
    e.respondWith(Promise.race([net, slow.then((hit) => hit || net)]).catch(() => caches.match('./')).then((r) => r || net));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok && url.pathname.match(/\.[0-9a-f]{10}\./)) { const copy = r.clone(); caches.open(V).then((c) => c.put(req, copy)); } return r; })));
});
