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
 * `met` ist der Wert für mittlere Intensität; die Intensitätsstufe verschiebt
 * ihn nach locker und hart. Wer eine Distanz eintragen kann, bekommt ein Feld
 * dafür.
 *
 * `hinweis` steht dort, wo „locker / mittel / hart" bei einer Sportart etwas
 * Bestimmtes heißt und man es sonst raten müsste.
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
  // Tennis getrennt vom übrigen Ballsport: Einzel und Doppel liegen weit
  // auseinander, und der Unterschied lässt sich über die Intensität abbilden —
  // locker trifft das Doppel, hart ein zügiges Einzel.
  { id: 'tennis',    name: 'Tennis',        met: 7.3,  distanz: false, icon: '🎾',
    hinweis: 'Locker trifft das Doppel, hart ein zügiges Einzel.' },
  // Golf gehörte bisher zum Ballsport und wurde damit mit MET 7 gerechnet —
  // also wie Fußball. Das ist deutlich zu hoch. Die Tabellenwerte liegen bei
  // 3,5 für eine Runde mit dem Cart, 4,8 für „Golf allgemein" und 5,3 für eine
  // Runde zu Fuß mit dem Bag. Mit 4,5 als Mittelwert treffen die drei
  // Intensitätsstufen genau diese drei Fälle: 3,4 — 4,5 — 5,6.
  //
  // Keine Strecke, obwohl eine gelaufene Runde acht bis elf Kilometer hat: Die
  // App würde daraus ein Tempo in Minuten je Kilometer rechnen, und das ist bei
  // einer Sportart, die zur Hälfte aus Stehen besteht, keine sinnvolle Zahl.
  { id: 'golf',      name: 'Golf',          met: 4.5,  distanz: false, icon: '⛳',
    hinweis: 'Locker heißt mit dem Cart, mittel zu Fuß in normalem Tempo, hart zu Fuß '
      + 'mit dem Bag. Gezählt wird die ganze Runde, Warten eingeschlossen — der '
      + 'Abschlag auf die Anrechnung fängt das auf.' },
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

/**
 * Wie stark eine Sportart fürs Trinken zählt.
 *
 * Der Trinkrichtwert rechnet zehn Milliliter je Sportminute dazu. Diese Zahl
 * kommt vom unteren Rand dessen, was beim Schwitzen verlorengeht — und sie
 * unterstellt, dass tatsächlich geschwitzt wird. Solange nur Laufen, Radfahren
 * und Ballsport in der Liste standen, ging das durch.
 *
 * Mit Golf geht es nicht mehr: Eine Runde dauert vier Stunden und hätte
 * 2,4 Liter obendrauf gelegt — mehr als der ganze Grundwert. Umgekehrt zählte
 * eine Stunde Yoga wie eine Stunde Laufen.
 *
 * Deshalb werden die Minuten nach Anstrengung gewichtet, mit sieben MET als
 * Bezugspunkt: Das ist der Bereich, für den die Schwitzmengen erhoben sind.
 * Nach unten bei 0,3 abgefangen — auch beim Yoga verliert man Wasser —, nach
 * oben bei 1,5, weil härter tatsächlich mehr schwitzt.
 */
export const SCHWITZ_BEZUG = 7;

export function schwitzFaktor(eintrag) {
  const art = activityById(eintrag?.type);
  if (!art) return 1;
  const met = art.met * (INTENSITIES[eintrag.intensity] || INTENSITIES.mittel).faktor;
  return Math.min(1.5, Math.max(0.3, met / SCHWITZ_BEZUG));
}

/**
 * Krafttraining zählt fürs Trinken etwas schwächer als eine Ausdauereinheit:
 * Ein großer Teil der Zeit ist Pause. Entspricht rund 5,5 MET.
 */
export const KRAFT_SCHWITZ = 0.8;

/** Summe eines Tages, und wie viel davon aufs Ziel kommt. */
export function dayTotals(eintraege, kg) {
  const gesamt = (eintraege || []).reduce((s, e) => s + kcalOf(e, kg), 0);
  const minuten = (eintraege || []).reduce((s, e) => s + (e.minutes || 0), 0);
  const schwitzen = (eintraege || [])
    .reduce((s, e) => s + (e.minutes || 0) * schwitzFaktor(e), 0);
  return {
    kcal: gesamt,
    minuten,
    // Nach Anstrengung gewichtete Minuten — nur fürs Trinkziel gedacht.
    schwitzen: Math.round(schwitzen),
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
  // Erst auf ganze Sekunden runden, dann teilen — sonst kommt bei 5,999 min/km
  // „5:60" heraus statt „6:00".
  const gesamt = Math.round(proKm * 60);
  const min = Math.floor(gesamt / 60);
  const sek = gesamt % 60;
  return `${min}:${String(sek).padStart(2, '0')} min/km`;
}
