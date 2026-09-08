/**
 * Beckenbodentraining (Kegel).
 *
 * **Kegel-Übungen und Beckenbodentraining sind dasselbe.** Der Name kommt von
 * Arnold Kegel, einem Gynäkologen, der die Übung 1948 beschrieben hat; im
 * Deutschen heißt sie meist nach dem Muskel und nicht nach dem Mann. Wer nach
 * „Kegel" sucht und „Beckenboden" findet, ist also richtig — deshalb steht das
 * Wort in der Ansicht sichtbar dabei.
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
 * `halten`   — Sekunden anspannen, gleich lang lösen, so oft
 * `schnell`  — kurze, kräftige Anspannungen, je eine Sekunde
 * `position` — liegend, sitzend, stehend
 *
 * Die Position ist kein Beiwerk. Im Liegen nimmt die Schwerkraft dem Muskel
 * die Arbeit ab — dort findet man ihn, dort kann man ihn aber nicht aufbauen.
 * Die Studie mit den besten Ergebnissen bei Erektionsproblemen (Dorey 2005)
 * hat genau so aufgebaut: erst im Liegen, dann im Sitzen, dann im Stehen. Für
 * die Erektion arbeiten zwei Muskeln des Beckenbodens gegen den Blutdruck im
 * Schwellkörper, und die trainiert man nicht im Liegen.
 */
export const STUFEN = [
  {
    nr: 1,
    position: 'liegend',
    name: 'Finden',
    halten: { sekunden: 3, pause: 5, wiederholungen: 5 },
    schnell: { wiederholungen: 5 },
    ziel: 'Erst einmal den richtigen Muskel treffen und ihn wieder ganz loslassen.',
  },
  {
    nr: 2,
    position: 'liegend',
    name: 'Gewöhnen',
    halten: { sekunden: 5, pause: 5, wiederholungen: 8 },
    schnell: { wiederholungen: 8 },
    ziel: 'Fünf Sekunden ohne Nachlassen und ohne die Luft anzuhalten.',
  },
  {
    nr: 3,
    position: 'sitzend',
    name: 'Aufbauen',
    halten: { sekunden: 6, pause: 6, wiederholungen: 10 },
    schnell: { wiederholungen: 10 },
    ziel: 'Zehn saubere Wiederholungen. Die letzte soll aussehen wie die erste.',
  },
  {
    nr: 4,
    position: 'stehend',
    name: 'Halten',
    halten: { sekunden: 8, pause: 8, wiederholungen: 10 },
    schnell: { wiederholungen: 12 },
    ziel: 'Acht Sekunden — hier merkt man, ob wirklich der Beckenboden arbeitet.',
  },
  {
    nr: 5,
    position: 'stehend',
    name: 'Ausdauer',
    halten: { sekunden: 10, pause: 10, wiederholungen: 10 },
    schnell: { wiederholungen: 15 },
    ziel: 'Zehn mal zehn Sekunden. Mehr braucht es nicht — ab hier wird gehalten, '
      + 'nicht gesteigert.',
  },
];

/** Wie die Position angesagt wird — kurz für die Kachel, lang für den Start. */
export const POSITION = {
  liegend: {
    kurz: 'im Liegen',
    lang: 'Auf den Rücken legen, Knie angestellt, Füße auf dem Boden.',
  },
  sitzend: {
    kurz: 'im Sitzen',
    lang: 'Aufrecht auf die vordere Kante des Stuhls, beide Füße flach auf dem Boden.',
  },
  stehend: {
    kurz: 'im Stehen',
    lang: 'Aufrecht stehen, Füße hüftbreit, Knie locker. Im Stehen ist es deutlich '
      + 'schwerer — wenn es hier nicht sauber geht, mach die Stufe im Sitzen zu Ende.',
  },
};

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
  const pos = POSITION[s.position] || POSITION.liegend;
  schritte.push({ art: 'bereit', sekunden: 8,
    text: `Gleich geht es los — ${pos.kurz}.`, hinweis: pos.lang });

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
  { text: 'Erektion und vorzeitiger Samenerguss', beleg: 'mittel' },
  { text: 'Stabilität des Rumpfes im Zusammenspiel mit der tiefen Bauchmuskulatur', beleg: 'mittel' },
];

/**
 * Der Teil, wegen dem die meisten Männer überhaupt anfangen — mit den Zahlen
 * aus den Studien statt mit Versprechen.
 *
 * Wichtig zur Einordnung: Das sind einzelne, kleine Untersuchungen. Die
 * Übersichtsarbeiten finden durchweg eine Wirkung, bemängeln aber
 * unterschiedliche Programme und schwache Studienbauten. „Mittel belegt" heißt
 * hier: Es spricht etwas dafür, aber niemand kann dir eine Zahl garantieren.
 */
export const SEX = [
  {
    titel: 'Erektion',
    zahl: '67 % gegen 30 %',
    text: 'In der besten Untersuchung dazu (55 Männer, 2005) hatten nach drei Monaten '
      + '67 % der Übenden eine bessere Erektion — gegen 30 % in der Vergleichsgruppe, die '
      + 'nur Ratschläge zum Lebensstil bekam. Nach sechs Monaten war es bei 40 % wieder '
      + 'normal, bei weiteren 36 % besser, bei knapp einem Viertel unverändert.',
    beleg: 'mittel',
  },
  {
    titel: 'Vorzeitiger Samenerguss',
    zahl: 'von 32 auf 146 Sekunden',
    text: 'Bei 40 Männern, die es seit jeher zu früh kam, stieg die Zeit bis zum Erguss in '
      + 'zwölf Wochen Beckenbodentraining im Schnitt von 32 auf 146 Sekunden. 33 der 40 '
      + 'sprachen an, fünf gar nicht. Der Effekt hielt über sechs Monate Nachbeobachtung.',
    beleg: 'mittel',
  },
  {
    titel: 'Stärkerer Orgasmus, mehr Ausdauer',
    zahl: null,
    text: 'Dafür gibt es keinen belastbaren Beleg. Steht hier, weil das die Versprechen '
      + 'sind, mit denen solche Übungen im Netz verkauft werden.',
    beleg: 'kein',
  },
];

