/**
 * Der Fragebogen. Sieben Schritte, aus denen Trainingsplan und Kalorienziele
 * entstehen. Wird auch zum Ändern der Angaben wieder aufgerufen — dann sind
 * die Felder vorbelegt.
 */

import { el, mount, viewHead, field, toast } from '../ui.js';
import { parseNumber, localDateKey } from '../nutrition.js';
import { setTrainingProfile, setPlan, saveWeight, listWeights } from '../store.js';
import { buildPlan, EQUIPMENT_LABEL, LIMIT_LABEL, FOCUS_LABEL, LEVEL_LABEL } from '../training.js';
import { SKILLS, MINUTES_PER_SKILL } from '../skills.js';

/** Zwischenstand des Fragebogens. Überlebt den Wechsel zwischen den Schritten. */
let draft = null;
let step = 0;

/** Startet den Fragebogen — leer oder mit den Werten eines bestehenden Profils. */
export function begin(profile) {
  draft = profile
    ? {
        ...profile,
        weekdays: [...(profile.weekdays || [])],
        limits: [...(profile.limits || [])],
        focus: [...(profile.focus || [])],
        skills: [...(profile.skills || [])],
      }
    : { weekdays: [], limits: [], focus: [], skills: [], sessionLength: 60 };
  step = 0;
}

const WEEKDAYS = [[1, 'Mo'], [2, 'Di'], [3, 'Mi'], [4, 'Do'], [5, 'Fr'], [6, 'Sa'], [0, 'So']];

/* ---------------- Bausteine ---------------- */

function numberField(label, key, hint, attrs = {}) {
  const input = el('input', {
    class: 'input', type: 'text', inputmode: 'decimal',
    value: draft[key] != null ? String(draft[key]).replace('.', ',') : '',
    onInput: (e) => { draft[key] = e.target.value.trim() === '' ? null : parseNumber(e.target.value); },
    ...attrs,
  });
  return field(label, input, hint);
}

/** Auswahlkarte mit Erklärtext — für Entscheidungen, die man nur einmal trifft. */
function optionCards(key, options) {
  const list = el('div', { class: 'optcards' });

  for (const [value, title, description] of options) {
    const card = el(
      'button',
      {
        class: 'optcard', type: 'button',
        'aria-pressed': draft[key] === value ? 'true' : 'false',
        onClick: () => {
          draft[key] = value;
          for (const other of list.children) other.setAttribute('aria-pressed', 'false');
          card.setAttribute('aria-pressed', 'true');
        },
      },
      el('span', { class: 'optcard-title', text: title }),
      description ? el('span', { class: 'optcard-desc', text: description }) : null
    );
    list.append(card);
  }
  return list;
}

/** Chips zum An- und Abwählen. `multi` erlaubt mehrere gleichzeitig. */
function chipGroup(key, options, { multi = false, max = null, asNumber = false } = {}) {
  const group = el('div', { class: 'chips' });

  const selected = () => (multi ? draft[key] || [] : [draft[key]]);
  const isOn = (value) => selected().some((v) => String(v) === String(value));

  for (const [value, label] of options) {
    const chip = el(
      'button',
      {
        class: 'chip', type: 'button',
        'aria-pressed': isOn(value) ? 'true' : 'false',
        onClick: () => {
          const parsed = asNumber ? Number(value) : value;
          if (!multi) {
            draft[key] = parsed;
            for (const other of group.children) other.setAttribute('aria-pressed', 'false');
            chip.setAttribute('aria-pressed', 'true');
            return;
          }
          const current = draft[key] || [];
          const has = current.some((v) => String(v) === String(value));
          if (has) {
            draft[key] = current.filter((v) => String(v) !== String(value));
          } else {
            if (max && current.length >= max) {
              toast(`Höchstens ${max} auswählen.`);
              return;
            }
            draft[key] = [...current, parsed];
          }
          chip.setAttribute('aria-pressed', has ? 'false' : 'true');
        },
      },
      label
    );
    group.append(chip);
  }
  return group;
}

/* ---------------- Die sieben Schritte ---------------- */

