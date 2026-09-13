/**
 * Die Überblickskarte ganz oben auf der Tagesansicht.
 *
 * Sie steht bewusst über allem anderen: Was hier steht, ist das, was heute
 * zählt — und wenn nichts ansteht, sagt sie das in einem Satz und nimmt keinen
 * Platz weg.
 *
 * Die Regeln selbst stehen in coach.js, ohne DOM. Hier wird nur gezeichnet.
 */

import { el } from '../ui.js';
import { localDateKey, shiftDateKey } from '../nutrition.js';
import { dailyCoach } from '../coach.js';
import { dayForWeekday, blockWeek } from '../training.js';
import { oeffneKachel } from './tagesleiste.js';

/** Welche Kachel der Tagesleiste hinter einem Sprungziel steckt. */
const KACHEL_ZU = { water: 'trinken', supps: 'ergaenzung' };

/** Die vierte Woche im Block ist die Entlastungswoche. */
const DELOAD_WOCHE = 4;

const ART_ICON = {
  warnung: '!',
  achtung: '~',
  offen: '·',
  info: 'i',
};

export function coachCard(ctx, dateKey, meals, goals, mealsByDate = {}) {
  if (dateKey !== localDateKey()) return null;

  const plan = ctx.state.plan;
  const wochentag = new Date(`${dateKey}T12:00:00`).getDay();
  const trainingHeute = plan ? dayForWeekday(plan, wochentag) : null;
  const sessionHeute = (ctx.state.sessions || []).find((s) => s.date === dateKey) || null;

  const deload = plan ? blockWeek(plan, dateKey) === DELOAD_WOCHE : false;

  const ergebnis = dailyCoach({
    dateKey,
    jetzt: new Date(),
    shift: shiftDateKey,
    profile: ctx.state.profile,
    plan,
    goals,
    meals,
    activities: ctx.state.activities || [],
    sportGestern: ctx.state.sportWoche || [],
    sleep: ctx.state.sleep || [],
    weights: ctx.state.weights || [],
    sessions: ctx.state.sessions || [],
    water: ctx.state.water || [],
    supps: ctx.state.supps || [],
    suppListe: ctx.state.suppListe || [],
    trainingHeute,
    sessionHeute,
    pending: ctx.state.pending || [],
    mealsByDate,
    deload,
  });

  // Ganz am Anfang, ohne Profil und ohne Einträge, hat die Karte nichts zu
  // sagen. Dann gar nicht erst erscheinen.
  if (!ergebnis.hinweise.length && !ergebnis.lob.length) return null;

  const springen = (ziel) => {
    // Trinken und Ergänzung liegen jetzt zugeklappt in der Tagesleiste. Erst
    // aufklappen, dann hinscrollen — sonst führt der Knopf auf eine Kachel,
    // die nichts zeigt.
    const kachel = KACHEL_ZU[ziel];
    if (kachel) {
      oeffneKachel(kachel);
      ctx.reload();
      // Nach dem Neuzeichnen steht der Inhalt erst im nächsten Bild.
      requestAnimationFrame(() => {
        document.querySelector(`[data-anker="${kachel}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    if (ziel === 'suggest') {
      const el2 = document.querySelector('[data-anker="suggest"]');
      if (el2) { el2.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    }
    ctx.go(ziel);
  };

  const zeilen = ergebnis.hinweise.map((h) => el('div', { class: `coachzeile coach-${h.art}` },
    el('span', { class: 'coachikon', 'aria-hidden': 'true', text: ART_ICON[h.art] || '·' }),
    el('div', { class: 'grow' },
      el('p', { class: 'coachtext', text: h.text }),
      h.aktion
        ? el('button', {
            class: 'btn btn-ghost btn-sm', type: 'button',
            onClick: () => springen(h.aktion.ziel),
          }, h.aktion.text)
        : null)));

  return el('div', { class: 'card stack coachkarte' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Heute' }),
      ergebnis.lob.length
        ? el('span', { class: 'pill pill-ok tabular', text: `${ergebnis.lob.length} steht` })
        : null),
    ...zeilen,
    ergebnis.alleGut && !zeilen.length
      ? el('p', { class: 'coachgut', text: `Alles im Rahmen: ${ergebnis.lob.join(', ')}.` })
      : ergebnis.lob.length
        ? el('p', { class: 'muted small', text: `Steht schon: ${ergebnis.lob.join(', ')}.` })
        : null);
}
