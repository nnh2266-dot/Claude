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
  const bwPlan = T.buildPlan(L.profileForPlan(bwProfil), 0, { rang: L.leiterRang });
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
    const plan = T.buildPlan(L.profileForPlan(pr), 1, { rang: L.leiterRang, pausen: tempo });
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
      const plan = T.buildPlan(L.profileForPlan(pr), 1, { rang: L.leiterRang, pausen: tempo });
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
  const empf = T.empfohleneZeit(knapp, { rang: L.leiterRang });

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
  p.ist(!T.empfohleneZeit(passend, { rang: L.leiterRang }).lohnt,
    'Zeitempfehlung: wer schon richtig liegt, wird nicht behelligt');

  // Die Empfehlung folgt dem Profil, auch wenn es sich über Monate ändert:
  // Wer Leitersprossen erklimmt, landet bei einarmigen und einbeinigen
  // Varianten, und die dauern doppelt so lang.
  const gestiegen = L.profileForPlan({ ...knapp, sessionLength: 60,
    outgrown: ['pushup', 'pseudopu', 'bwsq', 'lunge', 'gbridge', 'bwgm'] });
  const nachher = T.empfohleneZeit(gestiegen, { rang: L.leiterRang });
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
  const knappeTage = T.empfohleneZeit(zweiTage, { rang: L.leiterRang });
  p.ist(knappeTage.reichtNicht,
    'Zeitempfehlung: bei zwei Trainingstagen hilft keine Minutenzahl',
    `bestes Fenster erreicht ${knappeTage.gut} von ${knappeTage.gruppen} Gruppen`);
  p.ist(!knappeTage.lohnt,
    'Zeitempfehlung: dann wird auch keine Umstellung des Fensters vorgeschlagen');

  // Und bei genug Tagen bleibt es bei einer Zeitangabe.
  const fuenfTage = L.profileForPlan({ ...knapp, sessionLength: 45, days: 5, weekdays: [1, 2, 3, 4, 5] });
  p.ist(!T.empfohleneZeit(fuenfTage, { rang: L.leiterRang }).reichtNicht,
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
  const sechs = T.empfohleneZeit(sechsTage, { rang: L.leiterRang });
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
  const tage = T.tageVergleich(L.profileForPlan(knapp), { rang: L.leiterRang });
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
    L.profileForPlan({ ...knapp, days: 6, weekdays: [1, 2, 3, 4, 5, 6] }), { rang: L.leiterRang },
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
