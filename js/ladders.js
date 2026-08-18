/**
 * Variantenleitern für Übungen ohne Zusatzgewicht.
 *
 * Mit Hanteln ist die nächste Stufe einfach mehr Gewicht — das erledigt die
 * doppelte Progression. Ohne Gewicht gibt es diesen Weg nicht: irgendwann sind
 * sechzig Liegestütze kein Krafttraining mehr, sondern Ausdauer. Dann muss die
 * Übung schwerer werden, nicht länger.
 *
 * Jede Leiter beschreibt eine Bewegung von leicht nach schwer. Sprossen, die
 * mit der vorhandenen Ausrüstung nicht gehen, werden beim Auf- und Absteigen
 * übersprungen statt vorgeschlagen und dann abgelehnt.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

import { exerciseById, isAvailable } from './training.js';

export const LADDERS = [
  {
    id: 'druecken-waagerecht',
    name: 'Drücken waagerecht',
    stufen: ['pushele', 'pushup', 'pseudopu', 'archerpu', 'onearmneg'],
  },
  {
    id: 'druecken-senkrecht',
    name: 'Drücken über Kopf',
    stufen: ['pikepu', 'hspuneg', 'hspu'],
  },
  {
    id: 'ziehen-waagerecht',
    name: 'Ziehen waagerecht',
    stufen: ['pronelat', 'towelsit', 'towelrow', 'tablerow', 'invrow'],
  },
  {
    id: 'ziehen-senkrecht',
    name: 'Ziehen über Kopf',
    stufen: ['negpull', 'chinup', 'pullup'],
  },
  {
    id: 'kniebeuge',
    name: 'Kniebeuge',
    stufen: ['bwsq', 'lunge', 'stepup', 'bulg', 'skater', 'pistol1'],
  },
  {
    id: 'hueftstreckung',
    name: 'Hüftstreckung',
    stufen: ['gbridge', 'gbridge1'],
  },
  {
    id: 'trizeps',
    name: 'Trizeps strecken',
    stufen: ['benchdip', 'diapu'],
  },
];

const LEITER_VON = new Map();
for (const leiter of LADDERS) {
  leiter.stufen.forEach((id, index) => LEITER_VON.set(id, { leiter, index }));
}

/**
 * Leiter und Position einer Übung.
 * @returns {{leiter: object, index: number}|null}
 */
export function ladderFor(exerciseId) {
  return LEITER_VON.get(exerciseId) || null;
}

/** Steht diese Übung überhaupt auf einer Leiter? */
export function hasLadder(exerciseId) {
  return LEITER_VON.has(exerciseId);
}

/**
 * Nächste machbare Sprosse in eine Richtung.
 *
 * @param {string} exerciseId
 * @param {object} profile
 * @param {number} richtung  +1 schwerer, -1 leichter
 * @returns {{exercise: object, index: number, leiter: object, uebersprungen: string[]}|null}
 */
export function neighbourRung(exerciseId, profile, richtung) {
  const stand = ladderFor(exerciseId);
  if (!stand) return null;

  const uebersprungen = [];

  for (let i = stand.index + richtung; i >= 0 && i < stand.leiter.stufen.length; i += richtung) {
    const kandidat = exerciseById(stand.leiter.stufen[i]);
    if (!kandidat) continue;

    // Die eigene Sperrliste zählt, die Liste der ausgewachsenen Übungen nicht:
    // beim Aufsteigen will man ja genau dorthin, und beim Absteigen ist eine
    // erledigte Stufe die richtige Antwort auf „das war zu viel".
    const passt = richtung > 0
      ? isAvailable(kandidat, profile)
      : isAvailable(kandidat, { ...profile, outgrown: [] });

    if (passt) {
      return { exercise: kandidat, index: i, leiter: stand.leiter, uebersprungen };
    }
    uebersprungen.push(kandidat.name);
  }

  return null;
}

export const harderRung = (id, profile) => neighbourRung(id, profile, +1);
export const easierRung = (id, profile) => neighbourRung(id, profile, -1);

/**
 * Aus einer Liste von Kandidaten den nehmen, der auf derselben Leiter am
 * nächsten liegt. Für den Unterwegs-Betrieb: wer den Tisch nicht hat, soll
 * eine Sprosse daneben bekommen und nicht irgendetwas aus derselben Gruppe.
 */
export function pickNearestRung(kandidaten, uebung) {
  if (!kandidaten || !kandidaten.length) return null;
  const stand = ladderFor(uebung && uebung.id);
  if (!stand) return kandidaten[0];

  return [...kandidaten]
    .map((k) => {
      const s = ladderFor(k.id);
      const gleicheLeiter = s && s.leiter.id === stand.leiter.id;
      return {
        k,
        abstand: gleicheLeiter ? Math.abs(s.index - stand.index) : 99,
        // Bei gleichem Abstand die leichtere Sprosse: der Tausch passiert,
        // weil etwas fehlt, nicht weil es zu leicht geworden wäre.
        richtung: gleicheLeiter && s.index > stand.index ? 1 : 0,
      };
    })
    .sort((a, b) => a.abstand - b.abstand || a.richtung - b.richtung)[0].k;
}

/** Mindestens so viele aufgezeichnete Sätze, damit eine Einheit zählt. */
const MIN_SAETZE = 2;

/**
 * Wie oft zuletzt in Folge alle Sätze am oberen Ende des Bereichs lagen.
 *
 * Gezählt wird über die Einheiten, in denen die Übung überhaupt vorkam — eine
 * Woche Pause unterbricht die Serie also nicht.
 *
 * Verlangt wird nicht die heutige Satzzahl, sondern dass alle aufgezeichneten
 * Sätze oben lagen und es mindestens zwei waren. Sonst risse die Serie jedes
 * Mal, wenn die Blockwoche wechselt: die Deload-Woche hat weniger Sätze als
 * die Woche davor, und die alte Einheit sähe rückwirkend unvollständig aus.
 */
export function topOutStreak(sessions, prescription, bisDatum) {
  const [, obere] = prescription.reps;

  const relevante = [...(sessions || [])]
    .filter((s) => s.date <= bisDatum && (s.entries || {})[prescription.id])
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  let serie = 0;
  for (const session of relevante) {
    const saetze = (session.entries[prescription.id] || []).filter((s) => s && s.reps);
    const obenAn = saetze.length >= MIN_SAETZE && saetze.every((s) => Number(s.reps) >= obere);
    if (!obenAn) break;
    serie += 1;
  }
  return serie;
}

/** Ab wann die App von sich aus die nächste Stufe vorschlägt. */
export const STREAK_FOR_NEXT = 2;
