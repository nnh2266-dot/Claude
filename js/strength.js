/**
 * Krafteinordnung je Muskelgruppe.
 *
 * Zwei Fragen werden hier beantwortet: Wie stark ist eine Gruppe gemessen am
 * eigenen Körpergewicht, und wie stehen die Gruppen zueinander.
 *
 * Der Bezug aufs Körpergewicht ist der Kern. 80 kg Bankdrücken heißt bei 60 kg
 * Körpergewicht etwas anderes als bei 100 kg, und zwanzig Liegestütze sind für
 * einen schweren Körper mehr Arbeit als für einen leichten — beim Körpergewicht
 * steckt der Bezug schon in der Übung.
 *
 * Die Richtwerte sind grob. Sie stammen aus den üblichen Kraftstandards und
 * schwanken mit Alter, Hebelverhältnissen und Trainingsjahren. Sie taugen dafür
 * zu sagen „hier bist du weit, dort hinkst du hinterher" — nicht dafür, sich mit
 * anderen zu vergleichen.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

import { exerciseById, EXERCISES, GROUP_LABEL } from './training.js';

export const NIVEAUS = [
  { ab: 90, name: 'Sehr stark' },
  { ab: 75, name: 'Stark' },
  { ab: 50, name: 'Fortgeschritten' },
  { ab: 25, name: 'Geübt' },
  { ab: 0,  name: 'Anfang' },
];

export function niveauFor(punkte) {
  return NIVEAUS.find((n) => punkte >= n.ab) || NIVEAUS[NIVEAUS.length - 1];
}

/**
 * Richtwerte je Übung. Fünf Stützpunkte für 0, 25, 50, 75 und 100 Punkte.
 *
 *   art 'last' — geschätztes Einwiederholungsmaximum geteilt durch das
 *                Körpergewicht. Bei Kurzhanteln gilt die Zahl je Hantel.
 *   art 'wdh'  — Wiederholungen eines sauberen Satzes ohne Zusatzgewicht.
 *
 * Übungen ohne Eintrag bekommen keine Einordnung. Das ist Absicht: für
 * Handtuch-Rudern im Sitzen gibt es keinen Richtwert, weil der Widerstand aus
 * den eigenen Beinen kommt und niemand weiß, wie fest jemand dagegenhält.
 * Lieber keine Zahl als eine erfundene.
 */
