/**
 * Beweglichkeitstest.
 *
 * Gedehnt wird woanders — hier geht es nur ums Messen. Fünf Prüfungen, für die
 * es nichts braucht außer einer Wand und etwas Boden.
 *
 * Gemessen wird nicht in Zentimetern, sondern in Stufen: du schaust nach, wie
 * weit du kommst, und wählst die Beschreibung, die passt. Das klingt gröber als
 * ein Maßband, ist aber verlässlicher — ein Maßband hat man selten dabei, und
 * beim Messen an sich selbst verrutscht es ohnehin. Die Anhaltspunkte sind
 * dafür immer da: die eigenen Finger, die Knöchel, das Schulterblatt.
 *
 * Die Stufen sind aufsteigend sortiert, von unbeweglich zu beweglich. Damit ist
 * mehr immer besser, und der Vergleich braucht keine Sonderfälle.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/** Halbe Stufe für „hat gerade so gereicht". */
export const KNAPP = 0.5;

export const MOBILITY_TESTS = [
  {
    id: 'vorbeuge',
    name: 'Vorbeugen im Sitzen',
    why: 'Die ganze Rückseite: Waden, hintere Oberschenkel, unterer Rücken.',
    kind: 'stufe',
    setup: [
      'Setz dich mit gestreckten Beinen auf den Boden, die Fersen etwa faustbreit auseinander.',
      'Zieh die Zehen zu dir heran, sodass die Fußsohlen nach vorn zeigen.',
      'Drück die Kniekehlen Richtung Boden, damit die Beine gestreckt bleiben.',
      'Beuge dich langsam nach vorn, so weit du kommst, und bleib zwei Sekunden dort.',
      'Schau nach, wie weit deine Fingerspitzen kommen, und wähle die Stufe.',
    ],
    notCounted: [
      'Wippen oder federn. Es zählt nur, was du ruhig zwei Sekunden hältst.',
      'Gebeugte Knie. Hebt ein Knie ab, bist du zu weit.',
      'Ruck aus den Schultern. Die Bewegung kommt aus der Hüfte.',
    ],
    stages: [
      ['Bis zu den Knien', 'Die Fingerspitzen kommen nicht über die Knie hinaus.'],
      ['Bis zur Mitte der Schienbeine', ''],
      ['Bis zu den Knöcheln', ''],
      ['Bis zu den Zehenspitzen', 'Die Fingerspitzen berühren die Zehen.'],
      ['Hände fassen die Fußsohlen', 'Die Finger greifen um die Füße herum.'],
      ['Bauch liegt auf den Oberschenkeln', 'Der Oberkörper liegt auf den Beinen, die Ellbogen kommen neben die Waden.'],
    ],
    norm: [15, 35, 55, 75, 90, 100],
  },
  {
    id: 'knieWand',
    name: 'Knie zur Wand',
    why: 'Das Sprunggelenk. Es entscheidet, wie tief du in die Hocke kommst.',
    kind: 'stufe',
    perSide: true,
    sideNote: 'Gemessen wird das vordere Bein.',
    setup: [
      'Barfuß vor eine Wand stellen.',
      'Einen Fuß nach vorn setzen, die Zehen berühren die Wand, der Fuß zeigt gerade nach vorn.',
      'Das Knie über die Fußspitze zur Wand schieben, ohne dass die Ferse abhebt.',
      'Klappt das, den Fuß Stück für Stück zurückrutschen, bis das Knie die Wand gerade noch erreicht.',
      'Den Abstand der großen Zehe zur Wand mit den eigenen Fingern abmessen — quer gelegt, wie ein Lineal.',
    ],
    notCounted: [
      'Eine abgehobene Ferse. Der ganze Fuß bleibt am Boden.',
      'Ein nach innen fallendes Knie. Es zieht über die zweite Zehe.',
      'Ein schräg zur Wand gedrehter Fuß.',
    ],
    stages: [
      ['Knie kommt nicht an die Wand', 'Auch mit den Zehen direkt an der Wand nicht.'],
      ['Zehen an der Wand', 'Das Knie berührt gerade so, ohne Abstand.'],
      ['Ein Finger breit Abstand', ''],
      ['Zwei Finger breit', ''],
      ['Vier Finger breit', 'Etwa eine Handbreit ohne Daumen.'],
      ['Mehr als eine Handbreit', ''],
    ],
    norm: [10, 30, 45, 60, 85, 100],
  },
  {
    id: 'schulterGriff',
    name: 'Hand über die Schulter',
    why: 'Schultern und Brustwirbelsäule — wie weit du über Kopf kommst.',
    kind: 'stufe',
    perSide: true,
    sideNote: 'Benannt nach der Hand oben: rechts heißt rechte Hand über die rechte Schulter.',
    setup: [
      'Aufrecht sitzen oder stehen, die Schultern locker nach unten.',
      'Eine Hand von oben über die Schulter führen, die Handfläche zeigt zum Rücken.',
      'Die Fingerspitzen so weit an der Wirbelsäule hinunterschieben, wie du kommst — bis es spannt, nicht bis es zieht.',
      'Zwei Sekunden dort bleiben und mit den Fingerspitzen ertasten, wo du gelandet bist.',
      'Das Schulterblatt ist der Anhaltspunkt: oben die Kante, unten die spitze Ecke.',
    ],
    notCounted: [
      'Mit der anderen Hand nachhelfen oder am Ellbogen ziehen.',
      'Den Oberkörper zur Seite kippen oder nach vorn beugen.',
      'Die Rippen nach vorn schieben. Der untere Rücken bleibt lang.',
    ],
    stages: [
      ['Nacken', 'Tiefer als der Halsansatz kommen die Finger nicht.'],
      ['Oberkante des Schulterblatts', 'Der quer verlaufende Knochen oben am Rücken.'],
      ['Mitte des Schulterblatts', 'Auf halber Höhe zwischen Schulter und unterer Spitze.'],
      ['Untere Spitze des Schulterblatts', 'Die tastbare Ecke unten am Schulterblatt.'],
      ['Darunter auf den Rippen', ''],
      ['Bis zur Taille', ''],
    ],
    norm: [15, 40, 65, 85, 95, 100],
  },
  {
    id: 'schmetterling',
    name: 'Schmetterling',
    why: 'Hüftöffnung und Innenseite der Oberschenkel.',
    kind: 'stufe',
    perSide: true,
    sideNote: 'Je Knie einzeln — die Hüften sind selten gleich.',
    setup: [
      'Aufrecht auf den Boden setzen, die Fußsohlen aneinander.',
      'Die Fersen so weit heranziehen, dass zwei Handbreit zwischen Fersen und Becken bleiben.',
      'Die Knie sinken lassen, ohne mit den Händen zu drücken.',
      'Eine Minute so sitzen bleiben — die Hüfte gibt erst nach einer Weile nach.',
      'Dann nachsehen, wie hoch die Knie noch über dem Boden stehen, und je Seite die Stufe wählen.',
    ],
    notCounted: [
      'Mit Händen oder Ellbogen auf die Knie drücken.',
      'Nach vorn beugen. Der Rücken bleibt aufrecht.',
      'Die Fersen näher heranziehen als beim letzten Mal — dann misst du etwas anderes.',
    ],
    stages: [
      ['Höher als eine aufrechte Faust', 'Zwischen Knie und Boden passt mehr als deine hochkant gestellte Faust.'],
      ['Etwa eine aufrechte Faust', 'Die hochkant gestellte Faust passt gerade darunter.'],
      ['Eine flach liegende Hand', 'Die flache Hand passt darunter, die Faust nicht mehr.'],
      ['Zwei Finger übereinander', ''],
      ['Ein Finger', 'Das Knie schwebt knapp über dem Boden.'],
      ['Knie liegt am Boden', ''],
    ],
    norm: [15, 35, 55, 75, 90, 100],
  },
  {
    id: 'hocke',
    name: 'Tiefe Hocke halten',
    why: 'Hüfte, Knie und Sprunggelenk zusammen.',
    kind: 'zeit',
    maxSeconds: 180,
    zeitNorm: [[0, 0], [10, 20], [30, 45], [60, 70], [120, 90], [180, 100]],
    setup: [
      'Barfuß hinstellen, die Füße etwa schulterbreit, die Zehen leicht nach außen.',
      'So tief in die Hocke gehen, wie du kommst, das Gesäß Richtung Fersen.',
      'Die Fersen bleiben am Boden, der Rücken so aufrecht wie es geht.',
      'Die Arme darfst du vorn ausstrecken, um das Gleichgewicht zu halten.',
      'Auf Start tippen und halten, bis die Fersen abheben oder du dich festhalten musst. Dann auf Stopp.',
    ],
    notCounted: [
      'Abgehobene Fersen. Ab da läuft die Zeit nicht mehr.',
      'Sich an einem Möbelstück festhalten.',
      'Die Füße breiter stellen als beim letzten Mal.',
    ],
  },
];

