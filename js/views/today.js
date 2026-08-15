/**
 * Tagesansicht: Kalorienring gegen das Tagesziel, Makrobalken und die
 * Mahlzeiten des Tages, gruppiert nach Frühstück/Mittag/Abend/Snack.
 */

import { el, svg, mount, viewHead, iconButton, emptyState } from '../ui.js';
import { getMealsByDate } from '../store.js';
import {
  localDateKey, shiftDateKey, formatDateKey, formatTime,
  sumMeals, groupByMealType, MEAL_TYPE_LABEL,
} from '../nutrition.js';

/** Object-URLs der Thumbnails, damit sie beim nächsten Rendern freigegeben werden. */
let objectUrls = [];

function releaseObjectUrls() {
  for (const url of objectUrls) URL.revokeObjectURL(url);
  objectUrls = [];
}

const RING_RADIUS = 56;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Kalorienring plus Makrobalken. */
function progressCard(totals, goals, ctx) {
  const goalKcal = Math.max(1, goals.kcal);
  const ratio = totals.kcal / goalKcal;
  const over = totals.kcal > goals.kcal;
  const remaining = goals.kcal - totals.kcal;

  const ring = el(
    'div',
    { class: `ring${over ? ' over' : ''}` },
    svg(
      'svg',
      { viewBox: '0 0 128 128', 'aria-hidden': 'true' },
      svg('circle', {
        class: 'track', cx: 64, cy: 64, r: RING_RADIUS,
        fill: 'none', 'stroke-width': 11,
      }),
      svg('circle', {
        class: 'bar', cx: 64, cy: 64, r: RING_RADIUS,
        fill: 'none', 'stroke-width': 11, 'stroke-linecap': 'round',
        'stroke-dasharray': RING_CIRCUMFERENCE,
        // Bei Überschreitung bleibt der Ring voll statt sich erneut zu füllen.
        'stroke-dashoffset': RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, ratio))),
      })
    ),
    el(
      'div',
      { class: 'ring-label' },
      el('div', { class: 'ring-value', text: String(totals.kcal) }),
      el('div', { class: 'ring-unit', text: `von ${goals.kcal} kcal` })
    )
  );

  const macroBar = (cls, name, value, goal, unit = 'g') => {
    const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
    return el(
      'div',
      { class: `macro ${cls}` },
      el(
        'div',
        { class: 'macro-head' },
        el('span', { class: 'macro-name', text: name }),
        el('span', { class: 'macro-num tabular', text: `${Math.round(value)} / ${goal} ${unit}` })
      ),
      el('div', { class: 'macro-track' }, el('div', { class: 'macro-fill', style: { width: `${pct}%` } }))
    );
  };

  // Woher das Ziel kommt, gehört sichtbar dazu: an Trainingstagen ist es höher.
  const source = goals.kind === 'training'
    ? el('button', {
        class: 'daykind daykind-training', type: 'button',
        title: 'Zum Trainingsplan',
        onClick: () => ctx.go('training'),
      }, `Trainingstag · ${goals.dayName}`)
    : goals.kind === 'rest'
      ? el('button', {
          class: 'daykind', type: 'button', title: 'Zum Trainingsplan',
          onClick: () => ctx.go('training'),
        }, 'Ruhetag')
      : null;

  return el(
    'div',
    { class: 'card ring-card' },
    ring,
    el(
      'div',
      { class: 'ring-side' },
      source,
      el('p', {
        class: `ring-remaining${over ? ' over' : ''}`,
        text: over
          ? `${Math.abs(remaining)} kcal über dem Ziel`
          : `noch ${remaining} kcal übrig`,
      }),
      macroBar('macro-protein', 'Eiweiß', totals.protein, goals.protein),
      macroBar('macro-carbs', 'Kohlenhydrate', totals.carbs, goals.carbs),
      macroBar('macro-fat', 'Fett', totals.fat, goals.fat)
    )
  );
}

/** Eine Zeile in der Mahlzeitenliste. */
function mealRow(meal, ctx) {
  let thumb;
  if (meal.thumb instanceof Blob) {
    const url = URL.createObjectURL(meal.thumb);
    objectUrls.push(url);
    thumb = el('img', { class: 'meal-thumb', src: url, alt: '', loading: 'lazy' });
  } else {
    thumb = el('div', { class: 'meal-thumb', 'aria-hidden': 'true', text: '🍽️' });
  }

  const parts = [formatTime(meal.timestamp)];
  if (meal.items.length) {
    parts.push(meal.items.map((i) => i.name).join(', '));
  }

  return el(
    'button',
    {
      class: 'meal',
      type: 'button',
      onClick: () => ctx.openEditor({ mode: 'edit', meal, photoBlob: meal.photo, thumbBlob: meal.thumb }),
    },
    thumb,
    el(
      'div',
      { class: 'meal-body' },
      el('div', { class: 'meal-name', text: meal.name }),
      el('div', { class: 'meal-sub', text: parts.join(' · ') })
    ),
    el(
      'div',
      { class: 'meal-kcal tabular' },
      String(meal.totals.kcal),
      el('span', { text: 'kcal' })
    )
  );
}

export async function render(container, ctx, param) {
  releaseObjectUrls();

  const dateKey = param || ctx.state.date || localDateKey();
  ctx.state.date = dateKey;

  const today = localDateKey();
  const meals = await getMealsByDate(dateKey);
  const totals = sumMeals(meals);
  const goals = ctx.goalsFor(dateKey);
  const groups = groupByMealType(meals);

  const head = viewHead(
    formatDateKey(dateKey, today),
    meals.length
      ? `${meals.length} ${meals.length === 1 ? 'Eintrag' : 'Einträge'}`
      : 'noch nichts eingetragen',
    iconButton('prev', 'Vorheriger Tag', () => ctx.setDate(shiftDateKey(dateKey, -1))),
    iconButton('next', 'Nächster Tag', () => ctx.setDate(shiftDateKey(dateKey, 1)), {
      // Über den heutigen Tag hinaus gibt es nichts einzutragen.
      disabled: dateKey >= today,
    })
  );

  const body = [progressCard(totals, goals, ctx)];

  if (!meals.length) {
    body.push(
      el(
        'div',
        { class: 'card mt-16' },
        emptyState(
          'Noch keine Mahlzeit',
          'Tippe unten rechts auf die Kamera, um dein Essen zu fotografieren — oder trage es von Hand ein.'
        )
      )
    );
  } else {
    for (const group of groups) {
      body.push(
        el(
          'section',
          { class: 'meal-group' },
          el(
            'div',
            { class: 'meal-group-head' },
            el('h2', { text: MEAL_TYPE_LABEL[group.id] }),
            el('span', { class: 'kcal tabular', text: `${group.totals.kcal} kcal` })
          ),
          ...group.meals.map((m) => mealRow(m, ctx))
        )
      );
    }
  }

  body.push(
    el(
      'div',
      { class: 'mt-24 stack-sm' },
      el(
        'button',
        {
          class: 'btn btn-block',
          type: 'button',
          onClick: () => ctx.openEditor({ mode: 'manual', dateKey }),
        },
        'Von Hand eintragen'
      )
    )
  );

  mount(container, head, el('div', null, ...body));
}