export const STANDARDS = {
  /* Brust */
  bp:       { art: 'last', werte: [0.50, 0.75, 1.00, 1.25, 1.50] },
  incbb:    { art: 'last', werte: [0.40, 0.60, 0.80, 1.00, 1.20] },
  bpdb:     { art: 'last', werte: [0.20, 0.30, 0.40, 0.50, 0.60] },
  incdb:    { art: 'last', werte: [0.17, 0.26, 0.35, 0.44, 0.53] },
  pushup:   { art: 'wdh',  werte: [5, 15, 25, 40, 60] },
  pushele:  { art: 'wdh',  werte: [8, 20, 35, 50, 70] },
  pseudopu: { art: 'wdh',  werte: [3, 8, 15, 25, 35] },
  dips:     { art: 'wdh',  werte: [1, 5, 12, 20, 30] },

  /* Rücken */
  pullup:   { art: 'wdh',  werte: [1, 5, 10, 15, 22] },
  negpull:  { art: 'wdh',  werte: [1, 3, 6, 10, 15] },
  bbrow:    { art: 'last', werte: [0.40, 0.60, 0.80, 1.00, 1.25] },
  latpull:  { art: 'last', werte: [0.40, 0.60, 0.80, 1.00, 1.20] },
  dbrow:    { art: 'last', werte: [0.20, 0.30, 0.40, 0.50, 0.60] },
  invrow:   { art: 'wdh',  werte: [5, 12, 20, 30, 40] },
  tablerow: { art: 'wdh',  werte: [5, 12, 20, 30, 40] },
  towelrow: { art: 'wdh',  werte: [8, 15, 25, 35, 50] },

  /* Beine vorne */
  squat:    { art: 'last', werte: [0.75, 1.25, 1.50, 2.00, 2.50] },
  goblet:   { art: 'last', werte: [0.25, 0.40, 0.55, 0.70, 0.90] },
  legpress: { art: 'last', werte: [1.00, 1.75, 2.50, 3.25, 4.00] },
  bulg:     { art: 'wdh',  werte: [8, 15, 22, 30, 40] },
  lunge:    { art: 'wdh',  werte: [10, 20, 30, 40, 55] },
  bwsq:     { art: 'wdh',  werte: [15, 30, 50, 75, 100] },
  stepup:   { art: 'wdh',  werte: [10, 18, 26, 35, 45] },

  /* Beine hinten */
  dl:       { art: 'last', werte: [1.00, 1.50, 2.00, 2.50, 3.00] },
  rdl:      { art: 'last', werte: [0.75, 1.15, 1.50, 1.90, 2.30] },
  nordic:   { art: 'wdh',  werte: [1, 3, 6, 10, 15] },

  /* Gesäß */
  hipth:    { art: 'last', werte: [0.75, 1.25, 1.75, 2.25, 2.75] },
  gbridge:  { art: 'wdh',  werte: [15, 25, 40, 60, 80] },

  /* Schultern */
  ohp:      { art: 'last', werte: [0.35, 0.55, 0.70, 0.90, 1.10] },
  dbohp:    { art: 'last', werte: [0.15, 0.22, 0.30, 0.38, 0.45] },
  pikepu:   { art: 'wdh',  werte: [3, 8, 15, 25, 35] },

  /* Bizeps */
  chinup:   { art: 'wdh',  werte: [1, 6, 12, 18, 25] },
  bbcurl:   { art: 'last', werte: [0.20, 0.30, 0.40, 0.50, 0.60] },
  dbcurl:   { art: 'last', werte: [0.09, 0.13, 0.18, 0.22, 0.27] },

  /* Trizeps */
  cgbp:     { art: 'last', werte: [0.40, 0.60, 0.80, 1.00, 1.20] },
  diapu:    { art: 'wdh',  werte: [3, 10, 20, 30, 45] },
  benchdip: { art: 'wdh',  werte: [5, 15, 25, 35, 50] },

  /* Rumpf */
  hlr:      { art: 'wdh',  werte: [3, 8, 15, 22, 30] },
  abwheel:  { art: 'wdh',  werte: [3, 8, 15, 22, 30] },
};

/**
 * Frauen erreichen bezogen aufs Körpergewicht im Mittel niedrigere Werte,
 * am Oberkörper deutlicher als an den Beinen. Ohne diese Anpassung stünde bei
 * gleicher Leistung eine schlechtere Einordnung — und die wäre schlicht falsch.
 */
const OBERKOERPER = new Set(['brust', 'ruecken', 'schulter', 'sdelt', 'rdelt', 'bizeps', 'trizeps']);
const FRAUEN_FAKTOR = { oben: 0.65, unten: 0.80 };

function faktorFor(exercise, profile) {
  if (!profile || profile.sex !== 'w') return 1;
  return OBERKOERPER.has(exercise.group) ? FRAUEN_FAKTOR.oben : FRAUEN_FAKTOR.unten;
}

/** Linear zwischen den Stützpunkten, außerhalb abgeschnitten. */
function punkteAus(werte, wert) {
  const stufen = [0, 25, 50, 75, 100];
  if (wert <= werte[0]) return Math.max(0, Math.min(25, Math.round((wert / werte[0]) * 25)));
  if (wert >= werte[4]) return 100;
  for (let i = 1; i < werte.length; i += 1) {
    if (wert <= werte[i]) {
      const anteil = (wert - werte[i - 1]) / (werte[i] - werte[i - 1]);
      return Math.round(stufen[i - 1] + anteil * (stufen[i] - stufen[i - 1]));
    }
  }
  return 100;
}

