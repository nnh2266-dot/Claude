/**
 * Verlauf: Balkendiagramm der letzten Tage gegen das Kalorienziel,
 * Durchschnittswerte und eine antippbare Tagesliste.
 */

import { el, svg, mount, viewHead, emptyState } from '../ui.js';
import { getMealsInRange } from '../store.js';
import {
  localDateKey, lastNDays, formatDateKey, weekdayShort,
  sumMeals, averageTotals, formatGram,
} from '../nutrition.js';

/** Zeitraum bleibt über Ansichtswechsel hinweg erhalten. */
let rangeDays = 7;

const CHART_W = 320;
const BAR_AREA_H = 132;
const LABEL_H = 18;
const CHART_H = BAR_AREA_H + LABEL_H;

function chart(days, goalKcal) {
  const maxValue = Math.max(goalKcal, ...days.map((d) => d.totals.kcal), 1) * 1.12;
  const slot = CHART_W / days.length;
  const barWidth = Math.max(3, Math.min(26, slot * 0.62));
  const labelEvery = days.length <= 10 ? 1 : Math.ceil(days.length / 6);

  const goalY = BAR_AREA_H - (goalKcal / maxValue) * BAR_AREA_H;

  const parts = [];

  for (const [i, day] of days.entries()) {
    const x = slot * i + (slot - barWidth) / 2;
    const height = (day.totals.kcal / maxValue) * BAR_AREA_H;
    const over = day.totals.kcal > goalKcal;

    // Grauer Hintergrundbalken, damit auch leere Tage sichtbar sind.
    parts.push(
      svg('rect', {
        class: 'bar-bg', x, y: 0, width: barWidth, height: BAR_AREA_H, rx: Math.min(4, barWidth / 2),
      })
    );

    if (height > 0) {
      parts.push(
        svg('rect', {
          class: over ? 'bar-over' : 'bar-fill',
          x,
          y: BAR_AREA_H - height,
          width: barWidth,
          height,
          rx: Math.min(4, barWidth / 2),
        })
      );
    }

    if (i % labelEvery === 0) {
      parts.push(
        svg('text', {
          class: 'x-label',
          x: slot * i + slot / 2,
          y: BAR_AREA_H + 13,
        }, weekdayShort(day.key))
      );
    }
  }

  // Ziellinie zuletzt, damit sie über den Balken liegt.
  parts.push(svg('line', { class: 'goal-line', x1: 0, y1: goalY, x2: CHART_W, y2: goalY }));

  return svg(
    'svg',
    {
      class: 'chart',
      viewBox: `0 0 ${CHART_W} ${CHART_H}`,
      preserveAspectRatio: 'none',
      role: 'img',
      'aria-label': `Kalorien der letzten ${days.length} Tage im Vergleich zum Ziel von ${goalKcal} kcal`,
    },
    ...parts
  );
}

function statCard(value, label) {
  return el('div', { class: 'stat' }, el('b', { class: 'tabular', text: value }), el('span', { text: label }));
}

export async function render(container, ctx) {
  const today = localDateKey();
  const keys = lastNDays(rangeDays, today);
  const meals = await getMealsInRange(keys[0], today);
  const goals = ctx.settings.goals;

  const byDate = new Map(keys.map((k) => [k, []]));
  for (const meal of meals) {
    if (byDate.has(meal.date)) byDate.get(meal.date).push(meal);
  }

  const days = keys.map((key) => {
    const list = byDate.get(key) || [];
    return { key, meals: list, totals: sumMeals(list) };
  });

  // Für den Durchschnitt zählen nur Tage mit Einträgen — sonst zieht jeder
  // Tag ohne Nutzung den Schnitt künstlich nach unten.
  const trackedDays = days.filter((d) => d.meals.length > 0);
  const average = averageTotals(trackedDays.map((d) => d.totals));
  const onTarget = trackedDays.filter((d) => d.totals.kcal <= goals.kcal).length;

  const rangeSwitch = el(
    'div',
    { class: 'chips' },
    ...[7, 30].map((n) =>
      el('button', {
        class: 'chip',
        type: 'button',
        'aria-pressed': String(rangeDays === n),
        text: `${n} Tage`,
        onClick: () => {
          rangeDays = n;
          ctx.reload();
        },
      })
    )
  );

  const head = viewHead('Verlauf', `letzte ${rangeDays} Tage`);

  if (!trackedDays.length) {
    mount(
      container,
      head,
      el('div', null,
        rangeSwitch,
        el('div', { class: 'card mt-16' },
          emptyState(
            'Noch keine Daten',
            'Sobald du Mahlzeiten einträgst, siehst du hier deinen Verlauf und die Durchschnittswerte.'
          )
        )
      )
    );
    return;
  }

  const dayList = el(
    'div',
    { class: 'card' },
    ...[...days].reverse().map((day) =>
      el(
        'button',
        {
          class: 'day-row',
          type: 'button',
          onClick: () => ctx.setDate(day.key),
        },
        el('span', { class: 'd-name', text: formatDateKey(day.key, today) }),
        el('span', {
          class: 'small muted',
          text: day.meals.length
            ? `${day.meals.length} ${day.meals.length === 1 ? 'Eintrag' : 'Einträge'}`
            : '—',
        }),
        el('span', {
          class: `d-kcal tabular${day.totals.kcal > goals.kcal ? ' over' : ''}`,
          text: day.meals.length ? `${day.totals.kcal} kcal` : '',
        })
      )
    )
  );

  mount(
    container,
    head,
    el(
      'div',
      null,
      rangeSwitch,
      el('div', { class: 'card mt-16' }, chart(days, goals.kcal)),
      el('h2', { class: 'section-title', text: `Durchschnitt an ${trackedDays.length} erfassten Tagen` }),
      el(
        'div',
        { class: 'stat-grid' },
        statCard(`${average.kcal} kcal`, `Ziel: ${goals.kcal} kcal`),
        statCard(`${onTarget} von ${trackedDays.length}`, 'Tage im Ziel'),
        statCard(`${formatGram(average.protein)} g`, 'Eiweiß pro Tag'),
        statCard(`${formatGram(average.carbs)} g`, 'Kohlenhydrate pro Tag'),
        statCard(`${formatGram(average.fat)} g`, 'Fett pro Tag'),
        statCard(String(meals.length), 'Mahlzeiten insgesamt')
      ),
      el('h2', { class: 'section-title', text: 'Tage' }),
      dayList
    )
  );
}