const STEPS = [
  {
    title: 'Deine Basisdaten',
    note: 'Grundlage für den Kalorienbedarf',
    build: () => [
      field('Geschlecht', chipGroup('sex', [['m', 'Männlich'], ['w', 'Weiblich']]),
        'Beeinflusst den Grundumsatz um gut 160 kcal.'),
      el('div', { class: 'grid-3' },
        numberField('Alter', 'age', 'Jahre'),
        numberField('Größe', 'height', 'cm'),
        numberField('Gewicht', 'weight', 'kg')),
      numberField('Körperfett', 'bodyfat',
        'In Prozent, falls du es kennst — dann wird der Grundumsatz genauer. Sonst leer lassen.'),
    ],
    check: () => {
      if (!draft.sex) return 'Bitte das Geschlecht wählen.';
      if (!draft.age || draft.age < 14 || draft.age > 90) return 'Bitte ein Alter zwischen 14 und 90 eintragen.';
      if (!draft.height || draft.height < 130 || draft.height > 230) return 'Bitte die Größe in cm eintragen.';
      if (!draft.weight || draft.weight < 35 || draft.weight > 250) return 'Bitte das Gewicht in kg eintragen.';
      if (draft.bodyfat != null && (draft.bodyfat < 3 || draft.bodyfat > 60)) return 'Körperfett zwischen 3 und 60 % — oder leer lassen.';
      return null;
    },
  },
  {
    title: 'Dein Ziel',
    note: 'Bestimmt Kalorien und Wiederholungen',
    build: () => [
      optionCards('goal', [
        ['abnehmen', 'Fett verlieren', 'Kaloriendefizit bei hohem Eiweiß. Die Muskeln bleiben, der Umfang geht runter.'],
        ['form', 'Form verbessern', 'Etwa Erhaltung. Langsam Muskeln auf- und Fett abbauen.'],
        ['aufbau', 'Muskeln aufbauen', 'Leichter Überschuss, schwerere Grundübungen mit weniger Wiederholungen.'],
      ]),
      numberField('Wunschgewicht', 'targetWeight', 'kg — nur zur Orientierung im Verlauf. Optional.'),
    ],
    check: () => (draft.goal ? null : 'Bitte ein Ziel wählen.'),
  },
  {
    title: 'Erfahrung',
    note: 'Bestimmt Sätze und Intensität',
    build: () => [
      optionCards('level', [
        ['anfaenger', LEVEL_LABEL.anfaenger, 'Unter sechs Monaten regelmäßig. Weniger Sätze, mehr Reserve im Tank.'],
        ['fortgeschritten', LEVEL_LABEL.fortgeschritten, 'Sechs Monate bis zwei Jahre. Die Standarddosis.'],
        ['erfahren', LEVEL_LABEL.erfahren, 'Über zwei Jahre. Mehr Sätze, näher ans Limit.'],
      ]),
    ],
    check: () => (draft.level ? null : 'Bitte deine Erfahrung wählen.'),
  },
  {
    title: 'Deine Zeit',
    note: 'Bestimmt den Split',
    build: () => [
      field('An welchen Tagen kannst du trainieren?',
        chipGroup('weekdays', WEEKDAYS.map(([v, l]) => [v, l]), { multi: true, asNumber: true }),
        'Mindestens ein Ruhetag muss bleiben.'),
      field('Wie lange pro Einheit?',
        chipGroup('sessionLength', [[30, '30 Min'], [45, '45 Min'], [60, '60 Min'], [90, '90 Min']], { asNumber: true }),
        'Daraus ergibt sich, wie viele Übungen pro Tag Platz haben.'),
    ],
    check: () => {
      const days = draft.weekdays || [];
      if (!days.length) return 'Bitte mindestens einen Trainingstag wählen.';
      if (days.length > 6) return 'Höchstens sechs Trainingstage — ein Ruhetag muss sein.';
      if (!draft.sessionLength) return 'Bitte die Zeit pro Einheit wählen.';
      return null;
    },
  },
  {
    title: 'Ausrüstung',
    note: 'Bestimmt die Übungsauswahl',
    build: () => [
      optionCards('equipment', [
        ['studio', EQUIPMENT_LABEL.studio, 'Langhantel, Maschinen, Kabelzug — die volle Auswahl.'],
        ['home', EQUIPMENT_LABEL.home, 'Kurzhanteln, Bank, Körpergewicht.'],
        ['band', EQUIPMENT_LABEL.band, 'Bänder plus Körpergewicht.'],
        ['bw', EQUIPMENT_LABEL.bw, 'Ohne Geräte, überall machbar.'],
      ]),
    ],
    check: () => (draft.equipment ? null : 'Bitte deine Ausrüstung wählen.'),
  },
  {
    title: 'Alltag und Beschwerden',
    note: 'Feinschliff',
    build: () => [
      optionCards('activity', [
        ['sitzend', 'Sitzend', 'Büro, wenig Bewegung, unter 5 000 Schritte.'],
        ['leicht', 'Leicht aktiv', 'Etwas Bewegung, 5 000 bis 8 000 Schritte.'],
        ['mittel', 'Aktiv', 'Viel auf den Beinen, 8 000 bis 12 000 Schritte.'],
        ['hoch', 'Sehr aktiv', 'Körperliche Arbeit, über 12 000 Schritte.'],
      ]),
      field('Worauf soll ich Rücksicht nehmen?',
        chipGroup('limits', Object.entries(LIMIT_LABEL), { multi: true }),
        'Passende Übungen werden dann gar nicht erst eingeplant. Bei akuten Schmerzen bitte vorher ärztlich abklären.'),
    ],
    check: () => (draft.activity ? null : 'Bitte deinen Alltag einschätzen.'),
  },
  {
    title: 'Schwerpunkte',
    note: 'Optional',
    build: () => [
      field('Was soll besonders wachsen?',
        chipGroup('focus', Object.entries(FOCUS_LABEL), { multi: true, max: 2 }),
        'Für jeden Schwerpunkt kommt an den passenden Tagen eine Übung dazu. Bis zu zwei.'),
    ],
    check: () => null,
  },
  {
    title: 'Fähigkeiten',
    note: 'Optional',
    build: () => [
      el('p', { class: 'small muted' },
        'Kunststücke wie Handstand oder L-Sit lernt man nicht über Gewicht, sondern über ' +
        'Vorstufen: eine Haltung wird sauber und lange genug gehalten, dann kommt die nächste. ' +
        'Geübt wird am Anfang der Einheit, solange Kopf und Schultern frisch sind.'),
      skillPicker(),
      el('p', { class: 'hint' },
        `Bis zu zwei. Jede kostet rund ${MINUTES_PER_SKILL} Minuten pro Einheit — die Zeit ` +
        'wird vom Krafttraining abgezogen, damit die Einheit nicht heimlich länger wird.'),
    ],
    check: () => null,
  },
];

