/**
 * Der Wochenplan in voller Länge, dazu die Kalorienziele, die daraus folgen —
 * getrennt nach Trainings- und Ruhetagen, mit der Rechnung dahinter.
 */

import { el, mount, viewHead, iconButton, toast, confirmAction } from '../ui.js';
import { localDateKey } from '../nutrition.js';
import { setPlan, clearTraining, setTrainingProfile } from '../store.js';
import {
  exerciseById, GROUP_LABEL, EQUIPMENT_LABEL, GOAL_LABEL, LEVEL_LABEL,
  blockWeek, forWeek, buildPlan, BLOCK_WEEKS, restSeconds, sessionMinutes,
} from '../training.js';
import { ladderFor } from '../ladders.js';
import { energyPlan, energyBreakdown, ACTIVITY_LABEL } from '../energy.js';
import { skillById, currentLevel, levelIndex, MINUTES_PER_SKILL } from '../skills.js';

const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function dayCard(day, week, equipment, tempo) {
  const rows = day.exercises.map((prescription) => {
    const exercise = exerciseById(prescription.id);
    if (!exercise) return null;
    const adjusted = forWeek(prescription, week);

    return el('div', { class: 'exrow' },
      el('div', { class: 'grow' },
        el('div', { class: 'exrow-name', text: exercise.name }),
        el('div', { class: 'exrow-tag',
          text: `${GROUP_LABEL[exercise.group] || exercise.group} · ${exercise.type === 'c' ? 'Grundübung' : 'Isolation'} · ${restSeconds(prescription, tempo)} s Pause`
            + (ladderFor(prescription.id)
                ? ` · Stufe ${ladderFor(prescription.id).index + 1}/${ladderFor(prescription.id).leiter.stufen.length}`
                : '') })),
      el('div', { class: 'exrow-rx tabular' },
        el('strong', { text: `${adjusted.sets} × ${prescription.reps[0]}–${prescription.reps[1]}` }),
        el('span', { text: `RIR ${adjusted.rir}` })));
  }).filter(Boolean);

  const totalSets = day.exercises.reduce((sum, p) => sum + forWeek(p, week).sets, 0);

  return el('div', { class: 'card card-flush mt-16' },
    el('div', { class: 'dayhead' },
      el('span', { class: 'dayhead-wd', text: day.weekday != null ? WEEKDAY_SHORT[day.weekday] : '–' }),
      el('span', { class: 'dayhead-name grow', text: day.name }),
      el('span', { class: 'muted small tabular',
        text: `${totalSets} Sätze · rund ${sessionMinutes(day.exercises, tempo)} Min` })),
    ...rows,
    day.short
      ? el('p', { class: 'note note-inset' },
          `Kürzer als geplant: mit ${EQUIPMENT_LABEL[equipment]} und deinen Einschränkungen bleiben ` +
          'für diesen Tag nicht mehr passende Übungen übrig. Mach dafür einen Satz mehr pro Übung — ' +
          'oder ergänze die Ausrüstung unter „Angaben ändern".')
      : null);
}

function targetCard(title, macros, tone) {
  return el('div', { class: 'card targetcard' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: title }),
      el('span', { class: `pill pill-${tone} tabular`, text: `${macros.kcal} kcal` })),
    el('dl', { class: 'macrolist tabular' },
      el('div', null, el('dt', { text: 'Eiweiß' }), el('dd', { text: `${macros.protein} g` })),
      el('div', null, el('dt', { text: 'Kohlenhydrate' }), el('dd', { text: `${macros.carbs} g` })),
      el('div', null, el('dt', { text: 'Fett' }), el('dd', { text: `${macros.fat} g` }))));
}

