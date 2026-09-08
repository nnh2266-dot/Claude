/**
 * Beckenbodentraining (Kegel).
 *
 * Passt in keinen der bestehenden Teile, und das hat Gründe. Es ist keine
 * Kraftübung im Sinne des Plans — es gibt kein Gewicht, keine Wiederholung, die
 * jemand von außen sehen könnte, und es läuft täglich statt dreimal die Woche.
 * Es ist eine Gewohnheit mit Uhr, näher am Morgenlicht als an der Kniebeuge.
 *
 * **Wofür es belegt ist**, in absteigender Sicherheit:
 *
 * - **Belastungsinkontinenz** — der bestuntersuchte Fall. Gezieltes
 *   Beckenbodentraining ist dort Mittel der ersten Wahl, vor Medikamenten und
 *   vor einer Operation.
 * - **Nach einer Prostataoperation** — beschleunigt die Rückkehr der Kontinenz.
 * - **Erektionsfunktion und vorzeitiger Samenerguss** — mehrere kontrollierte
 *   Studien mit Wirkung, aber kleinere und uneinheitlichere als oben.
 * - **„Stärkerer Orgasmus", „mehr Leistung im Sport"** — dafür gibt es keinen
 *   belastbaren Beleg. Steht hier, weil das die Versprechen sind, mit denen
 *   solche Übungen sonst verkauft werden.
 *
 * **Zwei Dinge, die die meisten Anleitungen weglassen** und die hier deshalb
 * fest eingebaut sind:
 *
 * 1. **Mehr ist nicht besser.** Ein dauerhaft verspannter Beckenboden macht
 *    eigene Probleme — Schmerzen, Harndrang, schlechteres Entleeren. Das
 *    Loslassen ist der halbe Teil der Übung, deshalb ist die Pause hier genauso
 *    lang wie die Anspannung und wird genauso angesagt.
 * 2. **Nicht am Harnstrahl üben.** Den Strahl anzuhalten ist der übliche Trick,
 *    um den Muskel überhaupt zu finden — einmal. Als Übung wiederholt gemacht
 *    stört es die Blasenentleerung und begünstigt Infekte.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/**
 * Die Stufen.
 *
 * Zwei Reize, weil der Beckenboden zwei Aufgaben hat: dauerhaft halten (langsame
 * Fasern) und schnell zumachen, wenn man niest (schnelle Fasern). Ein Programm
 * mit nur langen Halten trainiert die Hälfte.
 *
 * `halten`  — Sekunden anspannen, gleich lang lösen, so oft
 * `schnell` — kurze, kräftige Anspannungen, je eine Sekunde
 */
export const STUFEN = [
  {
    nr: 1,
    name: 'Finden',
    halten: { sekunden: 3, pause: 5, wiederholungen: 5 },
    schnell: { wiederholungen: 5 },
    ziel: 'Erst einmal den richtigen Muskel treffen und ihn wieder ganz loslassen.',
  },
  {
    nr: 2,
    name: 'Gewöhnen',
    halten: { sekunden: 5, pause: 5, wiederholungen: 8 },
    schnell: { wiederholungen: 8 },
    ziel: 'Fünf Sekunden ohne Nachlassen und ohne die Luft anzuhalten.',
  },
  {
    nr: 3,
    name: 'Aufbauen',
    halten: { sekunden: 6, pause: 6, wiederholungen: 10 },
    schnell: { wiederholungen: 10 },
    ziel: 'Zehn saubere Wiederholungen. Die letzte soll aussehen wie die erste.',
  },
  {
    nr: 4,
    name: 'Halten',
    halten: { sekunden: 8, pause: 8, wiederholungen: 10 },
    schnell: { wiederholungen: 12 },
    ziel: 'Acht Sekunden — hier merkt man, ob wirklich der Beckenboden arbeitet.',
  },
  {
    nr: 5,
    name: 'Ausdauer',
    halten: { sekunden: 10, pause: 10, wiederholungen: 10 },
    schnell: { wiederholungen: 15 },
    ziel: 'Zehn mal zehn Sekunden. Mehr braucht es nicht — ab hier wird gehalten, '
      + 'nicht gesteigert.',
  },
];

/** Wie viele saubere Durchgänge eine Stufe braucht, bevor die nächste aufgeht. */
export const DURCHGAENGE_JE_STUFE = 12;

/** Ab so vielen Durchgängen am Tag sagt die App, dass es genug ist. */
export const GENUG_AM_TAG = 3;

export function stufe(nr) {
  return STUFEN.find((s) => s.nr === nr) || STUFEN[0];
}

/** Sekunden, die ein Durchgang dauert — für die Ankündigung vor dem Start. */
export function dauerSekunden(s) {
  const lang = s.halten.wiederholungen * (s.halten.sekunden + s.halten.pause);
  // Schnelle: eine Sekunde an, eine aus, plus zwanzig Sekunden Pause davor.
  const kurz = s.schnell.wiederholungen * 2 + 20;
  return lang + kurz;
}

/**
 * Der Ablauf eines Durchgangs als Liste von Abschnitten.
 *
 * Ausdrücklich mit Pausenabschnitten: Das Loslassen ist Teil der Übung und
 * nicht die Lücke dazwischen. Wer nur die Anspannung ansagt, trainiert
 * Verspannung.
 */
