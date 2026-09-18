/**
 * Bericht, Überblick und Offline-Betrieb.
 *
 * Der Teil der App, der Schlüsse zieht statt Zahlen entgegenzunehmen — und
 * deshalb der Teil, in dem ein Fehler am längsten unbemerkt bleibt.
 */
import { neuerLauf } from '../pruefen.js';
import { starte } from '../server.js';
import { ladePlaywright, browserPfad, warumNicht } from '../browser.js';

const PORT = 8404;

export default async function laufen() {
  const p = neuerLauf('Auswertung');
  const hindernis = warumNicht();
  if (hindernis) { p.ist(false, 'Auswertungsprüfung möglich', hindernis); return p; }

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

    /* ---------- Ein Bestand mit bekannten Antworten ---------- */
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

      for (let i = 0; i < 21; i += 1) {
        const d = n.shiftDateKey(heute, -i);
        // Eine viel zu kurze Nacht am Tag 0, sonst genug Schlaf.
        await s.saveSleep({ date: d, zuBett: i === 0 ? '01:30' : '22:50', aufgewacht: '06:20' });
        await s.saveWeight(d, 80 - i * 0.04);
        await s.saveMeal({ id: `m${i}`, date: d, timestamp: Date.now() - i * 86400000,
          mealType: 'mittag', name: 'Linsensuppe',
          items: [{ name: 'Linsen', grams: 400, kcal: 560, protein: 34, carbs: 80, fat: 8 }], note: '' });
        await s.addWater(d, 1800);
      }

      /* Ein Trainingsbestand mit bekannter Richtung — eine Einheit je Woche,
         damit jede Woche für sich steht.

         Bankdrücken und Kniebeuge steigen sauber an, Klimmzüge gehen seit der
         dritten Einheit zurück, und die bewegte Last wächst dadurch Woche für
         Woche, ohne dass je eine leichtere dazwischen liegt. Damit muss die App
         alle drei Aussagen treffen — und keine davon verwechseln: Fortschritt
         beim Drücken, Rückgang beim Ziehen, steigende Gesamtlast. */
      const bank = [60, 62.5, 65, 67.5, 70, 72.5, 75, 77.5];
      const beuge = [80, 90, 100, 110, 120, 130, 140, 150];
      const zug = [14, 15, 16, 13, 12, 11, 10, 9];
      for (let i = 0; i < 8; i += 1) {
        // Von hinten nach vorn: i = 0 ist die älteste Einheit.
        const d = n.shiftDateKey(heute, -(7 - i) * 7);
        const dreiSaetze = (gewicht) => [
          { reps: 8, weight: gewicht }, { reps: 8, weight: gewicht }, { reps: 8, weight: gewicht },
        ];
        await s.saveSession({
          date: d, dayName: 'Ganzkörper', done: true,
          entries: {
            bench: dreiSaetze(bank[i]),
            squat: dreiSaetze(beuge[i]),
            pullup: [{ reps: zug[i] }, { reps: zug[i] - 1 }],
          },
        });
      }
    });
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForTimeout(1300);

    /* ---------- Überblick auf „Heute" ---------- */
    await seite.evaluate(() => { window.location.hash = '#/today'; });
    await seite.waitForTimeout(1000);
    const heute = await seite.evaluate(() => document.getElementById('view-today').innerText);
    p.enthaelt(heute, 'Eiweiß', 'Der Überblick nennt das Eiweiß');
    p.ist(/\d+\s*\/\s*\d+\s*g/.test(heute), 'Eiweiß steht als „erreicht von Ziel"');
    // Nach einer Nacht von 01:30 bis 06:20 muss ein Hinweis kommen.
    p.ist(/Nacht|Schlaf/.test(heute), 'Die kurze Nacht taucht im Überblick auf');

    /* ---------- Bericht ---------- */
    await seite.evaluate(() => { window.location.hash = '#/report'; });
    await seite.waitForTimeout(1300);
    const bericht = await seite.evaluate(() => document.getElementById('view-report').innerText);
    p.ist(bericht.length > 500, 'Der Bericht hat Inhalt', `${bericht.length} Zeichen`);
    p.enthaelt(bericht, 'Ernährung', 'Der Bericht hat einen Ernährungsabschnitt');
    p.enthaelt(bericht, 'Training', 'Der Bericht hat einen Trainingsabschnitt');
    p.enthaeltNicht(bericht, 'NaN', 'Im Bericht steht kein NaN');
    p.enthaeltNicht(bericht, 'undefined', 'Im Bericht steht kein undefined');
    p.enthaeltNicht(bericht, 'Infinity', 'Im Bericht steht kein Infinity');

    /* ---------- Schlafregelmäßigkeit ---------- */
    await seite.evaluate(() => { window.location.hash = '#/sleep'; });
    await seite.waitForTimeout(900);
    const schlaf = await seite.evaluate(() => document.getElementById('view-sleep').innerText);
    p.enthaelt(schlaf, 'Regelmäßigkeit', 'Die Schlafansicht zeigt die Regelmäßigkeit');
    p.ist(/±\s*\d+\s*min/.test(schlaf), 'Die Schwankung steht als Minutenwert da',
      schlaf.slice(0, 200));
    // Zwanzig Nächte mit denselben Zeiten sind nicht „sprunghaft".
    p.enthaeltNicht(schlaf, 'springt um zwei Stunden',
      'Gleiche Zeiten Nacht für Nacht gelten nicht als sprunghaft');
    // Und die Herkunft der Zahl wird nicht verschwiegen.
    p.enthaelt(schlaf, 'Aktigraphie',
      'Die Ansicht sagt, dass die Studie anders gemessen hat als die App');

    /* ---------- Richtung, Rückgang, Belastung ---------- */
    await seite.evaluate(() => { window.location.hash = '#/progress'; });
    await seite.waitForTimeout(1100);
    const fortschritt = await seite.evaluate(() => document.getElementById('view-progress').innerText);
    // Abschnittsüberschriften setzt das Stylesheet in Großbuchstaben, und
    // innerText gibt sie genau so zurück. Deshalb ohne Rücksicht auf Groß und Klein.
    const ohneFall = fortschritt.toLowerCase();
    p.enthaelt(ohneFall, 'richtung je übung', 'Der Fortschritt zeigt die Richtung je Übung');
    p.ist(/Rückgang|unter dem Besten/.test(fortschritt),
      'Die zurückgehende Übung wird als solche benannt');
    p.enthaelt(ohneFall, 'belastungsverlauf',
      'Acht steigende Wochen bringen den Belastungsverlauf auf den Schirm');
    p.enthaelt(fortschritt, 'Foster',
      'Beim Belastungsverlauf steht, woher der Gedanke kommt');
    p.enthaelt(fortschritt, 'bewusst nicht ab',
      'Und dass Fosters Formel eine Eingabe bräuchte, die es hier nicht gibt');
    p.enthaeltNicht(fortschritt, 'NaN', 'Kein NaN in den neuen Abschnitten');

    /* ---------- Keine kaputten Zahlen irgendwo ---------- */
    const kaputt = [];
    for (const name of ['today', 'training', 'plan', 'progress', 'report', 'strength', 'supps']) {
      await seite.evaluate((h) => { window.location.hash = `#/${h}`; }, name);
      await seite.waitForTimeout(500);
      const t = await seite.evaluate((h) => document.getElementById(`view-${h}`)?.innerText || '', name);
      for (const wort of ['NaN', 'undefined', 'Infinity', '[object Object]', 'null']) {
        if (t.includes(wort)) kaputt.push(`${name}: ${wort}`);
      }
    }
    p.leer(kaputt, 'Keine kaputten Werte in den Ansichten');

    /* ---------- Offline ---------- */
    const sw = await seite.evaluate(async () => {
      if (!navigator.serviceWorker) return { da: false };
      const reg = await navigator.serviceWorker.getRegistration();
      return { da: !!reg, aktiv: !!(reg && reg.active), steuert: !!navigator.serviceWorker.controller };
    });
    p.ist(sw.da && sw.aktiv, 'Der Offline-Speicher ist eingerichtet', JSON.stringify(sw));

    await kontext.setOffline(true);
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForTimeout(1500);
    const offline = await seite.evaluate(() => document.getElementById('view-today')?.innerText || '');
    p.ist(offline.length > 100, 'Die App startet ohne Netz', `${offline.length} Zeichen`);
    const offlineDaten = await seite.evaluate(async () => {
      const s = await import('/js/store.js'); const n = await import('/js/nutrition.js');
      return (await s.getMealsByDate(n.localDateKey())).length;
    });
    p.gleich(offlineDaten, 1, 'Ohne Netz sind die Daten da');
    await kontext.setOffline(false);

    p.leer(ausnahmen, 'Keine Ausnahme in Bericht und Offline-Betrieb');
  } finally {
    await browser.close();
    server.close();
  }
  return p;
}
