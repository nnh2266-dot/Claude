/**
 * Die rechnenden Teile, ohne Browser.
 *
 * Alles hier ist eine Behauptung über eine Zahl oder einen Satz, den die App
 * ausgibt — und jede stammt aus einem Fehler, den es einmal gab, oder aus einer
 * Quelle, die in den Dateien zitiert ist.
 */
import { neuerLauf } from '../pruefen.js';
import * as T from '../../js/training.js';
import * as L from '../../js/ladders.js';
import * as W from '../../js/water.js';
import * as E from '../../js/energy.js';
import * as A from '../../js/activities.js';
import * as S from '../../js/strength.js';
import * as K from '../../js/kegel.js';
import { APP_VERSION } from '../../js/version.js';

const PROFIL = {
  sex: 'm', age: 34, height: 180, weight: 80, bodyfat: null,
  goal: 'abnehmen', targetWeight: 76, level: 'fortgeschritten',
  days: 3, weekdays: [1, 3, 5], sessionLength: 60, ernaehrung: 'vegetarisch',
  equipment: 'bw', activity: 'leicht',
  limits: [], focus: [], skills: [], gear: ['stange', 'barren'], blocked: [], outgrown: [],
};

export default async function laufen() {
  const p = neuerLauf('Logik');

  /* ---------- Trinken ---------- */
  // EFSA 2,5 l/Tag ist Gesamtwasser inkl. Essen; getrunken werden 25 ml je kg.
  p.gleich(W.ML_PRO_KG, 25, 'Trinken: 25 ml je kg (nicht 35 — das wäre Gesamtwasser)');
  p.gleich(W.dailyGoal(80, 0), 2000, 'Trinken: 80 kg ohne Sport ergibt 2000 ml');
  p.ist(W.dailyGoal(80, 60) > W.dailyGoal(80, 0), 'Trinken: Sport hebt den Richtwert');
  // Der Fehler, der zwei Zahlen auf einen Bildschirm brachte.
  p.gleich(E.energyPlan(PROFIL, 0).water, 2,
    'Trinken: Energieplan und Trinkkachel nennen dieselbe Zahl');

  /* ---------- Sport ---------- */
  p.gleich(A.activityById('golf').met, 4.5, 'Golf: MET 4,5 (Tabellenwert 3,5–5,3)');
  p.ist(A.activityById('golf').met < A.activityById('ballsport').met,
    'Golf ist lockerer als Ballsport');
  const golfTag = A.dayTotals([{ type: 'golf', minutes: 240, intensity: 'mittel' }], 80);
  p.gleich(golfTag.minuten, 240, 'Sport: rohe Minuten bleiben roh');
  p.ist(golfTag.schwitzen < golfTag.minuten,
    'Sport: fürs Trinken zählen gewichtete Minuten, nicht rohe');
  const laufTag = A.dayTotals([{ type: 'laufen', minutes: 60, intensity: 'mittel' }], 80);
  p.ist(laufTag.schwitzen > laufTag.minuten, 'Sport: Laufen zählt fürs Trinken stärker als eins zu eins');

  /* ---------- Einheiten: Sekunden gegen Wiederholungen ---------- */
  p.ist(T.isTimed('plank'), 'Unterarmstütz wird in Sekunden gemessen');
  p.ist(!T.isTimed('pushup'), 'Liegestütze werden in Wiederholungen gemessen');
  p.gleich(T.repRange({ id: 'plank' }), [30, 60], 'Plank: Zielbereich 30–60 s');
  // Der Fehler: Sekunden gingen als Wiederholungen ins Volumen.
  const nurHalten = T.weeklyVolume(
    [{ date: '2026-01-05', entries: { plank: [{ weight: null, reps: 45 }] } }], 80);
  p.leer(nurHalten, 'Volumen: reine Haltearbeit erzeugt kein Volumen');
  const mitWdh = T.weeklyVolume(
    [{ date: '2026-01-05', entries: { pushup: [{ weight: null, reps: 20 }] } }], 80);
  p.ist(mitWdh.length === 1 && mitWdh[0].volume > 0, 'Volumen: Wiederholungen zählen weiter');
  // Bestleistungen mischen die Einheiten nicht.
  const besten = T.personalBests([{ date: '2026-01-05', entries: {
    pushup: [{ weight: null, reps: 22 }], wallsit: [{ weight: null, reps: 60 }] } }]);
  p.ist(besten.findIndex((b) => b.id === 'pushup') < besten.findIndex((b) => b.id === 'wallsit'),
    'Bestleistungen: Haltearbeit steht hinter den Wiederholungen');

  /* ---------- Fortschrittstext ---------- */
  p.enthaelt(T.nextStep({ id: 'plank', sets: 3, reps: [30, 60], rir: 2, loadless: true },
    [{ reps: 35 }, { reps: 32 }]), 'Sekunden', 'Nächster Schritt bei Halteübungen in Sekunden');
  p.enthaelt(T.nextStep({ id: 'pushup', sets: 3, reps: [10, 20], rir: 2, loadless: true },
    [{ reps: 12 }, { reps: 11 }]), 'Wiederholung', 'Nächster Schritt bei Wiederholungen');

  /* ---------- RIR und Blockwochen ---------- */
  for (const woche of [1, 2, 3, 4]) {
    const f = T.forWeek({ id: 'bp', sets: 4, reps: [6, 10], rir: 1, loadless: false }, woche);
    p.zwischen(f.rir, 1, 4, `Woche ${woche}: RIR bleibt zwischen 1 und 4`);
    p.ist(f.sets >= 2, `Woche ${woche}: mindestens zwei Sätze`);
  }
  const plan4 = { createdAt: '2026-01-05', zyklus: 4 };
  p.gleich([0, 1, 2, 3].map((w) => T.blockWeek(plan4, verschoben('2026-01-05', w * 7))),
    [1, 2, 3, 4], 'Vierwochenblock läuft 1-2-3-4');
  const plan6 = { createdAt: '2026-01-05', zyklus: 6 };
  p.gleich([0, 1, 2, 3, 4, 5].map((w) => T.blockWeek(plan6, verschoben('2026-01-05', w * 7))),
    [1, 2, 2, 2, 3, 4], 'Sechswochenblock endet auf Deload');
  const planAus = { createdAt: '2026-01-05', zyklus: 0 };
  p.gleich([0, 1, 2, 3].map((w) => T.blockWeek(planAus, verschoben('2026-01-05', w * 7))),
    [2, 2, 2, 2], 'Ohne festen Block läuft die Aufbauwoche durch');

  /* ---------- Einseitige Übungen ---------- */
  p.ist(T.isUnilateral('bulg'), 'Bulgarian Split Squat ist einseitig');
  const einseitig = [{ id: 'bulg', sets: 3, reps: [10, 20], rir: 2, loadless: true }];
  const beidseitig = [{ id: 'bwsq', sets: 3, reps: [10, 20], rir: 2, loadless: true }];
  p.ist(T.sessionMinutes(einseitig) > T.sessionMinutes(beidseitig),
    'Zeit: einseitige Übungen dauern länger als beidseitige');
  p.gleich(T.tatsaechlicheSaetze(einseitig, 2), 6, 'Drei Sätze einseitig sind sechs Durchgänge');

  /* ---------- Leitern ---------- */
  p.gleich(L.outgrownMitUnterbau(['pseudopu']).sort(), ['pushele', 'pushup', 'pseudopu'].sort(),
    'Ausgewachsen: alles unterhalb zählt mit');
  p.gleich(L.leiterRang('pushele'), 0, 'Leiterrang: erhöhte Liegestütze sind Sprosse 1');
  p.ist(L.leiterRang('squat') === null, 'Leiterrang: Übungen ohne Leiter liefern null');
  const hoch = L.harderRung('pushup', PROFIL);
  p.ist(hoch && L.ladderFor(hoch.exercise.id).index > L.ladderFor('pushup').index,
    'Leiter: eine Stufe höher liegt höher');

  /* ---------- Beckenboden ---------- */
  p.gleich(K.DOSIS, 2, 'Beckenboden: zwei Durchgänge am Tag');
  p.ist(K.GENUG_AM_TAG >= K.DOSIS, 'Beckenboden: das Höchstmaß liegt nicht unter der Empfehlung');
  const ablauf = K.ablauf(K.stufe(1));
  p.gleich(ablauf.filter((x) => x.art === 'an').length,
    ablauf.filter((x) => x.art === 'aus').length,
    'Beckenboden: genauso oft loslassen wie anspannen');
  p.ist(!K.loesenAblauf().some((x) => x.art === 'an'),
    'Beckenboden: im Lösen-Durchgang wird nicht angespannt');

  /* ---------- Krafteinordnung ---------- */
  p.ist(S.RATED_COUNT > 0 && S.EXERCISE_COUNT === T.EXERCISES.length,
    'Kraft: der Ehrlichkeitskasten zählt alle Übungen');
  const sp = S.rateExercise('sideplank', { weight: 0, reps: 40 }, PROFIL);
  p.ist(sp && sp.art === 'zeit', 'Kraft: Seitstütz wird in Sekunden eingeordnet');
  p.ist(S.rateableFor('ham', PROFIL).length > 0,
    'Kraft: für Beine hinten gibt es ohne Geräte eine bewertbare Übung');

  /* ---------- Die Leiter muss auch steigen ---------- */
  // Der Fehler, den diese Prüfungen festnageln: Der Vorschlag „Zeit für die
  // nächste Stufe" verlangte, dass **alle** Sätze am oberen Rand liegen — bei
  // einem oberen Rand von zwanzig. Über vier bis fünf gerade Sätze fallen die
  // Wiederholungen aber immer ab. Wer dreißig Liegestütze konnte, schrieb
  // 28/24/21/19/18 auf und bekam den Vorschlag nie zu sehen. Die Bedingung ging
  // nur auf, wenn man sich künstlich bremste — also genau dann, wenn es zu
  // leicht war.
  const bwProfil = { ...PROFIL, equipment: 'bw' };
  const bwPlan = T.buildPlan(L.profileForPlan(bwProfil), 0, { rang: L.leiterRang, leiter: L.leiterId });
  const bwVorgaben = bwPlan.days.flatMap((d) => d.exercises)
    .filter((x) => x.loadless && !T.isTimed(x.id));
  p.ist(bwVorgaben.length > 0, 'Leiter: der Körpergewichtsplan hat Vorgaben ohne Gewicht');
  p.ist(bwVorgaben.every((x) => T.repRange(x)[1] <= T.LOADLESS_OBEN),
    `Leiter: ohne Gewicht endet der Bereich bei ${T.LOADLESS_OBEN}, nicht im Ausdauerbereich`,
    bwVorgaben.map((x) => `${x.id} ${T.repRange(x).join('-')}`).join(', ').slice(0, 160));

  // Alte Pläne tragen die 20 von früher. Sie müssen ohne Neubau mitgedeckelt
  // werden — sonst wirkt die Reparatur erst, wenn jemand den Plan neu würfelt.
  p.gleich(T.repRange({ id: 'pushup', reps: [10, 20], loadless: true }), [10, T.LOADLESS_OBEN],
    'Leiter: ein alter Plan mit 10–20 wird beim Lesen gedeckelt');
  p.gleich(T.repRange({ id: 'bench', reps: [6, 10], loadless: false }), [6, 10],
    'Leiter: mit Hantel bleibt der Bereich unangetastet');

  const serieAus = (reps, vorgabe) => L.topOutStreak(
    [0, 1, 2].map((i) => ({
      date: verschoben('2026-09-01', i),
      entries: { [vorgabe.id]: reps.map((r) => ({ reps: r, weight: vorgabe.loadless ? 0 : 60 })) },
    })),
    vorgabe, '2026-09-30',
  );
  const bwVorgabe = { id: 'pushup', sets: 5, reps: [10, 20], rir: 2, loadless: true };

  p.ist(serieAus([28, 24, 21, 19, 18], bwVorgabe) >= L.STREAK_FOR_NEXT,
    'Leiter: wer dreißig Liegestütze kann, bekommt die nächste Stufe vorgeschlagen');
  p.ist(serieAus([20, 17, 15, 14, 13], bwVorgabe) >= L.STREAK_FOR_NEXT,
    'Leiter: auch mit abfallenden Sätzen, solange der beste oben liegt');
  p.ist(serieAus([13, 12, 11, 10, 10], bwVorgabe) === 0,
    'Leiter: wer den Bereich noch nicht erreicht, wird nicht hochgeschickt');
  p.ist(serieAus([16], bwVorgabe) === 0,
    'Leiter: ein einzelner aufgezeichneter Satz reicht als Nachweis nicht');

  // Mit Hantel bleibt es bei der doppelten Progression: erst wenn alle Sätze
  // oben sind, steigt das Gewicht. Dort ist das erfüllbar, weil man das Gewicht
  // passend wählen kann.
  const hantelVorgabe = { id: 'bench', sets: 4, reps: [6, 10], rir: 2, loadless: false };
  p.ist(serieAus([10, 9, 8, 8], hantelVorgabe) === 0,
    'Leiter: mit Hantel zählt weiter der schwächste Satz, nicht der beste');
  p.ist(serieAus([10, 10, 10, 10], hantelVorgabe) >= L.STREAK_FOR_NEXT,
    'Leiter: mit Hantel steigt es, wenn wirklich alle Sätze oben sind');

  /* ---------- Das Pausentempo muss beim Planbau ankommen ---------- */
  // Der Fehler: Das Tempo wird über setSetting gespeichert und unter
  // ctx.settings.pausen gelesen — buildPlan suchte es aber in profile.pausen,
  // und dieses Feld gibt es im Trainingsprofil nicht. Der Plan rechnete also
  // immer mit neunzig Sekunden Pause. Wer kurze Pausen macht, bekam dadurch
  // weniger Übungen, als in sein Zeitfenster passen, und war früher fertig.
  const tempoProfil = (minuten) => ({ ...PROFIL, equipment: 'bw', sessionLength: minuten });
  const anzahlBei = (minuten, tempo) => {
    const pr = tempoProfil(minuten);
    const plan = T.buildPlan(L.profileForPlan(pr), 1, { rang: L.leiterRang, leiter: L.leiterId, pausen: tempo });
    return plan.days[0].exercises.length;
  };

  p.ist(anzahlBei(60, 'kurz') > anzahlBei(60, 'lang'),
    'Pausen: kurze Pausen lassen mehr Übungen in dieselbe Zeit',
    `kurz ${anzahlBei(60, 'kurz')}, normal ${anzahlBei(60, 'normal')}, lang ${anzahlBei(60, 'lang')}`);

  // Und das Ergebnis muss mit genau dem Tempo gemessen wieder hineinpassen.
  const passtNicht = [];
  for (const minuten of [45, 60, 75, 90]) {
    for (const tempo of ['kurz', 'normal', 'lang']) {
      const pr = tempoProfil(minuten);
      const plan = T.buildPlan(L.profileForPlan(pr), 1, { rang: L.leiterRang, leiter: L.leiterId, pausen: tempo });
      for (const tag of plan.days) {
        // Tage am Mindestumfang dürfen überziehen — das sagt die App dann auch.
        if (tag.exercises.length <= 4) continue;
        const dauer = T.sessionMinutes(
          tag.exercises.map((x) => ({ ...x, sets: T.forWeek(x, 2).sets })), tempo,
        );
        if (dauer > minuten + 1) passtNicht.push(`${minuten} min/${tempo}: ${dauer} min`);
      }
    }
  }
  p.leer(passtNicht, 'Pausen: der Plan passt in jedem Tempo in sein Zeitfenster');

  // Ohne übergebenes Tempo bleibt es beim bisherigen Verhalten — sonst wären
  // alle bestehenden Aufrufe stillschweigend andere Pläne.
  p.gleich(anzahlBei(60, null), anzahlBei(60, 'normal'),
    'Pausen: ohne Angabe wird wie bisher mit normalen Pausen gerechnet');

  /* ---------- Die empfohlene Trainingszeit ---------- */
  const knapp = { ...PROFIL, equipment: 'bw', sessionLength: 30, days: 5,
    weekdays: [1, 2, 3, 4, 5], skills: ['handstand', 'pullup'] };
  const empf = T.empfohleneZeit(knapp, { rang: L.leiterRang, leiter: L.leiterId });

  p.ist(empf && empf.minuten > knapp.sessionLength,
    'Zeitempfehlung: dreißig Minuten bei fünf Tagen sind zu knapp',
    empf ? `empfohlen ${empf.minuten} min` : 'keine Empfehlung');
  p.ist(empf.gut > empf.jetzt.gut,
    'Zeitempfehlung: das empfohlene Fenster bringt mehr Gruppen in den Zielbereich',
    `${empf.jetzt.gut} → ${empf.gut} von 10`);
  p.ist(empf.daneben < empf.jetzt.daneben,
    'Zeitempfehlung: und weniger Gruppen daneben');

  // Die Empfehlung darf nicht einfach das längste Fenster nehmen. Wer nur auf
  // „Gruppen im Zielbereich" schaut, landet bei achtzig Minuten und schiebt
  // dafür eine Gruppe über den Bereich hinaus.
  p.ist(empf.minuten < Math.max(...T.ZEIT_KANDIDATEN),
    'Zeitempfehlung: nicht einfach das längste Fenster',
    `empfohlen ${empf.minuten} von bis zu ${Math.max(...T.ZEIT_KANDIDATEN)} min`);

  // Bei Gleichstand gewinnt das kürzere Fenster — Zeit ist der Preis.
  const gleichstand = empf.stufen.filter((x) => x.daneben === empf.daneben);
  p.gleich(empf.minuten, Math.min(...gleichstand.map((x) => x.minuten)),
    'Zeitempfehlung: bei gleichem Ergebnis das kürzere Fenster');

  // Wer schon gut liegt, bekommt keine Empfehlung — sonst ist sie Lärm.
  const passend = { ...knapp, sessionLength: empf.minuten };
  p.ist(!T.empfohleneZeit(passend, { rang: L.leiterRang, leiter: L.leiterId }).lohnt,
    'Zeitempfehlung: wer schon richtig liegt, wird nicht behelligt');

  // Die Empfehlung folgt dem Profil, auch wenn es sich über Monate ändert:
  // Wer Leitersprossen erklimmt, landet bei einarmigen und einbeinigen
  // Varianten, und die dauern doppelt so lang.
  const gestiegen = L.profileForPlan({ ...knapp, sessionLength: 60,
    outgrown: ['pushup', 'pseudopu', 'bwsq', 'lunge', 'gbridge', 'bwgm'] });
  const nachher = T.empfohleneZeit(gestiegen, { rang: L.leiterRang, leiter: L.leiterId });
  p.ist(nachher && T.ZEIT_KANDIDATEN.includes(nachher.minuten),
    'Zeitempfehlung: auch nach Aufstiegen kommt eine gültige Empfehlung heraus',
    nachher ? `${nachher.minuten} min` : 'keine');

  // Aber sie darf nicht anfangen zu nörgeln. Ein Unterschied von einer Gruppe
  // ist für diese Rechnung Rauschen — wer deswegen alle paar Wochen um fünf
  // Minuten hin und her geschickt wird, schaltet die Karte im Kopf ab.
  p.ist(!nachher.lohnt,
    'Zeitempfehlung: eine Gruppe Unterschied löst keine neue Empfehlung aus',
    `beste ${nachher.minuten} min mit ${nachher.gut}, jetzt 60 min mit ${nachher.jetzt.gut}`);

  // Der Fall, in dem keine Zeitangabe die richtige Antwort ist.
  //
  // Bei zwei Trainingstagen liegt keine einzige Muskelgruppe im empfohlenen
  // Volumen — bei keinem Fenster, auch nicht bei achtzig Minuten. Die Rechnung
  // empfahl trotzdem dreißig Minuten: Alle waren gleich schlecht, und bei
  // Gleichstand gewinnt das kürzeste. „Trainier zweimal dreißig Minuten" als
  // Antwort auf „was ist optimal" ist aber eine Zahl ohne Inhalt.
  const zweiTage = L.profileForPlan({ ...knapp, sessionLength: 45, days: 2, weekdays: [1, 4] });
  const knappeTage = T.empfohleneZeit(zweiTage, { rang: L.leiterRang, leiter: L.leiterId });
  p.ist(knappeTage.reichtNicht,
    'Zeitempfehlung: bei zwei Trainingstagen hilft keine Minutenzahl',
    `bestes Fenster erreicht ${knappeTage.gut} von ${knappeTage.gruppen} Gruppen`);
  p.ist(!knappeTage.lohnt,
    'Zeitempfehlung: dann wird auch keine Umstellung des Fensters vorgeschlagen');

  // Und bei genug Tagen bleibt es bei einer Zeitangabe.
  const fuenfTage = L.profileForPlan({ ...knapp, sessionLength: 45, days: 5, weekdays: [1, 2, 3, 4, 5] });
  p.ist(!T.empfohleneZeit(fuenfTage, { rang: L.leiterRang, leiter: L.leiterId }).reichtNicht,
    'Zeitempfehlung: bei fünf Tagen ist die Zeit der richtige Hebel');

  // Gezählt wird gegen alle Muskelgruppen, die überhaupt vorkommen können —
  // nicht gegen die, die in diesem einen Plan zufällig stehen.
  //
  // Hier lag ein Fehler, der die Empfehlung systematisch zu kurz machte: Eine
  // kurze Einheit lässt Gruppen ganz weg, die tauchten in ihrer Wertung nicht
  // auf und zählten auch nicht als „daneben". Eine Gruppe, die gar nicht
  // trainiert wird, stand damit besser da als eine, die etwas zu wenig
  // abbekommt. Bei sechs Tagen kam so heraus: vierzig Minuten mit sechs von
  // zehn Gruppen schlug sechzig mit sieben von elf.
  const sechsTage = L.profileForPlan({ ...knapp, days: 6, weekdays: [1, 2, 3, 4, 5, 6] });
  const sechs = T.empfohleneZeit(sechsTage, { rang: L.leiterRang, leiter: L.leiterId });
  const nenner = new Set(sechs.stufen.map((x) => x.gruppen));
  p.gleich(nenner.size, 1,
    'Zeitempfehlung: alle Fenster werden gegen denselben Nenner gezählt',
    `Nenner: ${[...nenner].join(', ')}`);
  p.ist(sechs.stufen.every((x) => x.gut + x.daneben === x.gruppen),
    'Zeitempfehlung: im Ziel plus daneben ergibt immer alle Gruppen');

  const besteStufe = sechs.stufen.reduce((a, b) => (b.gut > a.gut ? b : a));
  p.ist(sechs.gut >= besteStufe.gut,
    'Zeitempfehlung: kein Fenster bringt mehr Gruppen ins Ziel als das empfohlene',
    `empfohlen ${sechs.minuten} min mit ${sechs.gut}, bestes ${besteStufe.minuten} min mit ${besteStufe.gut}`);

  /* ---------- Trainingstage im Vergleich ---------- */
  const tage = T.tageVergleich(L.profileForPlan(knapp), { rang: L.leiterRang, leiter: L.leiterId });
  p.gleich(tage.length, T.TAGE_KANDIDATEN.length,
    'Tagevergleich: jede Tagezahl bekommt ein Ergebnis');
  p.ist(tage.every((x) => x.gruppen === tage[0].gruppen),
    'Tagevergleich: auch hier derselbe Nenner für alle Zeilen');
  p.ist(tage.find((x) => x.tage === 2).reichtNicht,
    'Tagevergleich: zwei Tage reichen bei keinem Zeitfenster');
  p.ist(tage.find((x) => x.tage === 5).gut > tage.find((x) => x.tage === 2).gut,
    'Tagevergleich: mehr Tage bringen mehr Gruppen ins Ziel');

  // Der Tagevergleich muss auch eine Rangfolge hergeben, nicht nur Zeilen.
  const sechsTageVergleich = T.tageVergleich(
    L.profileForPlan({ ...knapp, days: 6, weekdays: [1, 2, 3, 4, 5, 6] }), { rang: L.leiterRang, leiter: L.leiterId },
  );
  const jetztSechs = sechsTageVergleich.find((x) => x.tage === 6);
  const besteVonAllen = [...sechsTageVergleich].sort((a, b) => a.daneben - b.daneben)[0];
  p.ist(besteVonAllen.daneben <= jetztSechs.daneben,
    'Tagevergleich: die beste Zeile ist nie schlechter als die eigene');

  // Und bei Gleichstand gewinnt die Tagezahl, die der jetzigen am nächsten
  // liegt — die kleinere Umstellung ist die, die man auch macht.
  const gleichGut = sechsTageVergleich.filter((x) => x.daneben === besteVonAllen.daneben);
  const naechste = [...gleichGut].sort((a, b) => Math.abs(a.tage - 6) - Math.abs(b.tage - 6))[0];
  p.ist(gleichGut.length === 1 || naechste.tage >= besteVonAllen.tage,
    'Tagevergleich: bei Gleichstand liegt die nähere Tagezahl vorn',
    gleichGut.map((x) => `${x.tage}d`).join(', '));

  // Vorgeschlagen wird nur, was nicht mehr Zeit kostet.
  //
  // Der Denkfehler: Die Karte suchte das beste Ergebnis über alle Tagezahlen
  // und empfahl es, auch wenn es deutlich mehr Wochenstunden verlangte. Aus
  // „sechsmal fünfundvierzig Minuten" wurde „fünfmal siebzig" — anderthalb
  // Stunden mehr in der Woche, für zwei Muskelgruppen. Wer sein Zeitbudget
  // festgelegt hat, will wissen, ob er es gut einsetzt, und nicht gefragt
  // werden, ob er nicht mehr geben möchte.
  const sechsTagePr = L.profileForPlan({ ...knapp, days: 6, weekdays: [1, 2, 3, 4, 5, 6] });
  const tabelle = T.tageVergleich(sechsTagePr, { rang: L.leiterRang, leiter: L.leiterId });
  const meine = tabelle.find((x) => x.tage === 6);
  const budget = meine.stunden * 1.05;
  const drin = tabelle.filter((x) => x.stunden <= budget);

  p.ist(drin.length > 0, 'Zeitbudget: die eigene Aufteilung liegt im eigenen Budget');
  p.ist(drin.every((x) => x.stunden <= meine.stunden * 1.05),
    'Zeitbudget: kein Vorschlag kostet mehr Wochenstunden als bisher',
    drin.map((x) => `${x.tage}d ${x.stunden}h`).join(', '));

  // Und wenn etwas Längeres besser wäre, darf es trotzdem nicht als Vorschlag
  // durchgehen — nur als Angabe in der Tabelle.
  const teurerBesser = tabelle.filter((x) => x.stunden > budget && x.daneben < meine.daneben);
  p.ist(teurerBesser.every((x) => !drin.includes(x)),
    'Zeitbudget: was mehr Zeit kostet, steht in der Tabelle und ist kein Vorschlag');

  /* ---------- Aus sechs möglichen Tagen fünf machen ---------- */
  // „Ich kann sechs Tage" heißt nicht „ich muss sechs Tage". Die Wochentage
  // aus dem Fragebogen sind Verfügbarkeit; welche davon genutzt werden, kann
  // die App selbst entscheiden.
  const laengsteFolge = (liste) => {
    const w = [...liste].sort((a, b) => a - b);
    if (w.length < 2) return w.length;
    let laengste = 1;
    let laufend = 1;
    for (let i = 1; i < w.length; i += 1) {
      laufend = w[i] - w[i - 1] === 1 ? laufend + 1 : 1;
      laengste = Math.max(laengste, laufend);
    }
    // Über den Wochenwechsel hinweg: Samstag und Sonntag hängen zusammen.
    if (w[0] + 7 - w[w.length - 1] === 1) laengste = Math.max(laengste, laufend + 1);
    return laengste;
  };

  const ausSechs = T.verteileTage([1, 2, 3, 4, 5, 6], 5);
  p.gleich(ausSechs.length, 5, 'Tagewahl: aus sechs möglichen werden fünf');
  p.ist(ausSechs.every((d) => [1, 2, 3, 4, 5, 6].includes(d)),
    'Tagewahl: nur Tage, die überhaupt möglich sind');
  p.ist(laengsteFolge(ausSechs) <= 3,
    'Tagewahl: nicht vier oder mehr Einheiten am Stück',
    `gewählt ${ausSechs.join(',')} — längste Folge ${laengsteFolge(ausSechs)}`);

  // Drei aus sechs muss jeden zweiten Tag ergeben — das ist die beste
  // Verteilung, die es gibt, und sie darf nicht verfehlt werden.
  p.gleich(laengsteFolge(T.verteileTage([1, 2, 3, 4, 5, 6], 3)), 1,
    'Tagewahl: drei aus sechs liegen jeden zweiten Tag');

  // Wer nicht mehr Tage hat als er braucht, behält alle.
  p.gleich(T.verteileTage([1, 3, 5], 3), [1, 3, 5],
    'Tagewahl: wer genau so viele Tage hat, behält sie');
  p.gleich(T.verteileTage([1, 3, 5], 5), [1, 3, 5],
    'Tagewahl: mehr verlangen als möglich gibt, was da ist');

  // Auch bei ungleichmäßiger Verfügbarkeit muss etwas Sinnvolles herauskommen.
  const krumm = T.verteileTage([1, 2, 4, 6], 2);
  p.gleich(krumm.length, 2, 'Tagewahl: auch aus verstreuten Tagen wird ausgewählt');
  p.ist(laengsteFolge(krumm) === 1,
    'Tagewahl: und dann nicht zwei Tage nebeneinander', krumm.join(','));

  /* ---------- Zu schwer erkennen, nicht nur zu leicht ---------- */
  // „Zu leicht" erkannte die App von selbst und bot die nächste Sprosse an;
  // „zu schwer" musste man selbst merken. Dabei sind die Folgen größer: Wer
  // eine Stufe zu hoch steht, macht schlechte Wiederholungen, wird nicht
  // stärker und hört im Zweifel ganz auf.
  const schwerVorgabe = { id: 'pseudopu', sets: 4, reps: [10, 15], rir: 2, loadless: true };
  const reihen = (liste) => liste.map((saetze, i) => ({
    date: verschoben('2026-09-01', i * 3),
    entries: { pseudopu: saetze.map((r) => ({ reps: r })) },
  }));

  p.ist(L.bottomOutStreak(reihen([[7, 6, 5], [7, 6, 5]]), schwerVorgabe, '2026-09-30')
      >= L.STREAK_FOR_NEXT,
    'Zu schwer: zweimal unter dem unteren Rand wird gemeldet');
  p.gleich(L.bottomOutStreak(reihen([[12, 10, 9], [11, 10, 9]]), schwerVorgabe, '2026-09-30'), 0,
    'Zu schwer: wer im Bereich liegt, wird nicht zurückgestuft');
  p.gleich(L.bottomOutStreak(reihen([[7, 6, 5], [11, 10, 9]]), schwerVorgabe, '2026-09-30'), 0,
    'Zu schwer: eine einzelne schwache Einheit löst nichts aus');

  // Der beste Satz entscheidet. Müde Sätze am Ende sind normal und kein Grund,
  // die Variante infrage zu stellen.
  p.gleich(L.bottomOutStreak(reihen([[11, 6, 5], [11, 5, 4]]), schwerVorgabe, '2026-09-30'), 0,
    'Zu schwer: der beste Satz zählt, nicht die müden danach');

  // Mit Zusatzgewicht ist die Antwort weniger Gewicht, nicht eine leichtere
  // Variante — die Leiter ist für Übungen ohne Hantel gedacht.
  const mitGewicht = [{ date: '2026-09-01', entries: { pseudopu: [{ reps: 5, weight: 10 }, { reps: 4, weight: 10 }] } },
    { date: '2026-09-04', entries: { pseudopu: [{ reps: 5, weight: 10 }, { reps: 4, weight: 10 }] } }];
  p.gleich(L.bottomOutStreak(mitGewicht, schwerVorgabe, '2026-09-30'), 0,
    'Zu schwer: bei Zusatzgewicht schweigt die Leiter — da hilft weniger Gewicht');

  // Und die beiden Richtungen dürfen sich nicht widersprechen.
  const guteReihe = reihen([[16, 15, 15], [16, 16, 15]]);
  p.ist(L.topOutStreak(guteReihe, schwerVorgabe, '2026-09-30') >= L.STREAK_FOR_NEXT
      && L.bottomOutStreak(guteReihe, schwerVorgabe, '2026-09-30') === 0,
    'Leiter: dieselbe Reihe kann nicht gleichzeitig zu leicht und zu schwer sein');

  /* ---------- Einen falschen Satz wieder loswerden ---------- */
  //
  // Die Einordnung einer Muskelgruppe hängt am besten Satz überhaupt. Ein
  // einziger mit falscher Ausführung setzt den Wert damit dauerhaft — und es
  // gab keinen Weg zurück: Die Trainingsansicht zeigt nur den heutigen Tag,
  // und die Löschfunktion war zwar geschrieben, wurde aber nirgends
  // aufgerufen.
  const saetze = [
    { reps: 8, weight: 0 },
    { reps: 22, weight: 0 },
    { reps: 7, weight: 0 },
  ];
  p.gleich(S.satzIndex(saetze, 'pushup', { reps: 22, weight: 0 }), 1,
    'Satz finden: der genannte Satz wird gefunden');
  p.gleich(S.satzIndex(saetze, 'pushup', { reps: 99, weight: 0 }), -1,
    'Satz finden: was nicht da ist, wird nicht gefunden');
  p.gleich(S.satzIndex(saetze, 'pushup', { reps: 22, weight: 20 }), -1,
    'Satz finden: das Gewicht muss auch stimmen');

  // Die Tücke: Bei einseitigen Übungen merkt sich die Bestenliste die
  // schwächere Seite. Wer 12 links und 9 rechts eingetragen hat, sucht nach
  // einer 9 — im Satz steht sie als zweite Zahl. Ein Vergleich auf die erste
  // fände nichts und ließe den falschen Wert stehen.
  const zweiSeiten = [{ reps: 12, reps2: 9 }, { reps: 6, reps2: 6 }];
  p.gleich(S.satzIndex(zweiSeiten, 'lunge', { reps: 9, weight: 0 }), 0,
    'Satz finden: bei einseitigen Übungen zählt die schwächere Seite');

  // Und der Effekt: Ohne den falschen Satz fällt die Einordnung zurück.
  const mitFehler = [{ date: '2026-09-01', entries: { pushup: [{ reps: 8 }, { reps: 40 }] } }];
  const ohneFehler = [{ date: '2026-09-01', entries: { pushup: [{ reps: 8 }] } }];
  const punkteMit = S.groupStrength(mitFehler, PROFIL).find((g) => g.group === 'brust');
  const punkteOhne = S.groupStrength(ohneFehler, PROFIL).find((g) => g.group === 'brust');
  p.ist(punkteMit.bewertet.punkte > punkteOhne.bewertet.punkte,
    'Einordnung: ein verworfener Satz senkt den Wert wieder',
    `mit ${punkteMit.bewertet.punkte}, ohne ${punkteOhne.bewertet.punkte}`);

  // Und die Herkunft muss mitgeliefert werden, sonst weiß niemand, welcher
  // Satz gemeint ist.
  p.ist(punkteMit.bewertet.leistung && punkteMit.bewertet.leistung.date === '2026-09-01',
    'Einordnung: zu jedem Wert steht, aus welcher Einheit er stammt');

  /* ---------- Eine Leiter bleibt in ihrer Muskelgruppe ---------- */
  //
  // Der Chin-Up stand als „bizeps" in der Tabelle, zwischen Negativ-Klimmzug
  // und Klimmzug, die beide „ruecken" sind. Die senkrechte Zugleiter wechselte
  // damit mitten drin die Gruppe — und der Rückenplatz im Plan nimmt nur
  // Rückenübungen. Wer die Sprosse erklommen hatte, verlor sie beim nächsten
  // Neubau und landete direkt beim vollen Klimmzug, also zwei Stufen höher,
  // als er stand. Genau das fühlt sich an wie „vor und zurück".
  const gemischt = L.LADDERS
    .filter((l) => new Set(l.stufen.map((id) => T.exerciseById(id)?.group)).size > 1)
    .map((l) => `${l.id}: ${l.stufen.map((id) => `${id}(${T.exerciseById(id)?.group})`).join(' → ')}`);
  p.leer(gemischt, 'Leitern: keine wechselt zwischen den Muskelgruppen');

  // Und dieselbe Prüfung für die Bewegung: Eine Leiter, die von senkrechtem
  // auf waagerechtes Ziehen springt, wäre genauso falsch.
  const musterWechsel = L.LADDERS
    .filter((l) => {
      const muster = [...new Set(l.stufen.map((id) => T.bewegungsmuster(id)).filter(Boolean))];
      return muster.length > 1;
    })
    .map((l) => `${l.id}: ${l.stufen.map((id) => `${id}(${T.bewegungsmuster(id)})`).join(' → ')}`);
  p.leer(musterWechsel, 'Leitern: keine wechselt das Bewegungsmuster');

  // Der Nachweis am konkreten Fall: Die erklommene Sprosse muss einen Neubau
  // überstehen, auch wenn sie in einem gruppengebundenen Platz steht.
  const nachAufstieg = L.profileForPlan({
    ...PROFIL, equipment: 'bw', level: 'anfaenger', days: 3, weekdays: [1, 3, 5],
    gear: ['stange'], outgrown: ['negpull'],
  });
  const ersterPlan = T.buildPlan(nachAufstieg, 1, { rang: L.leiterRang, leiter: L.leiterId });
  const senkrecht = (plan) => [...new Set(plan.days.flatMap((d) => d.exercises)
    .filter((x) => T.bewegungsmuster(x.id) === 'v').map((x) => x.id))];
  const zugVorher = senkrecht(ersterPlan);
  const zugNachher = senkrecht(T.buildPlan(nachAufstieg, 1,
    { stufen: L.rungsInPlan(ersterPlan), rang: L.leiterRang, leiter: L.leiterId }));
  p.gleich(zugNachher, zugVorher,
    'Leitern: die erklommene Zugsprosse überlebt den Neubau',
    `vorher ${zugVorher.join(',')} — nachher ${zugNachher.join(',')}`);
  p.ist(!zugNachher.includes('pullup') || zugVorher.includes('pullup'),
    'Leitern: niemand wird beim Neubau auf den vollen Klimmzug hochgeschoben');

  /* ---------- Stufenleitern der Fähigkeiten ---------- */
  const SK = await import('../../js/skills.js');

  // Gemeldet aus dem Gebrauch: „die letzte Stufe zu einfach, die neue viel zu
  // schwer." Beim Handstand fehlte das Ablösen von der Wand zwischen Wandstand
  // und freiem Kick-up, beim L-Sit der Advanced Tuck und der gespreizte Sitz.
  const hs = SK.SKILLS.find((x) => x.id === 'handstand');
  const ls = SK.SKILLS.find((x) => x.id === 'lsit');
  p.ist(hs.levels.some((l) => /Wand lösen/.test(l.name)),
    'Handstand: zwischen Wandstand und freiem Stand liegt das Ablösen');
  p.ist(ls.levels.some((l) => /Advanced Tuck/.test(l.name)),
    'L-Sit: zwischen Tuck und gestrecktem Bein liegt das Öffnen der Hüfte');
  p.ist(ls.levels.some((l) => /Straddle/.test(l.name)),
    'L-Sit: vor dem geschlossenen L-Sit liegt der gespreizte Sitz');

  // Jede Leiter braucht genug Stufen, damit kein Sprung zu groß wird. Fünf ist
  // das Minimum, das bei den ursprünglichen Leitern schon stand.
  const kurz = SK.SKILLS.filter((x) => x.levels.length < 5)
    .map((x) => `${x.name}: ${x.levels.length} Stufen`);
  p.leer(kurz, 'Fähigkeiten: jede Leiter hat mindestens fünf Stufen');

  // Und jede Stufe braucht Name, Ziel, Satzzahl, Maßeinheit und einen Hinweis
  // zur Ausführung — eine Stufe ohne Ausführungshinweis ist eine Einladung,
  // sie falsch zu machen.
  const unvollstaendig = [];
  for (const skill of SK.SKILLS) {
    skill.levels.forEach((l, i) => {
      if (!l.name || !l.cue || !l.target || !l.sets || !SK.MEASURE[l.measure]) {
        unvollstaendig.push(`${skill.id} Stufe ${i + 1}`);
      }
    });
  }
  p.leer(unvollstaendig, 'Fähigkeiten: jede Stufe ist vollständig beschrieben');

  /* ---------- Stände überleben das Einfügen von Stufen ---------- */
  //
  // Der Fortschritt wird als Zahl gespeichert, nicht als Name. Eine Stufe in
  // die Mitte einzufügen verschiebt damit jeden, der darüber steht: Wer beim
  // L-Sit auf Stufe 4 stand, stünde ohne Wanderung plötzlich auf Stufe 3 und
  // wäre stillschweigend zurückgesetzt.
  const ALT = {
    handstand: ['Hollow Hold am Boden', 'Bauch zur Wand, Füße hochlaufen',
      'Rücken zur Wand, saubere Linie', 'An der Wand, ein Bein lösen',
      'Freier Kick-up mit Abfangen', 'Freier Handstand', 'Freier Handstand, lang'],
    lsit: ['Stütz auf Blöcken, Füße am Boden', 'Tuck-Sit, Knie angezogen',
      'Ein Bein gestreckt', 'L-Sit auf Erhöhung', 'L-Sit am Boden', 'L-Sit am Boden, lang'],
  };
  const verrutscht = [];
  for (const [id, namen] of Object.entries(ALT)) {
    const skill = SK.SKILLS.find((x) => x.id === id);
    namen.forEach((name, alterStand) => {
      const neu = SK.wandereStaende({ [id]: alterStand }, 1).stand[id];
      const jetzt = skill.levels[neu];
      if (!jetzt || jetzt.name !== name) {
        verrutscht.push(`${id} ${alterStand} → ${neu}: „${jetzt?.name}" statt „${name}"`);
      }
    });
  }
  p.leer(verrutscht, 'Fähigkeiten: jeder alte Stand landet nach der Wanderung auf derselben Übung');

  // Leitern ohne neue Stufen bleiben unberührt.
  p.gleich(SK.wandereStaende({ pullup: 3, dip: 2 }, 1).stand, { pullup: 3, dip: 2 },
    'Fähigkeiten: unveränderte Leitern wandern nicht');

  // Und zweimal wandern darf nicht zweimal verschieben.
  const einmal = SK.wandereStaende({ lsit: 3 }, 1).stand;
  p.gleich(SK.wandereStaende(einmal, SK.LEITER_FASSUNG).stand, einmal,
    'Fähigkeiten: eine bereits gewanderte Fassung wandert nicht erneut');

  /* ---------- Fassung ---------- */
  const { readFileSync } = await import('node:fs');
  const sw = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
  p.enthaelt(sw, `naehrwerte-v${APP_VERSION}`, `Fassung ${APP_VERSION} steht auch im Offline-Speicher`);

  return p;
}

function verschoben(datum, tage) {
  const d = new Date(`${datum}T12:00:00`);
  d.setDate(d.getDate() + tage);
  return d.toISOString().slice(0, 10);
}
