/**
 * Trainingslogik — unverändert aus der Web-App übernommen.
 *
 * Grundregel: Alle Haltezeiten sind ein Anteil des gemessenen Maximums und
 * können es nie überschreiten. Die Stufe hebt den Anteil und macht die Einheit
 * dichter; länger halten geht erst, wenn ein Nachtest ein höheres Maximum ergibt.
 */

export const SESSION_SECONDS = 360;
export const RETEST_EVERY = 10; // nach so vielen Einheiten einen Nachtest vorschlagen

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Startstufe aus dem längsten Halteversuch des Eingangstests. */
export function levelFromHold(s: number): number {
  if (s < 3) return 1;
  if (s <= 5) return 2;
  if (s <= 8) return 3;
  if (s <= 12) return 4;
  if (s <= 20) return 5;
  return 6;
}

export interface Params {
  hold: number;
  longHold: number;
  step: number;
  rest: number;
  longRest: number;
  slowRelease: number;
  pulse: number;
  flickReps: number;
  setTarget: number;
  blockPause: number;
}

export function params(level: number, maxHold: number, flicks: number): Params {
  const g = level - 1;
  const m = Math.max(2, maxHold);
  // Nie über dem gemessenen Maximum — auch nicht durch die Untergrenze.
  const hold = Math.min(m, Math.max(2, Math.round(m * Math.min(0.65, 0.35 + g * 0.03))));
  const longHold = Math.min(m, Math.max(3, Math.round(m * Math.min(1.0, 0.65 + g * 0.04))));
  const step = clamp(Math.round(m * 0.22), 1, 3); // Stufenhöhe beim Aufzug
  const rest = clamp(Math.round(hold * Math.max(0.6, 1.6 - g * 0.09)), 2, 10);
  const longRest = clamp(Math.round(longHold * Math.max(0.5, 0.9 - g * 0.03)), 3, 15);
  const slowRelease = Math.max(4, Math.round(m * 0.6));
  const pulse = Math.max(6, Math.round(m * 1.2)); // halbe Kraft lässt sich länger halten
  const flickReps = Math.min(24, Math.max(8, flicks) + g * 2);
  const setTarget = Math.min(75, 45 + g * 3); // angestrebte Satzlänge in Sekunden
  const blockPause = Math.max(9, 15 - Math.floor(g / 2));
  return { hold, longHold, step, rest, longRest, slowRelease, pulse, flickReps, setTarget, blockPause };
}

/** Art einer Phase. `slow` und `pulse` zählen als Arbeit, nicht als Ruhe. */
export type PhaseKind = 'intro' | 'tense' | 'slow' | 'pulse' | 'release' | 'pause' | 'relax';

/** Eine Phase innerhalb einer Wiederholung: [Art, Beschriftung, Sekunden, Kreisgröße]. */
export type RepPhase = [PhaseKind, string, number, number];

export interface Exercise {
  id: string;
  /** Übersetzungsschlüssel für Name und Anleitung. */
  key: string;
  from: number; // Stufe, ab der die Übung freigeschaltet ist
  warmup?: boolean;
  rep: (p: Params) => RepPhase[];
  rest: (p: Params) => number;
  restKey: string;
}

export const EX: Record<string, Exercise> = {
  schnell: {
    id: 'schnell',
    key: 'quick',
    from: 1,
    warmup: true,
    rep: () => [['tense', 'tense', 1, 1]],
    rest: () => 1,
    restKey: 'loose',
  },
  halten: {
    id: 'halten',
    key: 'hold',
    from: 1,
    rep: (p) => [['tense', 'tense', p.hold, 1]],
    rest: (p) => p.rest,
    restKey: 'release',
  },
  lang: {
    id: 'lang',
    key: 'longHold',
    from: 1,
    rep: (p) => [['tense', 'tense', p.longHold, 1]],
    rest: (p) => p.longRest,
    restKey: 'release',
  },
  aufzug: {
    id: 'aufzug',
    key: 'elevator',
    from: 3,
    rep: (p) => [
      ['tense', 'step1', p.step, 0.72],
      ['tense', 'step2', p.step, 0.86],
      ['tense', 'step3', p.step, 1],
      ['tense', 'holdTop', Math.max(1, p.hold - p.step), 1],
      ['tense', 'step2', p.step, 0.86],
      ['tense', 'step1', p.step, 0.72],
    ],
    rest: (p) => p.rest + 2,
    restKey: 'releaseFully',
  },
  loesen: {
    id: 'loesen',
    key: 'slowRelease',
    from: 5,
    rep: (p) => [
      ['tense', 'tense', 2, 1],
      ['slow', 'releaseSlowly', p.slowRelease, 0.58],
    ],
    rest: (p) => p.rest,
    restKey: 'release',
  },
  pulsieren: {
    id: 'pulsieren',
    key: 'pulse',
    from: 7,
    rep: (p) => [['pulse', 'pulsing', p.pulse, 0.85]],
    rest: (p) => p.rest,
    restKey: 'release',
  },
};

