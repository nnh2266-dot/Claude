/**
 * App-Kern: Routing, gemeinsamer Zustand, Bootstrap.
 *
 * Die Views bekommen einen Kontext übergeben statt app.js zu importieren —
 * das vermeidet Import-Zyklen.
 */

import { localDateKey } from './nutrition.js';
import {
  getSettings, getTrainingProfile, getPlan, getKcalAdjust, getSkillLevels,
  listSessions, listWeights,
} from './store.js';
import { targetsForDate } from './energy.js';
import { toast } from './ui.js';

import * as todayView from './views/today.js';
import * as captureView from './views/capture.js';
import * as historyView from './views/history.js';
import * as favoritesView from './views/favorites.js';
import * as settingsView from './views/settings.js';
import * as trainingView from './views/training.js';
import * as planView from './views/plan.js';
import * as progressView from './views/progress.js';
import * as setupView from './views/setup.js';

const VIEWS = {
  today: todayView,
  capture: captureView,
  history: historyView,
  favorites: favoritesView,
  settings: settingsView,
  training: trainingView,
  plan: planView,
  progress: progressView,
  setup: setupView,
};

const state = {
  date: localDateKey(),
  /** Entwurf für den Editor: { meal, photoBlob, thumbBlob, mode, error, analysing } */
  draft: null,
  settings: null,
  /* Training — einmal geladen, danach über refreshTraining() aktuell gehalten. */
  profile: null,
  plan: null,
  kcalAdjust: 0,
  skillLevels: {},
  sessions: [],
  weights: [],
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

  // Der Reiter „Training" bleibt auch auf Plan, Fortschritt und Fragebogen
  // markiert — sonst sähe die Leiste unten aus, als wäre man nirgends.
  const TAB_OF = { plan: 'training', progress: 'training', setup: 'training' };
  const activeTab = TAB_OF[route.name] || route.name;
  for (const tab of document.querySelectorAll('.tab')) {
    if (tab.dataset.tab === activeTab) tab.setAttribute('aria-current', 'page');
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

  /** Lädt Profil, Plan, Einheiten und Gewichte neu. */
  async refreshTraining() {
    const [profile, plan, kcalAdjust, skillLevels, sessions, weights] = await Promise.all([
      getTrainingProfile(), getPlan(), getKcalAdjust(), getSkillLevels(),
      listSessions(), listWeights(),
    ]);
    Object.assign(state, { profile, plan, kcalAdjust, skillLevels, sessions, weights });
  },

  /**
   * Das Tagesziel für ein Datum. Mit Trainingsplan hängt es davon ab, ob an
   * dem Tag trainiert wird — sonst gelten die von Hand gesetzten Ziele.
   */
  goalsFor(dateKey) {
    return targetsForDate(state.profile, state.plan, state.kcalAdjust, dateKey, state.settings.goals);
  },

  /** Öffnet den Fragebogen, wahlweise mit den Werten eines bestehenden Profils. */
  startSetup(profile) {
    setupView.begin(profile || null);
    go('setup');
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
  await ctx.refreshTraining();

  window.addEventListener('hashchange', handleRoute);

  document.getElementById('fab')?.addEventListener('click', () => ctx.pickPhoto());

  document.getElementById('photo-input')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) captureView.startFromFile(file, ctx);
  });

  // Beim Wechsel in eine andere App wird eine Web-App oft aus dem Speicher
  // geworfen. Deshalb die angefangene Mahlzeit sichern, sobald die Seite in den
  // Hintergrund geht — das ist der letzte verlässliche Moment dafür.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) captureView.persistSession();
  });
  window.addEventListener('pagehide', () => captureView.persistSession());

  // Kam die App aus so einem Neustart zurück? Dann den Entwurf zurückholen.
  const restored = await captureView.restoreDraft(ctx);

  if (restored) location.hash = '#/capture';
  else if (!location.hash) location.hash = '#/today';

  await handleRoute();

  if (restored) toast('Angefangene Mahlzeit wiederhergestellt.');

  registerServiceWorker();
}

/**
 * Service Worker anmelden. Der Pfad ist bewusst relativ ('./sw.js'), damit der
 * Geltungsbereich im Unterordner bleibt, wenn die App nicht auf der Wurzel der
 * Domain liegt — sonst würde sie einer Nachbar-App dazwischenfunken.
 */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;

  const register = () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* Offline-Betrieb ist eine Zugabe — Fehler hier sind unkritisch. */
    });
  };

  // Nicht blind an 'load' hängen: bis hierher ist das Ereignis längst gefeuert,
  // ein danach angemeldeter Listener liefe nie und der Offline-Betrieb fiele
  // still aus.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

start().catch((err) => {
  console.error('Start fehlgeschlagen:', err);
  document.getElementById('views').innerHTML =
    '<p style="padding:40px 16px;text-align:center">Die App konnte nicht starten. ' +
    'Bitte prüfe, ob dein Browser IndexedDB erlaubt (im privaten Modus ist das oft blockiert).</p>';
});