export function ablauf(s) {
  const schritte = [];
  schritte.push({ art: 'bereit', sekunden: 5, text: 'Gleich geht es los. Locker sitzen oder liegen, '
    + 'normal weiteratmen.' });

  for (let i = 0; i < s.halten.wiederholungen; i += 1) {
    schritte.push({ art: 'an', sekunden: s.halten.sekunden,
      text: 'Anheben und halten', nummer: i + 1, von: s.halten.wiederholungen });
    schritte.push({ art: 'aus', sekunden: s.halten.pause,
      text: 'Ganz loslassen', nummer: i + 1, von: s.halten.wiederholungen });
  }

  schritte.push({ art: 'pause', sekunden: 20, text: 'Kurz durchatmen. Gleich kommen die schnellen.' });

  for (let i = 0; i < s.schnell.wiederholungen; i += 1) {
    schritte.push({ art: 'an', sekunden: 1, schnell: true,
      text: 'Zu', nummer: i + 1, von: s.schnell.wiederholungen });
    schritte.push({ art: 'aus', sekunden: 1, schnell: true,
      text: 'Auf', nummer: i + 1, von: s.schnell.wiederholungen });
  }

  schritte.push({ art: 'fertig', sekunden: 0, text: 'Fertig.' });
  return schritte;
}

/**
 * Wie man den richtigen Muskel findet — und wie ausdrücklich nicht.
 * Ohne diesen Teil üben viele wochenlang den Po.
 */
export const ANLEITUNG = [
  'Stell dir vor, du hältst Wind zurück und hebst dann alles nach innen und oben — '
    + 'Richtung Bauchnabel. Es ist ein Anheben, kein Pressen.',
  'Po, Oberschenkel und Bauchdecke bleiben locker. Wenn sich dort etwas anspannt, '
    + 'ist es zu viel Kraft — nimm weniger und such das Anheben.',
  'Weiteratmen. Die Luft anzuhalten ist der häufigste Fehler und macht die Übung wertlos.',
  'Zum Prüfen einmal beim Wasserlassen den Strahl kurz anhalten — nur einmal, zum '
    + 'Kennenlernen. Als Übung wiederholt gemacht stört es die Blasenentleerung.',
];

/** Was Beckenbodentraining belegtermaßen bringt, in absteigender Sicherheit. */
export const NUTZEN = [
  { text: 'Belastungsinkontinenz — Tröpfeln beim Niesen, Husten, Heben', beleg: 'gut' },
  { text: 'Rückkehr der Kontinenz nach einer Prostataoperation', beleg: 'gut' },
  { text: 'Erektionsfunktion und vorzeitiger Samenerguss', beleg: 'mittel' },
  { text: 'Stabilität des Rumpfes im Zusammenspiel mit der tiefen Bauchmuskulatur', beleg: 'mittel' },
];

/** Der Satz, den keine App ersetzt. */
export const ARZT = 'Bei Schmerzen im Beckenbereich, ständigem Harndrang oder wenn sich nach '
  + 'sechs bis acht Wochen nichts tut, gehört das abgeklärt — dann kann ein zu **fester** '
  + 'Beckenboden dahinterstecken, und der braucht das Gegenteil von diesem Training.';

/* ---------------- Auswertung ---------------- */

/** Durchgänge an einem Tag. */
export function dayCount(eintraege, dateKey) {
  return (eintraege || []).find((e) => e.date === dateKey)?.durchgaenge || 0;
}

/**
 * Tage in Folge mit mindestens einem Durchgang.
 * Wie bei Licht und Trinken zählt heute erst mit, wenn heute etwas steht —
 * sonst stünde morgens jedes Mal eine Null.
 */
export function streak(eintraege, bisDatum, shift) {
  const nach = new Map((eintraege || []).map((e) => [e.date, e]));
  const hat = (t) => (nach.get(t)?.durchgaenge || 0) > 0;

  let serie = 0;
  let tag = hat(bisDatum) ? bisDatum : shift(bisDatum, -1);
  for (let i = 0; i < 400; i += 1) {
    if (!hat(tag)) break;
    serie += 1;
    tag = shift(tag, -1);
  }
  return serie;
}

/** Gesamtzahl der Durchgänge — daran hängt die Stufe. */
export function gesamt(eintraege) {
  return (eintraege || []).reduce((s, e) => s + (e.durchgaenge || 0), 0);
}

/**
 * Welche Stufe nach so vielen Durchgängen dran ist.
 *
 * Bewusst an der Menge und nicht an einer Selbsteinschätzung: Wie gut eine
 * Anspannung war, sieht niemand von außen, und der Nutzer selbst am Anfang
 * auch nicht.
 */
export function stufeNach(durchgaenge, hoechstens = STUFEN.length) {
  const nr = Math.min(hoechstens, Math.floor(durchgaenge / DURCHGAENGE_JE_STUFE) + 1);
  return stufe(nr);
}

/** Wie viele Durchgänge bis zur nächsten Stufe fehlen. */
export function bisNaechste(durchgaenge) {
  const aktuell = stufeNach(durchgaenge);
  if (aktuell.nr >= STUFEN.length) return null;
  return DURCHGAENGE_JE_STUFE - (durchgaenge % DURCHGAENGE_JE_STUFE);
}

/** Zusammenfassung für den Wochenbericht. */
export function weekSummary(eintraege, tage) {
  const nach = new Map((eintraege || []).map((e) => [e.date, e]));
  const mitUebung = tage.filter((t) => (nach.get(t)?.durchgaenge || 0) > 0);
  const durchgaenge = tage.reduce((s, t) => s + (nach.get(t)?.durchgaenge || 0), 0);
  return { tage: mitUebung.length, vonTagen: tage.length, durchgaenge };
}
