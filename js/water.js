/**
 * Trinken.
 *
 * Der Richtwert lag schon lange im Energieplan, aber nur zum Anschauen. Damit
 * er etwas bedeutet, muss man eintragen können — und zwar in einem Tempo, das
 * neben dem Wasserhahn funktioniert: ein Tippen je Glas, keine Zahleneingabe.
 *
 * Über die Menge wird nicht dramatisiert. Der Körper reguliert Flüssigkeit gut,
 * und Durst ist ein brauchbarer Melder. Der Richtwert ist eine Orientierung für
 * Tage, an denen man das Trinken schlicht vergisst — nicht ein Ziel, dessen
 * Verfehlen bestraft gehört. Deshalb gibt es hier keine roten Balken.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/** Milliliter je Kilogramm Körpergewicht. */
export const ML_PRO_KG = 35;

/** Gängige Gefäße, in Millilitern. */
export const PORTIONEN = [
  { ml: 200, label: 'Glas', icon: '🥛' },
  { ml: 330, label: 'Flasche klein', icon: '🧃' },
  { ml: 500, label: 'Flasche', icon: '💧' },
  { ml: 750, label: 'Große Flasche', icon: '🍶' },
];

/**
 * Zusätzlicher Bedarf durch Schwitzen, in Millilitern je Minute Sport.
 *
 * Beim Schwitzen gehen je nach Hitze und Anstrengung 0,5 bis 2 Liter pro Stunde
 * verloren. Hier steht der untere Rand: rund zehn Milliliter je Minute. Lieber
 * zu wenig dazurechnen als jemandem eine Zahl hinstellen, die er gar nicht
 * schafft.
 */
export const ML_PRO_SPORTMINUTE = 10;

/**
 * Tagesrichtwert in Millilitern.
 *
 * @param {number} kg        Körpergewicht
 * @param {number} minuten   Sportminuten des Tages, Krafttraining eingeschlossen
 */
export function dailyGoal(kg, minuten = 0) {
  if (!kg) return null;
  const grund = kg * ML_PRO_KG;
  return Math.round((grund + Math.max(0, minuten) * ML_PRO_SPORTMINUTE) / 50) * 50;
}

/** „1,8 l" oder „350 ml". */
export function formatMl(ml) {
  if (typeof ml !== 'number' || !Number.isFinite(ml)) return '';
  if (ml < 1000) return `${Math.round(ml)} ml`;
  return `${(Math.round(ml / 100) / 10).toString().replace('.', ',')} l`;
}

/**
 * Einordnung des Tagesstandes.
 *
 * Bewusst mild formuliert und nach oben offen ohne Warnung: Wer viel trinkt,
 * hat in aller Regel kein Problem. Erst ab dem Doppelten des Richtwerts steht
 * ein Hinweis, und auch der ist nur ein Hinweis.
 */
export function rate(ml, ziel, { tagVorbei = false } = {}) {
  if (!ziel) return null;
  const anteil = ml / ziel;

  if (anteil >= 2) {
    return { art: 'sehrviel', text: 'Deutlich mehr als der Richtwert. Bei solchen Mengen '
      + 'lohnt ein Blick auf Salz und Elektrolyte, vor allem an heißen Tagen.' };
  }
  if (anteil >= 0.9) return { art: 'erreicht', text: 'Richtwert erreicht.' };
  if (anteil >= 0.6) {
    return tagVorbei
      ? { art: 'knapp', text: 'Etwas unter dem Richtwert geblieben.' }
      : { art: 'unterwegs', text: 'Gut unterwegs.' };
  }
  if (ml <= 0) return { art: 'leer', text: 'Heute noch nichts eingetragen.' };
  return tagVorbei
    ? { art: 'wenig', text: 'Deutlich unter dem Richtwert.' }
    : { art: 'anfang', text: 'Noch einiges offen.' };
}

/**
 * Wie viele Tage in Folge zuletzt der Richtwert erreicht wurde.
 * Wie bei der Lichtserie zählt der heutige Tag erst mit, wenn er erreicht ist —
 * sonst stünde vormittags jedes Mal eine Null.
 */
export function streak(eintraege, ziel, bisDatum, shift) {
  if (!ziel) return 0;
  const nach = new Map((eintraege || []).map((e) => [e.date, e]));
  const erreicht = (t) => (nach.get(t)?.ml || 0) >= ziel * 0.9;

  let serie = 0;
  let tag = erreicht(bisDatum) ? bisDatum : shift(bisDatum, -1);
  for (let i = 0; i < 400; i += 1) {
    if (!erreicht(tag)) break;
    serie += 1;
    tag = shift(tag, -1);
  }
  return serie;
}

/** Schnitt über die Tage, an denen überhaupt etwas eingetragen ist. */
export function average(eintraege, tage) {
  const nach = new Map((eintraege || []).map((e) => [e.date, e]));
  const werte = (tage || []).map((t) => nach.get(t)?.ml).filter((v) => typeof v === 'number' && v > 0);
  if (!werte.length) return null;
  return {
    schnitt: Math.round(werte.reduce((a, b) => a + b, 0) / werte.length),
    tage: werte.length,
  };
}
