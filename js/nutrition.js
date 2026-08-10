/**
 * Nährwert-Rechnen, Datums-Helfer und Aggregation.
 * Bewusst ohne DOM-Zugriff, damit alles einzeln prüfbar bleibt.
 */

export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Frühstück' },
  { id: 'lunch',     label: 'Mittagessen' },
  { id: 'dinner',    label: 'Abendessen' },
  { id: 'snack',     label: 'Snack' },
];

export const MEAL_TYPE_LABEL = Object.fromEntries(
  MEAL_TYPES.map((t) => [t.id, t.label])
);

export const DEFAULT_GOALS = { kcal: 2000, protein: 125, carbs: 225, fat: 67 };

/* ---------------- Datum ----------------
   Alles läuft über den *lokalen* Kalendertag. toISOString() wäre UTC und
   würde späte Mahlzeiten auf den falschen Tag schieben.
------------------------------------------ */

/** Lokales Datum als 'YYYY-MM-DD'. */
export function localDateKey(input = Date.now()) {
  const d = input instanceof Date ? input : new Date(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' → Date auf lokale Mitternacht. */
export function dateFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Verschiebt einen Datumsschlüssel um n Tage (auch negativ). */
export function shiftDateKey(key, n) {
  const d = dateFromKey(key);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

/** Die letzten n Tage inklusive `endKey`, aufsteigend sortiert. */
export function lastNDays(n, endKey = localDateKey()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(shiftDateKey(endKey, -i));
  return out;
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni',
                'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];

/** 'Heute' / 'Gestern' / 'Sa, 9. Aug.' */
export function formatDateKey(key, today = localDateKey()) {
  if (key === today) return 'Heute';
  if (key === shiftDateKey(today, -1)) return 'Gestern';
  if (key === shiftDateKey(today, 1)) return 'Morgen';
  const d = dateFromKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

/** Kurzform fürs Diagramm: 'Mo'. */
export function weekdayShort(key) {
  return WEEKDAYS[dateFromKey(key).getDay()];
}

/** 'HH:MM' aus einem Zeitstempel. */
export function formatTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ---------------- Zahlen ---------------- */

export function roundKcal(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
}

export function roundGram(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.round(v * 10) / 10;
}

/** Zahl aus einem Eingabefeld, mit Komma-Unterstützung. */
export function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value ?? '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : 0;
}

/** Zeigt Gramm ohne unnötige Nachkommastelle. */
export function formatGram(n) {
  const v = roundGram(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
}

/* ---------------- Aggregation ---------------- */

export const EMPTY_TOTALS = Object.freeze({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

/** Summiert die Komponenten einer Mahlzeit. */
export function sumItems(items = []) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const it of items) {
    t.kcal    += parseNumber(it.kcal);
    t.protein += parseNumber(it.protein);
    t.carbs   += parseNumber(it.carbs);
    t.fat     += parseNumber(it.fat);
  }
  return {
    kcal: roundKcal(t.kcal),
    protein: roundGram(t.protein),
    carbs: roundGram(t.carbs),
    fat: roundGram(t.fat),
  };
}

/** Summiert mehrere Mahlzeiten zu einer Tagessumme. */
export function sumMeals(meals = []) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const m of meals) {
    const mt = m.totals || sumItems(m.items);
    t.kcal    += parseNumber(mt.kcal);
    t.protein += parseNumber(mt.protein);
    t.carbs   += parseNumber(mt.carbs);
    t.fat     += parseNumber(mt.fat);
  }
  return {
    kcal: roundKcal(t.kcal),
    protein: roundGram(t.protein),
    carbs: roundGram(t.carbs),
    fat: roundGram(t.fat),
  };
}

/**
 * Skaliert alle Komponenten proportional — die wichtigste Korrektur:
 * "war eine kleinere Portion".
 */
export function scaleItems(items = [], factor = 1) {
  const f = Number(factor) || 0;
  return items.map((it) => ({
    ...it,
    grams:   roundGram(parseNumber(it.grams) * f),
    kcal:    roundKcal(parseNumber(it.kcal) * f),
    protein: roundGram(parseNumber(it.protein) * f),
    carbs:   roundGram(parseNumber(it.carbs) * f),
    fat:     roundGram(parseNumber(it.fat) * f),
  }));
}

/** Gruppiert Mahlzeiten nach Typ, in der Reihenfolge von MEAL_TYPES. */
export function groupByMealType(meals = []) {
  return MEAL_TYPES.map(({ id, label }) => {
    const list = meals
      .filter((m) => m.mealType === id)
      .sort((a, b) => a.timestamp - b.timestamp);
    return { id, label, meals: list, totals: sumMeals(list) };
  }).filter((g) => g.meals.length > 0);
}

/**
 * Makro-Vorschlag aus einem Kalorienziel.
 * Verteilung 25 % Eiweiß / 45 % Kohlenhydrate / 30 % Fett;
 * 4 kcal/g bei Eiweiß und Kohlenhydraten, 9 kcal/g bei Fett.
 */
export function macrosFromKcal(kcal) {
  const k = Math.max(0, parseNumber(kcal));
  return {
    protein: Math.round((k * 0.25) / 4),
    carbs:   Math.round((k * 0.45) / 4),
    fat:     Math.round((k * 0.30) / 9),
  };
}

/** Durchschnitte über eine Liste von Tagessummen (leere Tage zählen mit). */
export function averageTotals(dayTotals = []) {
  if (!dayTotals.length) return { ...EMPTY_TOTALS };
  const t = dayTotals.reduce(
    (acc, d) => ({
      kcal: acc.kcal + d.kcal,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const n = dayTotals.length;
  return {
    kcal: Math.round(t.kcal / n),
    protein: roundGram(t.protein / n),
    carbs: roundGram(t.carbs / n),
    fat: roundGram(t.fat / n),
  };
}

/** Eindeutige ID ohne externe Abhängigkeit. */
export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
