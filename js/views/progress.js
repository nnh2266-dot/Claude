/**
 * Fortschritt: Gewichtsverlauf, die Kalorienkorrektur, die sich daraus ergibt,
 * und was beim Training an Kraft dazugekommen ist.
 */

import { el, svg, mount, viewHead, iconButton, emptyState, toast } from '../ui.js';
import { localDateKey, formatDateKey, shiftDateKey } from '../nutrition.js';
import { setKcalAdjust } from '../store.js';
import { personalBests, weeklyVolume, GOAL_LABEL } from '../training.js';
import { calorieAdvice } from '../energy.js';
import { skillById, currentLevel, levelIndex, skillHistory } from '../skills.js';
import { mobilitySection } from './mobility.js';

const CHART_W = 320;
const CHART_H = 150;
const PAD = { left: 30, right: 6, top: 8, bottom: 16 };

const oneDecimal = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
const signed = (n) => (n > 0 ? '+' : '') + oneDecimal(n);

/**
 * Gewichtsverlauf: Tageswerte als Punkte, der Sieben-Tage-Schnitt als Linie.
 * Die Linie ist die Aussage — die Punkte zeigen nur, wie viel sie schwankt.
 */
function weightChart(weights, targetWeight) {
  const inner = { w: CHART_W - PAD.left - PAD.right, h: CHART_H - PAD.top - PAD.bottom };

  const averages = weights.map((entry, i) => {
    const from = shiftDateKey(entry.date, -6);
    const window = weights.filter((w) => w.date >= from && w.date <= entry.date);
    return window.reduce((sum, w) => sum + w.kg, 0) / window.length;
  });

  const values = weights.map((w) => w.kg);
  const candidates = targetWeight ? [...values, targetWeight] : values;
  let low = Math.min(...candidates);
  let high = Math.max(...candidates);
  const padding = Math.max((high - low) * 0.18, 0.6);
  low -= padding;
  high += padding;

  const x = (i) => PAD.left + (weights.length === 1 ? inner.w / 2 : (inner.w * i) / (weights.length - 1));
  const y = (v) => PAD.top + inner.h - (inner.h * (v - low)) / (high - low);

  const parts = [];

  for (let i = 0; i <= 2; i++) {
    const value = low + ((high - low) * i) / 2;
    parts.push(svg('line', { class: 'grid-line', x1: PAD.left, y1: y(value), x2: CHART_W - PAD.right, y2: y(value) }));
    parts.push(svg('text', { class: 'y-label', x: 0, y: y(value) + 3 }, oneDecimal(value)));
  }

  if (targetWeight && targetWeight >= low && targetWeight <= high) {
    parts.push(svg('line', {
      class: 'target-line', x1: PAD.left, y1: y(targetWeight), x2: CHART_W - PAD.right, y2: y(targetWeight),
    }));
  }

  const linePoints = averages.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  parts.push(svg('polygon', {
    class: 'trend-area',
    points: `${PAD.left},${PAD.top + inner.h} ${linePoints} ${x(averages.length - 1)},${PAD.top + inner.h}`,
  }));

  for (const [i, entry] of weights.entries()) {
    parts.push(svg('circle', { class: 'day-dot', cx: x(i), cy: y(entry.kg), r: 1.7 }));
  }

  parts.push(svg('polyline', { class: 'trend-line', points: linePoints }));

  const last = averages.length - 1;
  parts.push(svg('circle', { class: 'trend-end', cx: x(last), cy: y(averages[last]), r: 3.6 }));

  return svg('svg', {
    class: 'chart chart-weight',
    viewBox: `0 0 ${CHART_W} ${CHART_H}`,
    preserveAspectRatio: 'none',
    role: 'img',
    'aria-label': `Gewichtsverlauf über ${weights.length} Messungen, aktueller Sieben-Tage-Schnitt ${oneDecimal(averages[last])} Kilogramm`,
  }, ...parts);
}

