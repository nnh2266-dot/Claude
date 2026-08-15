/**
 * Trainingsansicht: die Einheit des Tages zum Mitschreiben, oder der Ruhetag
 * mit dem, was dann zählt. Darunter das Tagesgewicht — daraus lernt die App,
 * ob die Kalorien stimmen.
 */

import { el, mount, viewHead, emptyState, toast, iconButton } from '../ui.js';
import { localDateKey, formatDateKey, parseNumber, shiftDateKey } from '../nutrition.js';
import { getSession, saveSession, saveWeight, listWeights } from '../store.js';
import {
  exerciseById, GROUP_LABEL, blockWeek, forWeek, dayForWeekday, nextStep, BLOCK_WEEKS,
} from '../training.js';
import { energyPlan, weightTrend } from '../energy.js';

/** Letzte aufgezeichnete Leistung einer Übung vor einem Datum. */
function lastPerformance(sessions, exerciseId, beforeDate) {
  for (const session of [...sessions].sort((a, b) => (a.date < b.date ? -1 : 1)).reverse()) {
    if (session.date >= beforeDate) continue;
    const sets = (session.entries || {})[exerciseId];
    if (sets && sets.some((s) => s && s.reps)) return { date: session.date, sets };
  }
  return null;
}

function formatSets(sets) {
  return sets
    .filter((s) => s && s.reps)
    .map((s) => (Number(s.weight) > 0 ? `${String(s.weight).replace('.', ',')} kg × ${s.reps}` : `${s.reps} Wdh.`))
    .join('  ·  ');
}

/* ---------------- Übungsblock mit Satzeingabe ---------------- */

function exerciseBlock(prescription, week, session, sessions, dateKey, onChange) {
  const exercise = exerciseById(prescription.id);
  if (!exercise) return null;

  const adjusted = forWeek(prescription, week);
  const last = lastPerformance(sessions, prescription.id, dateKey);
  const entries = session.entries[prescription.id] || (session.entries[prescription.id] = []);

  const rows = [];
  for (let i = 0; i < adjusted.sets; i++) {
    const stored = entries[i] || {};

    // Bei Körpergewichtsübungen zählt die Wiederholung; das Zusatzgewicht darf leer bleiben.
    const isComplete = (set) => !!set.reps && (prescription.loadless || set.weight != null);

    const tick = el('div', { class: `settick${isComplete(stored) ? ' on' : ''}`, 'aria-hidden': 'true' }, '✓');

    const update = () => {
      entries[i] = {
        weight: weightInput.value.trim() === '' ? null : parseNumber(weightInput.value),
        reps: repsInput.value.trim() === '' ? null : Math.round(parseNumber(repsInput.value)),
      };
      tick.classList.toggle('on', isComplete(entries[i]));
      onChange();
    };

    const weightInput = el('input', {
      class: 'input setinput', type: 'text', inputmode: 'decimal',
      'aria-label': `Satz ${i + 1}, Gewicht`,
      placeholder: last && last.sets[i] && last.sets[i].weight ? String(last.sets[i].weight).replace('.', ',') : '–',
      value: stored.weight != null ? String(stored.weight).replace('.', ',') : '',
      onChange: update,
    });

    const repsInput = el('input', {
      class: 'input setinput', type: 'text', inputmode: 'numeric',
      'aria-label': `Satz ${i + 1}, Wiederholungen`,
      placeholder: String(prescription.reps[0]),
      value: stored.reps != null ? String(stored.reps) : '',
      onChange: update,
    });

    rows.push(el('div', { class: 'setrow' },
      el('span', { class: 'setnum tabular', text: String(i + 1) }),
      weightInput, repsInput, tick));
  }

  return el('div', { class: 'exblock' },
    el('div', { class: 'exblock-head' },
      el('span', { class: 'exblock-name', text: exercise.name }),
      el('span', { class: 'exblock-group', text: GROUP_LABEL[exercise.group] || exercise.group })),
    el('p', { class: 'exblock-rx tabular',
      text: `${adjusted.sets} Sätze · ${prescription.reps[0]}–${prescription.reps[1]} Wdh. · RIR ${adjusted.rir} · ${prescription.rest} s Pause` }),
    el('p', { class: 'exblock-last',
      text: last ? `Zuletzt ${formatDateKey(last.date)}: ${formatSets(last.sets)}` : 'Noch keine Werte aufgezeichnet.' }),
    el('div', { class: 'setlabels' },
      el('span'), el('span', { text: prescription.loadless ? 'Zusatz-kg' : 'kg' }),
      el('span', { text: 'Wdh.' }), el('span')),
    ...rows,
    el('p', { class: 'exblock-cue' },
      el('strong', { text: 'Nächster Schritt: ' }),
      nextStep(prescription, last ? last.sets : null, adjusted.rir),
      el('span', { class: 'exblock-hint', text: exercise.cue })));
}

/* ---------------- Gewichtskarte ---------------- */

