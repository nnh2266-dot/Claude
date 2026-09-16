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
  isTimed, repRange, isUnilateral, ZYKLUS_WAHL, weeklyPlannedSets, VOLUMEN_UNTEN, VOLUMEN_OBEN,
  EXERCISES,
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
    const zeit = isTimed(prescription.id);
    const bereich = repRange(prescription);

    return el('div', { class: 'exrow' },
      el('div', { class: 'grow' },
        el('div', { class: 'exrow-name', text: exercise.name }),
        el('div', { class: 'exrow-tag',
          // „je Seite" gehört sichtbar dazu: Drei Sätze einbeinige Glute
          // Bridge sind sechs Durchgänge, und so lange dauern sie auch.
          text: `${GROUP_LABEL[exercise.group] || exercise.group} · ${exercise.type === 'c' ? 'Grundübung' : 'Isolation'}`
            + (isUnilateral(prescription.id) ? ' · je Seite' : '')
            + ` · ${restSeconds(prescription, tempo)} s Pause`
            + (ladderFor(prescription.id)
                ? ` · Stufe ${ladderFor(prescription.id).index + 1}/${ladderFor(prescription.id).leiter.stufen.length}`
                : '') })),
      el('div', { class: 'exrow-rx tabular' },
        el('strong', { text: `${adjusted.sets} × ${bereich[0]}–${bereich[1]}${zeit ? ' s' : ''}` }),
        // Bei einer Halteübung gibt es keine Wiederholungen im Tank, also
        // auch kein RIR. Dort steht, was sonst der Zähler wäre: Sekunden.
        el('span', { text: zeit ? 'halten' : `RIR ${adjusted.rir}` })));
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
  return el('div', { class: 'card' },
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

  const zyklus = plan.zyklus === 0 ? 0 : (Number(plan.zyklus) || 4);

  /** Den Rhythmus umstellen, ohne die Übungsauswahl anzufassen. */
  const setzeZyklus = async (wert) => {
    if (wert === zyklus) return;
    await setPlan({ ...plan, zyklus: wert });
    await ctx.refreshTraining();
    ctx.reload();
    toast(wert ? `Entlastungswoche alle ${wert} Wochen.` : 'Keine feste Entlastungswoche mehr.');
  };

  const zyklusWahl = el('div', { class: 'stack-tight' },
    el('div', { class: 'suppzeit', text: 'Entlastungswoche' }),
    el('div', { class: 'row' },
      ...ZYKLUS_WAHL.map((z) => el('button', {
        class: 'chip', type: 'button',
        'aria-pressed': z.wert === zyklus ? 'true' : 'false',
        onClick: () => setzeZyklus(z.wert),
      }, z.label))),
    el('p', { class: 'muted small',
      text: (ZYKLUS_WAHL.find((z) => z.wert === zyklus) || ZYKLUS_WAHL[0]).hint }));

  /**
   * Bei drei Tagen gibt es zwei sinnvolle Aufteilungen, und sie
   * unterscheiden sich in dem, was zählt: Ganzkörper verteilt das Volumen
   * einer Gruppe auf drei Einheiten, Push/Pull/Beine packt alles in eine.
   */
  const aufteilung = profile.days === 3
    ? el('div', { class: 'stack-tight' },
        el('div', { class: 'suppzeit', text: 'Aufteilung' }),
        el('div', { class: 'row' },
          ...[['3', 'Ganzkörper 3×'], ['3ppl', 'Push / Pull / Beine']].map(([k, label]) => el('button', {
            class: 'chip', type: 'button',
            'aria-pressed': String(plan.splitKey) === k ? 'true' : 'false',
            onClick: async () => {
              if (String(plan.splitKey) === k) return;
              const neuesProfil = { ...profile, splitKey: k };
              const next = buildPlan(neuesProfil, plan.seed || 0);
              next.createdAt = plan.createdAt;
              next.zyklus = plan.zyklus;
              await setTrainingProfile(neuesProfil);
              await setPlan(next);
              await ctx.refreshTraining();
              ctx.reload();
              toast(`Aufteilung: ${label}.`);
            },
          }, label))),
        el('p', { class: 'muted small',
          text: String(plan.splitKey) === '3ppl'
            ? 'Jede Gruppe einmal die Woche, dafür geballt: Auf dem Zugtag stehen 13 bis 16 Sätze '
              + 'für den Rücken. Ab etwa elf Sätzen in einer Einheit trägt ein weiterer kaum noch etwas bei.'
            : 'Jede Gruppe dreimal die Woche, jeweils in kleineren Portionen. Bei gleichem '
              + 'Wochenvolumen ist das die verlässlichere Variante.' }))
    : null;

  /**
   * Der Plan liegt gespeichert. Kommen Übungen dazu, merkt er davon nichts —
   * man macht weiter dieselben sieben, obwohl die App inzwischen mehr kennt.
   * Von allein umzubauen wäre falsch: Ein Plan, der sich unter der Hand
   * ändert, ist kein Plan. Also ein Hinweis mit einem Knopf.
   */
  const stand = Number(plan.uebungsstand) || null;
  const neueUebungen = EXERCISES.length - (stand || 0);
  const neuBauen = async () => {
    const next = buildPlan(profile, (plan.seed || 0) + 1);
    next.createdAt = plan.createdAt;
    next.zyklus = plan.zyklus;
    await setPlan(next);
    await ctx.refreshTraining();
    ctx.reload();
    toast('Plan mit den neuen Übungen gebaut.');
  };

  const nachschub = (stand === null || neueUebungen > 0)
    ? el('div', { class: 'card stack mt-16' },
        el('div', { class: 'row-between' },
          el('h3', { class: 'card-title', text: 'Neue Übungen verfügbar' }),
          el('span', { class: 'pill pill-kcal tabular',
            text: stand === null ? `${EXERCISES.length} Übungen` : `+${neueUebungen}` })),
        el('p', { class: 'small',
          text: stand === null
            ? `Dein Plan stammt aus einer früheren Fassung. Die App kennt inzwischen `
              + `${EXERCISES.length} Übungen — ob davon welche neu sind, kann der Plan nicht sagen.`
            : `Seit dem Bau deines Plans sind ${neueUebungen} ${neueUebungen === 1 ? 'Übung' : 'Übungen'} `
              + 'dazugekommen. Ein gespeicherter Plan holt sie sich nicht von allein.' }),
        el('button', {
          class: 'btn btn-block', type: 'button', onClick: neuBauen,
        }, 'Plan mit den neuen Übungen bauen'),
        el('p', { class: 'hint',
          text: 'Aufteilung, Blockwoche und dein Startdatum bleiben. Aussortierte und '
            + 'ausgewachsene Übungen bleiben es auch. Was du von Hand einzeln ausgetauscht '
            + 'hast, wird dabei neu gewürfelt.' }))
    : null;

  const summary = el('div', { class: 'card stack' },
    el('p', { class: 'small' },
      el('strong', { text: zyklus ? `${zyklus}-Wochen-Block. ` : 'Ohne festen Block. ' }),
      zyklus
        ? 'Woche 1 sammelt Werte mit mehr Reserve, die mittleren Wochen bauen auf, die vorletzte ist die schwere, '
          + 'die letzte ist Deload mit weniger Sätzen. '
        : 'Es läuft dauerhaft die Aufbauwoche. Eine Entlastung schlägt die App vor, wenn Schlaf und Einheiten dafür sprechen. '
      , 'RIR heißt: so viele Wiederholungen hättest du am Satzende noch geschafft — je kleiner, desto härter.'),
    aufteilung,
    zyklusWahl,
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

  /**
   * Wie viele Sätze je Muskelgruppe in einer normalen Woche zusammenkommen.
   *
   * Die Zahl, die in Trainingsplänen am meisten entscheidet und die man am
   * seltensten sieht — weil man sie über sieben Tage und mehrere Übungen
   * zusammenzählen müsste. Hier steht sie einfach da.
   */
  const volumen = weeklyPlannedSets(plan);
  const volumenKarte = el('div', { class: 'card stack mt-16' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Sätze je Woche' }),
      el('span', { class: 'muted small',
        text: `${plan.days.reduce((sum, d) => sum + (d.exercises || [])
          .reduce((n, p2) => n + forWeek(p2, week).sets, 0), 0)} Sätze gesamt` })),

    el('div', { class: 'card-flush' },
      ...volumen.map((v) => el('div', { class: 'calcrow' },
        el('div', { class: 'grow' },
          el('div', { text: GROUP_LABEL[v.gruppe] || v.gruppe }),
          el('div', { class: 'muted small',
            text: v.mit
              ? `${v.direkt} direkt + ${v.mit} als Helfer · an ${v.tage} ${v.tage === 1 ? 'Tag' : 'Tagen'}`
              : `an ${v.tage} ${v.tage === 1 ? 'Tag' : 'Tagen'}` })),
        el('span', { class: `pill supppill supp-${v.stufe === 'gut' ? 'gut' : v.stufe === 'viel' ? 'mittel' : 'duenn'}`,
          text: v.stufe === 'gut' ? 'im Bereich' : v.stufe === 'viel' ? 'darüber' : 'darunter' }),
        el('div', { class: 'tabular', text: String(v.gesamt) })))),

    el('p', { class: 'hint',
      text: `Als Bereich gelten ${VOLUMEN_UNTEN} bis ${VOLUMEN_OBEN} Sätze je Muskelgruppe und Woche. `
        + 'Darunter verschenkt man etwas, darüber wird der Zugewinn je zusätzlichem Satz so klein, '
        + 'dass er die Erholung selten wert ist — beides sind Mittelwerte, die Streuung zwischen '
        + 'Menschen ist groß.' }),
    el('p', { class: 'hint',
      text: 'Gezählt wird wie in den Übersichtsarbeiten: Sätze, bei denen ein Muskel mitarbeitet, '
        + 'ohne das Ziel zu sein, gehen halb ein. Der Trizeps bekommt beim Bankdrücken etwas ab, '
        + 'auch wenn „Brust" darübersteht. „Rücken" ist dabei keine Muskelgruppe, sondern mehrere — '
        + 'die Zahl dort liest sich höher, als sie für den einzelnen Muskel ist.' }));

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

  mount(container, head, summary, nachschub, volumenKarte, skillSection, ...days, leiterliste, sperrliste, nutrition, breakdown, reset);
}
