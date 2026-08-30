/**
 * Sport außerhalb des Krafttrainings: Laufen, Rad, Schwimmen und so weiter.
 *
 * Der Kalorienverbrauch wird über MET-Werte geschätzt — ein MET ist der
 * Umsatz im Sitzen, Laufen liegt je nach Tempo bei 8 bis 12. Die Formel
 * lautet `MET × 3,5 × kg / 200` Kalorien pro Minute.
 *
 * Das sind Schätzungen, und zwar großzügige: Laborwerte gelten für einen
 * Durchschnittskörper bei gleichmäßigem Tempo. Wer alle zwei Minuten an einer
 * Ampel steht, verbrennt weniger als die Zahl sagt. Deshalb steht überall
 * dabei, dass es eine Schätzung ist, und der Anrechnung aufs Tagesziel liegt
 * ein Abschlag zugrunde.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/**
 * `met` ist der Wert für mittlere Intensität; `stufen` verschiebt ihn nach
 * locker und hart. Wer eine Distanz eintragen kann, bekommt ein Feld dafür.
 */
export const ACTIVITIES = [
  { id: 'laufen',    name: 'Laufen',        met: 9.8,  distanz: true,  icon: '🏃' },
  { id: 'gehen',     name: 'Spazieren',     met: 3.5,  distanz: true,  icon: '🚶' },
  { id: 'wandern',   name: 'Wandern',       met: 6.0,  distanz: true,  icon: '🥾' },
  { id: 'rad',       name: 'Radfahren',     met: 7.5,  distanz: true,  icon: '🚴' },
  { id: 'schwimmen', name: 'Schwimmen',     met: 7.0,  distanz: true,  icon: '🏊' },
  { id: 'rudern',    name: 'Rudern',        met: 7.0,  distanz: true,  icon: '🚣' },
  { id: 'yoga',      name: 'Yoga',          met: 3.0,  distanz: false, icon: '🧘' },
  { id: 'klettern',  name: 'Klettern',      met: 8.0,  distanz: false, icon: '🧗' },
  { id: 'ballsport', name: 'Ballsport',     met: 7.0,  distanz: false, icon: '⚽' },
  { id: 'kampf',     name: 'Kampfsport',    met: 9.0,  distanz: false, icon: '🥋' },
  { id: 'tanzen',    name: 'Tanzen',        met: 5.5,  distanz: false, icon: '💃' },
  { id: 'sonstiges', name: 'Sonstiges',     met: 5.0,  distanz: false, icon: '✨' },
];

const BY_ID = new Map(ACTIVITIES.map((a) => [a.id, a]));

export function activityById(id) {
  return BY_ID.get(id) || null;
}

/** Intensität verschiebt den MET-Wert. */
export const INTENSITIES = {
  locker: { label: 'Locker', faktor: 0.75, hint: 'Unterhaltung möglich, Atmung ruhig.' },
  mittel: { label: 'Mittel', faktor: 1,    hint: 'Kurze Sätze gehen noch, Atmung geht hoch.' },
  hart:   { label: 'Hart',   faktor: 1.25, hint: 'Sprechen geht kaum, es brennt.' },
};

/**
 * Anteil des geschätzten Verbrauchs, der aufs Tagesziel kommt.
 *
 * Nicht die volle Zahl, aus zwei Gründen. Erstens überschätzen MET-Tabellen
 * regelmäßig. Zweitens steckt im Aktivitätsfaktor des Profils schon
 * Alltagsbewegung — ein Teil des Spaziergangs ist dort bereits eingerechnet.
 * Wer den Verbrauch voll dazuisst, wundert sich am Monatsende über die Waage.
 */
export const ANRECHNUNG = 0.7;

/**
 * Geschätzter Verbrauch in Kalorien.
 * @param {object} eintrag  { type, minutes, intensity }
 * @param {number} kg       Körpergewicht
 */
export function estimateKcal(eintrag, kg) {
  const art = activityById(eintrag.type);
  if (!art || !eintrag.minutes || !kg) return 0;
  const faktor = (INTENSITIES[eintrag.intensity] || INTENSITIES.mittel).faktor;
  const met = art.met * faktor;
  return Math.round((met * 3.5 * kg / 200) * eintrag.minutes);
}

/** Was tatsächlich zählt: eingetragener Wert vor Schätzung. */
export function kcalOf(eintrag, kg) {
  if (typeof eintrag.kcal === 'number' && eintrag.kcal > 0) return Math.round(eintrag.kcal);
  return estimateKcal(eintrag, kg);
}

/** Summe eines Tages, und wie viel davon aufs Ziel kommt. */
export function dayTotals(eintraege, kg) {
  const gesamt = (eintraege || []).reduce((s, e) => s + kcalOf(e, kg), 0);
  const minuten = (eintraege || []).reduce((s, e) => s + (e.minutes || 0), 0);
  return {
    kcal: gesamt,
    minuten,
    anrechnung: Math.round(gesamt * ANRECHNUNG),
    anzahl: (eintraege || []).length,
  };
}

/** Wochensumme je Sportart, für den Bericht. */
export function weekSummary(eintraege, kg) {
  const nach = new Map();
  for (const e of eintraege || []) {
    const art = activityById(e.type);
    if (!art) continue;
    const bisher = nach.get(e.type) || { type: e.type, name: art.name, minuten: 0, kcal: 0, anzahl: 0, km: 0 };
    bisher.minuten += e.minutes || 0;
    bisher.kcal += kcalOf(e, kg);
    bisher.km += e.km || 0;
    bisher.anzahl += 1;
    nach.set(e.type, bisher);
  }
  return [...nach.values()].sort((a, b) => b.minuten - a.minuten);
}

/** Tempo in Minuten pro Kilometer, wenn Strecke und Zeit da sind. */
export function pace(eintrag) {
  if (!eintrag.km || !eintrag.minutes) return null;
  const proKm = eintrag.minutes / eintrag.km;
  const min = Math.floor(proKm);
  const sek = Math.round((proKm - min) * 60);
  return `${min}:${String(sek).padStart(2, '0')} min/km`;
}
