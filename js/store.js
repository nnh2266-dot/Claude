/**
 * Lokale Datenhaltung in IndexedDB. Nichts verlässt das Gerät.
 *
 * Stores:
 *   meals     — Mahlzeiten, Index 'by-date' auf den lokalen Datumsschlüssel
 *   favorites — wiederverwendbare Mahlzeiten
 *   sessions  — Trainingseinheiten, ein Eintrag je Tag
 *   weights   — Körpergewicht, ein Eintrag je Tag
 *   mobility  — Beweglichkeitstests, ein Eintrag je Messtag
 *   settings  — Key/Value (apiKey, model, goals, profile, plan, kcalAdjust,
 *               skillLevels)
 */

import { DEFAULT_GOALS, sumItems, newId, localDateKey } from './nutrition.js';

const DB_NAME = 'naehrwert';
const DB_VERSION = 3;

export const DEFAULT_MODEL = 'claude-haiku-4-5';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('meals')) {
        const meals = db.createObjectStore('meals', { keyPath: 'id' });
        meals.createIndex('by-date', 'date');
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      // Ab Version 2: Training. Läuft auch als Nachrüstung über eine
      // bestehende Datenbank, ohne die Mahlzeiten anzufassen.
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('weights')) {
        db.createObjectStore('weights', { keyPath: 'date' });
      }
      // Ab Version 3: Beweglichkeitstests. Wieder nur ein zusätzlicher Store,
      // alles Bestehende bleibt unangetastet.
      if (!db.objectStoreNames.contains('mobility')) {
        db.createObjectStore('mobility', { keyPath: 'date' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

/** Führt `fn(store)` in einer Transaktion aus und liefert das Request-Ergebnis. */
async function tx(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    try {
      result = fn(store);
    } catch (err) {
      transaction.abort();
      reject(err);
      return;
    }
    // Bei einem IDBRequest zählt sein Ergebnis. Fehlt der Datensatz, ist das
    // `undefined` — vorher kam in dem Fall das Request-Objekt selbst zurück,
    // und das ist wahrheitswertig, sieht also aus wie ein Treffer.
    transaction.oncomplete = () =>
      resolve(result instanceof IDBRequest ? result.result : result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Transaktion abgebrochen'));
  });
}

/* ---------------- Einstellungen ---------------- */

export async function getSettings() {
  const rows = await tx('settings', 'readonly', (s) => s.getAll());
  const raw = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
  return {
    apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '',
    model: typeof raw.model === 'string' && raw.model ? raw.model : DEFAULT_MODEL,
    goals: { ...DEFAULT_GOALS, ...(raw.goals && typeof raw.goals === 'object' ? raw.goals : {}) },
  };
}

export async function setSetting(key, value) {
  await tx('settings', 'readwrite', (s) => s.put({ key, value }));
}

/* ---------------- Entwurf ----------------
   Eine angefangene Mahlzeit überlebt damit einen Neustart der App. Wichtig für
   den Weg über die Claude-App: beim Wechseln in eine andere App wird eine
   Web-App oft aus dem Speicher geworfen und startet beim Zurückkommen neu.
-------------------------------------------- */

export async function saveDraft(draft) {
  await setSetting('draft', draft);
}

export async function loadDraft() {
  const row = await tx('settings', 'readonly', (s) => s.get('draft'));
  return row ? row.value : null;
}

export async function clearStoredDraft() {
  await tx('settings', 'readwrite', (s) => s.delete('draft'));
}

/* ---------------- Mahlzeiten ---------------- */

/** Normalisiert eine Mahlzeit und rechnet die Summen frisch nach. */
function normaliseMeal(meal) {
  const items = (meal.items || []).map((it) => ({
    name: String(it.name ?? '').trim() || 'Komponente',
    grams: Number(it.grams) || 0,
    kcal: Number(it.kcal) || 0,
    protein: Number(it.protein) || 0,
    carbs: Number(it.carbs) || 0,
    fat: Number(it.fat) || 0,
  }));

  const timestamp = Number(meal.timestamp) || Date.now();

  return {
    id: meal.id || newId(),
    // Der Datumsschlüssel folgt immer dem Zeitstempel, damit beides nicht auseinanderläuft.
    date: meal.date || localDateKey(timestamp),
    timestamp,
    mealType: meal.mealType || 'snack',
    name: String(meal.name ?? '').trim() || 'Mahlzeit',
    items,
    totals: sumItems(items),
    note: String(meal.note ?? ''),
    photo: meal.photo instanceof Blob ? meal.photo : null,
    thumb: meal.thumb instanceof Blob ? meal.thumb : null,
    source: meal.source || 'manual',
    confidence: meal.confidence || null,
  };
}

export async function saveMeal(meal) {
  const record = normaliseMeal(meal);
  await tx('meals', 'readwrite', (s) => s.put(record));
  return record;
}

export async function getMeal(id) {
  return tx('meals', 'readonly', (s) => s.get(id));
}

export async function deleteMeal(id) {
  await tx('meals', 'readwrite', (s) => s.delete(id));
}

/** Alle Mahlzeiten eines Tages, zeitlich sortiert. */
export async function getMealsByDate(dateKey) {
  const rows = await tx('meals', 'readonly', (s) =>
    s.index('by-date').getAll(IDBKeyRange.only(dateKey))
  );
  return (rows || []).sort((a, b) => a.timestamp - b.timestamp);
}

/** Alle Mahlzeiten in einem Datumsbereich (beide Grenzen inklusive). */
export async function getMealsInRange(startKey, endKey) {
  const rows = await tx('meals', 'readonly', (s) =>
    s.index('by-date').getAll(IDBKeyRange.bound(startKey, endKey))
  );
  return (rows || []).sort((a, b) => a.timestamp - b.timestamp);
}

export async function countMeals() {
  const n = await tx('meals', 'readonly', (s) => s.count());
  return n || 0;
}

/* ---------------- Favoriten ---------------- */

export async function listFavorites() {
  const rows = await tx('favorites', 'readonly', (s) => s.getAll());
  return (rows || []).sort((a, b) => (b.usedAt || 0) - (a.usedAt || 0));
}

export async function saveFavorite(fav) {
  const items = (fav.items || []).map((it) => ({
    name: String(it.name ?? '').trim() || 'Komponente',
    grams: Number(it.grams) || 0,
    kcal: Number(it.kcal) || 0,
    protein: Number(it.protein) || 0,
    carbs: Number(it.carbs) || 0,
    fat: Number(it.fat) || 0,
  }));

  const record = {
    id: fav.id || newId(),
    name: String(fav.name ?? '').trim() || 'Favorit',
    mealType: fav.mealType || 'snack',
    items,
    totals: sumItems(items),
    usedAt: Number(fav.usedAt) || Date.now(),
  };

  await tx('favorites', 'readwrite', (s) => s.put(record));
  return record;
}

export async function deleteFavorite(id) {
  await tx('favorites', 'readwrite', (s) => s.delete(id));
}

/* ---------------- Training ----------------
   Profil und Plan liegen in den Einstellungen, weil es von beidem genau eines
   gibt. Einheiten und Gewichte bekommen eigene Stores, weil sie mit der Zeit
   wachsen und nach Datum abgefragt werden.
-------------------------------------------- */

export async function getTrainingProfile() {
  const row = await tx('settings', 'readonly', (s) => s.get('profile'));
  return row ? row.value : null;
}

export async function setTrainingProfile(profile) {
  await setSetting('profile', profile);
}

export async function getPlan() {
  const row = await tx('settings', 'readonly', (s) => s.get('plan'));
  return row ? row.value : null;
}

export async function setPlan(plan) {
  await setSetting('plan', plan);
}

/** Erreichte Stufe je Fähigkeit: { handstand: 2, lsit: 0 }. */
export async function getSkillLevels() {
  const row = await tx('settings', 'readonly', (s) => s.get('skillLevels'));
  return (row && row.value) || {};
}

export async function setSkillLevel(skillId, index) {
  const levels = await getSkillLevels();
  levels[skillId] = Math.max(0, Number(index) || 0);
  await setSetting('skillLevels', levels);
  return levels;
}

export async function getKcalAdjust() {
  const row = await tx('settings', 'readonly', (s) => s.get('kcalAdjust'));
  return Number(row ? row.value : 0) || 0;
}

export async function setKcalAdjust(value) {
  await setSetting('kcalAdjust', Number(value) || 0);
}

/**
 * Eine Trainingseinheit.
 * `entries` ist { übungsId: [{ weight, reps }] } — die Satzliste behält ihre
 * Löcher, damit ein übersprungener Satz nicht die folgenden verschiebt.
 */
export async function getSession(dateKey) {
  const row = await tx('sessions', 'readonly', (s) => s.get(dateKey));
  return row && row.entries ? row : null;
}

export async function saveSession(session) {
  const record = {
    date: session.date,
    dayName: String(session.dayName || ''),
    template: session.template || null,
    entries: session.entries || {},
    // Technikarbeit: je Fähigkeit eine Liste aus Sekunden oder Wiederholungen
    skills: session.skills || {},
    done: !!session.done,
    updatedAt: Date.now(),
  };
  await tx('sessions', 'readwrite', (s) => s.put(record));
  return record;
}

export async function listSessions() {
  const rows = await tx('sessions', 'readonly', (s) => s.getAll());
  return (rows || []).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function deleteSession(dateKey) {
  await tx('sessions', 'readwrite', (s) => s.delete(dateKey));
}

/** Körpergewicht. Ein Wert je Tag; ein zweiter überschreibt den ersten. */
export async function saveWeight(dateKey, kg) {
  const record = { date: dateKey, kg: Math.round(Number(kg) * 10) / 10 };
  await tx('weights', 'readwrite', (s) => s.put(record));
  return record;
}

export async function listWeights() {
  const rows = await tx('weights', 'readonly', (s) => s.getAll());
  return (rows || []).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function deleteWeight(dateKey) {
  await tx('weights', 'readwrite', (s) => s.delete(dateKey));
}

/* ---------------- Beweglichkeit ----------------
   Ein Eintrag je Messtag: { date, results: { testId: { links, rechts } } }
------------------------------------------------- */

export async function saveMobilityTest(dateKey, results) {
  const record = { date: dateKey, results: results || {}, savedAt: Date.now() };
  await tx('mobility', 'readwrite', (s) => s.put(record));
  return record;
}

export async function listMobilityTests() {
  const rows = await tx('mobility', 'readonly', (s) => s.getAll());
  return (rows || []).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function deleteMobilityTest(dateKey) {
  await tx('mobility', 'readwrite', (s) => s.delete(dateKey));
}

/* ---------------- Export / Import / Löschen ---------------- */

/**
 * Exportiert Mahlzeiten, Favoriten und Ziele als JSON.
 * Fotos bleiben bewusst außen vor — sie würden die Datei um ein Vielfaches
 * aufblähen. Der API-Key wird nie exportiert.
 */
export async function exportData() {
  const [meals, favorites, settings, profile, plan, kcalAdjust, sessions, weights] =
    await Promise.all([
      tx('meals', 'readonly', (s) => s.getAll()),
      listFavorites(),
      getSettings(),
      getTrainingProfile(),
      getPlan(),
      getKcalAdjust(),
      listSessions(),
      listWeights(),
    ]);
  const skillLevels = await getSkillLevels();
  const mobility = await listMobilityTests();

  return {
    format: 'naehrwert-export',
    version: 2,
    exportedAt: new Date().toISOString(),
    goals: settings.goals,
    meals: (meals || []).map(({ photo, thumb, ...rest }) => rest),
    favorites,
    profile,
    plan,
    kcalAdjust,
    skillLevels,
    sessions,
    weights,
    mobility,
  };
}

/**
 * Importiert eine Exportdatei. Vorhandene Einträge mit gleicher ID werden
 * überschrieben, alles andere bleibt erhalten.
 */
export async function importData(data) {
  if (!data || data.format !== 'naehrwert-export') {
    throw new Error('Das ist keine gültige Nährwerte-Exportdatei.');
  }

  let meals = 0;
  let favorites = 0;
  let sessions = 0;
  let weights = 0;

  for (const meal of Array.isArray(data.meals) ? data.meals : []) {
    await saveMeal(meal);
    meals++;
  }
  for (const fav of Array.isArray(data.favorites) ? data.favorites : []) {
    await saveFavorite(fav);
    favorites++;
  }
  if (data.goals && typeof data.goals === 'object') {
    const current = await getSettings();
    await setSetting('goals', { ...current.goals, ...data.goals });
  }

  // Ab Version 2 stecken Training und Gewicht mit in der Datei. Ältere
  // Sicherungen haben diese Felder nicht — dann bleibt hier einfach alles leer.
  for (const session of Array.isArray(data.sessions) ? data.sessions : []) {
    if (!session || !session.date) continue;
    await saveSession(session);
    sessions++;
  }
  for (const entry of Array.isArray(data.weights) ? data.weights : []) {
    if (!entry || !entry.date || !Number(entry.kg)) continue;
    await saveWeight(entry.date, entry.kg);
    weights++;
  }
  if (data.profile && typeof data.profile === 'object') await setTrainingProfile(data.profile);
  if (data.plan && typeof data.plan === 'object') await setPlan(data.plan);
  if (typeof data.kcalAdjust === 'number') await setKcalAdjust(data.kcalAdjust);
  if (data.skillLevels && typeof data.skillLevels === 'object') {
    await setSetting('skillLevels', data.skillLevels);
  }
  for (const eintrag of Array.isArray(data.mobility) ? data.mobility : []) {
    if (eintrag && eintrag.date) await saveMobilityTest(eintrag.date, eintrag.results);
  }

  return { meals, favorites, sessions, weights };
}

/** Löscht alle Mahlzeiten und Favoriten. Einstellungen bleiben erhalten. */
export async function clearEntries() {
  await tx('meals', 'readwrite', (s) => s.clear());
  await tx('favorites', 'readwrite', (s) => s.clear());
}

/** Löscht Trainingsplan, Einheiten und Gewichtsverlauf. */
export async function clearTraining() {
  await tx('sessions', 'readwrite', (s) => s.clear());
  await tx('weights', 'readwrite', (s) => s.clear());
  await tx('mobility', 'readwrite', (s) => s.clear());
  await tx('settings', 'readwrite', (s) => {
    s.delete('profile');
    s.delete('plan');
    s.delete('kcalAdjust');
    s.delete('skillLevels');
  });
}

/** Löscht wirklich alles, inklusive API-Key, Zielen und Training. */
export async function clearEverything() {
  await clearEntries();
  await tx('sessions', 'readwrite', (s) => s.clear());
  await tx('weights', 'readwrite', (s) => s.clear());
  await tx('mobility', 'readwrite', (s) => s.clear());
  await tx('settings', 'readwrite', (s) => s.clear());
}
