/**
 * Verlauf: was die schon eingetragenen Sätze über die Richtung sagen.
 *
 * Alles hier rechnet **ausschließlich** mit Zahlen, die ohnehin beim Training
 * entstehen — Gewicht, Wiederholungen, Sekunden, Datum. Es gibt kein einziges
 * neues Feld zum Ausfüllen. Das ist Absicht: Ein Auswertungsverfahren, das
 * zusätzliche tägliche Eingaben verlangt, wird nach zwei Wochen nicht mehr
 * gefüttert und liefert danach schlechtere Zahlen als gar keines.
 *
 * Drei Fragen werden beantwortet:
 *   1. Wie hat sich eine Übung entwickelt?        → `uebungsVerlauf`, `entwicklung`
 *   2. Geht es bei einer Übung zurück?            → `rueckgang`
 *   3. Steigt die Gesamtbelastung ungebremst?     → `belastungsverlauf`
 *
 * Ohne DOM-Zugriff, wie training.js.
 */

import {
  isTimed, isUnilateral, setSides, exerciseById,
} from './training.js';
import { estimate1RM } from './strength.js';

/* ---------------- 1. Verlauf einer Übung ---------------- */

/** Ab wie vielen Einheiten ein Verlauf überhaupt eine Richtung hat. */
export const VERLAUF_MIN = 4;

/**
 * Der beste Satz je Einheit, als vergleichbare Zahlenreihe.
 *
 * Womit verglichen wird, hängt von der Übung ab:
 *   - mit Zusatzgewicht → geschätztes Einwiederholungsmaximum (Epley, aus
 *     strength.js, oberhalb von zwölf Wiederholungen gedeckelt)
 *   - ohne Gewicht      → die Wiederholungszahl selbst
 *   - gehalten          → die Sekunden
 *
 * Diese drei Größen werden **nicht** vermischt. Wer bei Klimmzügen erst ohne
 * und später mit Gewichtsgürtel arbeitet, hat zwei Reihen; die App nimmt die
 * Art der jüngsten Einheit als Maßstab und lässt die andersartigen Einheiten
 * aus der Reihe heraus, statt eine Kurve zu zeichnen, in der 8 Wiederholungen
 * und 8 Kilo auf derselben Achse stehen.
 *
 * Bei einseitigen Übungen zählt die schwächere Seite — sie begrenzt, was man
 * kann, und ein Mittelwert würde ein Ungleichgewicht verstecken.
 */
export function uebungsVerlauf(sessions, id, { bis = null, wieViele = 10 } = {}) {
  const zeit = isTimed(id);
  const einseitig = isUnilateral(id);

  const je = [];
  const sortiert = (sessions || [])
    .filter((s) => s && (!bis || s.date <= bis))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  for (const s of sortiert) {
    const saetze = (s.entries || {})[id] || [];
    let best = null;
    for (const set of saetze) {
      if (!set || !set.reps) continue;
      const gewicht = Number(set.weight) || 0;
      const reps = einseitig ? (setSides(set).schwaechste ?? set.reps) : set.reps;
      if (!reps) continue;
      const art = zeit ? 'zeit' : (gewicht > 0 ? 'e1rm' : 'wdh');
      const wert = art === 'e1rm' ? estimate1RM(gewicht, reps) : reps;
      const kandidat = { date: s.date, art, wert, gewicht, reps };

      if (!best) { best = kandidat; continue; }
      // Innerhalb einer Einheit gewinnt die schwerere Art: ein Satz mit
      // Zusatzgewicht sagt mehr über die Kraft als einer ohne, egal wie viele
      // Wiederholungen darin stehen.
      if (art === best.art) { if (wert > best.wert) best = kandidat; continue; }
      if (art === 'e1rm') best = kandidat;
    }
    if (best) je.push(best);
  }

  if (!je.length) return { id, art: null, punkte: [] };

  const leitArt = je[je.length - 1].art;
  const punkte = je.filter((p) => p.art === leitArt).slice(-wieViele);

  return { id, name: exerciseById(id)?.name || id, art: leitArt, punkte };
}

/**
 * Die Zahl so, wie sie dasteht: „≈ 62,5 kg", „14 Wdh.", „45 s".
 *
 * Das Ungefähr-Zeichen beim Gewicht ist kein Schmuck. Dort steht kein
 * gehobenes Gewicht, sondern eine Schätzung aus Gewicht und Wiederholungen —
 * eine Zahl, die so nie auf der Stange lag.
 */
export function verlaufText(art, wert) {
  if (art === 'zeit') return `${Math.round(wert)} s`;
  if (art === 'wdh') return `${Math.round(wert)} Wdh.`;
  return `≈ ${String(Math.round(wert * 10) / 10).replace('.', ',')} kg`;
}

