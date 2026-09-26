/**
 * Jede Plankombination, die der Fragebogen zulässt.
 *
 * Nicht stichprobenartig: Ausrüstung mal Erfahrung mal Tage mal Zeit mal Ziel
 * mal Geschlecht mal Technik mal Geräte. Was hier durchfällt, fällt bei
 * irgendeinem Nutzer im echten Leben durch.
 */
import { neuerLauf } from '../pruefen.js';
import * as T from '../../js/training.js';
import * as L from '../../js/ladders.js';

const AUSRUESTUNG = ['bw', 'band', 'home', 'studio'];
const ERFAHRUNG = ['anfaenger', 'fortgeschritten', 'erfahren'];
const TAGE = [1, 2, 3, 4, 5, 6];
const ZEIT = [30, 45, 60, 90];
const ZIELE = ['abnehmen', 'form', 'aufbau'];
const TECHNIK = [[], ['handstand'], ['handstand', 'pullup']];
const GERAETE = [[], ['stange'], ['stange', 'barren']];

export default async function laufen() {
  const p = neuerLauf('Pläne');

  const fehler = {
    gebaut: [], leer: [], doppelt: [], zeit: [], saetze: [], kraft: [], leiter: [],
    doppelleiter: [], stufe: [],
    zug: [], hinge: [], stange: [], volumen: [],
  };
  let gezaehlt = 0;

  for (const equipment of AUSRUESTUNG)
    for (const level of ERFAHRUNG)
      for (const days of TAGE)
        for (const sessionLength of ZEIT)
          for (const goal of ZIELE)
            for (const sex of ['m', 'w'])
              for (const skills of TECHNIK)
                for (const gear of GERAETE) {
                  gezaehlt += 1;
                  const wer = `${equipment}/${level}/${days}d/${sessionLength}min/${goal}/${sex}`;
                  const profil = L.profileForPlan({
                    sex, age: 34, height: 180, weight: 80, bodyfat: null,
                    goal, targetWeight: 76, level, days, sessionLength,
                    weekdays: [1, 2, 3, 4, 5, 6].slice(0, days),
                    ernaehrung: 'misch', equipment, activity: 'leicht',
                    limits: [], focus: [], skills, gear, blocked: [], outgrown: [],
                  });

                  let plan;
                  try { plan = T.buildPlan(profil, 0, { rang: L.leiterRang, leiter: L.leiterId }); }
                  catch (e) { fehler.gebaut.push(`${wer}: ${e.message}`); continue; }

                  for (const tag of plan.days) {
                    const ids = (tag.exercises || []).map((e) => e.id);
                    if (!ids.length) { fehler.leer.push(`${wer} · ${tag.name}`); continue; }
                    if (new Set(ids).size !== ids.length) fehler.doppelt.push(`${wer} · ${tag.name}`);

                    // Zeitbudget — und zwar für **jeden** Tag.
                    //
                    // Hier stand einmal `ids.length > 4 &&`: Tage am
                    // Mindestumfang waren ausgenommen, und genau dort lag der
                    // Fehler. Wer dreißig Minuten angab und fortgeschritten
                    // war, bekam einen Plan von achtundvierzig bis
                    // neunundfünfzig Minuten — die Prüfung sah weg, weil der
                    // Tag nur vier Übungen hatte. Seit die Satzzahl mitkürzt,
                    // muss jeder Tag hineinpassen.
                    // Die Technikarbeit läuft an jedem Trainingstag und zählt
                    // mit. Sie fehlte hier — und damit prüfte diese Zeile die
                    // Dauer des Kraftteils, während die Einheit in Wirklichkeit
                    // bis zu achtzehn Minuten länger war.
                    const technik = skills.length * 6;
                    const minuten = T.sessionMinutes(tag.exercises, 'normal') + technik;
                    const amBoden = tag.exercises.every((x) => x.sets <= T.SAETZE_MINDESTENS);
                    if (!amBoden && minuten > sessionLength + 1) {
                      fehler.zeit.push(`${wer}/${skills.length}sk · ${tag.name}: ${minuten} statt ${sessionLength} Min`);
                    }
                    // Und dem Kraftteil muss etwas übrig bleiben: Technik ist
                    // Übung, kein Ersatz für Sätze.
                    if (tag.exercises.length < 3) {
                      fehler.kraft.push(`${wer}/${skills.length}sk · ${tag.name}: nur ${tag.exercises.length} Übungen`);
                    }
                    // Und nie unter den Mindestreiz kürzen.
                    for (const x of tag.exercises) {
                      if (x.sets < T.SAETZE_MINDESTENS) {
                        fehler.saetze.push(`${wer} · ${tag.name}: ${x.id} mit ${x.sets} Sätzen`);
                      }
                    }
                    // Eine ganze Leiter an einem Tag ist immer ein Versehen.
                    for (const g of L.sameLadderGroups(ids)) {
                      if (g.stufen.length >= g.leiter.stufen.length) {
                        fehler.leiter.push(`${wer} · ${tag.name}: ${g.leiter.name}`);
                      }
                    }

                    /*
                     * Und schon zwei Sprossen derselben Leiter sind eine zu viel.
                     *
                     * Hier stand nur die Prüfung darüber — eine **ganze** Leiter
                     * an einem Tag. Das ließ Kniebeuge neben Ausfallschritt und
                     * Liegestütz neben Pseudo-Planche durchgehen: dieselbe
                     * Bewegung, einmal schwerer und einmal leichter, und die
                     * leichtere ist dann kein Satz mehr, sondern Aufwärmen.
                     * Gemessen kam das in 648 Plänen 1944 mal vor.
                     *
                     * Erlaubt bleibt es, wenn es nicht anders geht: Zwei
                     * Bizepsplätze und alle Körpergewichts-Curls auf einer
                     * Leiter lassen keine andere Wahl. „Nicht anders" heißt
                     * hier: In der Gruppe gibt es keine Übung von einer anderen
                     * Leiter, die noch frei wäre.
                     */
                    for (const g of L.sameLadderGroups(ids)) {
                      const vorbild = T.exerciseById(g.stufen[0].id);
                      // Der Typ muss stimmen: In einen Platz für eine
                      // Grundübung passt keine Isolationsübung, auch wenn sie
                      // zur selben Gruppe gehört. Ohne diese Bedingung meldete
                      // die Prüfung Alternativen, die der Plan nie hätte
                      // einsetzen können — etwa am Zugtag ohne Geräte, wo alle
                      // drei waagerechten Ruderübungen auf einer Leiter stehen
                      // und der senkrechte Platz schon belegt ist.
                      const ausweg = T.EXERCISES.some((e) => e.group === vorbild.group
                        && e.type === vorbild.type
                        && T.isAvailable(e, profil)
                        && !ids.includes(e.id)
                        && L.leiterId(e.id) !== g.leiter.id);
                      if (ausweg) {
                        fehler.doppelleiter.push(`${wer} · ${tag.name}: ${g.leiter.name} `
                          + `(${g.stufen.map((x) => x.id).join('+')}) — es gäbe Alternativen`);
                      }
                    }
                    // Die höchste Sprosse einer Leiter im Tag muss mindestens am
                    // Einstieg der Erfahrungsstufe liegen. Eine niedrigere daneben
                    // ist in Ordnung — sie kommt vor, wenn die passende Sprosse an
                    // diesem Tag schon besetzt ist.
                    const einstieg = T.EINSTIEGSSPROSSE[level] ?? 0;
                    const hoechste = new Map();
                    for (const id of ids) {
                      const st = L.ladderFor(id);
                      if (!st) continue;
                      const bisher = hoechste.get(st.leiter.id);
                      if (bisher === undefined || st.index > bisher) hoechste.set(st.leiter.id, st.index);
                    }
                    for (const [leiterId, r] of hoechste) {
                      if (r >= einstieg) continue;
                      const leiter = L.LADDERS.find((x) => x.id === leiterId);
                      // Verglichen wird nur mit Sprossen derselben Art: In einem
                      // Isolationsplatz kann keine Grundübung stehen, auch wenn sie
                      // auf derselben Leiter weiter oben liegt.
                      const art = T.exerciseById(leiter.stufen[r]).type;
                      const gibtHoehere = leiter.stufen.some((x, i) => {
                        const e = T.exerciseById(x);
                        return i >= einstieg && e.type === art && T.isAvailable(e, profil);
                      });
                      if (gibtHoehere) fehler.stufe.push(`${wer} · ${tag.name}: ${leiter.name} auf Sprosse ${r + 1}`);
                    }
                  }

                  const alle = plan.days.flatMap((d) => d.exercises.map((e) => e.id));
                  // Ab zwei Tagen müssen beide Zugrichtungen vorkommen.
                  if (days >= 2) {
                    const v = alle.some((i) => T.bewegungsmuster(i) === 'v');
                    const h = alle.some((i) => T.bewegungsmuster(i) === 'h');
                    if (!(v && h)) fehler.zug.push(`${wer}: ${v ? 'nur senkrecht' : h ? 'nur waagerecht' : 'gar kein Ziehen'}`);
                    // Hüftstreckung gehört in jede Woche.
                    const hinge = alle.some((i) => T.MUSTER_HINGE.has(i));
                    if (!hinge) fehler.hinge.push(wer);
                  }
                  // Wer eine Stange hat, soll sie benutzen.
                  if (gear.includes('stange') && days >= 2
                      && !alle.some((i) => T.GEAR[i] === 'stange')) {
                    fehler.stange.push(wer);
                  }
                  // Kein Wochenvolumen jenseits des Sinnvollen.
                  for (const g of T.weeklyPlannedSets(plan)) {
                    if (g.gesamt > 32) fehler.volumen.push(`${wer}: ${g.gruppe} ${g.gesamt}`);
                  }
                }

  p.ist(gezaehlt > 10000, `${gezaehlt} Kombinationen geprüft`);
  p.leer(fehler.gebaut, 'Jede Kombination lässt sich bauen');
  p.leer(fehler.leer, 'Kein Trainingstag ist leer');
  p.leer(fehler.doppelt, 'Keine Übung zweimal am selben Tag');
  p.leer(fehler.zeit, 'Keine Einheit überzieht ihr Zeitbudget — auch nicht am Mindestumfang');
  p.leer(fehler.saetze, `Keine Übung unter ${T.SAETZE_MINDESTENS} Sätzen`);
  p.leer(fehler.kraft, 'Die Technikarbeit frisst den Kraftteil nicht auf');
  p.leer(fehler.leiter, 'Keine ganze Leiter an einem Tag');
  p.leer(fehler.doppelleiter,
    'Keine zwei Sprossen derselben Leiter an einem Tag, solange es Alternativen gibt');
  p.leer(fehler.stufe, 'Keine Sprosse unter dem Einstieg der Erfahrungsstufe');
  p.leer(fehler.zug, 'Beide Zugrichtungen in jeder Woche');
  p.leer(fehler.hinge, 'Hüftstreckung in jeder Woche');
  p.leer(fehler.stange, 'Vorhandene Klimmzugstange kommt vor');
  p.leer(fehler.volumen, 'Kein Wochenvolumen über 32 Sätzen je Gruppe');

  /* ---------- Aufteilungen ---------- */
  //
  // Die Tagezahl sagt noch nicht, wie sich das Volumen verteilt. Sechs Tage als
  // Push/Pull/Beine zweimal treffen den Rücken an einem Tag mit bis zu sechzehn
  // Sätzen, dieselben sechs Tage als Ganzkörper mit fünf. Jede angebotene Wahl
  // muss deshalb bauen, die richtige Zahl Tage haben und keine Gruppe in einer
  // einzelnen Einheit unsinnig überladen.
  const splitFehler = { tage: [], gebaut: [], spitze: [] };
  for (const [tage, wahlen] of Object.entries(T.SPLIT_WAHL)) {
    for (const wahl of wahlen) {
      for (const equipment of AUSRUESTUNG) {
        const profil = L.profileForPlan({
          sex: 'm', age: 34, height: 180, weight: 80, bodyfat: null,
          goal: 'form', targetWeight: 76, level: 'fortgeschritten',
          days: Number(tage), sessionLength: 60,
          weekdays: [1, 2, 3, 4, 5, 6].slice(0, Number(tage)),
          ernaehrung: 'misch', equipment, activity: 'leicht',
          limits: [], focus: [], skills: [], gear: ['stange'], blocked: [], outgrown: [],
          splitKey: wahl.wert,
        });
        let plan;
        try { plan = T.buildPlan(profil, 0, { rang: L.leiterRang, leiter: L.leiterId }); }
        catch (e) { splitFehler.gebaut.push(`${wahl.wert}/${equipment}: ${e.message}`); continue; }

        if (plan.days.length !== Number(tage)) {
          splitFehler.tage.push(`${wahl.wert}/${equipment}: ${plan.days.length} statt ${tage} Tage`);
        }
        // Mehr als achtzehn Sätze einer Gruppe in einer einzigen Einheit ist
        // jenseits von allem, was ein weiterer Satz noch beiträgt.
        for (const tag of plan.days) {
          const je = {};
          for (const x of tag.exercises) {
            const g = T.exerciseById(x.id).group;
            je[g] = (je[g] || 0) + T.forWeek(x, 3).sets;
          }
          for (const [g, n] of Object.entries(je)) {
            if (n > 18) splitFehler.spitze.push(`${wahl.wert}/${equipment} · ${tag.name}: ${g} ${n}`);
          }
        }
      }
    }
  }
  p.leer(splitFehler.gebaut, 'Aufteilungen: jede angebotene Wahl lässt sich bauen');
  p.leer(splitFehler.tage, 'Aufteilungen: jede hat genau so viele Tage wie angegeben');
  p.leer(splitFehler.spitze, 'Aufteilungen: keine Gruppe über 18 Sätzen in einer Einheit');

  // Und eine Aufteilung aus einer anderen Tagezahl darf nicht durchschlagen.
  const falscheWahl = L.profileForPlan({
    sex: 'm', age: 34, height: 180, weight: 80, goal: 'form', targetWeight: 76,
    level: 'fortgeschritten', days: 6, sessionLength: 60, weekdays: [1, 2, 3, 4, 5, 6],
    ernaehrung: 'misch', equipment: 'bw', activity: 'leicht',
    limits: [], focus: [], skills: [], gear: ['stange'], blocked: [], outgrown: [],
    splitKey: '3ppl',
  });
  p.gleich(T.buildPlan(falscheWahl, 0, { rang: L.leiterRang, leiter: L.leiterId }).days.length, 6,
    'Aufteilungen: eine Drei-Tage-Aufteilung schlägt bei sechs Tagen nicht durch');

  /* ---------- Mit Einschränkungen ---------- */
  //
  // Der große Durchlauf oben läuft mit `limits: []` — Schonungen kamen darin
  // nie vor. Genau dort lag ein Fehler: „Strecker am Boden" war nur beim
  // Ellbogen als kritisch vermerkt, nicht beim Handgelenk, obwohl die flache
  // Hand am Boden das Gelenk streckt. Und als der Vermerk ergänzt wurde, blieb
  // für Trizeps und Schulter ohne Geräte gar nichts mehr übrig — was ohne
  // diese Prüfung niemandem aufgefallen wäre.
  const LIMITS = [
    [], ['handgelenk'], ['schulter'], ['knie'], ['ruecken'], ['ellbogen'],
    ['handgelenk', 'schulter'], ['knie', 'ruecken'], ['handgelenk', 'ellbogen'],
    ['knie', 'schulter', 'handgelenk'],
  ];
  const schonung = { gebaut: [], leer: [], duenn: [], zug: [], hinge: [], gruppe: [] };
  let mitLimits = 0;

  for (const limits of LIMITS)
    for (const equipment of AUSRUESTUNG)
      for (const level of ERFAHRUNG)
        for (const days of [2, 3, 5])
          for (const gear of GERAETE) {
            mitLimits += 1;
            const wer = `${limits.join('+') || 'ohne'}/${equipment}/${level}/${days}d/${gear.length}g`;
            const profil = L.profileForPlan({
              sex: 'm', age: 34, height: 180, weight: 80, bodyfat: null,
              goal: 'form', targetWeight: 76, level, days, sessionLength: 60,
              weekdays: [1, 2, 3, 4, 5, 6].slice(0, days),
              ernaehrung: 'misch', equipment, activity: 'leicht',
              limits, focus: [], skills: [], gear, blocked: [], outgrown: [],
            });

            let plan;
            try { plan = T.buildPlan(profil, 0, { rang: L.leiterRang, leiter: L.leiterId }); }
            catch (e) { schonung.gebaut.push(`${wer}: ${e.message}`); continue; }

            for (const tag of plan.days) {
              if (!tag.exercises.length) { schonung.leer.push(`${wer} · ${tag.name}`); continue; }
              // Zwei Übungen sind kein Trainingstag. Wenn eine Schonung so viel
              // wegnimmt, muss die Ersatzgruppe greifen.
              if (tag.exercises.length < 3) {
                schonung.duenn.push(`${wer} · ${tag.name}: ${tag.exercises.length} Übungen`);
              }
              // Keine Übung darf drinstehen, die die Schonung verbietet.
              for (const x of tag.exercises) {
                const uebung = T.exerciseById(x.id);
                if ((uebung.avoid || []).some((a) => limits.includes(a))) {
                  schonung.gebaut.push(`${wer} · ${tag.name}: ${uebung.name} trotz Schonung`);
                }
              }
            }

            const alle = plan.days.flatMap((d) => d.exercises.map((e) => e.id));
            if (days >= 2) {
              if (!alle.some((i) => T.bewegungsmuster(i) === 'v')
                  && !alle.some((i) => T.bewegungsmuster(i) === 'h')) {
                schonung.zug.push(`${wer}: gar kein Ziehen`);
              }
              // Hüftstreckung, aber nicht notwendigerweise als Hüftbeuge-Muster.
              //
              // Zuerst stand hier dieselbe Prüfung wie oben: MUSTER_HINGE muss
              // vorkommen. Mit geschontem unterem Rücken fiel sie durch — zu
              // Recht ausgelöst, aber falsch behauptet. Beim Schonen des
              // Rückens ist das Hinge das Problem: Hüfte nach hinten, Last auf
              // der Wirbelsäule. Die Beckenbrücke liefert dieselbe
              // Hüftstreckung im Liegen, ohne die Wirbelsäule zu belasten, und
              // genau die wählt der Plan dort. Verlangt wird deshalb
              // Hüftstreckung in irgendeiner Form, nicht dieses eine Muster.
              const hueftarbeit = alle.some((i) => T.MUSTER_HINGE.has(i))
                || alle.some((i) => {
                  const e = T.exerciseById(i);
                  return e && e.type === 'c' && ['ham', 'glute'].includes(e.group);
                });
              if (!hueftarbeit) schonung.hinge.push(wer);

              // Die Schonung darf keine Muskelgruppe aus der Woche werfen, für
              // die es noch erlaubte Übungen gibt.
              //
              // Gemessen wird gegen denselben Plan ohne Schonung, nicht gegen
              // eine absolute Erwartung. Zuerst stand hier „jede trainierbare
              // Gruppe muss vorkommen" — das fiel bei Zweitageplänen durch,
              // ganz ohne Schonung: Zwei Ganzkörpertage haben schlicht weniger
              // Plätze als Gruppen. Das ist die Vorlage, nicht die Schonung,
              // und eine Prüfung, die beides vermischt, zeigt auf das Falsche.
              if (limits.length) {
                const ohne = T.buildPlan({ ...profil, limits: [] }, 0, { rang: L.leiterRang, leiter: L.leiterId });
                const vorher = new Set(ohne.days.flatMap((d) => d.exercises)
                  .map((x) => T.exerciseById(x.id).group));
                const nachher = new Set(alle.map((i) => T.exerciseById(i).group));
                const nochMoeglich = new Set(T.EXERCISES
                  .filter((x) => T.isAvailable(x, profil)).map((x) => x.group));
                for (const g of vorher) {
                  // Waden und Rumpf sind die Gruppen, die in engen Vorlagen
                  // zuerst weichen: Fällt vorn eine Schulterübung weg, rutscht
                  // der ganze Tag, und der letzte Platz ist der erste, der
                  // verloren geht. Das ist eine Frage der Platzzahl und nicht
                  // der Schonung — bei zwei Ganzkörpertagen gibt es für elf
                  // Gruppen schlicht keine elf Plätze.
                  if (['waden', 'core'].includes(g)) continue;
                  if (nachher.has(g) || !nochMoeglich.has(g)) continue;
                  schonung.gruppe.push(`${wer}: ${g} fällt durch die Schonung weg`);
                }
              }
            }
          }

  p.ist(mitLimits > 500, `${mitLimits} Kombinationen mit Schonungen geprüft`);
  p.leer(schonung.gebaut, 'Mit Schonung baut jeder Plan, und keine verbotene Übung steht drin');
  p.leer(schonung.leer, 'Keine Schonung macht einen Trainingstag leer');
  p.leer(schonung.duenn, 'Keine Schonung lässt einen Tag auf unter drei Übungen schrumpfen');
  p.leer(schonung.zug, 'Auch mit Schonung bleibt eine Zugbewegung übrig');
  p.leer(schonung.hinge, 'Auch mit Schonung bleibt Hüftstreckung übrig — notfalls im Liegen');
  p.leer(schonung.gruppe, 'Keine trainierbare Muskelgruppe fällt durch eine Schonung aus der Woche');

  // Und der Umweg, den es zu jeder Schonung gibt, muss auch dastehen.
  const ohneUmweg = Object.keys(T.LIMIT_LABEL).filter((k) => !T.LIMIT_AUSWEG[k]);
  p.leer(ohneUmweg, 'Zu jeder Schonung gibt es einen Umweg-Hinweis');

  /* ---------- Stufen überleben den Neubau ---------- */
  const stufenfehler = [];
  for (const equipment of AUSRUESTUNG) {
    const profil = L.profileForPlan({
      sex: 'm', age: 34, height: 180, weight: 80, goal: 'aufbau', targetWeight: 84,
      level: 'fortgeschritten', days: 3, weekdays: [1, 3, 5], sessionLength: 60,
      ernaehrung: 'misch', equipment, activity: 'leicht',
      limits: [], focus: [], skills: [], gear: ['stange', 'barren'], blocked: [], outgrown: [],
    });
    const erst = T.buildPlan(profil, 0, { rang: L.leiterRang, leiter: L.leiterId });
    const stand = L.rungsInPlan(erst);
    for (let seed = 1; seed <= 6; seed += 1) {
      const neu = T.buildPlan(profil, seed, { stufen: stand, rang: L.leiterRang, leiter: L.leiterId });
      for (const id of L.rungsInPlan(neu)) {
        const leiterId = L.ladderFor(id).leiter.id;
        const vorher = [...stand].find((x) => L.ladderFor(x).leiter.id === leiterId);
        if (vorher && vorher !== id) {
          stufenfehler.push(`${equipment}/seed${seed}: ${T.exerciseById(vorher).name} → ${T.exerciseById(id).name}`);
        }
      }
    }
  }
  p.leer(stufenfehler, 'Leitersprossen überleben jeden Neubau');

  return p;
}
