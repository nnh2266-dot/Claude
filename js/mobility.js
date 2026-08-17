/**
 * Beweglichkeitstest.
 *
 * Gedehnt wird woanders — hier geht es nur ums Messen. Fünf Prüfungen, die
 * sich allein mit einem Maßband und einer Wand durchführen lassen und beim
 * nächsten Mal wieder gleich ausfallen. Genau das ist der Punkt: ein Gefühl
 * für Fortschritt trügt, eine Zahl in Zentimetern nicht.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/**
 * `betterWhen` sagt, in welche Richtung Fortschritt geht — beim Schulterhaken
 * ist ein kleinerer Abstand besser, beim Sitzen-und-Reichen ein größerer Wert.
 */
export const MOBILITY_TESTS = [
  {
    id: 'sitreach',
    name: 'Sitzen und reichen',
    target: 'Hintere Kette: Waden, hintere Oberschenkel, unterer Rücken',
    unit: 'cm',
    betterWhen: 'higher',
    how: 'Mit gestreckten Beinen auf den Boden setzen, Fersen an eine Wand oder Kante. '
      + 'Maßband längs neben die Beine legen, Null an den Fersen. Langsam nach vorn '
      + 'schieben, ohne zu wippen, und die Position zwei Sekunden halten.',
    reading: 'Abstand der Fingerspitzen zur Fußsohlen-Linie. Über die Zehen hinaus '
      + 'ist ein Pluswert, davor ein Minuswert.',
    range: [-30, 40],
  },
  {
    id: 'kneewall',
    name: 'Knie zur Wand',
    target: 'Sprunggelenk — entscheidet über die Tiefe der Kniebeuge',
    unit: 'cm',
    betterWhen: 'higher',
    how: 'Barfuß in einem Ausfallschritt vor die Wand. Das vordere Knie soll die Wand '
      + 'berühren, ohne dass die Ferse abhebt. Fuß so weit zurückschieben, wie das '
      + 'gerade noch klappt.',
    reading: 'Abstand der großen Zehe zur Wand. Je Seite einzeln messen.',
    perSide: true,
    range: [0, 20],
  },
  {
    id: 'shoulderreach',
    name: 'Schulterhaken hinter dem Rücken',
    target: 'Schultern und Brustwirbelsäule',
    unit: 'cm',
    betterWhen: 'lower',
    how: 'Eine Hand von oben über die Schulter, die andere von unten hinter den Rücken. '
      + 'Fingerspitzen aufeinander zu bewegen, ohne zu zerren.',
    reading: 'Abstand zwischen den Fingerspitzen. Berühren sie sich, ist es 0. '
      + 'Überlappen sie, trag die Überlappung als Minuswert ein. Gemessen wird nach der '
      + 'oberen Hand: rechts bedeutet rechte Hand oben.',
    perSide: true,
    range: [-20, 40],
  },
  {
    id: 'butterfly',
    name: 'Schmetterling',
    target: 'Hüftöffnung, Adduktoren — die Baustelle im Yin Yoga',
    unit: 'cm',
    betterWhen: 'lower',
    how: 'Aufrecht sitzen, Fußsohlen aneinander, Fersen locker Richtung Becken. '
      + 'Die Knie sinken lassen, ohne mit den Händen zu drücken. Eine Minute liegen '
      + 'lassen, dann messen.',
    reading: 'Abstand vom äußeren Knie zum Boden, je Seite.',
    perSide: true,
    range: [0, 40],
  },
  {
    id: 'deepsquat',
    name: 'Tiefe Hocke halten',
    target: 'Hüfte, Knie und Sprunggelenk zusammen',
    unit: 's',
    betterWhen: 'higher',
    how: 'Barfuß, Füße etwa schulterbreit, so tief wie möglich in die Hocke. '
      + 'Fersen bleiben am Boden, Rücken so aufrecht wie es geht. Halten, bis die '
      + 'Fersen abheben oder die Haltung zusammenfällt.',
    reading: 'Gehaltene Sekunden, höchstens 120.',
    range: [0, 120],
  },
];

const BY_ID = new Map(MOBILITY_TESTS.map((t) => [t.id, t]));

export function mobilityTestById(id) {
  return BY_ID.get(id) || null;
}

/** Wie viele Einzelwerte ein Test hat: einer, oder je Seite einer. */
export function fieldsFor(test) {
  return test.perSide ? ['links', 'rechts'] : ['wert'];
}

/**
 * Vergleicht zwei Messungen und sagt, ob es besser geworden ist.
 * @returns {{delta: number, besser: boolean}|null}
 */
export function compare(test, jetzt, vorher) {
  if (typeof jetzt !== 'number' || typeof vorher !== 'number') return null;
  const delta = Math.round((jetzt - vorher) * 10) / 10;
  if (delta === 0) return { delta, besser: false, gleich: true };
  return { delta, besser: test.betterWhen === 'higher' ? delta > 0 : delta < 0 };
}

/** Mittelwert der Seiten, damit sich ein Test in einer Zahl vergleichen lässt. */
export function summarise(test, werte) {
  if (!werte) return null;
  const zahlen = fieldsFor(test)
    .map((f) => werte[f])
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (!zahlen.length) return null;
  return Math.round((zahlen.reduce((a, b) => a + b, 0) / zahlen.length) * 10) / 10;
}

/** Empfohlener Abstand zwischen zwei Messungen. */
export const RETEST_DAYS = 28;

/**
 * Ist wieder ein Test fällig?
 * @param {string|null} letzteMessung  Datumsschlüssel der letzten Messung
 * @param {string} heute
 */
export function dueAgain(letzteMessung, heute) {
  if (!letzteMessung) return true;
  const tage = Math.floor(
    (new Date(`${heute}T12:00:00`) - new Date(`${letzteMessung}T12:00:00`)) / 86400000
  );
  return tage >= RETEST_DAYS;
}

/** Tage seit der letzten Messung, oder null. */
export function daysSince(letzteMessung, heute) {
  if (!letzteMessung) return null;
  return Math.floor(
    (new Date(`${heute}T12:00:00`) - new Date(`${letzteMessung}T12:00:00`)) / 86400000
  );
}
