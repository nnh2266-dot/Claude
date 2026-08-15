/**
 * Trainingsansicht: die Einheit des Tages zum Mitschreiben, oder der Ruhetag
 * mit dem, was dann zählt. Darunter das Tagesgewicht — daraus lernt die App,
 * ob die Kalorien stimmen.
 */

import { el, mount, viewHead, emptyState, toast, iconButton } from '../ui.js';
import { localDateKey, formatDateKey, parseNumber, shiftDateKey } from '../nutrition.js';
import {
  getSession, saveSession, saveWeight, setSkillLevel, setPlan, setTrainingProfile,
} from '../store.js';
import {
  exerciseById, GROUP_LABEL, blockWeek, forWeek, dayForWeekday, nextStep, BLOCK_WEEKS,
  replaceExercise,
} from '../training.js';
import { energyPlan, weightTrend } from '../energy.js';
import {
  skillById, currentLevel, levelIndex, setsNeeded, levelCleared, hasNextLevel, MEASURE,
} from '../skills.js';

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

/* ---------------- Stoppuhr für Haltezeiten ----------------
   Kopfüber lässt sich kein Bildschirm ablesen und keine zweite App bedienen.
   Deshalb: ein großer Knopf zum Starten und Stoppen, ein Signal beim Erreichen
   der Zielzeit — und der Wert landet direkt im richtigen Satz.
------------------------------------------------------------ */

/**
 * Laufende Uhren, damit sie beim Neuzeichnen der Ansicht angehalten werden.
 * Sonst tickt eine vergessene Uhr in einem längst ersetzten Block weiter.
 */
const laufendeUhren = new Set();

function stoppeAlleUhren() {
  for (const abbrechen of laufendeUhren) abbrechen();
  laufendeUhren.clear();
}

/** Kurzer Ton. Läuft nur nach einer Nutzergeste, deshalb erst beim Start erzeugt. */
function beep(context, dauer = 0.18, frequenz = 880) {
  try {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.frequency.value = frequenz;
    osc.type = 'sine';
    // Sanft ein- und ausblenden, sonst knackt es.
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, context.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + dauer);
    osc.connect(gain).connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + dauer);
  } catch { /* Ton ist Zugabe. */ }
}

function mmss(sekunden) {
  const m = Math.floor(sekunden / 60);
  const s = sekunden % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * @param {object} o
 * @param {number} o.target     Zielzeit in Sekunden
 * @param {number} o.sets       Anzahl Sätze
 * @param {Function} o.nextEmpty  Liefert den Index des nächsten leeren Satzes
 * @param {Function} o.write    (index, sekunden) => void
 */
function holdTimer({ target, sets, nextEmpty, write }) {
  let startedAt = null;
  let ticker = null;
  let zielGemeldet = false;
  let audio = null;
  let wakeLock = null;
  let index = null;

  const clock = el('div', { class: 'timer-clock tabular', text: '00:00' });
  const hint = el('div', { class: 'timer-hint' });
  const button = el('button', { class: 'btn btn-primary btn-lg timer-btn', type: 'button' });

  const setHint = () => {
    const frei = nextEmpty();
    hint.textContent = frei === null
      ? 'Alle Sätze eingetragen — Feld leeren, um neu zu messen.'
      : `Satz ${frei + 1} von ${sets} · Ziel ${target} s`;
    button.disabled = frei === null;
    button.textContent = 'Start';
  };

  const signal = () => {
    // Beides bestenfalls verfügbar: Vibration kennt iOS nicht, Ton kann
    // stummgeschaltet sein. Zusammen erwischt man die meisten Fälle.
    try { navigator.vibrate?.([160, 90, 160]); } catch { /* egal */ }
    if (audio) { beep(audio); setTimeout(() => beep(audio), 260); }
  };

  /** Bricht ohne Eintrag ab — für den Fall, dass die Ansicht neu gezeichnet wird. */
  const abbrechen = () => {
    if (ticker) clearInterval(ticker);
    ticker = null;
    startedAt = null;
    try { wakeLock?.release(); } catch { /* egal */ }
    wakeLock = null;
  };

  const stop = () => {
    if (startedAt === null) return;
    laufendeUhren.delete(abbrechen);
    const sekunden = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    clearInterval(ticker);
    ticker = null;
    startedAt = null;

    try { wakeLock?.release(); } catch { /* egal */ }
    wakeLock = null;

    if (audio) beep(audio, 0.12, 520);
    if (index !== null) write(index, sekunden);

    clock.classList.remove('reached');
    clock.textContent = mmss(sekunden);
    setHint();
  };

  const start = () => {
    index = nextEmpty();
    if (index === null) return;

    zielGemeldet = false;
    startedAt = Date.now();
    clock.textContent = '00:00';
    clock.classList.remove('reached');
    button.textContent = 'Stopp';
    hint.textContent = `Läuft — Satz ${index + 1}. Beim Runterkommen wieder tippen.`;

    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      audio.resume?.();
    } catch { audio = null; }

    // Bildschirm wach halten, solange gemessen wird.
    navigator.wakeLock?.request('screen').then((lock) => { wakeLock = lock; }).catch(() => {});

    laufendeUhren.add(abbrechen);
    ticker = setInterval(() => {
      const sekunden = Math.round((Date.now() - startedAt) / 1000);
      clock.textContent = mmss(sekunden);
      if (!zielGemeldet && sekunden >= target) {
        zielGemeldet = true;
        clock.classList.add('reached');
        signal();
      }
    }, 200);
  };

  button.addEventListener('click', () => (startedAt === null ? start() : stop()));
  setHint();

  return { node: el('div', { class: 'timer' }, clock, button, hint), refresh: setHint };
}

