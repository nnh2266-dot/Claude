/**
 * Was gespeichert wird, bleibt gespeichert — und kommt unverändert zurück.
 * Dazu die Dinge, die beim Umbauen des Plans schon einmal verlorengingen.
 */
import { neuerLauf } from '../pruefen.js';
import { starte } from '../server.js';
import { ladePlaywright, browserPfad, warumNicht } from '../browser.js';

const PORT = 8403;

export default async function laufen() {
  const p = neuerLauf('Daten');
  const hindernis = warumNicht();
  if (hindernis) { p.ist(false, 'Datenprüfung möglich', hindernis); return p; }

  const { chromium } = ladePlaywright();
  const server = await starte(PORT);
  const browser = await chromium.launch({ executablePath: browserPfad() });
  const seite = await (await browser.newContext({ viewport: { width: 420, height: 900 } })).newPage();
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

    /* ---------- Jede Art von Eintrag einmal ---------- */
    const angelegt = await seite.evaluate(async () => {
      const s = await import('/js/store.js');
      const t = await import('/js/training.js');
      const l = await import('/js/ladders.js');
      const n = await import('/js/nutrition.js');
      const heute = n.localDateKey();
      const profil = {
        sex: 'm', age: 34, height: 180, weight: 80, bodyfat: null, goal: 'aufbau',
        targetWeight: 84, level: 'fortgeschritten', weekdays: [1, 3, 5], days: 3,
        sessionLength: 60, ernaehrung: 'vegan', equipment: 'bw', activity: 'leicht',
        limits: [], focus: [], skills: [], gear: ['stange'], blocked: [], outgrown: ['pushup'],
      };
      await s.setTrainingProfile(profil);
      await s.setPlan(t.buildPlan(l.profileForPlan(profil), 0, { rang: l.leiterRang, leiter: l.leiterId }));
      await s.saveMeal({ id: 'a', date: heute, timestamp: Date.now(), mealType: 'mittag',
        name: 'Linsen', items: [{ name: 'Linsen', grams: 300, kcal: 420, protein: 26, carbs: 60, fat: 6 }], note: 'Notiz' });
      await s.saveFavorite({ id: 'f1', name: 'Linsen', items: [{ name: 'Linsen', grams: 300, kcal: 420, protein: 26, carbs: 60, fat: 6 }] });
      await s.saveWeight(heute, 80.4);
      await s.saveSession({ date: heute, dayName: 'Ganzkörper A', template: 'fbA', done: true,
        skills: {}, entries: { pushup: [{ weight: null, reps: 12 }] } });
      await s.saveSleep({ date: heute, zuBett: '23:10', aufgewacht: '06:40', qualitaet: 3 });
      await s.saveActivity({ date: heute, type: 'golf', minutes: 240, intensity: 'mittel' });
      await s.addWater(heute, 1500);
      await s.setSupplementList([{ id: 'kreatin', zeit: 'egal' }]);
      await s.setSupplementTaken(heute, 'kreatin', true);
      await s.addKegelRun(heute, 1, 'kraft');
      await s.addKegelRun(heute, 1, 'loesen');
      await s.saveMobilityTest(heute, { schulter: 3, hueffte: 2 });
      return true;
    });
    p.ist(angelegt, 'Von jeder Art ist ein Eintrag angelegt');

    /* ---------- Neustart: alles noch da ---------- */
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForTimeout(1200);
    const nachNeustart = await seite.evaluate(async () => {
      const s = await import('/js/store.js'); const n = await import('/js/nutrition.js');
      const heute = n.localDateKey();
      return {
        mahlzeiten: (await s.getMealsByDate(heute)).length,
        favoriten: (await s.listFavorites()).length,
        gewichte: (await s.listWeights()).length,
        einheiten: (await s.listSessions()).length,
        schlaf: (await s.listSleep()).length,
        sport: (await s.getActivitiesByDate(heute)).length,
        wasser: (await s.listWater()).length,
        supps: (await s.listSupplementDays()).length,
        kegel: (await s.listKegel()).length,
        beweglichkeit: (await s.listMobilityTests()).length,
        profil: !!(await s.getTrainingProfile()),
        plan: !!(await s.getPlan()),
      };
    });
    p.gleich(nachNeustart, {
      mahlzeiten: 1, favoriten: 1, gewichte: 1, einheiten: 1, schlaf: 1, sport: 1,
      wasser: 1, supps: 1, kegel: 1, beweglichkeit: 1, profil: true, plan: true,
    }, 'Nach dem Neuladen ist jeder Eintrag noch da');

    /* ---------- Export und Import ---------- */
    const rund = await seite.evaluate(async () => {
      const s = await import('/js/store.js');
      const d = await s.exportData();
      const kopie = JSON.parse(JSON.stringify(d));
      const zurueck = await s.importData(kopie);
      const danach = await s.exportData();
      // Zeitstempel ändern sich beim Import zwangsläufig — der Datensatz wird
      // ja neu geschrieben. Verglichen wird der Inhalt, nicht die Uhrzeit.
      const ohneStempel = (x) => JSON.parse(JSON.stringify(x, (schluessel, wert) =>
        (['exportedAt', 'updatedAt', 'savedAt'].includes(schluessel) ? 0 : wert)));
      return {
        felder: Object.keys(d).sort(),
        zurueck,
        gleich: JSON.stringify(ohneStempel(d)) === JSON.stringify(ohneStempel(danach)),
        kostErhalten: danach.profile?.ernaehrung,
        kegelLoesen: danach.kegel?.[0]?.loesen,
      };
    });
    p.ist(rund.felder.includes('kegel') && rund.felder.includes('water')
      && rund.felder.includes('supps') && rund.felder.includes('schonung'),
    'Der Export enthält alle Bereiche', rund.felder.join(', '));
    p.ist(rund.gleich, 'Export, Import, Export ergibt denselben Inhalt');
    p.gleich(rund.kostErhalten, 'vegan', 'Die Kostform überlebt den Import');
    p.gleich(rund.kegelLoesen, 1, 'Lösen-Durchgänge überleben den Import');

    /* ---------- Leitersprossen überleben den Neubau ---------- */
    const leiter = await seite.evaluate(async () => {
      const s = await import('/js/store.js');
      const t = await import('/js/training.js');
      const l = await import('/js/ladders.js');
      const profil = await s.getTrainingProfile();
      const alt = await s.getPlan();
      const vorher = [...l.rungsInPlan(alt)].sort();
      const neu = t.buildPlan(l.profileForPlan(profil), (alt.seed || 0) + 3,
        { stufen: l.rungsInPlan(alt), rang: l.leiterRang, leiter: l.leiterId });
      const nachher = [...l.rungsInPlan(neu)].sort();
      // Gemeinsame Leitern müssen dieselbe Sprosse haben.
      const abweichung = [];
      for (const id of nachher) {
        const leiterId = l.ladderFor(id).leiter.id;
        const passend = vorher.find((x) => l.ladderFor(x).leiter.id === leiterId);
        if (passend && passend !== id) abweichung.push(`${passend} → ${id}`);
      }
      return { vorher, nachher, abweichung };
    });
    p.leer(leiter.abweichung, 'Keine Leitersprosse verschiebt sich beim Neubau');
    p.ist(leiter.vorher.length >= 4, `${leiter.vorher.length} Leitern im Plan`);

    /* ---------- Aufräumen lässt nichts liegen ---------- */
    const geleert = await seite.evaluate(async () => {
      const s = await import('/js/store.js');
      await s.clearEntries();
      const n = await import('/js/nutrition.js');
      return {
        mahlzeiten: (await s.getMealsByDate(n.localDateKey())).length,
        profilBleibt: !!(await s.getTrainingProfile()),
      };
    });
    p.gleich(geleert.mahlzeiten, 0, 'Einträge löschen entfernt die Mahlzeiten');
    p.ist(geleert.profilBleibt, 'Einträge löschen lässt das Profil stehen');

    p.leer(ausnahmen, 'Keine Ausnahme beim Speichern und Laden');
  } finally {
    await browser.close();
    server.close();
  }
  return p;
}
