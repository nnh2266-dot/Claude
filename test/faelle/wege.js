/**
 * Die Wege, die ein Mensch durch die App nimmt.
 *
 * Vom leeren Gerät bis zum eingetragenen Satz. Jeder Schritt behauptet etwas
 * über das, was danach auf dem Schirm steht oder in der Datenbank liegt.
 */
import { neuerLauf } from '../pruefen.js';
import { starte } from '../server.js';
import { ladePlaywright, browserPfad, warumNicht } from '../browser.js';

const PORT = 8402;

export default async function laufen() {
  const p = neuerLauf('Wege');
  const hindernis = warumNicht();
  if (hindernis) { p.ist(false, 'Wegeprüfung möglich', hindernis); return p; }

  const { chromium } = ladePlaywright();
  const server = await starte(PORT);
  const browser = await chromium.launch({ executablePath: browserPfad() });
  const kontext = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const seite = await kontext.newPage();

  const ausnahmen = [];
  await seite.addInitScript(() => {
    window.__toasts = [];
    const start = () => new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) {
        if (n.nodeType === 1 && /toast/.test(n.className || '')) window.__toasts.push(n.textContent);
      }
    }).observe(document.body, { childList: true, subtree: true });
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  });
  seite.on('pageerror', (e) => ausnahmen.push(`Ausnahme: ${e.message}`));
  seite.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404')) ausnahmen.push(`Konsole: ${m.text()}`);
  });

  const letzterToast = () => seite.evaluate(() => window.__toasts[window.__toasts.length - 1] || '');
  const text = (id) => seite.evaluate((x) => document.getElementById(`view-${x}`)?.innerText || '', id);

  try {
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForTimeout(1200);
    await seite.evaluate(() => new Promise((f) => {
      const r = indexedDB.deleteDatabase('naehrwert'); r.onsuccess = f; r.onerror = f; r.onblocked = f;
    }));
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForTimeout(1300);

    /* ---------- 1. Erster Start ---------- */
    const start = seite.locator('#view-today .card', { hasText: 'Erst ein paar Fragen' });
    p.ist(await start.count() === 1, 'Ohne Profil führt „Heute" zum Fragebogen');

    /* ---------- 2. Fragebogen ---------- */
    await start.first().locator('button').click();
    await seite.waitForTimeout(800);
    const schritte = [];
    for (let i = 1; i <= 12; i += 1) {
      const offen = await seite.evaluate(() => {
        const v = document.getElementById('view-setup'); return v && !v.hidden;
      });
      if (!offen) break;
      schritte.push(await seite.evaluate(() => document.querySelector('#view-setup .view-head h1')?.textContent || ''));

      const felder = seite.locator('#view-setup input[type="text"]:visible');
      const anzahl = await felder.count();
      for (let k = 0; k < anzahl; k += 1) {
        const f = felder.nth(k);
        if ((await f.inputValue()).trim()) continue;
        if (i === 1) { const w = ['34', '180', '80'][k]; if (w) await f.fill(w); }
        else await f.fill('76');
      }
      const gruppen = seite.locator('#view-setup .optcards, #view-setup .chips');
      const gz = await gruppen.count();
      for (let k = 0; k < gz; k += 1) {
        const g = gruppen.nth(k);
        if (await g.locator('[aria-pressed="true"]').count()) continue;
        const opts = g.locator('.chip, .optcard');
        const oz = await opts.count();
        if (!oz) continue;
        const mehrere = oz >= 7 && /Mo|Di/.test(await g.innerText());
        for (let j = 0; j < (mehrere ? 3 : 1); j += 1) { await opts.nth(j).click(); await seite.waitForTimeout(90); }
      }
      await seite.locator('#view-setup button', { hasText: /Weiter|Plan erstellen/ }).last().click();
      await seite.waitForTimeout(800);
    }
    p.ist(schritte.length === 8, 'Der Fragebogen hat acht Schritte', schritte.join(' → '));
    p.ist(schritte.some((t) => /Ziel/.test(t)), 'Ein Schritt fragt nach dem Ziel');
    const profil = await seite.evaluate(async () => {
      const s = await import('/js/store.js');
      const pr = await s.getTrainingProfile(); const pl = await s.getPlan();
      return pr && { kost: pr.ernaehrung, gewicht: pr.weight, tage: pr.days, plan: pl?.splitName, stand: pl?.uebungsstand };
    });
    p.ist(profil && profil.gewicht === 80, 'Das Gewicht ist im Profil angekommen');
    p.ist(profil && profil.kost, 'Die Kostform wurde gefragt und gespeichert', JSON.stringify(profil));
    p.ist(profil && profil.plan, 'Am Ende steht ein Plan');
    p.ist(profil && profil.stand > 0, 'Der Plan merkt sich den Übungsstand');

    /* ---------- 3. Mahlzeit ---------- */
    await seite.evaluate(() => { window.location.hash = '#/today'; });
    await seite.waitForTimeout(900);
    await seite.locator('#view-today button', { hasText: 'Von Hand eintragen' }).click();
    await seite.waitForTimeout(700);
    await seite.locator('#view-capture input').first().fill('Quark mit Beeren');
    await seite.locator('#view-capture button', { hasText: 'Komponente hinzufügen' }).click();
    await seite.waitForTimeout(400);
    await seite.locator('#view-capture input[aria-label^="Name der Komponente"]').first().fill('Magerquark');

    await seite.locator('#view-capture button', { hasText: /^Speichern$/ }).click();
    await seite.waitForTimeout(800);
    p.enthaelt(await letzterToast(), 'Kalorien', 'Mahlzeit ohne Nährwerte wird abgelehnt');
    p.gleich(await seite.evaluate(async () => {
      const s = await import('/js/store.js'); const n = await import('/js/nutrition.js');
      return (await s.getMealsByDate(n.localDateKey())).length;
    }), 0, 'Die leere Mahlzeit liegt nicht in der Datenbank');

    const zahlen = seite.locator('#view-capture input[inputmode="decimal"]');
    const werte = ['250', '170', '30', '10', '1'];
    for (let i = 0; i < Math.min(await zahlen.count(), 5); i += 1) await zahlen.nth(i).fill(werte[i]);
    await seite.locator('#view-capture button', { hasText: /^Speichern$/ }).click();
    await seite.waitForTimeout(900);
    const mahlzeiten = await seite.evaluate(async () => {
      const s = await import('/js/store.js'); const n = await import('/js/nutrition.js');
      return (await s.getMealsByDate(n.localDateKey())).map((m) => ({ name: m.name, kcal: m.totals?.kcal, p: m.totals?.protein }));
    });
    p.gleich(mahlzeiten, [{ name: 'Quark mit Beeren', kcal: 170, p: 30 }], 'Die Mahlzeit steht mit ihren Werten drin');
    await seite.evaluate(() => { window.location.hash = '#/today'; });
    await seite.waitForTimeout(800);
    p.enthaelt(await text('today'), '170', 'Heute zeigt die Kalorien der Mahlzeit');

    /* ---------- 4. Training: Satz eintragen ---------- */
    await seite.evaluate(async () => {
      const s = await import('/js/store.js');
      const plan = await s.getPlan(); const pr = await s.getTrainingProfile();
      const wt = new Date().getDay();
      await s.setPlan({ ...plan, days: plan.days.map((d, i) => ({ ...d, weekday: i === 0 ? wt : (wt + i + 2) % 7 })) });
      await s.setTrainingProfile({ ...pr, equipment: 'bw', skills: [] });
    });
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForTimeout(1100);
    await seite.evaluate(() => { window.location.hash = '#/training'; });
    await seite.waitForTimeout(1200);

    const bloecke = await seite.locator('#view-training .exblock').count();
    p.ist(bloecke >= 4, `Der Trainingstag zeigt ${bloecke} Übungsblöcke`);

    const ersterName = await seite.locator('#view-training .exblock-name').first().innerText();
    await seite.locator('#view-training .exblock').first().locator('.settick')
      .first()
      .click();
    await seite.waitForTimeout(1100);
    const satz = await seite.evaluate(async () => {
      const s = await import('/js/store.js'); const n = await import('/js/nutrition.js');
      const ses = await s.getSession(n.localDateKey());
      const [, v] = Object.entries(ses?.entries || {}).find(([, x]) => x.length) || [];
      return v ? v[0] : null;
    });
    p.ist(satz && satz.reps > 0, `Der Haken trägt einen Satz ein (${ersterName})`, JSON.stringify(satz));

    /* ---------- 5. Übung aussortieren ---------- */
    const aussortieren = seite.locator('#view-training button', { hasText: 'aussortieren' }).first();
    p.ist(await aussortieren.count() === 1, 'Es gibt einen Knopf zum Aussortieren');
    await aussortieren.click();
    await seite.waitForTimeout(1100);
    const gesperrt = await seite.evaluate(async () => (await (await import('/js/store.js')).getTrainingProfile()).blocked);
    p.ist(gesperrt.length === 1, 'Die aussortierte Übung steht auf der Sperrliste', JSON.stringify(gesperrt));
    const namenJetzt = await seite.locator('#view-training .exblock-name').allInnerTexts();
    p.ist(!namenJetzt.includes(ersterName), 'Die aussortierte Übung steht nicht mehr im Tag');

    /* ---------- 6. Einheit abschließen ---------- */
    await seite.locator('#view-training button', { hasText: 'Einheit abschließen' }).click();
    await seite.waitForTimeout(1100);
    p.ist(await seite.evaluate(async () => {
      const s = await import('/js/store.js'); const n = await import('/js/nutrition.js');
      return (await s.getSession(n.localDateKey()))?.done === true;
    }), 'Die Einheit ist als erledigt vermerkt');

    p.leer(ausnahmen, 'Keine Ausnahme auf dem ganzen Weg');
  } finally {
    await browser.close();
    server.close();
  }
  return p;
}
