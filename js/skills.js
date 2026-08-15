/**
 * Fähigkeiten wie Handstand oder L-Sit.
 *
 * Anders als beim Krafttraining läuft der Fortschritt hier nicht über Gewicht,
 * sondern über eine Leiter aus Vorstufen: erst wird eine Haltung sauber und
 * lange genug gehalten, dann kommt die nächste, schwerere Variante.
 *
 * Geübt wird am Anfang der Einheit — Technik braucht einen frischen Kopf und
 * frische Schultern, nach dem Krafttraining ginge beides verloren.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/* Woran gemessen wird: gehaltene Sekunden oder saubere Wiederholungen. */
export const MEASURE = { sec: 'Sekunden', reps: 'Wiederholungen' };

/**
 * Jede Stufe: was zu tun ist, wie viele Sätze, welches Ziel je Satz und wie
 * viele Sätze das Ziel erreichen müssen, damit die nächste Stufe aufgeht.
 */
const CATALOG = [
  {
    id: 'handstand',
    name: 'Handstand',
    blurb: 'Vom Hohlkörper an der Wand bis zum freien Stand.',
    needs: 'eine freie Wandfläche',
    warmup: 'Handgelenke kreisen und dehnen, eine Minute. Ohne das rächt sich der Handstand schnell.',
    levels: [
      { name: 'Hollow Hold am Boden', measure: 'sec', target: 40, sets: 3,
        cue: 'Unterer Rücken bleibt am Boden gedrückt. Das ist die Spannung, die später oben hält.' },
      { name: 'Bauch zur Wand, Füße hochlaufen', measure: 'sec', target: 30, sets: 3,
        cue: 'Bauch zur Wand, Füße so weit hoch wie möglich, Hände Richtung Wand setzen. Rippen einziehen.' },
      { name: 'Rücken zur Wand, saubere Linie', measure: 'sec', target: 45, sets: 3,
        cue: 'Nur die Fersen berühren die Wand. Schultern über den Händen, Po anspannen.' },
      { name: 'An der Wand, ein Bein lösen', measure: 'sec', target: 30, sets: 3,
        cue: 'Abwechselnd ein Bein von der Wand nehmen. Das Gewicht wandert auf die Finger.' },
      { name: 'Freier Kick-up mit Abfangen', measure: 'sec', target: 10, sets: 5,
        cue: 'Vorher das Herausdrehen üben: eine Hand loslassen, zur Seite abrollen. Dann traut man sich.' },
      { name: 'Freier Handstand', measure: 'sec', target: 30, sets: 3,
        cue: 'Korrigiert wird mit den Fingern, nicht mit der Hüfte.' },
      { name: 'Freier Handstand, lang', measure: 'sec', target: 60, sets: 3,
        cue: 'Ruhig atmen. Ab hier ist es Ausdauer, nicht mehr Balance.' },
    ],
  },
  {
    id: 'lsit',
    name: 'L-Sit',
    blurb: 'Beine waagerecht, Körper frei gestützt.',
    needs: 'nichts weiter — mit zwei Blöcken geht es leichter',
    warmup: 'Hüftbeuger und hintere Oberschenkel kurz mobilisieren.',
    levels: [
      { name: 'Stütz auf Blöcken, Füße am Boden', measure: 'sec', target: 45, sets: 3,
        cue: 'Arme durchgestreckt, Schultern nach unten weg von den Ohren.' },
      { name: 'Tuck-Sit, Knie angezogen', measure: 'sec', target: 30, sets: 3,
        cue: 'Knie zur Brust, Po hebt ab. Rücken rund ist hier erlaubt.' },
      { name: 'Ein Bein gestreckt', measure: 'sec', target: 20, sets: 3,
        cue: 'Abwechselnd. Das gestreckte Bein bleibt waagerecht, nicht hängend.' },
      { name: 'L-Sit auf Erhöhung', measure: 'sec', target: 20, sets: 3,
        cue: 'Beide Beine gestreckt, Fersen auf Hüfthöhe. Blöcke geben Platz nach unten.' },
      { name: 'L-Sit am Boden', measure: 'sec', target: 20, sets: 3,
        cue: 'Ohne Erhöhung. Hände neben die Hüfte, Schultern aktiv nach unten drücken.' },
      { name: 'L-Sit am Boden, lang', measure: 'sec', target: 45, sets: 3,
        cue: 'Beine bleiben zusammen und gestreckt bis in die Fußspitze.' },
    ],
  },
  {
    id: 'pullup',
    name: 'Erster Klimmzug',
    blurb: 'Von aktivem Hängen bis zum sauberen Klimmzug.',
    gear: 'stange',
    needs: 'eine Klimmzugstange',
    warmup: 'Schultern kreisen, ein paar Scapula Pulls als Aufwärmsatz.',
    levels: [
      { name: 'Aktives Hängen', measure: 'sec', target: 45, sets: 3,
        cue: 'Schultern aus den Ohren ziehen, Körper ruhig. Baut den Griff mit auf.' },
      { name: 'Scapula Pulls', measure: 'reps', target: 8, sets: 3,
        cue: 'Nur die Schulterblätter ziehen, Arme bleiben gestreckt. Kleine Bewegung.' },
      { name: 'Negativ-Klimmzüge', measure: 'reps', target: 5, sets: 3,
        cue: 'Oben starten, fünf Sekunden kontrolliert ablassen. Nicht fallen lassen.' },
      { name: 'Klimmzüge mit Band', measure: 'reps', target: 8, sets: 3,
        cue: 'Band unter die Knie. Sobald acht gehen, ein dünneres Band nehmen.' },
      { name: 'Erster Klimmzug', measure: 'reps', target: 1, sets: 3,
        cue: 'Ohne Schwung, Kinn über die Stange, kontrolliert runter.' },
      { name: 'Klimmzüge', measure: 'reps', target: 8, sets: 3,
        cue: 'Ab hier zählt Sauberkeit vor Menge.' },
    ],
  },
  {
    id: 'dip',
    name: 'Erster Dip',
    blurb: 'Stützkraft für Brust, Schulter und Trizeps.',
    gear: 'barren',
    needs: 'einen Dip-Barren oder zwei stabile Stühle',
    warmup: 'Handgelenke und Schultern lockern, ein Satz Stützhalten.',
    levels: [
      { name: 'Stützhalten oben', measure: 'sec', target: 30, sets: 3,
        cue: 'Arme durchgestreckt, Schultern nach unten. Nicht in den Schultern hängen.' },
      { name: 'Bankdips', measure: 'reps', target: 12, sets: 3,
        cue: 'Hüfte nah an der Bank, Ellbogen nach hinten statt nach außen.' },
      { name: 'Negativ-Dips', measure: 'reps', target: 5, sets: 3,
        cue: 'Oben starten, fünf Sekunden runter bis Oberarme waagerecht.' },
      { name: 'Erster Dip', measure: 'reps', target: 1, sets: 3,
        cue: 'Nur so tief, wie die Schulter es schmerzfrei zulässt.' },
      { name: 'Dips', measure: 'reps', target: 8, sets: 3,
        cue: 'Leicht vorgelehnt trainiert mehr Brust, aufrecht mehr Trizeps.' },
    ],
  },
  {
    id: 'pistol',
    name: 'Pistol Squat',
    blurb: 'Einbeinige Kniebeuge bis ganz nach unten.',
    needs: 'nichts weiter',
    warmup: 'Sprunggelenke mobilisieren — daran scheitert die Pistol öfter als an der Kraft.',
    levels: [
      { name: 'Einbeinig am Türrahmen', measure: 'reps', target: 8, sets: 3,
        cue: 'Am Rahmen festhalten und nur so viel ziehen wie nötig.' },
      { name: 'Pistol auf die Bank', measure: 'reps', target: 8, sets: 3,
        cue: 'Kontrolliert absetzen, nicht plumpsen. Bank Stück für Stück niedriger.' },
      { name: 'Negativ-Pistol', measure: 'reps', target: 5, sets: 3,
        cue: 'Fünf Sekunden runter, dann mit beiden Beinen hoch.' },
      { name: 'Pistol mit leichter Hilfe', measure: 'reps', target: 5, sets: 3,
        cue: 'Ein Finger an der Wand reicht am Ende.' },
      { name: 'Pistol Squat frei', measure: 'reps', target: 5, sets: 3,
        cue: 'Freies Bein bleibt gestreckt, Ferse des Standbeins bleibt am Boden.' },
    ],
  },
  {
    id: 'muscleup',
    name: 'Muscle-Up',
    blurb: 'Über die Stange — Klimmzug und Dip in einer Bewegung.',
    gear: 'stange',
    needs: 'eine Klimmzugstange',
    warmup: 'Erst ab etwa acht sauberen Klimmzügen und acht Dips sinnvoll.',
    levels: [
      { name: 'Explosive Klimmzüge', measure: 'reps', target: 5, sets: 3,
        cue: 'So hoch ziehen, dass die untere Brust die Stange erreicht.' },
      { name: 'Straight Bar Dips', measure: 'reps', target: 8, sets: 3,
        cue: 'Über der Stange abstützen und beugen. Das ist die zweite Hälfte.' },
      { name: 'Übergang mit Band', measure: 'reps', target: 3, sets: 3,
        cue: 'Band unter die Füße. Die Handgelenke drehen früh über die Stange.' },
      { name: 'Erster Muscle-Up', measure: 'reps', target: 1, sets: 3,
        cue: 'Leichter Schwung ist am Anfang in Ordnung, der Rest kommt später.' },
      { name: 'Muscle-Ups', measure: 'reps', target: 3, sets: 3,
        cue: 'Ab hier ohne Schwung üben.' },
    ],
  },
  {
    id: 'frontlever',
    name: 'Front Lever',
    blurb: 'Waagerecht unter der Stange, Körper gestreckt.',
    gear: 'stange',
    needs: 'eine Klimmzugstange',
    warmup: 'Lange Rumpfspannung vorher, sonst kippt die Hüfte durch.',
    levels: [
      { name: 'Hängen mit Hohlkörper', measure: 'sec', target: 30, sets: 3,
        cue: 'Rippen einziehen, Becken leicht einrollen, Beine leicht vor dem Körper.' },
      { name: 'Tuck Front Lever', measure: 'sec', target: 20, sets: 3,
        cue: 'Knie eng an die Brust, Rücken waagerecht. Arme bleiben gestreckt.' },
      { name: 'Advanced Tuck', measure: 'sec', target: 20, sets: 3,
        cue: 'Oberschenkel öffnen bis rechter Winkel, Rücken bleibt flach.' },
      { name: 'Ein Bein gestreckt', measure: 'sec', target: 15, sets: 3,
        cue: 'Abwechselnd. Das gestreckte Bein sinkt nicht ab.' },
      { name: 'Straddle Front Lever', measure: 'sec', target: 15, sets: 3,
        cue: 'Beide Beine gestreckt, weit gegrätscht.' },
      { name: 'Front Lever', measure: 'sec', target: 10, sets: 3,
        cue: 'Beine geschlossen, Körper eine waagerechte Linie.' },
    ],
  },
];

