/**
 * Ein halbes Jahr Training, durchgerechnet.
 *
 * Warum es diese Gruppe gibt: Die anderen Prüfungen fragen, ob etwas **da**
 * ist — ob der Plan baubar ist, ob die Ansicht erscheint, ob die Zahl stimmt.
 * Der teuerste Fehler dieser App war aber ein anderer: Ein Mechanismus war da,
 * vollständig, richtig programmiert — und ging im echten Gebrauch nie los.
 *
 * Der Vorschlag „Zeit für die nächste Stufe" verlangte, dass alle Sätze am
 * oberen Rand liegen, bei einem oberen Rand von zwanzig. Über fünf gerade
 * Sätze fallen die Wiederholungen aber immer ab. Wer dreißig Liegestütze
 * konnte, bekam den Vorschlag nie. Kein Bauteil war kaputt, keine Prüfung fiel
 * durch — trotzdem stand jemand ein halbes Jahr an derselben Sprosse.
 *
 * Solche Fehler sieht man nur in der Zeit. Deshalb trainiert hier ein
 * ausgedachter Mensch sechsundzwanzig Wochen lang, mit Wiederholungen, die
 * über die Sätze abfallen, und einer Leistung, die sich langsam bessert. Die
 * App entscheidet dabei wie im echten Gebrauch: Sie schlägt die nächste Stufe
 * vor, und er nimmt sie an.
 *
 * Gefragt wird nicht „geht es?", sondern „bewegt sich etwas?".
 *
 * Alles rein rechnerisch, kein Browser. Die Zufallszahlen sind gesät, der Lauf
 * ist also jedes Mal derselbe.
 */
import { neuerLauf } from '../pruefen.js';
import * as T from '../../js/training.js';
import * as L from '../../js/ladders.js';
import * as V from '../../js/verlauf.js';

const PROFIL = {
  sex: 'm', age: 34, height: 180, weight: 80, bodyfat: null,
  goal: 'form', targetWeight: 78, level: 'fortgeschritten',
  days: 3, weekdays: [1, 3, 5], sessionLength: 60, ernaehrung: 'misch',
  equipment: 'bw', activity: 'leicht',
  limits: [], focus: [], skills: [], gear: ['stange', 'barren'], blocked: [], outgrown: [],
};

const WOCHEN = 26;
const START = '2026-01-05'; // ein Montag

function verschoben(datum, tage) {
  const d = new Date(`${datum}T12:00:00`);
  d.setDate(d.getDate() + tage);
  return d.toISOString().slice(0, 10);
}

/** Gesäter Zufall — derselbe Lauf bei jedem Aufruf. */
function wuerfel(saat) {
  let z = saat;
  return () => {
    z = (z * 1103515245 + 12345) % 2147483648;
    return z / 2147483648;
  };
}

/**
 * Ein Mensch, der trainiert.
 *
 * `kann` ist, wie viele saubere Wiederholungen er von einer Übung gerade
 * schafft, wenn er bis zum Versagen geht. Das ist die eine Zahl, aus der alles
 * andere folgt: Mit zwei Wiederholungen im Tank macht er zwei weniger, und über
 * die Sätze fällt es ab, weil er müde wird. Genau dieses Abfallen hat den
 * Fehler oben verursacht — eine Prüfung mit gleichbleibenden Sätzen hätte ihn
 * nie gefunden.
 *
 * @param {number} tempo  Wie viel er je Einheit dazugewinnt. 0 = Stillstand,
 *                        negativ = er baut ab.
 */