export const ALL_EX: Exercise[] = [EX.schnell, EX.halten, EX.lang, EX.aufzug, EX.loesen, EX.pulsieren];

/** Freigeschaltet ist, was die Stufe erlaubt. */
export const unlocked = (level: number) => ALL_EX.filter((e) => e.from <= level);

/**
 * Welche Übungen sind heute dran? Der Schnellspanner wärmt immer auf, dazu
 * zwei weitere, die von Einheit zu Einheit durchrotieren.
 */
export function pickExercises(level: number, sessionNo: number): Exercise[] {
  const pool = unlocked(level).filter((e) => !e.warmup);
  const picked: Exercise[] = [];
  for (let i = 0; i < Math.min(2, pool.length); i++) {
    picked.push(pool[(sessionNo + i) % pool.length]);
  }
  return [EX.schnell, ...picked];
}

/** Eine Wiederholung dauert so lange: */
export const repSeconds = (ex: Exercise, p: Params) =>
  ex.rep(p).reduce((a, ph) => a + ph[2], 0);

/** Verteilt n Wiederholungen möglichst gleichmäßig auf mehrere Sätze. */
export function spread(n: number, sets: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < sets; i++) out.push(Math.floor(n / sets) + (i < n % sets ? 1 : 0));
  return out.filter((x) => x > 0);
}

/**
 * Wie viele Wiederholungen einer Übung passen in ein Zeitbudget?
 * Je Satz entfällt eine Pause: die letzte Wiederholung geht direkt in die
 * Satzpause bzw. in die nächste Ankündigung über.
 */
export function fitReps(ex: Exercise, p: Params, budget: number) {
  const repDur = repSeconds(ex, p);
  const rest = ex.rest(p);
  const perSet = clamp(Math.floor(p.setTarget / (repDur + rest)), 1, 12);
  const setsFor = (n: number) => Math.ceil(n / perSet);
  const cost = (n: number) =>
    n * repDur +
    Math.max(0, n - setsFor(n)) * rest +
    Math.max(0, setsFor(n) - 1) * p.blockPause;
  let n = 1;
  while (cost(n + 1) <= budget) n++;
  return { n, perSet, cost: cost(n) };
}

export interface Phase {
  kind: PhaseKind;
  /** Übersetzungsschlüssel der Beschriftung. */
  label: string;
  dur: number;
  /** Übungs-Id, zu der die Phase gehört. */
  exercise: string;
  set: number;
  of: number;
  scale: number;
  rep: number;
  reps: number;
  start: number;
  /** Nur bei Ankündigungen: Anleitung und Anzahl. */
  note?: { key: string; reps: number };
}

export interface Session {
  phases: Phase[];
  p: Params;
  total: number;
  plan: { ex: Exercise; n: number; perSet: number }[];
  list: Exercise[];
}