export const SKILLS = CATALOG;

const BY_ID = new Map(CATALOG.map((s) => [s.id, s]));

export function skillById(id) {
  return BY_ID.get(id) || null;
}

/** Die Stufe, auf der jemand gerade steht (0-basiert, begrenzt auf die Leiter). */
export function levelIndex(skill, levels) {
  const stored = Number((levels || {})[skill.id]) || 0;
  return Math.min(Math.max(stored, 0), skill.levels.length - 1);
}

export function currentLevel(skill, levels) {
  return skill.levels[levelIndex(skill, levels)];
}

/**
 * Wie viele Sätze das Ziel treffen müssen, damit die nächste Stufe aufgeht.
 * Nicht alle — ein schwacher letzter Satz soll den Abend nicht entwerten.
 */
export function setsNeeded(level) {
  return Math.max(2, level.sets - 1);
}

/** Ist die aktuelle Stufe mit diesen Werten geschafft? */
export function levelCleared(level, values) {
  const hits = (values || []).filter((v) => Number(v) >= level.target).length;
  return hits >= setsNeeded(level);
}

/** Steht nach dieser Stufe noch etwas auf der Leiter? */
export function hasNextLevel(skill, levels) {
  return levelIndex(skill, levels) < skill.levels.length - 1;
}

/**
 * Bester Wert je Fähigkeit über alle Einheiten, plus der Verlauf für die
 * Fortschrittsansicht.
 */
export function skillHistory(sessions, skillId) {
  const points = [];
  for (const session of [...sessions].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    const values = (session.skills || {})[skillId];
    if (!values || !values.length) continue;
    const best = Math.max(...values.map((v) => Number(v) || 0));
    if (best > 0) points.push({ date: session.date, best });
  }
  return points;
}

/** Wie viel Zeit die gewählten Fähigkeiten je Einheit ungefähr kosten. */
export const MINUTES_PER_SKILL = 6;
