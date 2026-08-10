/**
 * App-Kern: Routing, gemeinsamer Zustand, Bootstrap.
 *
 * Die Views bekommen einen Kontext übergeben statt app.js zu importieren —
 * das vermeidet Import-Zyklen.
 */

import { localDateKey } from './nutrition.js';
import { getSettings } from './store.js';
import { toast } from './ui.js';

import * as todayView from './views/today.js';
import * as captureView from './views/capture.js';
import * as historyView from './views/history.js';
import * as favoritesView from './views/favorites.js';
import * as settingsView from './views/settings.js';

const VIEWS = {
  today: todayView,
  capture: captureView,
  history: historyView,
  favorites: favoritesView,
  settings: settingsView,
};

const state = {
  date: localDateKey(),
  /** Entwurf für den Editor: { meal, photoBlob, thumbBlob, mode, error, analysing } */
  draft: null,
  settings: null,
};

let current = { name: null, param: null };

/* ---------------- Routing ---------------- */

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [name = 'today', param = null] = raw.split('/');
  return { name: VIEWS[name] ? name : 'today', param };
}

/** Navigiert zu einer Route, z. B. go('history') oder go('today', '2026-08-01'). */
function go(name, param) {
  const target = param ? `#/${name}/${param}` : `#/${name}`;
  if (location.hash === target) handleRoute();
  else location.hash = target;
}

async function handleRoute() {
  const route = parseHash();

  // Der Editor braucht einen Entwurf. Ohne einen (z. B. nach Neuladen der
  // Seite mit #/capture in der URL) geht es zurück auf die Tagesansicht.
  if (route.name === 'capture' && !state.draft) {
    go('today');
    return;
  }

  current = route;

  for (const [name] of Object.entries(VIEWS)) {
    const section = document.getElementById(`view-${name}`);
    if (section) section.hidden = name !== route.name;
  }

  for (const tab of document.querySelectorAll('.tab')) {
    const isCurrent = tab.dataset.tab === route.name;
    if (isCurrent) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }

  // Der Foto-Button gehört nur auf die Tagesansicht. In den Listen darunter
  // würde er sonst die Kalorienwerte am rechten Rand verdecken.
  const fab = document.getElementById('fab');
  if (fab) fab.hidden = route.name !== 'today';

  const container = document.getElementById(`view-${route.name}`);
  const view = VIEWS[route.name];

  try {
    await view.render(container, ctx, route.param);
  } catch (err) {
    console.error('Fehler beim Rendern der Ansicht:', err);
    toast('Etwas ist schiefgelaufen. Bitte Seite neu laden.', 'err');
  }

  window.scrollTo(0, 0);
}

/* ---------------- Kontext für die Views ---------------- */

const ctx = {
  state,

  go,

  /** Rendert die aktuelle Ansicht neu (z. B. nach dem Speichern). */
  reload: () => handleRoute(),

  /** Lädt die Einstellungen frisch aus der Datenbank. */
  async refreshSettings() {
    state.settings = await getSettings();
    return state.settings;
  },

  get settings() {
    return state.settings;
  },

  /** Setzt das angezeigte Datum und springt in die Tagesansicht. */
  setDate(dateKey) {
    state.date = dateKey;
    go('today');
  },

  /** Öffnet Kamera bzw. Fotoauswahl. Die Verarbeitung übernimmt capture.js. */
  pickPhoto() {
    const input = document.getElementById('photo-input');
    if (!input) return;
    input.value = '';
    input.click();
  },

  /** Startet den Editor mit einem Entwurf. */
  openEditor(draft) {
    state.draft = draft;
    go('capture');
  },

  clearDraft() {
    state.draft = null;
  },

  toast,
};

/* ---------------- Bootstrap ---------------- */

async function start() {
  state.settings = await getSettings();

  window.addEventListener('hashchange', handleRoute);

  document.getElementById('fab')?.addEventListener('click', () => ctx.pickPhoto());

  document.getElementById('photo-input')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) captureView.startFromFile(file, ctx);
  });

  if (!location.hash) location.hash = '#/today';
  await handleRoute();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // Registrierung nach dem ersten Rendern, damit sie nichts blockiert.
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {
        /* Offline-Betrieb ist optional — Fehler hier sind unkritisch. */
      });
    });
  }
}

start().catch((err) => {
  console.error('Start fehlgeschlagen:', err);
  document.getElementById('views').innerHTML =
    '<p style="padding:40px 16px;text-align:center">Die App konnte nicht starten. ' +
    'Bitte prüfe, ob dein Browser IndexedDB erlaubt (im privaten Modus ist das oft blockiert).</p>';
});