const BY_ID = new Map(MOBILITY_TESTS.map((t) => [t.id, t]));

export function mobilityTestById(id) {
  return BY_ID.get(id) || null;
}

/** Höchste Stufe eines Tests (die Stufen sind nullbasiert). */
export function topStage(test) {
  return test.stages ? test.stages.length - 1 : 0;
}

/** Wie viele Einzelwerte ein Test hat: einer, oder je Seite einer. */
export function fieldsFor(test) {
  if (test.kind === 'zeit') return ['sekunden'];
  return test.perSide ? ['links', 'rechts'] : ['stufe'];
}

/**
 * Beschriftung eines einzelnen Stufenwerts. Halbe Werte bedeuten „knapp",
 * also die nächsthöhere Stufe gerade eben erreicht.
 */
export function stageLabel(test, wert) {
  if (test.kind === 'zeit' || typeof wert !== 'number' || !test.stages) return null;
  const stufen = test.stages;

  if (Number.isInteger(wert)) return stufen[Math.min(wert, topStage(test))]?.[0] || null;

  const naechste = stufen[Math.min(Math.ceil(wert), topStage(test))];
  return naechste ? `${naechste[0]} (knapp)` : null;
}

/**
 * Beschriftung für einen ganzen Messwert, so wie er gespeichert ist.
 *
 * Bei zwei ungleichen Seiten gibt es bewusst keine: der Mittelwert von Stufe 4
 * und Stufe 2 ist Stufe 3, und die Beschriftung von Stufe 3 wäre schlicht
 * falsch — auf der steht keine der beiden Seiten. Dann bleibt nur die Zahl.
 */