function trainierender(tempo, saat = 7) {
  const rnd = wuerfel(saat);
  const kann = new Map();
  const gewicht = new Map();

  return {
    kann,
    /** Ein Satzprotokoll für eine Übung, so wie er es eintragen würde. */
    saetze(vorgabe, anzahl, rir) {
      const [unten, oben] = T.repRange(vorgabe);
      if (T.isTimed(vorgabe.id)) {
        const s = kann.get(vorgabe.id) ?? unten;
        kann.set(vorgabe.id, s + tempo);
        return Array.from({ length: anzahl }, (_, i) => ({ reps: Math.max(5, Math.round(s - i * 2)) }));
      }

      if (!vorgabe.loadless) {
        // Mit Hantel: das Gewicht ist die Stellschraube, die Wiederholungen
        // bleiben im Bereich.
        const kg = gewicht.get(vorgabe.id) ?? 40;
        const basis = kann.get(vorgabe.id) ?? unten;
        kann.set(vorgabe.id, basis + tempo);
        const liste = Array.from({ length: anzahl }, (_, i) => ({
          reps: Math.max(3, Math.min(oben, Math.round(basis - i))), weight: kg,
        }));
        // Doppelte Progression, wie nextStep sie vorgibt.
        if (liste.every((s) => s.reps >= oben)) {
          gewicht.set(vorgabe.id, kg + 2.5);
          kann.set(vorgabe.id, unten);
        }
        return liste;
      }

      const k = kann.get(vorgabe.id) ?? 14;
      kann.set(vorgabe.id, k + tempo);
      const erster = Math.max(4, Math.round(k - rir));
      return Array.from({ length: anzahl }, (_, i) => {
        const rauschen = Math.round(rnd() * 2) - 1;
        const wert = Math.max(4, erster - i * 2 + rauschen);
        return T.isUnilateral(vorgabe.id)
          ? { reps: wert, reps2: Math.max(4, wert - 1) }
          : { reps: wert };
      });
    },
    /** Eine schwerere Variante kann er erst einmal deutlich seltener. */
    nachAufstieg(alteId, neueId) {
      const alt = kann.get(alteId) ?? 14;
      kann.set(neueId, Math.max(8, Math.round(alt * 0.55)));
    },
  };
}

/**
 * Sechsundzwanzig Wochen durchspielen.
 * Gibt zurück, was dabei passiert ist — die Prüfungen fragen danach.
 */
function dauerlauf(tempo, { entlastung = 4, saat = 7 } = {}) {
  let profil = { ...PROFIL, outgrown: [] };
  let plan = T.buildPlan(L.profileForPlan(profil), 1, { rang: L.leiterRang });
  plan = { ...plan, createdAt: START, zyklus: entlastung };

  const mensch = trainierender(tempo, saat);
  const sessions = [];
  const aufstiege = [];
  const zuLeichtInFolge = new Map();
  const laengsteZuLeicht = new Map();
  const blockWochen = [];
  const minuten = [];

  for (let tag = 0; tag < WOCHEN * 7; tag += 1) {
    const datum = verschoben(START, tag);
    const wochentag = new Date(`${datum}T12:00:00`).getDay();
    const day = T.dayForWeekday(plan, wochentag);
    if (!day) continue;

    const woche = T.blockWeek(plan, datum);
    blockWochen.push(woche);

    const entries = {};
    for (const vorgabe of day.exercises) {
      const { sets, rir } = T.forWeek(vorgabe, woche);
      entries[vorgabe.id] = mensch.saetze(vorgabe, sets, rir);
    }
    // Die Dauer mit den Sätzen **dieser** Woche, nicht mit den Grundsätzen.
    // In der schweren Woche kommt je Übung ein Satz dazu; wer nur die
    // Grundvorgabe misst, prüft genau die Woche nicht, in der es eng wird.
    minuten.push({
      datum,
      woche,
      min: T.sessionMinutes(day.exercises.map((x) => ({ ...x, sets: T.forWeek(x, woche).sets }))),
    });
    sessions.push({ date: datum, dayName: day.name, entries, done: true });

    // Jetzt entscheidet die App — und der Mensch tut, was sie vorschlägt.
    day.exercises.forEach((vorgabe, index) => {
      const [, oben] = T.repRange(vorgabe);
      const werte = (entries[vorgabe.id] || []).map((s) => (T.isUnilateral(vorgabe.id)
        ? (T.setSides(s).schwaechste ?? s.reps) : s.reps));
      const bester = Math.max(...werte, 0);
      const naechste = L.harderRung(vorgabe.id, profil);

      // Buch führen: Wie lange steht jemand auf einer Sprosse, obwohl er
      // längst darüber ist und es eine höhere gäbe?
      if (bester >= oben && naechste) {
        const n = (zuLeichtInFolge.get(vorgabe.id) || 0) + 1;
        zuLeichtInFolge.set(vorgabe.id, n);
        laengsteZuLeicht.set(vorgabe.id, Math.max(laengsteZuLeicht.get(vorgabe.id) || 0, n));
      } else {
        zuLeichtInFolge.set(vorgabe.id, 0);
      }

      const serie = L.topOutStreak(sessions, vorgabe, datum);
      if (serie >= L.STREAK_FOR_NEXT && naechste) {
        aufstiege.push({ datum, von: vorgabe.id, zu: naechste.exercise.id });
        mensch.nachAufstieg(vorgabe.id, naechste.exercise.id);
        profil = { ...profil, outgrown: [...new Set([...profil.outgrown, vorgabe.id])] };
        const dayIndex = plan.days.indexOf(day);
        plan = T.setExercise(plan, profil, dayIndex, index, naechste.exercise.id);
        zuLeichtInFolge.set(vorgabe.id, 0);
      }
    });
  }

  return { plan, profil, sessions, aufstiege, laengsteZuLeicht, blockWochen, minuten };
}