/**
 * Geschätztes Einwiederholungsmaximum nach Epley.
 *
 * Die Formel taugt bis etwa zwölf Wiederholungen; darüber überschätzt sie
 * kräftig. Deshalb wird gedeckelt — lieber eine vorsichtige Schätzung als eine
 * Bestleistung, die nie stattgefunden hat.
 */
export function estimate1RM(weight, reps) {
  return weight * (1 + Math.min(reps, 12) / 30);
}

/** Beste Leistung je Übung aus allen Einheiten. */
export function bestPerExercise(sessions) {
  const best = new Map();

  for (const session of sessions || []) {
    for (const [id, sets] of Object.entries(session.entries || {})) {
      for (const set of sets || []) {
        if (!set || !set.reps) continue;
        const weight = Number(set.weight) || 0;
        const score = weight > 0 ? estimate1RM(weight, set.reps) : set.reps;
        const vorher = best.get(id);
        if (!vorher || score > vorher.score) {
          best.set(id, { id, score, weight, reps: set.reps, date: session.date });
        }
      }
    }
  }
  return best;
}

/**
 * Einordnung einer einzelnen Übungsleistung.
 * @returns {{punkte: number, niveau: object, wert: number, art: string,
 *            naechstes: string|null}|null}
 */
export function rateExercise(id, leistung, profile) {
  const exercise = exerciseById(id);
  const standard = STANDARDS[id];
  if (!exercise || !standard || !leistung) return null;

  const koerper = profile?.weight || 0;
  const faktor = faktorFor(exercise, profile);
  const werte = standard.werte.map((w) => w * faktor);

  let wert;
  if (standard.art === 'last') {
    // Ohne Zusatzgewicht lässt sich eine Lastübung nicht einordnen.
    if (!leistung.weight || !koerper) return null;
    wert = estimate1RM(leistung.weight, leistung.reps) / koerper;
  } else {
    // Wer eine Körpergewichtsübung mit Zusatzgewicht macht, ist über den
    // Wiederholungsrichtwert hinaus — das rechnet die Tabelle nicht ab.
    if (leistung.weight > 0) return null;
    wert = leistung.reps;
  }

  const punkte = punkteAus(werte, wert);
  const naechsterIndex = werte.findIndex((w) => w > wert);
  const STUFEN = [0, 25, 50, 75, 100];

  return {
    punkte,
    niveau: niveauFor(punkte),
    wert,
    art: standard.art,
    ziel: naechsterIndex >= 0 ? werte[naechsterIndex] : null,
    zielNiveau: naechsterIndex >= 0 ? niveauFor(STUFEN[naechsterIndex]) : null,
    koerper,
  };
}

/**
 * Krafteinordnung je Muskelgruppe.
 *
 * Maßgeblich ist die bestbewertete Übung der Gruppe, nicht der Durchschnitt:
 * wer schwer Bankdrücken kann, hat eine starke Brust, auch wenn daneben ein
 * halbherziger Satz Fliegende steht.
 */
export function groupStrength(sessions, profile) {
  const best = bestPerExercise(sessions);
  const gruppen = new Map();

  for (const [id, leistung] of best) {
    const exercise = exerciseById(id);
    if (!exercise) continue;

    const bewertung = rateExercise(id, leistung, profile);
    const eintrag = gruppen.get(exercise.group) || {
      group: exercise.group,
      label: GROUP_LABEL[exercise.group] || exercise.group,
      bewertet: null,
      uebungen: [],
    };

    eintrag.uebungen.push({ id, name: exercise.name, leistung, bewertung });
    if (bewertung && (!eintrag.bewertet || bewertung.punkte > eintrag.bewertet.punkte)) {
      eintrag.bewertet = { id, name: exercise.name, leistung, ...bewertung };
    }
    gruppen.set(exercise.group, eintrag);
  }

  return [...gruppen.values()].sort((a, b) => {
    const pa = a.bewertet ? a.bewertet.punkte : -1;
    const pb = b.bewertet ? b.bewertet.punkte : -1;
    return pb - pa;
  });
}

/* ---------------- Verhältnisse ---------------- */

