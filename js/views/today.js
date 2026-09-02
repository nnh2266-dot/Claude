/**
 * Tagesansicht: Kalorienring gegen das Tagesziel, Makrobalken und die
 * Mahlzeiten des Tages, gruppiert nach Frühstück/Mittag/Abend/Snack.
 */

import { el, svg, mount, viewHead, iconButton, emptyState } from '../ui.js';
import { getMealsByDate } from '../store.js';
import { reportTeaser } from './report.js';
import { startFromPending } from './capture.js';
import { activitySection } from './activity.js';
import { dayTotals } from '../activities.js';
import { sleepSection } from './sleep.js';
import { energyPlan } from '../energy.js';
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
  const wasser = ctx.state.profile
    ? String(energyPlan(ctx.state.profile, ctx.state.kcalAdjust).water).replace('.', ',')
    : null;
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
      macroBar('macro-fat', 'Fett', totals.fat, goals.fat),
      // Der Wasserrichtwert wurde längst gerechnet und stand nur im Rechenweg
      // des Plans, wo niemand hinsieht.
      wasser
        ? el('p', { class: 'ring-wasser',
            text: `Wasser: rund ${wasser} l${goals.kind === 'training' ? ', an Trainingstagen eher mehr' : ''}` })
        : null
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

/**
 * Karte für Fotos, die ohne Verbindung aufgehoben wurden.
 *
 * Ausgewertet wird eines nach dem anderen über den normalen Editor — dann
 * gelten dieselben Korrekturmöglichkeiten wie bei einem frischen Foto, statt
 * dass ein Stapel ungeprüft in den Tag rutscht.
 */
function wartendeFotos(ctx) {
  const warten = ctx.state.pending || [];
  if (!warten.length) return null;

  const offline = navigator.onLine === false;
  const ohneKey = !ctx.settings.apiKey;
  const naechstes = warten[0];

  const grund = offline
    ? 'Noch keine Verbindung.'
    : ohneKey
      ? 'Ohne API-Key geht die Auswertung nur über die Claude-App — den Weg findest du im Editor.'
      : null;

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title',
        text: warten.length === 1 ? 'Ein Foto wartet' : `${warten.length} Fotos warten` }),
      el('span', { class: 'pill pill-kcal', text: 'offen' })),
    el('div', { class: 'fotostreifen' },
      ...warten.slice(0, 5).map((w) => el('img', {
        class: 'fotomini', alt: '',
        src: URL.createObjectURL(w.thumb || w.blob),
      }))),
    el('p', { class: 'hint',
      text: 'Aufgehoben ohne Verbindung. Bis zur Auswertung zählen sie nirgends mit — '
        + 'weder in der Tagessumme noch im Bericht.' }),
    grund ? el('p', { class: 'hint', text: grund }) : null,
    el('button', {
      class: 'btn btn-primary btn-block', type: 'button', disabled: offline,
      onClick: () => startFromPending(naechstes, ctx),
    }, warten.length === 1 ? 'Jetzt auswerten' : `Nächstes auswerten (${warten.length} offen)`));
}

export async function render(container, ctx, param) {
  releaseObjectUrls();

  const dateKey = param || ctx.state.date || localDateKey();
  ctx.state.date = dateKey;

  const today = localDateKey();
  const meals = await getMealsByDate(dateKey);
  const totals = sumMeals(meals);

  // Sport hebt das Tagesziel — die Aktivitäten müssen also vor den Zielen da sein.
  const activities = await ctx.refreshActivities(dateKey);
  const aktiv = dayTotals(activities, ctx.state.profile?.weight);
  const goals = ctx.goalsFor(dateKey, aktiv.anrechnung);
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

  // Schlaf vor Sport: morgens ist das die erste Eingabe des Tages.
  body.push(el('div', { class: 'mt-16' }, sleepSection(ctx, dateKey, ctx.state.sleep)));
  body.push(el('div', { class: 'mt-16' }, activitySection(ctx, dateKey, activities)));

  // Wartende Fotos zuerst: solange sie liegen, stimmt keine Zahl darunter.
  const warteschlange = wartendeFotos(ctx);
  if (warteschlange) body.push(el('div', { class: 'mt-16' }, warteschlange));

  // Der Bericht gehört nach oben, nicht ans Ende: er sagt, was heute noch
  // fehlt, und das nützt am Morgen mehr als am Abend.
  if (dateKey === today) {
    const bericht = reportTeaser(ctx, meals);
    if (bericht) body.push(el('div', { class: 'mt-16' }, bericht));
  }

  if (!meals.length) {
    body.push(
      el(
        'div',
        { class: 'card mt-16' },
        emptyState(
          'Noch keine Mahlzeit',
          'Tippe unten rechts auf die Kamera, um dein Essen zu fotografieren — oder beschreib '
          + 'es mit Worten, das geht auch ohne Foto.'
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
          onClick: () => ctx.openEditor({ mode: 'text', dateKey }),
        },
        'Mit Worten beschreiben'
      ),
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