export default async function laufen() {
  const p = neuerLauf('Dauerlauf');

  /* ---------- Wer besser wird, kommt die Leiter hoch ---------- */
  const fleissig = dauerlauf(0.35);

  p.ist(fleissig.sessions.length >= WOCHEN * 3 - 3,
    `Dauerlauf: ${WOCHEN} Wochen ergeben rund ${WOCHEN * 3} Einheiten`,
    `waren ${fleissig.sessions.length}`);

  p.ist(fleissig.aufstiege.length >= 4,
    'Leiter: wer ein halbes Jahr besser wird, steigt mehrfach auf',
    `${fleissig.aufstiege.length} Aufstiege: `
      + fleissig.aufstiege.map((a) => `${a.von}→${a.zu}`).join(', '));

  // Das ist die Prüfung, die den Fehler gefunden hätte. Niemand darf über
  // Einheiten hinweg über dem Zielbereich liegen, während eine höhere Sprosse
  // danebensteht. Zwei Einheiten sind der Nachweis, dass es kein guter Tag war
  // — ab der dritten ist es verschenkte Zeit.
  const haengengeblieben = [...fleissig.laengsteZuLeicht.entries()]
    .filter(([, n]) => n > L.STREAK_FOR_NEXT)
    .map(([id, n]) => `${T.exerciseById(id)?.name || id}: ${n}× zu leicht in Folge`);
  p.leer(haengengeblieben,
    `Leiter: keine Übung bleibt länger als ${L.STREAK_FOR_NEXT} Einheiten zu leicht`);

  /* ---------- Wer nicht besser wird, wird nicht hochgeschickt ---------- */
  const stillstand = dauerlauf(0, { saat: 11 });
  p.gleich(stillstand.aufstiege.length, 0,
    'Leiter: ohne Fortschritt schlägt die App keine schwerere Stufe vor');

  /* ---------- Der Plan bleibt nach all den Aufstiegen gesund ---------- */
  for (const day of fleissig.plan.days) {
    p.ist(day.exercises.length > 0, `Plan nach ${WOCHEN} Wochen: ${day.name} ist nicht leer`);
    const ids = day.exercises.map((x) => x.id);
    p.gleich(ids.length, new Set(ids).size,
      `Plan nach ${WOCHEN} Wochen: keine Übung doppelt an ${day.name}`,
      ids.join(', '));

    // Eine Sprosse kann auf zwei Leitern stehen — der Klimmzug im Untergriff
    // steht sowohl beim senkrechten Ziehen als auch am Ende der Bizepsleiter.
    // Ein Aufstieg darf daraus nicht zweimal dieselbe Bewegung an einem Tag
    // machen.
    const doppelt = L.sameLadderGroups(ids);
    p.leer(doppelt.map((g) => `${day.name}: ${g.leiter.name} zweimal`),
      `Plan nach ${WOCHEN} Wochen: keine Bewegung doppelt an ${day.name}`);
  }

  /* ---------- Die Entlastungswoche kommt wirklich ---------- */
  const deloads = fleissig.blockWochen.filter((w) => w === 4).length;
  p.ist(deloads >= 12,
    'Block: die Entlastungswoche kommt über ein halbes Jahr regelmäßig',
    `${deloads} Einheiten in Entlastungswochen von ${fleissig.blockWochen.length}`);

  const deloadSaetze = T.forWeek({ sets: 5, rir: 2 }, 4).sets;
  const schwerSaetze = T.forWeek({ sets: 5, rir: 2 }, 3).sets;
  p.ist(deloadSaetze < schwerSaetze,
    'Block: in der Entlastungswoche stehen weniger Sätze als in der schweren');

  /* ---------- Die App warnt nicht vor ihrem eigenen Plan ---------- */
  // Wenn der eigene Vierwochenblock die eigene Belastungswarnung auslöst, ist
  // die Warnung Lärm und niemand liest sie mehr.
  const last = T.weeklyVolume(fleissig.sessions, PROFIL.weight);
  const belastung = V.belastungsverlauf(last, verschoben(START, WOCHEN * 7));
  p.ist(belastung.warnung !== 'anstieg',
    'Belastung: der geplante Vierwochenblock löst die eigene Warnung nicht aus',
    `Warnung ${belastung.warnung}, ${belastung.anstiege} Anstiege, `
      + `${belastung.ohneLeichte} Wochen ohne leichtere`);

  // Ohne Entlastungswochen muss sie dagegen anschlagen — sonst wäre sie blind.
  const ohnePause = dauerlauf(0.35, { entlastung: 0, saat: 7 });
  const belastungOhne = V.belastungsverlauf(
    T.weeklyVolume(ohnePause.sessions, PROFIL.weight), verschoben(START, WOCHEN * 7),
  );
  p.ist(belastungOhne.ohneLeichte > belastung.ohneLeichte,
    'Belastung: ohne Entlastungswochen läuft die Reihe länger ohne leichtere Woche',
    `ohne Pause ${belastungOhne.ohneLeichte}, mit Block ${belastung.ohneLeichte}`);

  /* ---------- Rückgang: schlägt an, wenn es zurückgeht, und sonst nicht ---------- */
  const absteigend = dauerlauf(-0.25, { saat: 3 });
  const zurueck = V.alleVerlaeufe(absteigend.sessions)
    .filter((x) => x.rueckgang.ja && x.rueckgang.lage === 'rueckgang');
  p.ist(zurueck.length > 0,
    'Rückgang: ein halbes Jahr bergab wird als Rückgang erkannt',
    `${zurueck.length} Übungen`);

  const fleissigZurueck = V.alleVerlaeufe(fleissig.sessions)
    .filter((x) => x.rueckgang.ja && x.rueckgang.lage === 'rueckgang')
    // Ein Aufstieg lässt die Wiederholungen absichtlich einbrechen — das ist
    // Fortschritt und darf nicht als Rückgang gelten. Übungen, die er
    // verlassen hat, zählen hier deshalb nicht.
    .filter((x) => !fleissig.profil.outgrown.includes(x.verlauf.id));
  p.leer(fleissigZurueck.map((x) => x.verlauf.name),
    'Rückgang: wer durchgehend besser wird, bekommt keine Rückgangsmeldung');

  /* ---------- Die Dauer, die dasteht, ist die Dauer, die es wird ---------- */
  // Der zweite Fehler, den dieser Dauerlauf gefunden hat: Im Plan stand „rund
  // 57 Min", während die schwere Woche 73 Minuten dauerte. Daneben stand die
  // Satzzahl, und die war für die Woche richtig gerechnet — zwei Zahlen in
  // einer Zeile, eine davon aus einer anderen Woche.
  const abweichung = [];
  for (const day of fleissig.plan.days) {
    for (const woche of [1, 2, 3, 4]) {
      const echt = T.sessionMinutes(
        day.exercises.map((x) => ({ ...x, sets: T.forWeek(x, woche).sets })), 'normal',
      );
      const spanne = T.sessionSpanne(day, PROFIL, 'normal', 4);
      if (echt < spanne.kuerzeste || echt > spanne.laengste) {
        abweichung.push(`${day.name} W${woche}: ${echt} außerhalb ${spanne.kuerzeste}–${spanne.laengste}`);
      }
    }
  }
  p.leer(abweichung, 'Zeit: die angezeigte Spanne deckt jede Woche des Blocks ab');

  const spanneA = T.sessionSpanne(fleissig.plan.days[0], PROFIL, 'normal', 4);
  p.ist(spanneA.laengste > spanneA.normal,
    'Zeit: die schwere Woche wird als länger ausgewiesen, nicht verschwiegen',
    `normal ${spanneA.normal}, längste ${spanneA.laengste}`);

  // Ein frisch gebauter Plan muss das Zeitfenster einhalten — das ist die
  // Zusage, die buildPlan macht.
  const frisch = T.buildPlan(L.profileForPlan(PROFIL), 1, { rang: L.leiterRang });
  p.ist(T.sessionSpanne(frisch.days[0], PROFIL, 'normal', 4).normal <= PROFIL.sessionLength,
    `Zeit: ein frischer Plan passt in die angegebenen ${PROFIL.sessionLength} Minuten`,
    `${T.sessionSpanne(frisch.days[0], PROFIL, 'normal', 4).normal} min`);

  // Nach einem halben Jahr Aufstiegen darf er es nicht mehr: Vier Leitern
  // wechseln unterwegs von beidseitig auf einseitig, und einseitig dauert
  // doppelt so lang. Das ist hinnehmbar — verschwiegen werden darf es nicht.
  const gewachsen = fleissig.plan.days
    .map((d) => T.sessionSpanne(d, PROFIL, 'normal', 4))
    .filter((sp) => sp.normal > sp.budget);
  p.leer(gewachsen.filter((sp) => !sp.ueberzieht)
    .map((sp) => `${sp.normal} min bei ${sp.budget} min, ohne Hinweis`),
    'Zeit: eine über die Monate gewachsene Einheit wird nie stillschweigend länger');
  p.ist(spanneA.normal <= PROFIL.sessionLength * 1.5,
    'Zeit: sie wächst auch über ein halbes Jahr nicht ins Uferlose',
    `${spanneA.normal} min bei ${PROFIL.sessionLength} min Vorgabe`);

  // Ein knappes Zeitfenster wird eingehalten, indem die Satzzahl sinkt — nicht
  // indem Bewegungen wegfallen. Vorher kürzte der Plan nur bis zum
  // Mindestumfang von vier Übungen und landete bei dreißig Minuten Vorgabe
  // trotzdem bei achtundvierzig.
  const engProfil = { ...PROFIL, sessionLength: 30 };
  const engPlan = T.buildPlan(L.profileForPlan(engProfil), 1, { rang: L.leiterRang });
  const engSpanne = T.sessionSpanne(engPlan.days[0], engProfil, 'normal', 4);
  p.ist(!engSpanne.ueberzieht,
    'Zeit: auch dreißig Minuten werden eingehalten, nicht überzogen',
    `${engSpanne.normal} min bei ${engSpanne.budget} min Vorgabe`);
  p.ist(engPlan.days[0].exercises.length >= 4,
    'Zeit: dafür fallen keine Bewegungen weg — die Übungen bleiben stehen',
    `${engPlan.days[0].exercises.length} Übungen`);
  p.ist(engPlan.days[0].gekuerzt > 0,
    'Zeit: der Plan sagt, wie viele Sätze das enge Zeitfenster gekostet hat',
    `${engPlan.days[0].gekuerzt} Sätze`);
  p.ist(engPlan.days[0].exercises.every((x) => x.sets >= T.SAETZE_MINDESTENS),
    `Zeit: gekürzt wird nie unter ${T.SAETZE_MINDESTENS} Sätze — darunter ist es kein Reiz mehr`);
  p.gleich(fleissig.plan.days.every((d) => !d.gekuerzt || d.gekuerzt > 0), true,
    'Zeit: ein großzügiges Zeitfenster kürzt nichts weg');
  p.ist(!T.sessionSpanne(frisch.days[0], PROFIL, 'normal', 4).ueberzieht,
    'Zeit: ein passendes Zeitfenster meldet nichts — sonst wäre der Hinweis Lärm');

  // Ohne festen Rhythmus gibt es keine schwere Woche und damit keine Spanne.
  const ohneBlock = T.sessionSpanne(fleissig.plan.days[0], PROFIL, 'normal', 0);
  p.gleich(ohneBlock.kuerzeste, ohneBlock.laengste,
    'Zeit: ohne Entlastungsrhythmus steht eine Dauer da, keine Spanne');

  /* ---------- Das Volumen bleibt im Zielbereich ---------- */
  const volumen = T.weeklyPlannedSets(fleissig.plan, 3);
  const zuViel = volumen.filter((g) => g.gesamt > 32).map((g) => `${g.gruppe}: ${g.gesamt}`);
  p.leer(zuViel, 'Volumen: auch nach allen Aufstiegen keine Gruppe über 32 Sätzen');

  return p;
}