/** Bewegte Last je Woche als Balken. */
function volumeChart(rows) {
  const max = Math.max(...rows.map((r) => r.volume)) * 1.12;
  const slot = CHART_W / rows.length;
  const width = Math.max(6, Math.min(30, slot * 0.55));
  const areaH = CHART_H - 18;

  const parts = [];
  for (const [i, row] of rows.entries()) {
    const height = (row.volume / max) * areaH;
    parts.push(svg('rect', {
      class: i === rows.length - 1 ? 'bar-fill' : 'bar-bg',
      x: slot * i + (slot - width) / 2, y: areaH - height,
      width, height, rx: 3,
    }));
    parts.push(svg('text', { class: 'x-label', x: slot * i + slot / 2, y: areaH + 13 },
      formatDateKey(row.week).replace(/^\w+, /, '')));
  }

  return svg('svg', {
    class: 'chart chart-volume',
    viewBox: `0 0 ${CHART_W} ${CHART_H}`,
    preserveAspectRatio: 'none',
    role: 'img',
    'aria-label': 'Bewegte Last je Trainingswoche',
  }, ...parts);
}

/* ---------------- Ansicht ---------------- */

export async function render(container, ctx) {
  const { profile, plan, sessions, weights } = ctx.state;

  if (!profile || !plan) {
    ctx.go('training');
    return;
  }

  const today = localDateKey();
  const advice = calorieAdvice(profile, weights, today);
  const done = sessions.filter((s) => s.done);

  const head = viewHead('Fortschritt',
    `${done.length} ${done.length === 1 ? 'Einheit' : 'Einheiten'} aufgezeichnet`,
    iconButton('back', 'Zurück zum Training', () => ctx.go('training')));

  const body = [];

  /* Gewicht */
  body.push(el('h2', { class: 'section-title', text: 'Gewicht' }));
  if (weights.length < 2) {
    body.push(el('div', { class: 'card' },
      emptyState('Noch zu wenig Werte',
        'Trag dein Gewicht ein paar Tage lang ein. Ab etwa einer Woche erkennt die App den Trend und rechnet die Kalorien nach.')));
  } else {
    body.push(el('div', { class: 'card' },
      weightChart(weights, profile.targetWeight),
      el('div', { class: 'row-between mt-16' },
        el('span', { class: 'muted small', text: '● Tageswerte    — Sieben-Tage-Schnitt' }),
        profile.targetWeight
          ? el('span', { class: 'muted small tabular', text: `Ziel ${oneDecimal(profile.targetWeight)} kg` })
          : null)));
  }

  /* Kalorien nachsteuern — die eigentliche Kopplung */
  body.push(el('h2', { class: 'section-title', text: 'Kalorien nachsteuern' }));

  if (!advice) {
    body.push(el('div', { class: 'card' },
      el('p', { class: 'small',
        text: 'Sobald in zwei aufeinanderfolgenden Wochen je mindestens zwei Gewichtswerte stehen, ' +
              'vergleicht die App deine tatsächliche Veränderung mit deinem Ziel und schlägt eine Korrektur vor.' })));
  } else {
    const { trend, wanted, deviation } = advice;
    const card = el('div', { class: 'card stack' },
      el('div', { class: 'row-between' },
        el('h3', { class: 'card-title', text: 'Gemessen gegen geplant' }),
        el('span', { class: `pill ${advice.onTrack ? 'pill-ok' : 'pill-kcal'}`,
          text: advice.onTrack ? 'Auf Kurs' : 'Anpassung sinnvoll' })),
      el('p', { class: 'small' },
        'Deine Veränderung: ',
        el('strong', { text: `${signed(trend.percent)} % Körpergewicht pro Woche` }),
        ` (${signed(trend.deltaKg)} kg). Zielkorridor für `,
        el('strong', { text: GOAL_LABEL[profile.goal] }),
        `: ${signed(wanted)} % pro Woche.`));

    if (advice.onTrack) {
      card.append(el('p', { class: 'note', text: 'Passt. Alles so lassen und weitermachen.' }));
    } else {
      card.append(
        el('p', { class: 'note' },
          'Empfehlung: das Tagesziel um ',
          el('strong', { text: `${advice.delta > 0 ? '+' : ''}${advice.delta} kcal` }),
          ' ändern. Danach wieder zwei Wochen beobachten, bevor du erneut korrigierst.'),
        el('button', {
          class: 'btn btn-primary btn-block', type: 'button',
          onClick: async () => {
            await setKcalAdjust((ctx.state.kcalAdjust || 0) + advice.delta);
            await ctx.refreshTraining();
            ctx.reload();
            toast('Kalorienziel angepasst.');
          },
        }, `Ziel um ${advice.delta > 0 ? '+' : ''}${advice.delta} kcal anpassen`));
    }

    if (ctx.state.kcalAdjust) {
      card.append(el('button', {
        class: 'btn btn-ghost btn-block', type: 'button',
        onClick: async () => {
          await setKcalAdjust(0);
          await ctx.refreshTraining();
          ctx.reload();
          toast('Anpassung zurückgesetzt.');
        },
      }, `Anpassung zurücksetzen (${ctx.state.kcalAdjust > 0 ? '+' : ''}${ctx.state.kcalAdjust} kcal)`));
    }

    body.push(card);
  }

  /* Fähigkeiten */
  const skillIds = profile.skills || [];
  if (skillIds.length) {
    body.push(el('h2', { class: 'section-title', text: 'Fähigkeiten' }));
    body.push(el('div', { class: 'card card-flush' },
      ...skillIds.map((id) => {
        const skill = skillById(id);
        if (!skill) return null;
        const index = levelIndex(skill, ctx.state.skillLevels);
        const level = currentLevel(skill, ctx.state.skillLevels);
        const unit = level.measure === 'sec' ? 's' : 'Wdh.';
        const history = skillHistory(sessions, id);
        const best = history.length ? Math.max(...history.map((h) => h.best)) : 0;

        return el('div', { class: 'skillrow' },
          el('div', { class: 'row-between' },
            el('span', { class: 'exblock-name', text: skill.name }),
            el('span', { class: 'muted small tabular', text: `Stufe ${index + 1} / ${skill.levels.length}` })),
          el('div', { class: 'ladder' },
            ...skill.levels.map((_, i) =>
              el('span', { class: `rung${i < index ? ' done' : i === index ? ' on' : ''}` }))),
          el('p', { class: 'muted small', text: level.name }),
          el('p', { class: 'small tabular',
            text: best
              ? `Bester Satz bisher: ${best} ${unit} — Ziel dieser Stufe: ${level.target} ${unit}`
              : `Noch nichts aufgezeichnet. Ziel dieser Stufe: ${level.target} ${unit}` }));
      }).filter(Boolean)));
  }

  /* Beweglichkeit */
  body.push(el('h2', { class: 'section-title', text: 'Beweglichkeit' }));
  body.push(mobilitySection(ctx));

  /* Kraft */
  body.push(el('h2', { class: 'section-title', text: 'Kraftentwicklung' }));
  const bests = personalBests(sessions).slice(0, 10);

  if (!bests.length) {
    body.push(el('div', { class: 'card' },
      emptyState('Noch keine Sätze',
        'Trag die Sätze im Reiter „Training" direkt beim Üben ein — dann steht hier, was dazugekommen ist.')));
  } else {
    body.push(el('div', { class: 'card card-flush' },
      ...bests.map((best) => {
        const gain = best.bodyweight ? best.reps - best.firstReps : best.weight - best.firstWeight;
        return el('div', { class: 'calcrow' },
          el('div', { class: 'grow' },
            el('div', { text: best.name }),
            el('div', { class: 'muted small',
              text: `bester Satz ${formatDateKey(best.date)} · Start ${best.bodyweight ? `${best.firstReps} Wdh.` : `${oneDecimal(best.firstWeight)} kg`}` })),
          gain > 0 ? el('span', { class: 'pill pill-ok tabular', text: `${signed(gain)}${best.bodyweight ? ' Wdh.' : ' kg'}` }) : null,
          el('div', { class: 'tabular',
            text: best.bodyweight ? `${best.reps} Wdh.` : `${oneDecimal(best.weight)} kg × ${best.reps}` }));
      })));
  }

  /* Volumen */
  const volume = weeklyVolume(sessions, profile.weight);
  if (volume.length >= 2) {
    body.push(el('h2', { class: 'section-title', text: 'Volumen pro Woche' }));
    body.push(el('div', { class: 'card' },
      volumeChart(volume),
      el('p', { class: 'hint mt-16',
        text: 'Bewegte Last je Woche, also Gewicht mal Wiederholungen. Körpergewichtsübungen zählen mit dem halben Körpergewicht.' })));
  }

  mount(container, head, el('div', null, ...body));
}