/* ---------------- Technikblock ----------------
   Fähigkeiten stehen vor dem Krafttraining: Technik braucht frische Schultern
   und einen wachen Kopf, nach dem Krafttraining wäre beides weg.
------------------------------------------------ */

function skillBlock(skillId, session, ctx, onChange) {
  const skill = skillById(skillId);
  if (!skill) return null;

  const index = levelIndex(skill, ctx.state.skillLevels);
  const level = currentLevel(skill, ctx.state.skillLevels);
  const unit = level.measure === 'sec' ? 's' : 'Wdh.';
  const values = session.skills[skillId] || (session.skills[skillId] = []);

  const block = el('div', { class: 'exblock' });
  const status = el('div');

  const paint = () => {
    status.replaceChildren();
    if (!levelCleared(level, values)) return;

    if (!hasNextLevel(skill, ctx.state.skillLevels)) {
      status.append(el('p', { class: 'note',
        text: 'Oberste Stufe geschafft. Ab hier gilt: halten und sauberer machen.' }));
      return;
    }

    const next = skill.levels[index + 1];
    status.append(
      el('p', { class: 'note' },
        el('strong', { text: 'Stufe geschafft. ' }),
        `Als Nächstes: ${next.name}, ${next.target} ${unitFor(next)} in ${next.sets} Sätzen.`),
      el('button', {
        class: 'btn btn-primary btn-block', type: 'button',
        onClick: async () => {
          await setSkillLevel(skill.id, index + 1);
          await ctx.refreshTraining();
          ctx.reload();
          toast(`${skill.name}: Stufe ${index + 2} freigeschaltet.`);
        },
      }, 'Nächste Stufe freischalten')
    );
  };

  const rows = [];
  const inputs = [];
  const ticks = [];

  for (let i = 0; i < level.sets; i++) {
    const input = el('input', {
      class: 'input setinput', type: 'text', inputmode: 'numeric',
      'aria-label': `${skill.name}, Satz ${i + 1}`,
      placeholder: String(level.target),
    });
    input.value = values[i] != null ? String(values[i]) : '';

    const tick = el('button', {
      class: `settick${Number(values[i]) >= level.target ? ' on' : ''}`,
      type: 'button',
      'aria-label': `Satz ${i + 1} als geschafft markieren`,
    }, '✓');

    // Tippen trägt die Zielvorgabe ein, nochmal tippen leert den Satz.
    tick.addEventListener('click', () => {
      input.value = values[i] != null ? '' : String(level.target);
      input.dispatchEvent(new Event('change'));
    });

    input.addEventListener('change', () => {
      values[i] = input.value.trim() === '' ? null : Math.round(parseNumber(input.value));
      tick.classList.toggle('on', Number(values[i]) >= level.target);
      paint();
      timer?.refresh();
      onChange();
    });

    inputs.push(input);
    ticks.push(tick);
    rows.push(el('div', { class: 'setrow setrow-skill' },
      el('span', { class: 'setnum tabular', text: String(i + 1) }),
      input,
      tick));
  }

  /** Schreibt eine gestoppte Zeit in einen Satz — als käme sie aus dem Feld. */
  const writeSeconds = (index, seconds) => {
    values[index] = seconds;
    inputs[index].value = String(seconds);
    ticks[index].classList.toggle('on', seconds >= level.target);
    paint();
    onChange();
  };

  /** Erster noch leerer Satz, oder null wenn alle stehen. */
  const nextEmpty = () => {
    for (let i = 0; i < level.sets; i++) if (values[i] == null) return i;
    return null;
  };

  // Gemessen wird nur, wo es Sekunden sind. Wiederholungen zählt man selbst.
  const timer = level.measure === 'sec'
    ? holdTimer({ target: level.target, sets: level.sets, nextEmpty, write: (i, sek) => writeSeconds(i, sek) })
    : null;

  /** Stufe von Hand verschieben — die App kann nicht wissen, was schon sitzt. */
  const stufeWechseln = async (delta) => {
    const ziel = Math.min(Math.max(index + delta, 0), skill.levels.length - 1);
    if (ziel === index) return;
    await setSkillLevel(skill.id, ziel);
    await ctx.refreshTraining();
    ctx.reload();
    toast(`${skill.name}: Stufe ${ziel + 1} von ${skill.levels.length}.`);
  };

  block.append(
    el('div', { class: 'exblock-head' },
      el('span', { class: 'exblock-name', text: skill.name }),
      el('span', { class: 'exblock-group', text: `Stufe ${index + 1} von ${skill.levels.length}` })),
    el('div', { class: 'ladder', 'aria-hidden': 'true' },
      ...skill.levels.map((_, i) =>
        el('span', { class: `rung${i < index ? ' done' : i === index ? ' on' : ''}` }))),
    el('p', { class: 'exblock-rx', text: level.name }),
    el('p', { class: 'exblock-last tabular',
      text: `${level.sets} Sätze · Ziel ${level.target} ${unit} je Satz · weiter, wenn ${setsNeeded(level)} Sätze das Ziel treffen` }),
    timer ? timer.node : null,
    el('div', { class: 'setlabels setlabels-skill' },
      el('span'), el('span', { text: MEASURE[level.measure] }), el('span')),
    ...rows,
    status,
    el('p', { class: 'exblock-cue' },
      el('strong', { text: 'Ausführung: ' }), level.cue,
      el('span', { class: 'exblock-hint', text: skill.warmup })),
    el('div', { class: 'stufenwahl' },
      el('button', {
        class: 'btn btn-ghost btn-sm', type: 'button',
        disabled: index === 0,
        onClick: () => stufeWechseln(-1),
      }, '← Zu schwer'),
      el('button', {
        class: 'btn btn-ghost btn-sm', type: 'button',
        disabled: index >= skill.levels.length - 1,
        onClick: () => stufeWechseln(1),
      }, 'Zu leicht →'))
  );

  paint();
  return block;
}