/**
 * Wohin es über die Reihe ging.
 *
 * Verglichen wird der Durchschnitt der ersten beiden mit dem der letzten beiden
 * Einheiten, nicht der erste mit dem letzten Punkt. Ein einzelner guter oder
 * schlechter Tag am Rand würde sonst die ganze Aussage bestimmen.
 */
export function entwicklung(verlauf) {
  const p = verlauf?.punkte || [];
  if (p.length < VERLAUF_MIN) return null;

  const mittel = (liste) => liste.reduce((a, b) => a + b.wert, 0) / liste.length;
  const anfang = mittel(p.slice(0, 2));
  const ende = mittel(p.slice(-2));
  const prozent = anfang > 0 ? ((ende - anfang) / anfang) * 100 : 0;
  const bester = p.reduce((a, b) => (b.wert > a.wert ? b : a));

  return {
    art: verlauf.art,
    einheiten: p.length,
    von: p[0].date,
    anfang,
    ende,
    bester,
    prozent: Math.round(prozent * 10) / 10,
    richtung: prozent > 2.5 ? 'hoch' : prozent < -2.5 ? 'runter' : 'flach',
  };
}

/* ---------------- 2. Rückgang erkennen ---------------- */

/**
 * Wie weit unter den besten Wert es gehen muss, damit es kein Rauschen mehr ist.
 *
 * Getrennt nach Art, weil die Tagesform unterschiedlich stark durchschlägt:
 * Die Wiederholungszahl bis zum Muskelversagen schwankt von Tag zu Tag
 * deutlich stärker als eine Schätzung aus einem schweren Satz. Für
 * Wiederholungen und Haltezeiten liegt die Schwelle deshalb bei zehn Prozent,
 * für das geschätzte Maximum bei fünf. Das sind unsere Zahlen, gewählt so,
 * dass sie über der üblichen Tagesschwankung liegen — keine Grenzwerte aus
 * einer Studie.
 */
export const RUECK_SCHWELLE = { e1rm: 0.05, wdh: 0.10, zeit: 0.10 };

/** Wie viele Einheiten in Folge darunter liegen müssen. */
export const RUECK_EINHEITEN = 3;

/**
 * Geht es bei dieser Übung zurück?
 *
 * Eine schlechte Einheit ist keine Information — schlecht geschlafen, spät
 * gegessen, Kopf woanders. Gemeldet wird erst, wenn der beste Wert der Reihe
 * mindestens drei Einheiten zurückliegt **und** alle Einheiten seitdem
 * deutlich darunter geblieben sind.
 *
 * Woher der Gedanke kommt, und was daran nicht belegt ist: In der
 * geschwindigkeitsbasierten Trainingssteuerung wird der Abfall der
 * Hantelgeschwindigkeit als Ermüdungszeichen benutzt — dort ist der
 * Zusammenhang zwischen Geschwindigkeitsverlust und Ermüdung gut untersucht
 * (Sánchez-Medina & González-Badillo 2011; Übersicht bei Weakley u. a. 2021).
 * Das hier ist eine Übertragung dieses Gedankens auf Wiederholungen und
 * geschätzte Maxima, weil niemand zu Hause die Hantelgeschwindigkeit misst.
 * Die Übertragung ist plausibel, aber nicht dasselbe und nicht validiert.
 * Deshalb ist das Ergebnis ein Hinweis zum Nachdenken, keine Diagnose.
 */
