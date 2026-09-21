/**
 * Jede Ansicht im Browser, mit vollem Datenbestand.
 *
 * Geprüft wird dreierlei: dass sie überhaupt erscheint, dass sie etwas zeigt,
 * und dass dabei keine Ausnahme fliegt. Dazu ein paar Inhalte, die schon
 * einmal falsch waren.
 */
import { neuerLauf } from '../pruefen.js';
import { starte } from '../server.js';
import { ladePlaywright, browserPfad, warumNicht } from '../browser.js';

const PORT = 8401;

const ANSICHTEN = ['today', 'training', 'plan', 'progress', 'report', 'history',
  'favorites', 'settings', 'strength', 'mobility', 'photos', 'activity', 'sleep',
  'supps', 'kegel'];

export default async function laufen() {
  const p = neuerLauf('Ansichten');
  const hindernis = warumNicht();
  if (hindernis) { p.ist(false, 'Ansichtsprüfung möglich', hindernis); return p; }

  const { chromium } = ladePlaywright();
  const server = await starte(PORT);
  const browser = await chromium.launch({ executablePath: browserPfad() });
  const kontext = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const seite = await kontext.newPage();

  const ausnahmen = [];
  seite.on('pageerror', (e) => ausnahmen.push(`Ausnahme: ${e.message}`));
  seite.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404')) ausnahmen.push(`Konsole: ${m.text()}`);
  });

  try {
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForTimeout(1200);
    await seite.evaluate(() => new Promise((f) => {
      const r = indexedDB.deleteDatabase('naehrwert'); r.onsuccess = f; r.onerror = f; r.onblocked = f;
    }));
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForTimeout(1200);

    // Voller Bestand: Profil, Plan, vierzehn Tage Essen, Schlaf, Sport, Einheiten.
    await seite.evaluate(async () => {
      const s = await import('/js/store.js');
      const t = await import('/js/training.js');
      const l = await import('/js/ladders.js');
      const n = await import('/js/nutrition.js');
      const wt = new Date().getDay();
      const heute = n.localDateKey();
      const profil = {
        sex: 'm', age: 34, height: 180, weight: 80, bodyfat: null, goal: 'abnehmen',
        targetWeight: 76, level: 'fortgeschritten', weekdays: [wt, (wt + 2) % 7, (wt + 4) % 7],
        days: 3, sessionLength: 60, ernaehrung: 'vegetarisch', equipment: 'studio',
        activity: 'leicht', limits: [], focus: [], skills: [], gear: ['stange', 'barren'],
        blocked: [], outgrown: [],
      };
      await s.setTrainingProfile(profil);
      const plan = t.buildPlan(l.profileForPlan(profil), 0, { rang: l.leiterRang });
      await s.setPlan({ ...plan, days: plan.days.map((d, i) => ({ ...d, weekday: i === 0 ? wt : (wt + i + 2) % 7 })) });
      for (let i = 0; i < 14; i += 1) {
        const d = n.shiftDateKey(heute, -i);
        await s.saveWeight(d, 80 - i * 0.05);
        await s.saveMeal({ id: `m${i}`, date: d, timestamp: Date.now() - i * 86400000,
          mealType: 'mittag', name: 'Linsensuppe',
          items: [{ name: 'Linsen', grams: 300, kcal: 420, protein: 26, carbs: 60, fat: 6 }], note: '' });
        await s.addWater(d, 1500);
        await s.saveSleep({ date: d, zuBett: '23:10', aufgewacht: '06:40', qualitaet: 3 });
        await s.saveActivity({ date: d, type: i % 2 ? 'laufen' : 'golf', minutes: i % 2 ? 40 : 240, intensity: 'mittel' });
        if (i % 3 === 0) {
          await s.saveSession({ date: d, dayName: 'Ganzkörper A', template: 'fbA', done: true, skills: {},
            entries: { bp: [{ weight: 60, reps: 8 }, { weight: 60, reps: 7 }],
              pullup: [{ weight: null, reps: 9 }], plank: [{ weight: null, reps: 45 }] } });
        }
      }
      await s.addKegelRun(heute, 1, 'kraft');
      // Kurze Pausen eingestellt, Plan aber mit normalen gebaut — genau die
      // Lage, in der jemand früher fertig ist, als er wollte.
      await s.setSetting('pausen', 'kurz');
    });
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForTimeout(1300);

    for (const name of ANSICHTEN) {
      await seite.evaluate((h) => { window.location.hash = `#/${h}`; }, name);
      await seite.waitForTimeout(600);
      const stand = await seite.evaluate((n2) => {
        const v = document.getElementById(`view-${n2}`);
        return { da: !!v, versteckt: v ? v.hidden : null, text: v ? (v.innerText || '') : '' };
      }, name);
      p.ist(stand.da && !stand.versteckt, `Ansicht „${name}" erscheint`);
      p.ist(stand.text.length > 80, `Ansicht „${name}" zeigt Inhalt`, `${stand.text.length} Zeichen`);
    }

    /* ---------- Inhalte, die schon einmal falsch waren ---------- */
    await seite.evaluate(() => { window.location.hash = '#/today'; });
    await seite.waitForTimeout(900);
    const heuteText = await seite.evaluate(() => document.getElementById('view-today').innerText);
    p.enthaeltNicht(heuteText, 'Wasser: rund', 'Heute nennt den Trinkrichtwert nur einmal');
    p.enthaelt(heuteText, 'Trinken', 'Heute hat eine Trinkkachel');

    await seite.evaluate(() => { window.location.hash = '#/training'; });
    await seite.waitForTimeout(900);
    const trainingText = await seite.evaluate(() => document.getElementById('view-training').innerText);
    p.enthaeltNicht(trainingText, 'Wdh. halten', 'Halteübungen sagen nicht „Wdh."');
    p.enthaelt(trainingText, 'Pause', 'Der Übungsblock nennt die Pause');

    /* ---------- Beide Wege auf der Leiter ---------- */
    // „Zu schwer" gab es im Übungsblock nie. Die Funktion dahinter war
    // vollständig geschrieben — nur der Knopf fehlte. Dazu hieß der
    // Tauschknopf früher „Zu schwer — andere Übung"; nach dem Umbenennen stand
    // das Wort nirgends mehr, und wer eine Übung nicht schaffte, fand nur noch
    // das dauerhafte Aussortieren. Das sind zwei verschiedene Dinge.
    const leiterKnoepfe = await seite.evaluate(() => {
      const bloecke = [...document.querySelectorAll('#view-training .exblock')];
      return bloecke.map((b) => {
        const text = b.innerText;
        return {
          leiter: /Stufe \d+ von \d+/.test(text),
          runter: text.includes('Zu schwer'),
          hoch: text.includes('Zu leicht'),
          aussortieren: text.includes('aussortieren'),
        };
      });
    });
    const mitLeiter = leiterKnoepfe.filter((x) => x.leiter);
    p.ist(mitLeiter.length > 0, 'Es gibt Übungen mit einer Variantenleiter',
      `${leiterKnoepfe.length} Blöcke, davon ${mitLeiter.length} mit Leiter`);
    p.ist(mitLeiter.some((x) => x.runter),
      'Auf der Leiter geht es auch abwärts — „Zu schwer" ist erreichbar');
    p.ist(mitLeiter.every((x) => x.runter || x.hoch),
      'Jede Leiterübung bietet mindestens eine Richtung an');
    p.ist(leiterKnoepfe.every((x) => x.aussortieren),
      'Aussortieren gibt es weiterhin bei jeder Übung — das ist etwas anderes');

    const einheiten = await seite.evaluate(() => {
      const raus = [];
      for (const el of document.querySelectorAll('#view-training .exblock-rx')) raus.push(el.innerText);
      return raus;
    });
    const halte = einheiten.filter((t) => t.includes(' s halten'));
    const wdh = einheiten.filter((t) => t.includes('Wdh.'));
    p.ist(halte.length + wdh.length === einheiten.length,
      'Jeder Übungsblock nennt entweder Wiederholungen oder Sekunden');

    /* ---------- Der Plan sagt, wenn er nicht zu den Pausen passt ---------- */
    // Im Bestand oben stehen kurze Pausen, der Plan wurde aber mit normalen
    // gebaut. Dann liegt Zeit brach, und genau das muss dastehen — sonst
    // bleibt die Einstellung folgenlos und man ist früher fertig, als man
    // wollte, ohne den Grund zu erfahren.
    await seite.evaluate(() => { window.location.hash = '#/plan'; });
    await seite.waitForTimeout(1000);
    const planText = await seite.evaluate(() => document.getElementById('view-plan').innerText);
    p.enthaelt(planText, 'Passt nicht zu deinen Pausen',
      'Der Plan meldet, dass er nicht zu den eingestellten Pausen passt');
    p.ist(/Sätze mehr in deine \d+ Minuten/.test(planText),
      'Er sagt auch, wie viel dadurch brachliegt',
      (planText.match(/Du pausierst[^.]*\./) || ['nicht gefunden'])[0]);
    p.ist(/auffüllen|kürzen/.test(planText),
      'Und bietet einen Knopf an, statt es nur festzustellen');

    /* ---------- Der Zeitfenster-Vergleich bleibt sichtbar ---------- */
    // Die Empfehlungskarte verschwindet, sobald man ihr gefolgt ist — und
    // damit auch die Begründung. Diese Tabelle bleibt und zeigt jedes Fenster
    // mit seinem Ergebnis, das eigene markiert.
    const tabelle = await seite.evaluate(() => {
      const d = [...document.querySelectorAll('#view-plan details')]
        .find((x) => x.innerText.includes('Zeit und Tage im Vergleich'));
      if (!d) return null;
      d.open = true;
      return d.innerText;
    });
    p.ist(tabelle, 'Der Plan zeigt den Zeit- und Tagevergleich');
    p.enthaelt(tabelle || '', 'deine Einstellung',
      'Die eigene Einstellung ist in der Tabelle markiert');
    p.ist((tabelle || '').split('Minuten').length - 1 >= 6,
      'Die Tabelle stellt mehrere Zeitfenster gegenüber',
      `${(tabelle || '').split('Minuten').length - 1} Zeilen`);
    p.ist(/\d+\/\d+/.test(tabelle || ''),
      'Und nennt je Fenster, wie viele Gruppen im Zielbereich lägen');
    p.enthaelt(tabelle || '', 'Und wie viele Tage?',
      'Der Vergleich stellt auch die Trainingstage gegenüber');
    p.ist(/\d+ Tage à \d+ Minuten/.test(tabelle || ''),
      'Je Tagezahl steht das Zeitfenster dabei, das dort am besten abschneidet');

    p.leer(ausnahmen, 'Keine Ausnahme und kein Konsolenfehler in allen Ansichten');
  } finally {
    await browser.close();
    server.close();
  }
  return p;
}