function weightCard(weights, dateKey, ctx) {
  const existing = weights.find((w) => w.date === dateKey);
  const trend = weightTrend(weights, dateKey);

  const input = el('input', {
    class: 'input', type: 'text', inputmode: 'decimal',
    placeholder: trend ? String(trend.latest).replace('.', ',') : 'kg',
    value: existing ? String(existing.kg).replace('.', ',') : '',
  });

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('h2', { class: 'card-title', text: 'Gewicht heute' }),
      trend
        ? el('span', { class: 'muted small tabular',
            text: `⌀ 7 Tage: ${String(Math.round(trend.average7 * 10) / 10).replace('.', ',')} kg` })
        : null),
    el('div', { class: 'row' },
      el('div', { class: 'grow' }, input),
      el('button', {
        class: 'btn btn-primary', type: 'button',
        onClick: async () => {
          const kg = parseNumber(input.value);
          if (!kg || kg < 30 || kg > 300) { toast('Bitte ein Gewicht zwischen 30 und 300 kg eintragen.'); return; }
          await saveWeight(dateKey, kg);
          await ctx.refreshTraining();
          ctx.reload();
          toast('Gewicht gespeichert.');
        },
      }, 'Eintragen')),
    el('p', { class: 'hint',
      text: 'Am besten morgens nach dem Aufstehen. Nur der Sieben-Tage-Schnitt zählt — Tagesschwankungen sind Wasser, nicht Fett.' }));
}

/* ---------------- Ansicht ---------------- */

export async function render(container, ctx) {
  const dateKey = localDateKey();
  const { profile, plan, sessions, weights } = ctx.state;

  if (!profile || !plan) {
    mount(container,
      viewHead('Training', 'noch kein Plan'),
      el('div', { class: 'card' },
        emptyState('Noch kein Trainingsplan',
          'Sieben Fragen, dann steht dein Plan — und die Kalorienziele passen sich automatisch an Trainings- und Ruhetage an.'),
        el('button', {
          class: 'btn btn-primary btn-block btn-lg', type: 'button',
          onClick: () => ctx.startSetup(),
        }, 'Fragebogen starten')));
    return;
  }

  const week = blockWeek(plan, dateKey);
  const weekday = new Date(`${dateKey}T12:00:00`).getDay();
  const day = dayForWeekday(plan, weekday);
  const energy = energyPlan(profile, ctx.state.kcalAdjust);

  const head = viewHead(
    day ? day.name : 'Ruhetag',
    `${formatDateKey(dateKey)} · ${BLOCK_WEEKS[week].label}`,
    iconButton('star', 'Ganzer Plan', () => ctx.go('plan'))
  );

  const body = [];

  if (!day) {
    // Nächste Einheit suchen, damit der Ruhetag nicht im Leeren endet.
    let next = null;
    for (let i = 1; i <= 7 && !next; i++) {
      const key = shiftDateKey(dateKey, i);
      const candidate = dayForWeekday(plan, new Date(`${key}T12:00:00`).getDay());
      if (candidate) next = { day: candidate, key };
    }

    body.push(el('div', { class: 'card stack' },
      el('p', null, 'Heute ist Erholung — da passiert der Muskelaufbau.'),
      next ? el('p', { class: 'muted small',
        text: `Nächste Einheit: ${next.day.name}, ${formatDateKey(next.key)}.` }) : null,
      el('div', { class: 'note' },
        el('strong', { text: `${energy.rest.kcal} kcal statt ${energy.training.kcal}. ` }),
        `Ruhetage brauchen weniger Energie, weil die Einheit fehlt. Das Eiweiß bleibt mit ${energy.rest.protein} g gleich hoch — daran hängt der Muskelerhalt.`)));
  } else {
    const session = (await getSession(dateKey)) || {
      date: dateKey, dayName: day.name, template: day.template, entries: {}, done: false,
    };

    let pending = null;
    const persist = () => {
      // Beim Tippen nicht bei jedem Zeichen schreiben — kurz sammeln.
      clearTimeout(pending);
      pending = setTimeout(() => { saveSession(session).then(() => ctx.refreshTraining()); }, 400);
    };

    const blocks = day.exercises
      .map((p) => exerciseBlock(p, week, session, sessions, dateKey, persist))
      .filter(Boolean);

    body.push(el('div', { class: 'card card-flush' }, ...blocks));

    body.push(el('button', {
      class: 'btn btn-primary btn-block btn-lg mt-16', type: 'button',
      onClick: async () => {
        session.done = true;
        await saveSession(session);
        await ctx.refreshTraining();
        ctx.reload();
        toast('Stark. Einheit gespeichert.');
      },
    }, session.done ? 'Einheit gespeichert ✓' : 'Einheit abschließen'));

    body.push(el('div', { class: 'note mt-16' },
      el('strong', { text: `Heute ${energy.training.kcal} kcal. ` }),
      `An Trainingstagen liegen die Kohlenhydrate höher (${energy.training.carbs} g statt ${energy.rest.carbs} g) — sie befeuern die Einheit.`));
  }

  body.push(el('div', { class: 'mt-16' }, weightCard(weights, dateKey, ctx)));

  body.push(el('div', { class: 'row mt-16' },
    el('button', { class: 'btn grow', type: 'button', onClick: () => ctx.go('plan') }, 'Ganzer Plan'),
    el('button', { class: 'btn grow', type: 'button', onClick: () => ctx.go('progress') }, 'Fortschritt')));

  mount(container, head, el('div', null, ...body));
}
