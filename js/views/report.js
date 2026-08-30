/**
 * Bericht: kurz für den Tag, ausführlich für die Woche.
 *
 * Die Zahlen kommen aus report.js, hier steht nur die Darstellung. Befunde
 * bekommen eine Farbe nach Art — gut, schlecht, Tatsache —, damit man mit
 * einem Blick sieht, wo es hakt, ohne jeden Satz lesen zu müssen. Nichts wird
 * ausgeblendet: gerade die unangenehmen Zeilen sind der Zweck der Sache.
 */

import { el, mount, viewHead, iconButton, emptyState } from '../ui.js';
import { localDateKey, shiftDateKey } from '../nutrition.js';
import { getMealsInRange, getActivitiesInRange, getActivitiesByDate } from '../store.js';
import { dailyReport, weeklyReport, weekStart } from '../report.js';

/** Welche Woche gerade gezeigt wird — null heißt: die laufende. */
let woche = null;

const ICON = { gut: '✓', schlecht: '!', neutral: '·' };

/**
 * Datum ohne relative Namen. `formatDateKey` sagt „Heute" und „Gestern" — in
 * einer Zeitspanne liest sich das als „Gestern bis So, 23. Aug." und stiftet
 * mehr Verwirrung, als es spart.
 */
function tagKurz(key) {
  return new Date(`${key}T12:00:00`)
    .toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

function befundZeile(b) {
  return el('div', { class: `befund befund-${b.art}` },
    el('span', { class: 'befund-icon', text: ICON[b.art] || '·' }),
    el('span', { class: 'befund-text', text: b.text }));
}

function abschnitt(titel, befunde) {
  return el('div', { class: 'card stack' },
    el('h3', { class: 'card-title', text: titel }),
    el('div', { class: 'befunde' }, ...befunde.map(befundZeile)));
}

/* ---------------- Ansicht ---------------- */

export async function render(container, ctx) {
  const heute = localDateKey();
  const anker = woche || heute;
  const montag = weekStart(anker);
  const sonntag = shiftDateKey(montag, 6);

  // Mahlzeiten der Woche und des Tages in einem Rutsch — der Bericht rechnet
  // sonst mit Lücken, die gar keine sind.
  const mealsWoche = await getMealsInRange(montag, sonntag);
  const mealsByDate = {};
  for (const m of mealsWoche) (mealsByDate[m.date] ||= []).push(m);

  const wocheAktiv = await getActivitiesInRange(montag, sonntag);

  const daten = {
    activities: wocheAktiv,
    profile: ctx.state.profile,
    plan: ctx.state.plan,
    sessions: ctx.state.sessions,
    weights: ctx.state.weights,
    mobility: ctx.state.mobility,
    skillLevels: ctx.state.skillLevels,
    kcalAdjust: ctx.state.kcalAdjust,
    goals: ctx.settings.goals,
  };

  const istLaufendeWoche = montag === weekStart(heute);
  const stichtag = istLaufendeWoche ? heute : sonntag;

  const head = viewHead('Bericht',
    `${tagKurz(montag)} bis ${tagKurz(sonntag)}`,
    iconButton('back', 'Zurück', () => { woche = null; ctx.go('today'); }));

  const body = [];

  if (!ctx.state.profile) {
    mount(container, head, el('div', { class: 'card' },
      emptyState('Noch kein Plan',
        'Der Bericht rechnet mit Trainingsplan und Kalorienzielen. Beides entsteht im Fragebogen.')));
    return;
  }

  /* Tagesbericht — nur für die laufende Woche sinnvoll. */
  if (istLaufendeWoche) {
    const tag = dailyReport({
      ...daten,
      meals: mealsByDate[heute] || [],
      activities: wocheAktiv.filter((a) => a.date === heute),
      dateKey: heute,
    });
    body.push(el('h2', { class: 'section-title', text: 'Heute' }));
    body.push(abschnitt(tag.titel, tag.befunde));
  }

  /* Wochenbericht */
  const w = weeklyReport({ ...daten, mealsByDate, dateKey: stichtag });

  body.push(el('h2', { class: 'section-title', text: w.vollstaendig ? 'Die Woche' : 'Die Woche bisher' }));

  if (!w.vollstaendig) {
    body.push(el('p', { class: 'hint' },
      'Die Woche läuft noch. Der vollständige Bericht steht am Sonntag — bis dahin '
      + 'zählen nur die Tage bis heute.'));
  }

  for (const a of w.abschnitte) body.push(el('div', { class: 'mt-16' }, abschnitt(a.titel, a.befunde)));

  body.push(el('div', { class: 'card stack mt-16' },
    el('h3', { class: 'card-title', text: 'Fazit' }),
    el('p', { class: 'small', text: w.fazit })));

  /* Blättern */
  body.push(el('div', { class: 'row mt-16' },
    el('button', {
      class: 'btn grow', type: 'button',
      onClick: () => { woche = shiftDateKey(montag, -7); ctx.reload(); },
    }, 'Woche davor'),
    istLaufendeWoche
      ? null
      : el('button', {
          class: 'btn grow', type: 'button',
          onClick: () => { woche = shiftDateKey(montag, 7); ctx.reload(); },
        }, 'Woche danach')));

  if (!istLaufendeWoche) {
    body.push(el('button', {
      class: 'btn btn-block mt-16', type: 'button',
      onClick: () => { woche = null; ctx.reload(); },
    }, 'Zurück zur laufenden Woche'));
  }

  mount(container, head, el('div', null, ...body));
}

/** Kurzfassung für die Tagesansicht: die zwei dringendsten Zeilen. */
export function reportTeaser(ctx, meals) {
  if (!ctx.state.profile) return null;

  const heute = localDateKey();
  const tag = dailyReport({
    activities: ctx.state.activities || [],
    profile: ctx.state.profile,
    plan: ctx.state.plan,
    sessions: ctx.state.sessions,
    weights: ctx.state.weights,
    meals: meals || [],
    kcalAdjust: ctx.state.kcalAdjust,
    goals: ctx.settings.goals,
    dateKey: heute,
  });

  // Was schiefläuft, zuerst — dafür ist der Bericht da.
  const sortiert = [
    ...tag.befunde.filter((b) => b.art === 'schlecht'),
    ...tag.befunde.filter((b) => b.art !== 'schlecht'),
  ].slice(0, 2);

  const sonntag = new Date(`${heute}T12:00:00`).getDay() === 0;

  return el('button', {
    class: 'card reportcard', type: 'button',
    onClick: () => { woche = null; ctx.go('report'); },
  },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: sonntag ? 'Wochenbericht' : 'Tagesbericht' }),
      sonntag ? el('span', { class: 'pill pill-kcal', text: 'Sonntag' }) : null),
    el('div', { class: 'befunde mt-16' }, ...sortiert.map(befundZeile)),
    el('p', { class: 'hint mt-16',
      text: sonntag
        ? 'Heute ist Sonntag — der ausführliche Wochenbericht steht bereit.'
        : 'Antippen für den ganzen Bericht samt Woche.' }));
}