/**
 * Wie lange es dauert, bevor man urteilen darf.
 * Beide Studien oben liefen zwölf Wochen, die Erektionsstudie hat erst nach
 * sechs Monaten abschließend bewertet. Wer nach zwei Wochen aufhört, weil
 * nichts passiert, hat nichts falsch gemacht außer zu früh aufzuhören.
 */
export const DAUER = 'Rechne mit zwölf Wochen täglich, bevor sich etwas zeigt — die Studien '
  + 'haben so lange gemessen, und die abschließende Bewertung kam erst nach einem halben Jahr.';

/**
 * Anzeichen für einen zu **festen** Beckenboden.
 *
 * Der wichtigste Teil, wenn das Ziel Sex heißt. Ein dauerhaft verspannter
 * Beckenboden verursacht selbst Erektionsprobleme und vorzeitigen Samenerguss —
 * und dagegen ist Anspannen genau das Falsche. Es ist, als würde man einem
 * Krampf sagen, er soll fester zudrücken.
 */
export const ANZEICHEN_FEST = [
  'Schmerzen oder Druck am Damm, im Hoden, am After oder in der Penisspitze',
  'ständiger Harndrang, oder der Strahl kommt schwer in Gang',
  'Schmerzen beim oder direkt nach dem Samenerguss',
  'das Gefühl, nach dem Anspannen nicht wieder ganz loszulassen',
  'Schmerzen, die im Sitzen schlimmer werden',
];

export const ANZEICHEN_RAT = 'Wenn davon etwas auf dich zutrifft: **nicht anspannen.** '
  + 'Nimm das Lösen unten und lass es ärztlich abklären. Kraftübungen können hier alles '
  + 'schlimmer machen.';

/** Der Satz, den keine App ersetzt. */
export const ARZT = 'Bei Schmerzen im Beckenbereich, ständigem Harndrang oder wenn sich nach '
  + 'zwölf Wochen gar nichts tut, gehört das abgeklärt — dann kann ein zu **fester** '
  + 'Beckenboden dahinterstecken, und der braucht das Gegenteil von diesem Training.';

/* ---------------- Lösen ---------------- */

/**
 * Der Gegenteil-Durchgang: bewusst loslassen statt anspannen.
 *
 * Gehört gleichberechtigt dazu und nicht als Anhängsel. Ein Muskel, der nur
 * noch zumacht, ist kein starker Muskel, sondern ein verspannter — und bei
 * Erektion und Samenerguss ist genau das eine bekannte Ursache. Geführt wird
 * über den Atem, weil der Beckenboden mit dem Zwerchfell mitgeht: Beim
 * Einatmen senkt er sich von selbst, wenn man ihn lässt.
 *
 * Kein Pressen. Loslassen heißt aufhören zu halten, nicht nach unten drücken.
 */
export const LOESEN_RUNDEN = 10;
export const LOESEN_EIN = 4;
export const LOESEN_AUS = 6;

export const LOESEN_ANLEITUNG = [
  'Bequem hinlegen oder auf dem Stuhl anlehnen. Nichts muss aufrecht sein.',
  'Beim Einatmen geht die Luft in den Bauch, die Bauchdecke hebt sich — und der '
    + 'Beckenboden senkt sich von allein mit. Du musst nichts tun außer ihn zu lassen.',
  'Beim Ausatmen einfach ausatmen. Nicht nachhelfen, nicht anspannen, nicht drücken.',
  'Wenn du merkst, dass du zwischendurch anspannst: normal. Nur nicht dagegen kämpfen — '
    + 'beim nächsten Einatmen wieder lockerlassen.',
];

export function loesenAblauf(runden = LOESEN_RUNDEN) {
  const schritte = [{ art: 'bereit', sekunden: 8, text: 'Einfach nur atmen.',
    hinweis: 'Bequem liegen oder anlehnen. Hier wird nichts angespannt.' }];
  for (let i = 0; i < runden; i += 1) {
    schritte.push({ art: 'weit', sekunden: LOESEN_EIN,
      text: 'Einatmen — sinken lassen', nummer: i + 1, von: runden });
    schritte.push({ art: 'ruhe', sekunden: LOESEN_AUS,
      text: 'Ausatmen — nichts tun', nummer: i + 1, von: runden });
  }
  schritte.push({ art: 'fertig', sekunden: 0, text: 'Fertig.' });
  return schritte;
}

export function loesenSekunden(runden = LOESEN_RUNDEN) {
  return 8 + runden * (LOESEN_EIN + LOESEN_AUS);
}

/* ---------------- Auswertung ---------------- */

/** Durchgänge an einem Tag. */
export function dayCount(eintraege, dateKey) {
  return (eintraege || []).find((e) => e.date === dateKey)?.durchgaenge || 0;
}

/** Lösen-Durchgänge an einem Tag. Zählen nicht auf die Stufe ein. */
export function dayLoesen(eintraege, dateKey) {
  return (eintraege || []).find((e) => e.date === dateKey)?.loesen || 0;
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
  const loesen = tage.reduce((s, t) => s + (nach.get(t)?.loesen || 0), 0);
  return { tage: mitUebung.length, vonTagen: tage.length, durchgaenge, loesen };
}
