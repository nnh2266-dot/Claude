/**
 * Lokale Datenhaltung in IndexedDB. Nichts verlässt das Gerät.
 *
 * Stores:
 *   meals     — Mahlzeiten, Index 'by-date' auf den lokalen Datumsschlüssel
 *   favorites — wiederverwendbare Mahlzeiten
 *   sessions  — Trainingseinheiten, ein Eintrag je Tag
 *   weights   — Körpergewicht, ein Eintrag je Tag
 *   mobility  — Beweglichkeitstests, ein Eintrag je Messtag
 *   photos    — Fortschrittsfotos, ein Eintrag je Aufnahmetag
 *   pending   — fotografierte Mahlzeiten, die noch auf die Auswertung warten
 *   activities— Sport außerhalb des Krafttrainings, Index 'by-date'
 *   sleep     — Schlaf und Morgenlicht, ein Eintrag je Nacht
 *   settings  — Key/Value (apiKey, model, goals, profile, plan, kcalAdjust,
 *               skillLevels)
 */

import { DEFAULT_GOALS, sumItems, newId, localDateKey } from './nutrition.js';

const DB_NAME = 'naehrwert';
const DB_VERSION = 7;

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
      // Ab Version 4: Fortschrittsfotos. Die Bilder liegen als Blob daneben,
      // nicht in den Mahlzeiten — sie haben mit Essen nichts zu tun und sollen
      // beim Aufräumen der Einträge nicht mit verschwinden.
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'date' });
      }
      // Ab Version 5: die Warteschlange für Fotos ohne Verbindung. Bewusst ein
      // eigener Store und nicht ein Eintrag in `meals` mit null Kalorien — ein
      // solcher Platzhalter würde in Tagessumme, Zielen und Berichten
      // mitzählen und die Zahlen still verfälschen.
      if (!db.objectStoreNames.contains('pending')) {
        const pending = db.createObjectStore('pending', { keyPath: 'id' });
        pending.createIndex('by-created', 'createdAt');
      }
      // Ab Version 6: Aktivitäten. Mehrere je Tag möglich — wer morgens läuft
      // und abends zum Yoga geht, soll beides eintragen können.
      if (!db.objectStoreNames.contains('activities')) {
        const acts = db.createObjectStore('activities', { keyPath: 'id' });
        acts.createIndex('by-date', 'date');
      }
      // Ab Version 7: Schlaf. Ein Eintrag je Nacht, unter dem Datum des
      // Aufwachens — dieselbe Sicht, in der man morgens denkt.
      if (!db.objectStoreNames.contains('sleep')) {
        db.createObjectStore('sleep', { keyPath: 'date' });
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
    // Unterwegs: der Plan wird auf das umgerechnet, was in einem leeren Zimmer geht.
    unterwegs: raw.unterwegs === true,
    // Pausenlänge: kurz, normal oder lang.
    pausen: ['kurz', 'normal', 'lang'].includes(raw.pausen) ? raw.pausen : 'normal',
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

/**
 * Die Felder werden einzeln übernommen und nicht der ganze Übergabewert
 * gespeichert — sonst landen Anzeigereste und halbe Zustände in der Datenbank.
 * Preis dafür: neue Felder müssen hier eingetragen werden, sonst fallen sie
 * still hinten runter.
 */
export async function saveSession(session) {
  const record = {
    date: session.date,
    dayName: String(session.dayName || ''),
    template: session.template || null,
    entries: session.entries || {},
    // Technikarbeit: je Fähigkeit eine Liste aus Sekunden oder Wiederholungen
    skills: session.skills || {},
    done: !!session.done,
    // Bewusst ausgelassen, mit Grund.
    skipped: !!session.skipped,
    reason: session.reason || null,
    // Diese Einheit holt einen ausgefallenen Tag nach …
    holtNach: session.holtNach || null,
    // … und dieser Tag wurde anderswo nachgeholt.
    movedTo: session.movedTo || null,
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

/* ---------------- Schlaf ---------------- */

/**
 * Eine Nacht speichern. Teilweise gefüllte Einträge sind normal und gewollt:
 * abends steht nur die Zubettgeh-Zeit, der Rest kommt am Morgen dazu.
 */
export async function saveSleep(eintrag) {
  const vorher = (await tx('sleep', 'readonly', (s) => s.get(eintrag.date))) || {};
  const record = {
    date: eintrag.date,
    zuBett: eintrag.zuBett !== undefined ? (eintrag.zuBett || null) : (vorher.zuBett || null),
    aufgewacht: eintrag.aufgewacht !== undefined
      ? (eintrag.aufgewacht || null) : (vorher.aufgewacht || null),
    licht: eintrag.licht !== undefined ? (eintrag.licht || null) : (vorher.licht || null),
    note: eintrag.note !== undefined ? (eintrag.note || '') : (vorher.note || ''),
    source: eintrag.source || vorher.source || 'manual',
    updatedAt: Date.now(),
  };
  await tx('sleep', 'readwrite', (s) => s.put(record));
  return record;
}

export async function getSleep(dateKey) {
  return tx('sleep', 'readonly', (s) => s.get(dateKey));
}

export async function listSleep() {
  const rows = await tx('sleep', 'readonly', (s) => s.getAll());
  return (rows || []).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function getSleepInRange(startKey, endKey) {
  return (await listSleep()).filter((e) => e.date >= startKey && e.date <= endKey);
}

export async function deleteSleep(dateKey) {
  await tx('sleep', 'readwrite', (s) => s.delete(dateKey));
}

/* ---------------- Aktivitäten ---------------- */

export async function saveActivity(activity) {
  const record = {
    id: activity.id || newId(),
    date: activity.date,
    type: activity.type,
    minutes: Number(activity.minutes) || 0,
    km: typeof activity.km === 'number' && activity.km > 0 ? activity.km : null,
    // Ein selbst eingetragener Verbrauch schlägt die Schätzung — etwa aus der
    // Uhr, die den Puls kennt.
    kcal: typeof activity.kcal === 'number' && activity.kcal > 0 ? Math.round(activity.kcal) : null,
    intensity: activity.intensity || 'mittel',
    note: activity.note || '',
    source: activity.source || 'manual',
    updatedAt: Date.now(),
  };
  await tx('activities', 'readwrite', (s) => s.put(record));
  return record;
}

export async function getActivitiesByDate(dateKey) {
  const rows = await tx('activities', 'readonly', (s) =>
    s.index('by-date').getAll(IDBKeyRange.only(dateKey))
  );
  return (rows || []).sort((a, b) => a.updatedAt - b.updatedAt);
}

export async function getActivitiesInRange(startKey, endKey) {
  const rows = await tx('activities', 'readonly', (s) =>
    s.index('by-date').getAll(IDBKeyRange.bound(startKey, endKey))
  );
  return (rows || []).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function listActivities() {
  const rows = await tx('activities', 'readonly', (s) => s.getAll());
  return (rows || []).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function deleteActivity(id) {
  await tx('activities', 'readwrite', (s) => s.delete(id));
}

/* ---------------- Warteschlange für Fotos ---------------- */

/**
 * Ein Foto aufheben, bis wieder eine Verbindung da ist.
 * Beschreibung und Datum reisen mit — sonst landet die Mahlzeit später am
 * falschen Tag, und der Hinweis fürs Schätzen wäre verloren.
 */
export async function queuePhoto({ dateKey, blob, thumb, hint = '', mealType = null }) {
  const record = {
    id: newId(), date: dateKey, blob, thumb: thumb || blob,
    hint, mealType, createdAt: Date.now(),
  };
  await tx('pending', 'readwrite', (s) => s.put(record));
  return record;
}

export async function listPending() {
  const rows = await tx('pending', 'readonly', (s) => s.getAll());
  return (rows || []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function countPending() {
  return (await tx('pending', 'readonly', (s) => s.count())) || 0;
}

export async function deletePending(id) {
  await tx('pending', 'readwrite', (s) => s.delete(id));
}

/* ---------------- Fortschrittsfotos ---------------- */

/**
 * Ein Foto je Tag. Ein zweites am selben Tag ersetzt das erste — sonst sammeln
 * sich zehn Aufnahmen einer Pose, und der Vergleich wird zur Suche.
 */
export async function saveProgressPhoto(dateKey, blob, thumbBlob, note = '') {
  const record = {
    date: dateKey, blob, thumb: thumbBlob || blob, note, savedAt: Date.now(),
  };
  await tx('photos', 'readwrite', (s) => s.put(record));
  return record;
}

export async function listProgressPhotos() {
  const rows = await tx('photos', 'readonly', (s) => s.getAll());
  return (rows || []).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function getProgressPhoto(dateKey) {
  return tx('photos', 'readonly', (s) => s.get(dateKey));
}

export async function deleteProgressPhoto(dateKey) {
  await tx('photos', 'readwrite', (s) => s.delete(dateKey));
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
  const activities = await listActivities();
  const sleep = await listSleep();

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
    activities,
    sleep,
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

  let activities = 0;
  for (const eintrag of Array.isArray(data.activities) ? data.activities : []) {
    if (!eintrag || !eintrag.date || !eintrag.type) continue;
    await saveActivity(eintrag);
    activities++;
  }

  for (const eintrag of Array.isArray(data.sleep) ? data.sleep : []) {
    if (eintrag && eintrag.date) await saveSleep(eintrag);
  }

  return { meals, favorites, sessions, weights, activities };
}

/** Löscht alle Mahlzeiten und Favoriten. Einstellungen bleiben erhalten. */
export async function clearEntries() {
  await tx('pending', 'readwrite', (s) => s.clear());
  await tx('meals', 'readwrite', (s) => s.clear());
  await tx('favorites', 'readwrite', (s) => s.clear());
}

/** Löscht Trainingsplan, Einheiten und Gewichtsverlauf. */
export async function clearTraining() {
  await tx('sessions', 'readwrite', (s) => s.clear());
  await tx('weights', 'readwrite', (s) => s.clear());
  await tx('mobility', 'readwrite', (s) => s.clear());
  await tx('photos', 'readwrite', (s) => s.clear());
  await tx('activities', 'readwrite', (s) => s.clear());
  await tx('sleep', 'readwrite', (s) => s.clear());
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
  await tx('photos', 'readwrite', (s) => s.clear());
  await tx('pending', 'readwrite', (s) => s.clear());
  await tx('activities', 'readwrite', (s) => s.clear());
  await tx('sleep', 'readwrite', (s) => s.clear());
  await tx('settings', 'readwrite', (s) => s.clear());
}