function unitFor(level) {
  return level.measure === 'sec' ? 's' : 'Wdh.';
}

/* ---------------- Übungsblock mit Satzeingabe ---------------- */

function exerciseBlock(prescription, week, session, sessions, dateKey, onChange, tauschen) {
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

    // Der Haken sieht aus wie ein Kästchen — also muss er sich auch wie eines
    // verhalten. Tippen übernimmt die Vorschläge aus den Platzhaltern: das
    // Gewicht vom letzten Mal und die untere Wiederholungszahl. Nochmal tippen
    // leert den Satz wieder.
    const tick = el('button', {
      class: `settick${isComplete(stored) ? ' on' : ''}`,
      type: 'button',
      'aria-label': `Satz ${i + 1} als geschafft markieren`,
    }, '✓');

    const update = () => {
      entries[i] = {
        weight: weightInput.value.trim() === '' ? null : parseNumber(weightInput.value),
        reps: repsInput.value.trim() === '' ? null : Math.round(parseNumber(repsInput.value)),
      };
      tick.classList.toggle('on', isComplete(entries[i]));
      onChange();
    };

    tick.addEventListener('click', () => {
      if (isComplete(entries[i] || {})) {
        weightInput.value = '';
        repsInput.value = '';
        update();
        return;
      }

      // Leere Felder mit dem füllen, was ohnehin als Vorschlag dort steht.
      if (!repsInput.value.trim()) repsInput.value = repsInput.placeholder;
      if (!weightInput.value.trim()) {
        const vorschlag = parseNumber(weightInput.placeholder);
        if (vorschlag > 0) weightInput.value = String(vorschlag).replace('.', ',');
      }
      update();

      // Beim ersten Mal gibt es noch kein Gewicht vom letzten Mal. Dann bleibt
      // der Satz offen — also gleich ins fehlende Feld springen, statt den
      // Nutzer raten zu lassen, warum der Haken nicht angeht.
      if (!isComplete(entries[i] || {}) && !weightInput.value.trim()) {
        weightInput.focus();
        weightInput.select?.();
      }
    });

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
      el('span', { class: 'exblock-hint', text: exercise.cue })),
    el('div', { class: 'stufenwahl' },
      el('button', {
        class: 'btn btn-ghost btn-sm', type: 'button', onClick: tauschen,
      }, 'Zu schwer — andere Übung')));
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
  stoppeAlleUhren();
  const dateKey = localDateKey();
  const { profile, plan, sessions, weights } = ctx.state;

  if (!profile || !plan) {
    mount(container,
      viewHead('Training', 'noch kein Plan'),
      el('div', { class: 'card' },
        emptyState('Noch kein Trainingsplan',
          'Acht Fragen, dann steht dein Plan — die Kalorienziele passen sich an Trainings- und '
          + 'Ruhetage an, und auf Wunsch übst du Fähigkeiten wie Handstand oder L-Sit mit.'),
        el('button', {
          class: 'btn btn-primary btn-block btn-lg', type: 'button',
          onClick: () => ctx.startSetup(),
        }, 'Fragebogen starten')));
    return;
  }

  // Profile von vor der Gerätefrage haben kein `gear`. Ihr gespeicherter Plan
  // kann Klimmzüge oder Dips enthalten, obwohl weder Stange noch Barren da ist —
  // deshalb einmal nachfragen, statt den Plan hinter dem Rücken umzuschreiben.
  const gearUnbeantwortet = profile.gear === undefined && profile.equipment !== 'studio';

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

  if (gearUnbeantwortet) {
    body.push(el('div', { class: 'card stack' },
      el('div', { class: 'row-between' },
        el('h2', { class: 'card-title', text: 'Kurze Rückfrage' }),
        el('span', { class: 'pill pill-kcal', text: 'neu' })),
      el('p', { class: 'small' },
        'Bisher hat die App Klimmzüge und Dips eingeplant, sobald du „ohne Gewichte" '
        + 'gewählt hast — dabei brauchen die eine Stange beziehungsweise einen Barren. '
        + 'Sie fragt das jetzt getrennt ab.'),
      el('button', {
        class: 'btn btn-primary btn-block', type: 'button',
        onClick: () => ctx.startSetup(profile),
      }, 'Gerät nachtragen und Plan neu bauen')));
  }

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
      (profile.skills || []).length
        ? el('p', { class: 'muted small',
            text: 'Technik darf auch heute — locker und ohne bis ans Limit zu gehen. ' +
                  'Aufgezeichnet wird sie nur an Trainingstagen.' })
        : null,
      el('div', { class: 'note' },
        el('strong', { text: `${energy.rest.kcal} kcal statt ${energy.training.kcal}. ` }),
        `Ruhetage brauchen weniger Energie, weil die Einheit fehlt. Das Eiweiß bleibt mit ${energy.rest.protein} g gleich hoch — daran hängt der Muskelerhalt.`)));
  } else {
    const session = (await getSession(dateKey)) || {
      date: dateKey, dayName: day.name, template: day.template, entries: {}, skills: {}, done: false,
    };
    if (!session.skills) session.skills = {};   // Einheiten von vor den Fähigkeiten

    let pending = null;
    const persist = () => {
      // Beim Tippen nicht bei jedem Zeichen schreiben — kurz sammeln.
      clearTimeout(pending);
      pending = setTimeout(() => { saveSession(session).then(() => ctx.refreshTraining()); }, 400);
    };

    // Technik zuerst, danach die Kraftübungen.
    const skillBlocks = (profile.skills || [])
      .map((id) => skillBlock(id, session, ctx, persist))
      .filter(Boolean);

    if (skillBlocks.length) {
      body.push(el('h2', { class: 'section-title', text: 'Technik zuerst' }));
      body.push(el('div', { class: 'card card-flush' }, ...skillBlocks));
      body.push(el('h2', { class: 'section-title', text: 'Krafttraining' }));
    }

    const dayIndex = plan.days.indexOf(day);

    /**
     * Übung austauschen. Die abgelehnte wird gemerkt, damit sie auch bei einem
     * späteren Neubau des Plans nicht zurückkommt.
     */
    const tauschen = async (exerciseIndex) => {
      const alteId = day.exercises[exerciseIndex].id;
      const { plan: neuerPlan, ersatz } = replaceExercise(plan, profile, dayIndex, exerciseIndex);

      if (!ersatz) {
        toast('Dafür gibt es mit deiner Ausrüstung keinen Ersatz mehr.');
        return;
      }

      const blocked = [...new Set([...(profile.blocked || []), alteId])];
      await setTrainingProfile({ ...profile, blocked });
      await setPlan(neuerPlan);

      // Aufgezeichnete Sätze der alten Übung gehören nicht zur neuen.
      if (session.entries[alteId]) {
        delete session.entries[alteId];
        await saveSession(session);
      }

      await ctx.refreshTraining();
      ctx.reload();
      toast(`Getauscht: ${exerciseById(ersatz.id).name}.`);
    };

    const blocks = day.exercises
      .map((p, i) => exerciseBlock(p, week, session, sessions, dateKey, persist, () => tauschen(i)))
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
