/**
 * Lokale Datenhaltung in IndexedDB. Nichts verlässt das Gerät.
 *
 * Stores:
 *   meals     — Mahlzeiten, Index 'by-date' auf den lokalen Datumsschlüssel
 *   favorites — wiederverwendbare Mahlzeiten
 *   settings  — Key/Value (apiKey, model, goals)
 */

import { DEFAULT_GOALS, sumItems, newId, localDateKey } from './nutrition.js';

const DB_NAME = 'naehrwert';
const DB_VERSION = 1;

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
    transaction.oncomplete = () =>
      resolve(result && typeof result.result !== 'undefined' ? result.result : result);
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

/* ---------------- Export / Import / Löschen ---------------- */

/**
 * Exportiert Mahlzeiten, Favoriten und Ziele als JSON.
 * Fotos bleiben bewusst außen vor — sie würden die Datei um ein Vielfaches
 * aufblähen. Der API-Key wird nie exportiert.
 */
export async function exportData() {
  const [meals, favorites, settings] = await Promise.all([
    tx('meals', 'readonly', (s) => s.getAll()),
    listFavorites(),
    getSettings(),
  ]);

  return {
    format: 'naehrwert-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    goals: settings.goals,
    meals: (meals || []).map(({ photo, thumb, ...rest }) => rest),
    favorites,
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

  return { meals, favorites };
}

/** Löscht alle Mahlzeiten und Favoriten. Einstellungen bleiben erhalten. */
export async function clearEntries() {
  await tx('meals', 'readwrite', (s) => s.clear());
  await tx('favorites', 'readwrite', (s) => s.clear());
}

/** Löscht wirklich alles, inklusive API-Key und Zielen. */
export async function clearEverything() {
  await clearEntries();
  await tx('settings', 'readwrite', (s) => s.clear());
}