/** Auswahlkarten für die Fähigkeiten, mit Stufenzahl und nötigem Gerät. */
function skillPicker() {
  const list = el('div', { class: 'optcards' });

  for (const skill of SKILLS) {
    const chosen = () => (draft.skills || []).includes(skill.id);
    const card = el(
      'button',
      {
        class: 'optcard', type: 'button',
        'aria-pressed': chosen() ? 'true' : 'false',
        onClick: () => {
          const current = draft.skills || [];
          if (chosen()) {
            draft.skills = current.filter((id) => id !== skill.id);
          } else {
            if (current.length >= 2) { toast('Höchstens zwei Fähigkeiten auf einmal.'); return; }
            draft.skills = [...current, skill.id];
          }
          card.setAttribute('aria-pressed', chosen() ? 'true' : 'false');
        },
      },
      el('span', { class: 'optcard-title', text: skill.name }),
      el('span', { class: 'optcard-desc', text: skill.blurb }),
      el('span', { class: 'optcard-meta' },
        `${skill.levels.length} Stufen · braucht ${skill.needs}`)
    );
    list.append(card);
  }
  return list;
}

/* ---------------- Ansicht ---------------- */

export async function render(container, ctx) {
  if (!draft) begin(ctx.state.profile);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const dots = el('div', { class: 'stepdots' },
    ...STEPS.map((_, i) =>
      el('span', { class: `stepdot${i === step ? ' on' : i < step ? ' done' : ''}` })));

  const head = viewHead(current.title, `Frage ${step + 1} von ${STEPS.length} · ${current.note}`);

  const actions = el('div', { class: 'row mt-24' },
    step > 0
      ? el('button', { class: 'btn grow', type: 'button', onClick: () => { step--; ctx.reload(); } }, 'Zurück')
      : el('button', { class: 'btn grow', type: 'button', onClick: () => ctx.go(ctx.state.plan ? 'plan' : 'today') }, 'Abbrechen'),
    el('button', {
      class: 'btn btn-primary grow', type: 'button',
      onClick: async () => {
        const problem = current.check();
        if (problem) { toast(problem); return; }
        if (!isLast) { step++; ctx.reload(); return; }
        await finish(ctx);
      },
    }, isLast ? 'Plan erstellen' : 'Weiter')
  );

  const intro = step === 0
    ? el('div', { class: 'card' },
        el('p', { class: 'small', html:
          'Aus deinen Antworten entstehen zwei Dinge auf einmal: der Trainingsplan und die ' +
          'Kalorienziele dazu. An Trainingstagen darfst du mehr essen, an Ruhetagen weniger — ' +
          'über die Woche kommt genau das raus, was dein Ziel braucht.' }))
    : null;

  mount(container, head, dots, intro,
    el('div', { class: 'card stack mt-16' }, ...current.build()), actions);
}

async function finish(ctx) {
  const profile = {
    sex: draft.sex,
    age: draft.age,
    height: draft.height,
    weight: draft.weight,
    bodyfat: draft.bodyfat || null,
    goal: draft.goal,
    targetWeight: draft.targetWeight || null,
    level: draft.level,
    // Reihenfolge der Trainingstage ab Montag, damit Tag A auf den ersten fällt.
    weekdays: [...(draft.weekdays || [])].map(Number).sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)),
    days: (draft.weekdays || []).length,
    sessionLength: Number(draft.sessionLength) || 60,
    equipment: draft.equipment,
    activity: draft.activity,
    limits: draft.limits || [],
    focus: (draft.focus || []).slice(0, 2),
    skills: (draft.skills || []).slice(0, 2),
  };

  const plan = buildPlan(profile, 0);

  await setTrainingProfile(profile);
  await setPlan(plan);

  // Ohne Startwert kann der Verlauf später nichts vergleichen.
  const weights = await listWeights();
  if (!weights.length) await saveWeight(localDateKey(), profile.weight);

  await ctx.refreshTraining();
  draft = null;
  step = 0;
  ctx.go('plan');
  toast(`Plan erstellt: ${plan.splitName}`);
}