/** Baut die komplette Einheit als Phasenliste mit kumulativen Startzeiten. */
export function buildTimeline(
  level: number,
  maxHold: number,
  flicks: number,
  sessionNo = 0,
): Session {
  const p = params(level, maxHold, flicks);
  const list = pickExercises(level, sessionNo);
  const INTRO = p.blockPause; // Die Ankündigung ist zugleich die Pause davor.
  const MIN_CLOSING = 15;

  // Schnellspanner ist als Aufwärmen fest gesetzt, der Rest wird geteilt.
  const warmupCost = 2 * p.flickReps - 1;
  let remaining = SESSION_SECONDS - list.length * INTRO - warmupCost - MIN_CLOSING;

  const main = list.slice(1);
  const plan: { ex: Exercise; n: number; perSet: number }[] = [];
  main.forEach((ex, i) => {
    const share = Math.floor(remaining / (main.length - i));
    const fit = fitReps(ex, p, share);
    plan.push({ ex, n: fit.n, perSet: fit.perSet });
    remaining -= fit.cost;
  });

  const tl: Phase[] = [];
  let repNo = 0;
  let repTotal = 0;
  const add = (
    kind: PhaseKind,
    label: string,
    dur: number,
    exercise: string,
    set = 0,
    of = 0,
    scale = 0.58,
  ): Phase => {
    const ph: Phase = {
      kind, label, dur, exercise, set, of, scale,
      rep: repNo, reps: repTotal, start: 0,
    };
    tl.push(ph);
    return ph;
  };

  // Die Ankündigung ersetzt die Pause vor einer Übung — nie beides hintereinander.
  const announce = (ex: Exercise, reps: number) => {
    add('intro', ex.key, INTRO, ex.id).note = { key: ex.key, reps };
  };

  // Aufwärmen
  repTotal = p.flickReps;
  announce(EX.schnell, p.flickReps);
  for (let i = 0; i < p.flickReps; i++) {
    repNo = i + 1;
    add('tense', 'tense', 1, EX.schnell.id, 1, 1, 1);
    if (i < p.flickReps - 1) add('release', 'loose', 1, EX.schnell.id, 1, 1, 0.58);
  }

  // Hauptübungen, jede am Stück
  plan.forEach(({ ex, n, perSet }) => {
    repTotal = n;
    repNo = 0;
    announce(ex, n);
    const sets = spread(n, Math.ceil(n / perSet));
    sets.forEach((count, s) => {
      for (let r = 0; r < count; r++) {
        repNo++;
        ex.rep(p).forEach(([kind, label, dur, scale]) =>
          add(kind, label, dur, ex.id, s + 1, sets.length, scale),
        );
        if (r < count - 1) add('release', ex.restKey, ex.rest(p), ex.id, s + 1, sets.length, 0.58);
      }
      if (s < sets.length - 1) add('pause', 'setPause', p.blockPause, ex.id, s + 1, sets.length, 0.58);
    });
  });
  repNo = 0;
  repTotal = 0;

  add('relax', 'relax', MIN_CLOSING, 'closing');

  // Übrige Sekunden verteilen — höchstens 2 s je Pause, damit keine
  // Satzpause spürbar länger wird; der Rest geht in den Abschluss.
  let slack = SESSION_SECONDS - tl.reduce((a, ph) => a + ph.dur, 0);
  const pauses = tl.filter((ph) => ph.kind === 'pause');
  for (let round = 0; round < 2 && slack > 0 && pauses.length; round++) {
    for (const ph of pauses) {
      if (slack <= 0) break;
      ph.dur++;
      slack--;
    }
  }
  tl[tl.length - 1].dur += slack;

  let t = 0;
  tl.forEach((ph) => {
    ph.start = t;
    t += ph.dur;
  });

  return { phases: tl, p, total: t, plan, list };
}

/** Phasen, in denen der Muskel arbeitet — auch das langsame Lösen zählt dazu. */
export const WORK = new Set<PhaseKind>(['tense', 'slow', 'pulse']);

/* ========== Fortschritt ========== */

export type Feedback = 'easy' | 'ok' | 'hard';

export interface Progress {
  level: number;
  points: number;
  hardStreak: number;
}

/**
 * Rückmeldung nach der Einheit steuert das Tempo: „zu leicht" zählt 2 Punkte,
 * „genau richtig" 1, „zu schwer" 0,5. Bei 4 Punkten geht es eine Stufe hoch,
 * dreimal „zu schwer" hintereinander wieder eine runter.
 */
export function applyFeedback(prev: Progress, kind: Feedback): Progress {
  let { level, points, hardStreak } = prev;
  if (kind === 'hard') {
    hardStreak++;
    points += 0.5;
    if (hardStreak >= 3 && level > 1) {
      level--;
      points = 0;
      hardStreak = 0;
    }
  } else {
    hardStreak = 0;
    points += kind === 'easy' ? 2 : 1;
  }
  if (points >= 4) {
    level++;
    points = 0;
  }
  return { level, points, hardStreak };
}
