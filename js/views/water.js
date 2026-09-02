/**
 * Trinken: eine Karte auf der Tagesansicht, mehr braucht es nicht.
 *
 * Kein eigener Reiter, kein Formular. Wer trinkt, hat ein Glas in der Hand und
 * höchstens einen Daumen frei — also große Knöpfe mit festen Mengen und ein
 * Rückgängig für den Fehlgriff. Eine Zahleneingabe würde nach drei Tagen nicht
 * mehr benutzt.
 */

import { el, toast } from '../ui.js';
import { addWater, setWater } from '../store.js';
import { localDateKey, shiftDateKey } from '../nutrition.js';
import { dayTotals } from '../activities.js';
import {
  PORTIONEN, dailyGoal, formatMl, rate, streak, ML_PRO_KG, ML_PRO_SPORTMINUTE,
} from '../water.js';

/**
 * Balken statt Ring: Trinken ist eine Menge, die sich über den Tag füllt, und
 * die Tagesansicht hat schon einen Ring. Zwei Ringe nebeneinander sähen aus,
 * als wären sie gleich wichtig.
 */
function balken(ml, ziel) {
  const anteil = ziel ? Math.min(1, ml / ziel) : 0;
  // Markierungen bei Vierteln — sie machen aus dem Balken eine Skala, an der
  // man mittags ablesen kann, ob man auf Kurs ist.
  const marken = [0.25, 0.5, 0.75].map((p) =>
    el('i', { class: 'wassermarke', style: { left: `${p * 100}%` } }));

  return el('div', { class: 'wasserbalken' },
    el('div', { class: 'wasserfuell', style: { width: `${anteil * 100}%` } }),
    ...marken);
}

export function waterSection(ctx, dateKey, eintraege) {
  const heute = localDateKey();
  const profile = ctx.state.profile;
  const kg = profile?.weight || null;

  // Sport hebt den Richtwert — dieselbe Logik wie beim Tagesziel für Kalorien.
  const sport = dayTotals(ctx.state.activities || [], kg);
  const trainingsMinuten = ctx.state.plan && ctx.goalsFor(dateKey).kind === 'training'
    ? (profile?.sessionLength || 0)
    : 0;
  const minuten = sport.minuten + trainingsMinuten;

  const ziel = dailyGoal(kg, minuten);
  const eintrag = (eintraege || []).find((e) => e.date === dateKey);
  const ml = eintrag?.ml || 0;

  const stand = rate(ml, ziel, { tagVorbei: dateKey < heute || new Date().getHours() >= 21 });
  const serie = ziel ? streak(eintraege, ziel, dateKey, shiftDateKey) : 0;

  const trinken = async (menge) => {
    await addWater(dateKey, menge);
    await ctx.refreshDaily();
    ctx.reload();
  };

  // Ohne Profil gibt es kein Gewicht und damit keinen Richtwert. Eintragen soll
  // trotzdem gehen — die Zahl steht dann eben ohne Bezug da.
  const kopf = el('div', { class: 'row-between' },
    el('h3', { class: 'card-title', text: 'Trinken' }),
    el('span', { class: `pill ${stand?.art === 'erreicht' ? 'pill-ok' : 'pill-kcal'} tabular`,
      text: ziel ? `${formatMl(ml)} / ${formatMl(ziel)}` : formatMl(ml) }));

  const knoepfe = el('div', { class: 'wasserknoepfe' },
    ...PORTIONEN.map((p) => el('button', {
      class: 'btn wasserknopf', type: 'button',
      title: `${p.label} — ${p.ml} ml`,
      onClick: () => trinken(p.ml),
    },
      el('span', { class: 'wasserikon', text: p.icon }),
      el('span', { class: 'wassermenge tabular', text: `+${p.ml}` }))));

  const fuss = el('div', { class: 'row-between' },
    el('span', { class: 'muted small',
      text: minuten > 0 && ziel
        ? `${ML_PRO_KG} ml je kg, plus ${ML_PRO_SPORTMINUTE} ml je Sportminute (${minuten} min heute)`
        : ziel ? `Richtwert: ${ML_PRO_KG} ml je kg Körpergewicht` : 'Ohne Profil kein Richtwert' }),
    ml > 0
      ? el('button', { class: 'btn btn-ghost btn-sm', type: 'button',
          onClick: async () => {
            if (eintrag?.portionen?.length) await addWater(dateKey, -1);
            else await setWater(dateKey, 0);
            await ctx.refreshDaily();
            ctx.reload();
            toast('Zurückgenommen.');
          } }, 'Rückgängig')
      : null);

  return el('div', { class: 'card stack' },
    kopf,
    ziel ? balken(ml, ziel) : null,
    stand ? el('p', { class: 'muted small', text: stand.text }) : null,
    serie >= 3
      ? el('p', { class: 'hint', text: `${serie} Tage in Folge den Richtwert erreicht.` })
      : null,
    knoepfe,
    fuss);
}