export async function render(container, ctx) {
  const { profile, plan } = ctx.state;

  if (!profile || !plan) {
    ctx.go('training');
    return;
  }

  const week = blockWeek(plan, localDateKey());
  const energy = energyPlan(profile, ctx.state.kcalAdjust);

  const head = viewHead(plan.splitName,
    `${profile.days}× pro Woche · ${profile.sessionLength} Minuten · ${BLOCK_WEEKS[week].label}`,
    iconButton('back', 'Zurück zum Training', () => ctx.go('training')));

  const summary = el('div', { class: 'card stack' },
    el('p', { class: 'small' },
      el('strong', { text: 'Vier-Wochen-Block. ' }),
      'Woche 1 sammelt Werte mit mehr Reserve, Woche 2 und 3 werden schwerer, Woche 4 ist Deload mit weniger Sätzen. ' +
      'RIR heißt: so viele Wiederholungen hättest du am Satzende noch geschafft — je kleiner, desto härter.'),
    el('p', { class: 'muted small',
      text: `${GOAL_LABEL[profile.goal]} · ${LEVEL_LABEL[profile.level]} · ${EQUIPMENT_LABEL[profile.equipment]} · Alltag ${ACTIVITY_LABEL[profile.activity].toLowerCase()}` }),
    el('div', { class: 'row' },
      el('button', {
        class: 'btn grow', type: 'button',
        onClick: async () => {
          // Gleicher Split, gleiche Blockwoche — nur andere Übungen.
          const next = buildPlan(profile, (plan.seed || 0) + 1);
          next.createdAt = plan.createdAt;
          await setPlan(next);
          await ctx.refreshTraining();
          ctx.reload();
          toast('Neue Übungsauswahl.');
        },
      }, 'Andere Übungen'),
      el('button', {
        class: 'btn grow', type: 'button',
        onClick: () => ctx.startSetup(profile),
      }, 'Angaben ändern')));

  const tempo = ctx.settings.pausen || 'normal';
  const days = plan.days.map((day) => dayCard(day, week, profile.equipment, tempo));

  // Fähigkeiten stehen über den Tagen: sie laufen an jedem Trainingstag,
  // nicht an einem bestimmten.
  const skillIds = profile.skills || [];
  const skillSection = skillIds.length
    ? el('div', null,
        el('h2', { class: 'section-title', text: 'Technik an jedem Trainingstag' }),
        el('div', { class: 'card card-flush' },
          ...skillIds.map((id) => {
            const skill = skillById(id);
            if (!skill) return null;
            const index = levelIndex(skill, ctx.state.skillLevels);
            const level = currentLevel(skill, ctx.state.skillLevels);
            const unit = level.measure === 'sec' ? 's' : 'Wdh.';
            return el('div', { class: 'exrow' },
              el('div', { class: 'grow' },
                el('div', { class: 'exrow-name', text: skill.name }),
                el('div', { class: 'exrow-tag',
                  text: `Stufe ${index + 1} von ${skill.levels.length} · ${level.name}` })),
              el('div', { class: 'exrow-rx tabular' },
                el('strong', { text: `${level.sets} × ${level.target} ${unit}` }),
                el('span', { text: 'vor dem Krafttraining' })));
          }).filter(Boolean)),
        el('p', { class: 'note mt-16',
          text: `Zusammen rund ${skillIds.length * MINUTES_PER_SKILL} Minuten je Einheit. `
            + 'Diese Zeit ist vom Krafttraining abgezogen, damit die Einheit so lang bleibt wie angesagt.' }))
    : null;

  const nutrition = el('div', null,
    el('h2', { class: 'section-title', text: 'Kalorien zum Plan' }),
    el('div', { class: 'targetgrid' },
      targetCard('Trainingstag', energy.training, 'kcal'),
      targetCard('Ruhetag', energy.rest, 'muted')),
    el('p', { class: 'note mt-16' },
      'An Trainingstagen liegen die Kohlenhydrate höher — sie befeuern die Einheit. ' +
      `Über die Woche kommt trotzdem genau die Summe raus, die dein Ziel braucht: ${energy.target} kcal im Schnitt.`));

  const breakdown = el('div', null,
    el('h2', { class: 'section-title', text: 'Wie die Zahlen entstehen' }),
    el('div', { class: 'card card-flush' },
      ...energyBreakdown(profile, ctx.state.kcalAdjust).map(([label, value, note]) =>
        el('div', { class: 'calcrow' },
          el('div', { class: 'grow' },
            el('div', { text: label }),
            el('div', { class: 'muted small', text: note })),
          el('div', { class: 'tabular', text: value })))));

  const gesperrt = profile.blocked || [];
  const sperrliste = gesperrt.length
    ? el('div', null,
        el('h2', { class: 'section-title', text: 'Aussortierte Übungen' }),
        el('div', { class: 'card stack' },
          el('p', { class: 'small muted',
            text: 'Im Training als zu schwer gemeldet. Sie kommen auch bei einem neuen '
              + 'Plan nicht zurück.' }),
          ...gesperrt.map((id) => {
            const e = exerciseById(id);
            return el('div', { class: 'row-between' },
              el('span', { text: e ? e.name : id }),
              el('button', {
                class: 'btn btn-sm', type: 'button',
                onClick: async () => {
                  await setTrainingProfile({
                    ...profile, blocked: gesperrt.filter((x) => x !== id),
                  });
                  await ctx.refreshTraining();
                  ctx.reload();
                  toast('Wieder freigegeben — beim nächsten Planbau ist sie dabei.');
                },
              }, 'Wieder zulassen'));
          })))
    : null;

  const erledigt = profile.outgrown || [];
  const leiterliste = erledigt.length
    ? el('div', null,
        el('h2', { class: 'section-title', text: 'Ausgewachsene Übungen' }),
        el('div', { class: 'card stack' },
          el('p', { class: 'small muted',
            text: 'Zu leicht geworden — du bist auf der Variantenleiter darüber '
              + 'hinaus. Anders als aussortierte Übungen sind sie nicht ungeeignet, '
              + 'nur erledigt.' }),
          ...erledigt.map((id) => {
            const e = exerciseById(id);
            const stand = ladderFor(id);
            return el('div', { class: 'row-between' },
              el('div', { class: 'grow' },
                el('div', { text: e ? e.name : id }),
                stand
                  ? el('div', { class: 'muted small',
                      text: `${stand.leiter.name} · Stufe ${stand.index + 1} von ${stand.leiter.stufen.length}` })
                  : null),
              el('button', {
                class: 'btn btn-sm', type: 'button',
                onClick: async () => {
                  await setTrainingProfile({
                    ...profile, outgrown: erledigt.filter((x) => x !== id),
                  });
                  await ctx.refreshTraining();
                  ctx.reload();
                  toast('Wieder im Vorrat.');
                },
              }, 'Zurückholen'));
          })))
    : null;

  const reset = el('div', { class: 'mt-24' },
    el('button', {
      class: 'btn btn-danger btn-block', type: 'button',
      onClick: async () => {
        if (!confirmAction('Trainingsplan, Einheiten, Gewichtsverlauf, Beweglichkeitstests und Fortschrittsfotos löschen? Die Mahlzeiten bleiben erhalten.')) return;
        await clearTraining();
        await ctx.refreshTraining();
        ctx.go('training');
        toast('Trainingsdaten gelöscht.');
      },
    }, 'Training zurücksetzen'));

  mount(container, head, summary, skillSection, ...days, leiterliste, sperrliste, nutrition, breakdown, reset);
}