export function rueckgang(verlauf) {
  const p = verlauf?.punkte || [];
  const schwelle = RUECK_SCHWELLE[verlauf?.art] ?? 0.10;
  if (p.length < RUECK_EINHEITEN + 2) return { ja: false, einheiten: p.length };

  // Gesucht ist die längste Schlussfolge, die unter dem besten Wert **davor**
  // liegt. Den höchsten Punkt der ganzen Reihe zu nehmen reicht nicht: Steht
  // der ganz am Anfang und kommt in der Mitte noch einmal vor, bricht eine
  // Prüfung „alles nach dem Höchsten" schon an diesem zweiten Vorkommen ab —
  // und der klare Absturz danach fiele durch.
  const besterVon = (liste) => liste.reduce((a, b) => (b.wert > a.wert ? b : a));
  let seit = 0;
  let hoch = null;
  for (let n = RUECK_EINHEITEN; n <= p.length - 2; n += 1) {
    const kopf = p.slice(0, p.length - n);
    const spitze = besterVon(kopf);
    const grenze = spitze.wert * (1 - schwelle);
    if (p.slice(p.length - n).every((x) => x.wert <= grenze)) { seit = n; hoch = spitze; }
  }
  if (!seit) return { ja: false, einheiten: p.length };

  const danach = p.slice(p.length - seit);
  const jetzt = p[p.length - 1];
  // Zwei Lagen, die man nicht in einen Topf werfen darf. Wer bei 12
  // Wiederholungen angefangen hat, einmal 16 geschafft hat und jetzt bei 14
  // steht, geht nicht zurück — er hat eine Spitze nicht wiederholt, liegt aber
  // über dem Anfang. Nur wenn auch der Anfangswert wieder unterschritten ist,
  // ist es ein echter Rückgang. Der Unterschied ist wichtig, weil die beiden
  // Lagen verschiedene Antworten verlangen: einmal Geduld, einmal Erholung.
  const anfang = p.slice(0, 2).reduce((a, b) => a + b.wert, 0) / 2;
  const lage = jetzt.wert <= anfang ? 'rueckgang' : 'spitze';

  return {
    ja: true,
    lage,
    art: verlauf.art,
    hoch,
    jetzt,
    seit: danach.length,
    prozent: Math.round((1 - jetzt.wert / hoch.wert) * 100),
  };
}

/** Was die Lage heißt, in einem Satz. */
export function rueckgangText(r) {
  if (!r || !r.ja) return null;
  const hoch = verlaufText(r.art, r.hoch.wert);
  const jetzt = verlaufText(r.art, r.jetzt.wert);
  if (r.lage === 'rueckgang') {
    return `Seit ${r.seit} Einheiten unter deinem besten Wert (${hoch}), zuletzt ${jetzt} `
      + `— ${r.prozent} Prozent darunter, und damit auch unter dem, womit die Reihe angefangen hat. `
      + 'Das ist mehr als ein schlechter Tag. Meistens steckt Erholung dahinter: zu wenig Schlaf, '
      + 'zu wenig gegessen, zu viele schwere Wochen hintereinander.';
  }
  return `Dein bester Wert (${hoch}) liegt ${r.seit} Einheiten zurück, zuletzt ${jetzt}. `
    + 'Über dem Anfang der Reihe stehst du trotzdem — das ist kein Rückschritt, sondern eine '
    + 'Spitze, die du noch nicht wiederholt hast. Dranbleiben reicht hier meistens.';
}

/* ---------------- 3. Belastungsverlauf ---------------- */

/** Ab wie vielen abgeschlossenen Wochen die Reihe etwas aussagt. */
export const BELASTUNG_MIN_WOCHEN = 4;

/** Ab wie vielen Anstiegen in Folge ohne leichtere Woche es auffällt. */
export const BELASTUNG_ANSTIEGE = 3;

/** Ab wann eine Woche als leichter gilt: mindestens ein Fünftel weniger. */
export const BELASTUNG_LEICHTER = 0.8;

/** Ab wann ein Sprung von Woche zu Woche auffällt. */
export const BELASTUNG_SPRUNG = 0.3;

/**
 * Steigt die bewegte Last Woche für Woche, ohne dass je eine leichtere dazwischen
 * liegt?
 *
 * Woher der Gedanke kommt — und was hier bewusst **nicht** gemacht wird:
 * Carl Foster hat 1998 die Trainingsbelastung als Dauer mal gefühlter
 * Anstrengung (session-RPE) beschrieben und gezeigt, dass Wochen mit hoher
 * Belastung und wenig Abwechslung mit mehr Krankheits- und Verletzungstagen
 * zusammenfielen. Fosters Formel braucht genau das, was diese App bewusst
 * nicht abfragt: nach jeder Einheit eine Zahl für die Anstrengung. Ohne diese
 * Eingabe ist sie nicht zu rechnen, und eine erfundene Ersatzzahl wäre keine
 * Foster-Belastung, sondern nur eine, die so heißt.
 *
 * Übernommen wird deshalb nur der Kern, der auch ohne RPE trägt: **Abwechslung
 * schützt.** Gerechnet wird mit der bewegten Last aus `weeklyVolume` — Kilo mal
 * Wiederholungen, Körpergewichtssätze mit dem halben Körpergewicht angesetzt.
 * Das ist äußere Belastung, nicht die innere, die Foster meinte; wie anstrengend
 * eine Woche sich angefühlt hat, steht darin nicht.
 *
 * Auch die verbreiteten Grenzwerte gelten hier nicht: Fosters Monotonie- und
 * Belastungsschwellen stammen aus dem Leistungssport mit RPE-Daten, und das
 * „acute:chronic workload ratio" mit seinem angeblich sicheren Bereich ist
 * methodisch stark in die Kritik geraten (Impellizzeri u. a. 2020). Die Zahlen
 * unten sind darum unsere eigenen, bewusst grob gewählt, damit die App nicht
 * bei jeder normalen Steigerung Alarm schlägt.
 */
