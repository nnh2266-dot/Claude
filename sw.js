/**
 * Service Worker: hält die App-Dateien im Cache, damit sie offline startet.
 *
 * Die Nutzdaten liegen ohnehin in IndexedDB — offline funktioniert also alles
 * außer der Foto-Analyse, die eine Verbindung zur API braucht.
 *
 * CACHE_VERSION bei jeder Änderung an den App-Dateien erhöhen.
 */

const CACHE_VERSION = 'naehrwerte-v20';   // muss zu APP_VERSION in js/version.js passen

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/ui.js',
  './js/store.js',
  './js/nutrition.js',
  './js/image.js',
  './js/claude.js',
  './js/training.js',
  './js/energy.js',
  './js/skills.js',
  './js/warmup.js',
  './js/mobility.js',
  './js/report.js',
  './js/strength.js',
  './js/ladders.js',
  './js/version.js',
  './js/views/today.js',
  './js/views/capture.js',
  './js/views/history.js',
  './js/views/favorites.js',
  './js/views/settings.js',
  './js/views/training.js',
  './js/views/plan.js',
  './js/views/progress.js',
  './js/views/setup.js',
  './js/views/mobility.js',
  './js/views/report.js',
  './js/views/photos.js',
  './js/views/strength.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // addAll bricht komplett ab, wenn eine Datei fehlt — deshalb einzeln,
      // damit ein fehlendes Icon nicht die ganze Installation kippt.
      .then((cache) => Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API-Aufrufe niemals cachen oder abfangen.
  if (url.origin !== self.location.origin) return;

  // Navigationen: erst Netz (frische Version), sonst der gecachte App-Shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./')))
    );
    return;
  }

  // Statische Dateien: erst das Netz, der Cache ist die Rückfalllösung.
  //
  // Vorher lief das andersherum — aus dem Cache und im Hintergrund auffrischen.
  // Das ist schneller, hat aber eine unangenehme Folge: eine neue Fassung wird
  // beim Öffnen zwar geladen, aber erst beim übernächsten Start angezeigt. Auf
  // einem Handy, das die App tagelang im Hintergrund hält, kann das ewig dauern.
  // Die App ist klein genug, dass der Netzweg nicht auffällt, und ohne Netz
  // greift weiterhin der Cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
