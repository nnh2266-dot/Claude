/**
 * Richtung statt Momentaufnahme: Schlafregelmäßigkeit, Übungsverlauf,
 * Rückgang und Belastungsverlauf.
 *
 * Diese vier Rechnungen haben eines gemeinsam: Sie verlangen keine einzige
 * neue Eingabe. Genau das macht sie prüfbar — es gibt keine Zahl, die von
 * außen kommt und ein Ergebnis retten könnte. Jede Behauptung hier stammt aus
 * einer Falle, in die eine solche Rechnung leicht tappt.
 */
import { neuerLauf } from '../pruefen.js';
import * as SL from '../../js/sleep.js';
import * as V from '../../js/verlauf.js';

/** Tage verschieben, wie shiftDateKey in der App. */
function shift(datum, tage) {
  const d = new Date(`${datum}T12:00:00`);
  d.setDate(d.getDate() + tage);
  return d.toISOString().slice(0, 10);
}

/** Nächte rückwärts ab einem Datum. */
function naechte(bis, zeiten) {
  return zeiten.map(([zuBett, aufgewacht], i) => ({
    date: shift(bis, i - (zeiten.length - 1)), zuBett, aufgewacht,
  }));
}

/** Einheiten rückwärts, eine Übung, je Einheit ein Satz. */
function einheiten(bis, saetze, id = 'pushup') {
  return saetze.map((satz, i) => ({
    date: shift(bis, (i - (saetze.length - 1)) * 3),
    entries: { [id]: [satz] },
  }));
}