export function belastungsverlauf(wochen, aktuelleWoche = null) {
  // Die laufende Woche ist noch nicht vorbei. Sie mitzurechnen hieße, jeden
  // Montag einen Einbruch zu melden, der keiner ist.
  const reihe = (wochen || []).filter((w) => w && (!aktuelleWoche || w.week < aktuelleWoche));

  if (reihe.length < BELASTUNG_MIN_WOCHEN) {
    return { wochen: reihe.length, genug: false, warnung: null };
  }

  let anstiege = 0;
  for (let i = reihe.length - 1; i > 0; i -= 1) {
    if (reihe[i].volume > reihe[i - 1].volume) anstiege += 1; else break;
  }

  let ohneLeichte = 0;
  for (let i = reihe.length - 1; i > 0; i -= 1) {
    if (reihe[i].volume <= reihe[i - 1].volume * BELASTUNG_LEICHTER) break;
    ohneLeichte += 1;
  }

  const letzte = reihe[reihe.length - 1];
  // Verglichen wird mit der **schwersten** Woche davor, nicht mit der
  // unmittelbaren Vorwoche. Sonst meldet die App nach jeder Entlastungswoche
  // einen Sprung: Von 7.000 auf 12.500 kg sind rechnerisch achtzig Prozent,
  // tatsächlich ist es die Rückkehr auf das gewohnte Maß — genau das, wofür
  // die leichte Woche da war.
  const hoechste = reihe.slice(0, -1).reduce((a, b) => (b.volume > a.volume ? b : a));
  const sprung = hoechste.volume > 0 ? letzte.volume / hoechste.volume - 1 : 0;

  const warnung = sprung >= BELASTUNG_SPRUNG
    ? 'sprung'
    : (anstiege >= BELASTUNG_ANSTIEGE && ohneLeichte >= BELASTUNG_ANSTIEGE ? 'anstieg' : null);

  return {
    wochen: reihe.length,
    genug: true,
    anstiege,
    ohneLeichte,
    sprungProzent: Math.round(sprung * 100),
    letzte,
    warnung,
  };
}

/** Ein Satz zur Warnung — was sie heißt, nicht nur dass es eine gibt. */
export function belastungText(b) {
  if (!b || !b.genug || !b.warnung) return null;
  if (b.warnung === 'sprung') {
    return `Die letzte Woche liegt ${b.sprungProzent} Prozent über der bisher schwersten Woche `
      + 'der Reihe. Ein Sprung dieser Größe ist selten geplant — meist steckt eine nachgeholte '
      + 'Einheit dahinter oder eine Woche, in der ausnahmsweise nichts ausgefallen ist.';
  }
  return `${b.anstiege} Wochen in Folge mehr bewegte Last, und seit ${b.ohneLeichte} Wochen war `
    + 'keine davon spürbar leichter. Aufbau lebt davon, dass zwischendurch etwas zurückgenommen '
    + 'wird — sonst sammelt sich Ermüdung schneller an, als sie abgebaut wird.';
}

/* ---------------- Alles auf einmal ---------------- */

/**
 * Für jede Übung mit genug Einheiten: Richtung und mögliche Rückgänge.
 *
 * Sortiert wird nach Dringlichkeit, nicht alphabetisch: echte Rückgänge zuerst,
 * danach die nicht wiederholten Spitzen, dann der Rest nach Fortschritt. Wer
 * die Liste von oben liest, liest zuerst das, was eine Entscheidung verlangt.
 */
export function alleVerlaeufe(sessions, { bis = null, wieViele = 10 } = {}) {
  const ids = new Set();
  for (const s of sessions || []) {
    for (const [id, saetze] of Object.entries(s.entries || {})) {
      if ((saetze || []).some((x) => x && x.reps)) ids.add(id);
    }
  }

  const rang = { rueckgang: 0, spitze: 1 };
  return [...ids]
    .map((id) => {
      const verlauf = uebungsVerlauf(sessions, id, { bis, wieViele });
      return { verlauf, entwicklung: entwicklung(verlauf), rueckgang: rueckgang(verlauf) };
    })
    .filter((x) => x.entwicklung)
    .sort((a, b) => {
      const ra = a.rueckgang.ja ? rang[a.rueckgang.lage] : 2;
      const rb = b.rueckgang.ja ? rang[b.rueckgang.lage] : 2;
      return ra - rb || b.entwicklung.prozent - a.entwicklung.prozent;
    });
}
