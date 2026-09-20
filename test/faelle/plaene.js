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
    gebaut: [], leer: [], doppelt: [], zeit: [], saetze: [], kraft: [], leiter: [], stufe: [],
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
                  try { plan = T.buildPlan(profil, 0, { rang: L.leiterRang }); }
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
  p.leer(fehler.stufe, 'Keine Sprosse unter dem Einstieg der Erfahrungsstufe');
  p.leer(fehler.zug, 'Beide Zugrichtungen in jeder Woche');
  p.leer(fehler.hinge, 'Hüftstreckung in jeder Woche');
  p.leer(fehler.stange, 'Vorhandene Klimmzugstange kommt vor');
  p.leer(fehler.volumen, 'Kein Wochenvolumen über 32 Sätzen je Gruppe');

  /* ---------- Stufen überleben den Neubau ---------- */
  const stufenfehler = [];
  for (const equipment of AUSRUESTUNG) {
    const profil = L.profileForPlan({
      sex: 'm', age: 34, height: 180, weight: 80, goal: 'aufbau', targetWeight: 84,
      level: 'fortgeschritten', days: 3, weekdays: [1, 3, 5], sessionLength: 60,
      ernaehrung: 'misch', equipment, activity: 'leicht',
      limits: [], focus: [], skills: [], gear: ['stange', 'barren'], blocked: [], outgrown: [],
    });
    const erst = T.buildPlan(profil, 0, { rang: L.leiterRang });
    const stand = L.rungsInPlan(erst);
    for (let seed = 1; seed <= 6; seed += 1) {
      const neu = T.buildPlan(profil, seed, { stufen: stand, rang: L.leiterRang });
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