export default async function laufen() {
  const p = neuerLauf('Verlauf');
  const HEUTE = '2026-09-18';

  /* ---------- 1. Schlafregelmäßigkeit ---------- */

  // Die Falle, an der jede naive Rechnung scheitert: 23:50 und 00:10 sind
  // zwanzig Minuten auseinander, nicht dreiundzwanzig Stunden. Wer Uhrzeiten
  // als Zahlen mittelt, macht aus zwei fast gleichen Nächten die größte
  // Unregelmäßigkeit, die es gibt.
  const umMitternacht = naechte(HEUTE, [
    ['23:50', '07:00'], ['00:10', '07:10'], ['23:40', '06:50'],
    ['00:00', '07:05'], ['23:55', '07:00'],
  ]);
  const rUm = SL.regelmaessigkeit(umMitternacht, HEUTE, shift);
  p.ist(rUm.genug, 'Schlaf: fünf Nächte reichen für eine Aussage');
  p.zwischen(rUm.bettStreuung, 0, 25,
    'Schlaf: 23:50 und 00:10 gelten als zwanzig Minuten auseinander, nicht als Tag');
  p.gleich(rUm.stufe, 'fest', 'Schlaf: gleichmäßige Zeiten heißen „fest"');

  // Und umgekehrt: Wer wirklich springt, muss auch als springend gelten.
  const springend = naechte(HEUTE, [
    ['21:30', '05:30'], ['02:30', '10:30'], ['21:00', '05:00'],
    ['03:00', '11:00'], ['22:00', '06:00'],
  ]);
  const rSpring = SL.regelmaessigkeit(springend, HEUTE, shift);
  p.ist(rSpring.mitteStreuung > rUm.mitteStreuung * 5,
    'Schlaf: springende Zeiten streuen deutlich stärker als feste');
  p.ist(['wechselhaft', 'sprunghaft'].includes(rSpring.stufe),
    'Schlaf: fünf Stunden Unterschied heißen nicht mehr „ordentlich"',
    `war ${rSpring.stufe} bei ± ${rSpring.mitteStreuung} min`);

  // Zu wenig Daten ist kein Ergebnis, sondern zu wenig Daten. Eine Stufe aus
  // drei Nächten wäre eine Behauptung ohne Grundlage.
  const wenige = naechte(HEUTE, [['23:00', '07:00'], ['23:10', '07:05'], ['22:50', '06:55']]);
  p.ist(!SL.regelmaessigkeit(wenige, HEUTE, shift).genug,
    'Schlaf: unter fünf Nächten gibt es keine Stufe');

  // Halbe Nächte dürfen nicht mitzählen — sonst rechnet die Streuung mit
  // Zeiten, die gar nicht dastehen.
  const halb = [...umMitternacht, { date: shift(HEUTE, -6), zuBett: '23:00' }];
  p.gleich(SL.regelmaessigkeit(halb, HEUTE, shift).naechte, 5,
    'Schlaf: eine halb eingetragene Nacht zählt nicht mit');

  // Das Fenster muss wirken: Was länger her ist, gehört nicht in die Zahl.
  const alt = naechte(shift(HEUTE, -30), [
    ['23:00', '07:00'], ['23:00', '07:00'], ['23:00', '07:00'],
    ['23:00', '07:00'], ['23:00', '07:00'],
  ]);
  p.ist(!SL.regelmaessigkeit(alt, HEUTE, shift).genug,
    'Schlaf: Nächte von vor einem Monat zählen nicht für heute');

  /* ---------- 2. Verlauf einer Übung ---------- */

  const steigend = einheiten(HEUTE, [{ reps: 10 }, { reps: 11 }, { reps: 12 }, { reps: 14 }]);
  const vSteigend = V.uebungsVerlauf(steigend, 'pushup');
  p.gleich(vSteigend.art, 'wdh', 'Verlauf: ohne Gewicht zählen Wiederholungen');
  p.gleich(vSteigend.punkte.map((x) => x.wert), [10, 11, 12, 14],
    'Verlauf: je Einheit der beste Satz, in zeitlicher Reihenfolge');
  p.gleich(V.entwicklung(vSteigend).richtung, 'hoch',
    'Verlauf: von 10 auf 14 Wiederholungen ist ein Anstieg');

  // Unter vier Einheiten gibt es keine Richtung, nur Punkte.
  p.ist(V.entwicklung(V.uebungsVerlauf(einheiten(HEUTE, [{ reps: 10 }, { reps: 12 }]), 'pushup')) === null,
    'Verlauf: aus zwei Einheiten wird keine Richtung abgeleitet');

  // Der Kern von Vorschlag 2: Mit Zusatzgewicht wird das geschätzte Maximum
  // gerechnet, nicht die Wiederholungszahl. 60 kg × 8 sind mehr als 50 kg × 10
  // — als Wiederholungen gelesen wäre es weniger.
  const mitGewicht = einheiten(HEUTE, [
    { reps: 10, weight: 50 }, { reps: 10, weight: 52.5 },
    { reps: 9, weight: 57.5 }, { reps: 8, weight: 60 },
  ], 'pullup');
  const vGewicht = V.uebungsVerlauf(mitGewicht, 'pullup');
  p.gleich(vGewicht.art, 'e1rm', 'Verlauf: mit Zusatzgewicht zählt das geschätzte Maximum');
  p.gleich(V.entwicklung(vGewicht).richtung, 'hoch',
    'Verlauf: weniger Wiederholungen bei mehr Gewicht sind trotzdem Fortschritt');
  p.enthaelt(V.verlaufText('e1rm', 62.5), '≈',
    'Verlauf: das geschätzte Maximum steht als Schätzung da, nicht als gehobenes Gewicht');

  // Zwei Arten dürfen nicht auf eine Achse. Wer erst ohne und dann mit Gewicht
  // arbeitet, hat zwei Reihen — 8 Wiederholungen und 8 Kilo sind nicht
  // vergleichbar.
  const gemischt = einheiten(HEUTE, [
    { reps: 12 }, { reps: 13 }, { reps: 14 },
    { reps: 8, weight: 5 }, { reps: 8, weight: 7.5 },
    { reps: 8, weight: 10 }, { reps: 8, weight: 12.5 },
  ], 'pullup');
  const vGemischt = V.uebungsVerlauf(gemischt, 'pullup');
  p.gleich(vGemischt.art, 'e1rm', 'Verlauf: die jüngste Art gibt den Maßstab vor');
  p.gleich(vGemischt.punkte.length, 4,
    'Verlauf: die Einheiten ohne Gewicht bleiben aus der Reihe heraus');

  // Haltearbeit ist Sekunden, nicht Wiederholungen — der Fehler, der einmal
  // aus zwei Planks das Fünffache einer Liegestützeinheit gemacht hat.
  const gehalten = einheiten(HEUTE, [{ reps: 40 }, { reps: 45 }, { reps: 50 }, { reps: 55 }], 'plank');
  p.gleich(V.uebungsVerlauf(gehalten, 'plank').art, 'zeit',
    'Verlauf: bei gehaltenen Übungen zählen Sekunden');

  /* ---------- 3. Rückgang ---------- */

  const rein = (reihe, id = 'pushup') =>
    V.rueckgang(V.uebungsVerlauf(einheiten(HEUTE, reihe.map((r) => ({ reps: r })), id), id));

  // Eine einzelne schlechte Einheit ist Tagesform, kein Rückgang.
  p.ist(!rein([12, 13, 14, 15, 12]).ja,
    'Rückgang: eine einzelne schwache Einheit löst nichts aus');

  // Aufwärts ist kein Rückgang.
  p.ist(!rein([10, 11, 12, 13, 14]).ja, 'Rückgang: eine steigende Reihe wird nicht gemeldet');

  // Drei Einheiten deutlich unter dem Besten und unter dem Anfang: Rückgang.
  const echt = rein([16, 15, 16, 13, 12, 11]);
  p.ist(echt.ja && echt.lage === 'rueckgang',
    'Rückgang: 16 → 11 über drei Einheiten ist ein echter Rückgang',
    `war ${echt.ja ? echt.lage : 'nichts'}`);
  p.gleich(echt.hoch.wert, 16, 'Rückgang: der Bezugswert ist der beste davor');

  // Der Unterschied, auf den es ankommt: Wer bei 12 angefangen hat, einmal 16
  // geschafft hat und jetzt bei 14 steht, geht nicht zurück. Er hat eine
  // Spitze nicht wiederholt — und braucht Geduld, nicht Erholung.
  const spitze = rein([12, 14, 16, 13, 13, 14]);
  p.ist(spitze.ja && spitze.lage === 'spitze',
    'Rückgang: über dem Anfang heißt „Spitze nicht wiederholt", nicht „Rückgang"',
    `war ${spitze.ja ? spitze.lage : 'nichts'}`);
  p.enthaelt(V.rueckgangText(spitze), 'kein Rückschritt',
    'Rückgang: der Text zur Spitze sagt ausdrücklich, dass es keiner ist');

  // Der lange Abstieg muss ganz gefunden werden, nicht nur zu dritt.
  p.gleich(rein([20, 19, 18, 17, 16, 15, 14]).seit, 5,
    'Rückgang: die ganze abfallende Schlussfolge wird gezählt');

  // Für Wiederholungen ist die Schwelle höher als für das geschätzte Maximum —
  // die Tagesform schlägt dort stärker durch.
  p.ist(V.RUECK_SCHWELLE.wdh > V.RUECK_SCHWELLE.e1rm,
    'Rückgang: Wiederholungen dürfen stärker schwanken als geschätzte Maxima');

  // Vier Prozent unter dem Besten sind bei Wiederholungen Rauschen.
  p.ist(!rein([25, 25, 24, 24, 24]).ja,
    'Rückgang: vier Prozent Abstand bei Wiederholungen sind noch kein Signal');

  /* ---------- 4. Belastungsverlauf ---------- */

  const w = (...vol) => vol.map((volume, i) => ({ week: shift('2026-08-03', i * 7), volume }));

  // Die laufende Woche ist nicht vorbei. Sie mitzurechnen hieße, jeden Montag
  // einen Einbruch zu melden, den es nicht gibt.
  const mitLaufender = w(10000, 11000, 12000, 13000, 800);
  const b = V.belastungsverlauf(mitLaufender, shift('2026-08-03', 28));
  p.gleich(b.wochen, 4, 'Belastung: die angebrochene Woche zählt nicht mit');
  p.gleich(b.warnung, 'anstieg',
    'Belastung: vier steigende Wochen ohne leichtere fallen auf');

  // Mit einer leichten Woche dazwischen ist alles in Ordnung.
  const mitEntlastung = w(10000, 11000, 12000, 7000, 12500);
  p.gleich(V.belastungsverlauf(mitEntlastung, shift('2026-08-03', 35)).warnung, null,
    'Belastung: eine leichtere Woche dazwischen beruhigt die Reihe');

  // Ein Sprung ist etwas anderes als ein Anstieg und bekommt einen eigenen Namen.
  const sprung = V.belastungsverlauf(w(10000, 10200, 10100, 16000), shift('2026-08-03', 28));
  p.gleich(sprung.warnung, 'sprung', 'Belastung: ein Satz um sechzig Prozent heißt Sprung');
  p.enthaelt(V.belastungText(sprung), 'über der bisher schwersten Woche',
    'Belastung: der Sprung wird an der schwersten Woche gemessen, nicht an der Vorwoche');

  // Der Fehler, den diese Prüfung gefunden hat: Gemessen an der Vorwoche ist
  // die Rückkehr aus einer Entlastungswoche ein Sprung von achtzig Prozent —
  // und die App hätte genau das gemeldet, wofür die leichte Woche da war.
  p.gleich(V.belastungsverlauf(w(10000, 11000, 12000, 7000, 12300), shift('2026-08-03', 35)).warnung, null,
    'Belastung: die Rückkehr auf das gewohnte Maß nach einer leichten Woche ist kein Sprung');

  // Unter vier Wochen gibt es kein Muster, nur Wochen.
  p.ist(!V.belastungsverlauf(w(10000, 11000, 12000), shift('2026-08-03', 21)).genug,
    'Belastung: drei Wochen sind noch kein Verlauf');

  // Und der Text muss offenlegen, dass hier nicht nach Foster gerechnet wird.
  const { readFileSync } = await import('node:fs');
  const quelle = readFileSync(new URL('../../js/verlauf.js', import.meta.url), 'utf8');
  p.enthaelt(quelle, 'Foster', 'Belastung: die Herkunft des Gedankens ist benannt');
  p.enthaelt(quelle, 'nicht abfragt',
    'Belastung: im Quelltext steht, warum Fosters Formel hier nicht gerechnet wird');

  return p;
}