/*
 * Für die Verhältnisse zählen nur die großen Gruppen. Ein starker Curl würde
 * sonst die ganze Seite „Ziehen" hochziehen, obwohl der Rücken schwach ist —
 * der Bizeps steuert wenig zur eigentlichen Zugkraft bei, wiegt im Mittelwert
 * aber genauso schwer wie der Rücken.
 */
const DRUECKEN = ['brust', 'schulter'];
const ZIEHEN = ['ruecken', 'rdelt'];
const OBEN = [...DRUECKEN, ...ZIEHEN];
const UNTEN = ['quad', 'ham', 'glute'];

function mittel(gruppen, welche) {
  const punkte = gruppen
    .filter((g) => welche.includes(g.group) && g.bewertet)
    .map((g) => g.bewertet.punkte);
  return punkte.length ? Math.round(punkte.reduce((a, b) => a + b, 0) / punkte.length) : null;
}

/**
 * Wie die Gruppen zueinander stehen.
 *
 * Der Vergleich braucht beide Seiten. Fehlt eine, kommt kein Befund — ein
 * Ungleichgewicht zwischen einer gemessenen und einer nie trainierten Seite
 * wäre keine Erkenntnis, sondern eine Datenlücke.
 */
export function balance(gruppen) {
  const befunde = [];

  const paar = (name, a, b, aName, bName, schwelle = 12) => {
    const pa = mittel(gruppen, a);
    const pb = mittel(gruppen, b);
    if (pa === null || pb === null) return;

    const diff = pa - pb;
    befunde.push({
      name,
      links: { label: aName, punkte: pa },
      rechts: { label: bName, punkte: pb },
      diff,
      schief: Math.abs(diff) >= schwelle,
      staerker: diff > 0 ? aName : bName,
      schwaecher: diff > 0 ? bName : aName,
    });
  };

  paar('Drücken und Ziehen', DRUECKEN, ZIEHEN, 'Drücken', 'Ziehen');
  paar('Oberkörper und Beine', OBEN, UNTEN, 'Oberkörper', 'Beine');

  return befunde;
}

/**
 * Sätze je Muskelgruppe in einem Zeitraum — zeigt, was schlicht nicht
 * trainiert wird. Ein Anteil sagt mehr als eine absolute Zahl, weil die von
 * der Zahl der Einheiten abhängt.
 */
export function setsByGroup(sessions, vonDatum) {
  const zaehler = new Map();
  let gesamt = 0;

  for (const session of sessions || []) {
    if (vonDatum && session.date < vonDatum) continue;
    for (const [id, sets] of Object.entries(session.entries || {})) {
      const exercise = exerciseById(id);
      if (!exercise) continue;
      const voll = (sets || []).filter((s) => s && s.reps).length;
      if (!voll) continue;
      zaehler.set(exercise.group, (zaehler.get(exercise.group) || 0) + voll);
      gesamt += voll;
    }
  }

  return {
    gesamt,
    gruppen: [...zaehler.entries()]
      .map(([group, saetze]) => ({
        group,
        label: GROUP_LABEL[group] || group,
        saetze,
        anteil: gesamt ? Math.round((saetze / gesamt) * 100) : 0,
      }))
      .sort((a, b) => b.saetze - a.saetze),
  };
}

/** Muskelgruppen, die im Plan stehen, aber im Zeitraum keinen Satz gesehen haben. */
export function neglected(plan, sessions, vonDatum) {
  if (!plan) return [];

  const imPlan = new Set();
  for (const tag of plan.days || []) {
    for (const p of tag.exercises || []) {
      const e = exerciseById(p.id);
      if (e) imPlan.add(e.group);
    }
  }

  const trainiert = new Set(setsByGroup(sessions, vonDatum).gruppen.map((g) => g.group));
  return [...imPlan]
    .filter((g) => !trainiert.has(g))
    .map((g) => ({ group: g, label: GROUP_LABEL[g] || g }));
}

/** Wie viele Übungen der App überhaupt einen Richtwert haben — für die Ehrlichkeit. */
export const RATED_COUNT = Object.keys(STANDARDS).length;
export const EXERCISE_COUNT = EXERCISES.length;