export function standLabel(test, werte) {
  if (!werte) return null;

  if (test.kind === 'zeit') {
    return typeof werte.sekunden === 'number' ? `${werte.sekunden} s` : null;
  }

  const zahlen = fieldsFor(test)
    .map((f) => werte[f])
    .filter((v) => typeof v === 'number' && Number.isFinite(v));

  if (!zahlen.length) return null;
  if (zahlen.length > 1 && zahlen.some((v) => v !== zahlen[0])) return null;
  return stageLabel(test, zahlen[0]);
}

/** Einheit für eine Veränderung, passend zur Zahl. */
export function deltaUnit(test, betrag) {
  if (test.kind === 'zeit') return 's';
  return Math.abs(betrag) === 1 ? 'Stufe' : 'Stufen';
}

/**
 * Vergleicht zwei Messungen. Bei allen Prüfungen ist mehr besser: die Stufen
 * laufen von unbeweglich nach beweglich, die Hocke wird länger gehalten.
 * @returns {{delta: number, besser: boolean, gleich?: boolean}|null}
 */
export function compare(test, jetzt, vorher) {
  if (typeof jetzt !== 'number' || typeof vorher !== 'number') return null;
  const delta = Math.round((jetzt - vorher) * 10) / 10;
  if (delta === 0) return { delta, besser: false, gleich: true };
  return { delta, besser: delta > 0 };
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

/** Wie viele Seiten eines Tests tatsächlich eingetragen sind. */
export function filledSides(test, werte) {
  if (!werte) return 0;
  return fieldsFor(test).filter((f) => typeof werte[f] === 'number').length;
}

/** Enthält ein gespeicherter Datensatz überhaupt bekannte Prüfungen? */
export function hasResults(record) {
  if (!record || !record.results) return false;
  return MOBILITY_TESTS.some((test) => summarise(test, record.results[test.id]) != null);
}

/* ---------------- Auswertung ---------------- */

/**
 * Was die Punktzahl bedeutet.
 *
 * Die Grenzen sind an gängigen Richtwerten ausgerichtet, nicht an einer
 * Rangliste: Zehenspitzen erreichen, das Knie eine Handbreit vor der Wand, die
 * Fingerspitzen an der unteren Schulterblattspitze — das gilt jeweils als
 * unauffällig bis gut, und genau dort liegt die Grenze zu „gut".
 */
export const SCORE_BANDS = [
  { ab: 85, name: 'Sehr gut', text: 'Da ist wenig Luft nach oben. Halten genügt.' },
  { ab: 70, name: 'Gut', text: 'Über den üblichen Richtwerten. Nichts, was dich einschränkt.' },
  { ab: 55, name: 'Brauchbar', text: 'Reicht für Alltag und Training, mit Luft nach oben.' },
  { ab: 35, name: 'Eingeschränkt', text: 'Merkbar eingeschränkt — hier bringt Dehnen am meisten.' },
  { ab: 0, name: 'Deutlich eingeschränkt', text: 'Weit von den Richtwerten entfernt. Dafür ist es der größte Hebel, den du hast.' },
];

export function bandFor(punkte) {
  return SCORE_BANDS.find((b) => punkte >= b.ab) || SCORE_BANDS[SCORE_BANDS.length - 1];
}

/** Linear zwischen Stützpunkten, damit auch halbe Stufen zählen. */
function interpolieren(punkte, x) {
  if (x <= punkte[0][0]) return punkte[0][1];
  const letzte = punkte[punkte.length - 1];
  if (x >= letzte[0]) return letzte[1];

  for (let i = 1; i < punkte.length; i += 1) {
    const [x0, y0] = punkte[i - 1];
    const [x1, y1] = punkte[i];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return letzte[1];
}

/** Punkte für eine Prüfung, 0 bis 100, oder null wenn sie nicht gemessen wurde. */
export function testScore(test, werte) {
  const wert = summarise(test, werte);
  if (wert == null) return null;

  const stuetzen = test.kind === 'zeit'
    ? test.zeitNorm
    : test.norm.map((p, i) => [i, p]);

  return Math.round(interpolieren(stuetzen, wert));
}

/**
 * Gesamtauswertung einer Messung.
 *
 * Gewertet wird nur, was auch gemessen wurde — wer zwei Prüfungen überspringt,
 * bekommt keine schlechtere Zahl, sondern eine aus drei Prüfungen. Deshalb steht
 * `anzahl` mit dabei: ohne die wäre der Wert nicht einzuordnen.
 */
export function overallScore(record) {
  if (!record || !record.results) return null;

  const einzeln = MOBILITY_TESTS
    .map((test) => ({ test, punkte: testScore(test, record.results[test.id]) }))
    .filter((e) => e.punkte != null);

  if (!einzeln.length) return null;

  const punkte = Math.round(einzeln.reduce((a, e) => a + e.punkte, 0) / einzeln.length);
  const sortiert = [...einzeln].sort((a, b) => a.punkte - b.punkte);

  return {
    punkte,
    band: bandFor(punkte),
    anzahl: einzeln.length,
    von: MOBILITY_TESTS.length,
    einzeln,
    schwaechste: sortiert[0],
    staerkste: sortiert[sortiert.length - 1],
  };
}

/**
 * Seitenunterschiede ab einer halben Stufe.
 *
 * Das ist der Befund, den ein Gesamtwert verschluckt: zwei Seiten, die sich um
 * zwei Stufen unterscheiden, ergeben im Mittel einen unauffälligen Wert.
 */
export function asymmetries(record, schwelle = 1) {
  if (!record || !record.results) return [];

  return MOBILITY_TESTS.flatMap((test) => {
    if (!test.perSide) return [];
    const werte = record.results[test.id];
    if (!werte) return [];
    const { links, rechts } = werte;
    if (typeof links !== 'number' || typeof rechts !== 'number') return [];

    const unterschied = Math.round(Math.abs(links - rechts) * 10) / 10;
    if (unterschied < schwelle) return [];

    return [{
      test,
      unterschied,
      schwaecher: links < rechts ? 'links' : 'rechts',
      staerker: links < rechts ? 'rechts' : 'links',
    }];
  });
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
  return daysSince(letzteMessung, heute) >= RETEST_DAYS;
}

/** Tage seit der letzten Messung, oder null. */
export function daysSince(letzteMessung, heute) {
  if (!letzteMessung) return null;
  return Math.floor(
    (new Date(`${heute}T12:00:00`) - new Date(`${letzteMessung}T12:00:00`)) / 86400000
  );
}
