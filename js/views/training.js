/**
 * Trainingsansicht: die Einheit des Tages zum Mitschreiben, oder der Ruhetag
 * mit dem, was dann zählt. Darunter das Tagesgewicht — daraus lernt die App,
 * ob die Kalorien stimmen.
 */

import { el, mount, viewHead, emptyState, toast, iconButton } from '../ui.js';
import { localDateKey, formatDateKey, parseNumber, shiftDateKey } from '../nutrition.js';
import {
  getSession, saveSession, saveWeight, setSkillLevel, setPlan, setTrainingProfile,
  setSetting,
} from '../store.js';
import {
  exerciseById, GROUP_LABEL, blockWeek, forWeek, dayForWeekday, nextStep, BLOCK_WEEKS,
  travelDay, restSeconds, sessionMinutes, REST_TEMPO,
  replaceExercise, setExercise, missedDays, SKIP_REASONS, deloadHinweis,
  isUnilateral,
} from '../training.js';
import {
  ladderFor, harderRung, easierRung, pickNearestRung, topOutStreak, STREAK_FOR_NEXT,
} from '../ladders.js';
import { energyPlan, weightTrend } from '../energy.js';
import { activityById } from '../activities.js';
import { warmupFor, warmupMinutes } from '../warmup.js';
import { hasResults, dueAgain, daysSince, RETEST_DAYS } from '../mobility.js';
import {
  duration as schlafDauer, formatDauer as schlafDauerText, isComplete as nachtVoll, SOLL_MIN,
} from '../sleep.js';
import {
  skillById, currentLevel, levelIndex, setsNeeded, levelCleared, hasNextLevel, MEASURE,
} from '../skills.js';

const WOCHENTAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/**
 * Eine Einheit bewusst ausfallen lassen, mit Grund.
 *
 * Der Grund ist kein Schmuck. Ohne ihn steht im Wochenbericht nur „ausgefallen",
 * und das liest sich gleich, ob man verreist war oder es vergessen hat. Nach
 * einer durchwachten Nacht ist Nichttrainieren die richtige Entscheidung — die
 * App soll dafür nicht schimpfen.
 */
function ausfallenKarte(ctx, session, day, dateKey) {
  if (session.done) return null;

  if (session.skipped) {
    const grund = SKIP_REASONS[session.reason];
    return el('div', { class: 'card stack' },
      el('div', { class: 'row-between' },
        el('h3', { class: 'card-title', text: 'Heute ausgelassen' }),
        el('span', { class: 'pill', text: grund ? grund.label : 'ohne Grund' })),
      el('p', { class: 'hint',
        text: 'Steht so im Wochenbericht — als Entscheidung, nicht als Versäumnis. '
          + 'Nachholen kannst du die Einheit an einem der nächsten Ruhetage.' }),
      el('button', {
        class: 'btn btn-block', type: 'button',
        onClick: async () => {
          delete session.skipped;
          delete session.reason;
          await saveSession(session);
          await ctx.refreshTraining();
          ctx.reload();
          toast('Doch nicht ausgelassen.');
        },
      }, 'Doch trainieren'));
  }

  const auswahl = el('div', { class: 'chips' },
    ...Object.entries(SKIP_REASONS).map(([wert, r]) => el('button', {
      class: 'chip', type: 'button',
      onClick: async () => {
        Object.assign(session, {
          skipped: true, reason: wert, done: false,
          dayName: day.name, template: day.template,
        });
        await saveSession(session);
        await ctx.refreshTraining();
        ctx.reload();
        toast('Eingetragen. Kein Drama.');
      },
    }, r.label)));

  return el('details', { class: 'card klappkarte ausfallwahl' },
    el('summary', null,
      el('span', { class: 'grow', text: 'Heute geht nichts?' }),
      el('span', { class: 'muted small', text: 'ausfallen lassen' })),
    el('div', { class: 'stack mt-16' },
      el('p', { class: 'small' },
        'Besser eine Einheit bewusst auslassen als eine halbe absolvieren. Nach zu '
        + 'wenig Schlaf ist die Kraft ohnehin weg, und das Risiko steigt.'),
      auswahl,
      el('p', { class: 'hint',
        text: 'Der Grund steht später im Bericht. Nachholen geht danach an einem Ruhetag.' })));
}

/**
 * Ausgefallene Einheiten der letzten Tage, zum Nachholen an einem Ruhetag.
 *
 * Nur an Ruhetagen: zwei Einheiten an einem Tag sind keine Rettung, sondern
 * der nächste Ausfall.
 */
function nachholKarte(ctx, plan, sessions, dateKey, { nachholenMoeglich = true } = {}) {
  const offen = missedDays(plan, sessions, dateKey, 10);
  if (!offen.length) return null;

  /** Grund für einen vergangenen Tag setzen oder wieder löschen. */
  const grundSetzen = async (m, wert) => {
    const eintrag = m.session || {
      date: m.date, entries: {}, skills: {}, done: false,
      dayName: m.day.name, template: m.day.template,
    };
    eintrag.skipped = Boolean(wert);
    eintrag.reason = wert || null;
    await saveSession(eintrag);
    await ctx.refreshTraining();
    ctx.reload();
    toast(wert ? 'Grund eingetragen.' : 'Grund entfernt.');
  };

  const nachholen = async (m) => {
    const heute = (await getSession(dateKey)) || {
      date: dateKey, entries: {}, skills: {}, done: false,
    };
    heute.holtNach = m.date;
    heute.dayName = m.day.name;
    heute.template = m.day.template;
    await saveSession(heute);

    // Der ausgefallene Tag bekommt einen Vermerk, damit er nicht weiter
    // in der Liste steht — auch wenn dort gar kein Eintrag existierte.
    const alt = m.session || { date: m.date, entries: {}, skills: {}, done: false };
    alt.movedTo = dateKey;
    await saveSession(alt);

    await ctx.refreshTraining();
    ctx.reload();
    toast(`${m.day.name} wird heute nachgeholt.`);
  };

  const zeile = (m) => {
    const grund = m.grund ? SKIP_REASONS[m.grund] : null;

    // Der Grund gehört an den Tag, an dem es passiert ist. Wer erst am
    // nächsten Morgen dazu kommt, soll ihn nicht auf den falschen Tag buchen.
    const grundWahl = el('details', { class: 'klappkarte grundwahl' },
      el('summary', null,
        el('span', { class: 'grow small', text: grund ? 'Grund ändern' : 'Grund eintragen' })),
      el('div', { class: 'chips mt-16' },
        ...Object.entries(SKIP_REASONS).map(([wert, r]) => el('button', {
          class: 'chip', type: 'button',
          'aria-pressed': m.grund === wert ? 'true' : 'false',
          onClick: () => grundSetzen(m, m.grund === wert ? null : wert),
        }, r.label))));

    return el('div', { class: 'nachholzeile' },
      el('div', { class: 'row-between' },
        el('div', { class: 'grow' },
          el('div', { text: `${formatDateKey(m.date)} · ${m.day.name}` }),
          el('div', { class: 'muted small',
            text: grund ? `ausgelassen, ${grund.text}` : 'nicht gemacht, ohne Grund' })),
        nachholenMoeglich
          ? el('button', {
              class: 'btn btn-sm', type: 'button', onClick: () => nachholen(m),
            }, 'Heute nachholen')
          : null),
      grundWahl);
  };

  // Höchstens drei zur Auswahl: nachgeholt wird eine, und eine lange Liste
  // liest sich wie eine Mahnung.
  const zeigen = offen.slice(0, 3);

  return el('div', { class: 'card stack' },
    el('h3', { class: 'card-title',
      text: offen.length === 1 ? 'Eine Einheit ist offen' : `${offen.length} Einheiten sind offen` }),
    el('p', { class: 'muted small',
      text: nachholenMoeglich
        ? 'Heute ist Ruhetag — ein guter Tag, um eine davon nachzuholen. Muss aber nicht: '
          + 'ein Plan mit drei Einheiten die Woche verträgt eine ausgefallene.'
        : 'Vergangene Tage. Nachholen geht am nächsten Ruhetag; den Grund kannst du '
          + 'aber jetzt schon eintragen — er gehört an den Tag, an dem es passiert ist.' }),
    el('div', { class: 'card card-flush' }, ...zeigen.map(zeile)),
    offen.length > zeigen.length
      ? el('p', { class: 'hint',
          text: `${offen.length - zeigen.length} weitere liegen noch weiter zurück. Die holt man `
            + 'nicht mehr nach — der Plan läuft weiter.' })
      : null);
}

/**
 * Pausenlänge einstellen, mit der Dauer der Einheit als Folge daneben.
 *
 * Die Zahl steht bewusst dabei: eine Pause von zweieinhalb Minuten klingt nach
 * nichts, aber vierzehn davon sind eine halbe Stunde Dastehen. Erst die
 * Gesamtdauer macht die Entscheidung entscheidbar.
 */
function pausenKarte(ctx, tempo, exercises) {
  const waehlen = async (wert) => {
    await setSetting('pausen', wert);
    await ctx.refreshSettings();
    ctx.reload();
  };

  const chips = el('div', { class: 'chips' },
    ...Object.entries(REST_TEMPO).map(([wert, t]) => el('button', {
      class: 'chip', type: 'button',
      'aria-pressed': tempo === wert ? 'true' : 'false',
      onClick: () => waehlen(wert),
    }, `${t.label} · ${sessionMinutes(exercises, wert)} Min`)));

  return el('details', { class: 'card klappkarte pausenwahl' },
    el('summary', null,
      el('span', { class: 'grow', text: 'Pausen' }),
      el('span', { class: 'muted small',
        text: `${REST_TEMPO[tempo].label} · rund ${sessionMinutes(exercises, tempo)} Min` })),
    el('div', { class: 'stack mt-16' },
      chips,
      el('p', { class: 'hint', text: REST_TEMPO[tempo].hint }),
      el('p', { class: 'hint' },
        'Die angegebene Dauer ist die ganze Einheit samt Pausen — Aufwärmen und '
        + 'Technik kommen obendrauf.')));
}

/**
 * Schalter für den Unterwegs-Betrieb, samt Liste der getauschten Übungen.
 *
 * Bewusst mit sichtbarem Ausschalter: ein Modus, der den Plan umschreibt und
 * dabei still bleibt, wird irgendwann vergessen — und dann wundert man sich
 * Wochen später, warum keine Klimmzüge mehr drinstehen.
 */
function unterwegsKarte(ctx, unterwegs, umgerechnet) {
  const umschalten = async (an) => {
    await setSetting('unterwegs', an);
    await ctx.refreshSettings();
    ctx.reload();
    toast(an ? 'Plan aufs Zimmer umgerechnet.' : 'Wieder der normale Plan.');
  };

  if (!unterwegs) {
    return el('div', { class: 'card stack' },
      el('button', {
        class: 'btn btn-block', type: 'button',
        onClick: () => umschalten(true),
      }, 'Unterwegs? Plan aufs Zimmer umrechnen'),
      el('p', { class: 'hint' },
        'Für Hotel und Besuch: dann stehen nur Übungen im Plan, die mit Boden und '
        + 'Wand auskommen — ohne Tisch, Türrahmen, Stange oder Erhöhung.'));
  }

  const getauscht = (umgerechnet && umgerechnet.getauscht) || [];

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('h2', { class: 'card-title', text: 'Unterwegs' }),
      el('span', { class: 'pill pill-kcal', text: 'an' })),
    el('p', { class: 'small' },
      'Heute stehen nur Übungen im Plan, die mit Boden und Wand auskommen. '
      + 'Dein gespeicherter Plan bleibt unverändert.'),
    getauscht.length
      ? el('ul', { class: 'nogo swaps' },
          ...getauscht.map((g) => el('li', {
            text: g.zu ? `${g.von} → ${g.zu}` : `${g.von} — dafür gibt es hier keinen Ersatz`,
          })))
      : el('p', { class: 'hint', text: 'Heute war nichts zu tauschen — der Tag ging ohnehin ohne alles.' }),
    el('button', {
      class: 'btn btn-block', type: 'button',
      onClick: () => umschalten(false),
    }, 'Wieder der normale Plan'));
}

/** Letzte aufgezeichnete Leistung einer Übung vor einem Datum. */
function lastPerformance(sessions, exerciseId, beforeDate) {
  for (const session of [...sessions].sort((a, b) => (a.date < b.date ? -1 : 1)).reverse()) {
    if (session.date >= beforeDate) continue;
    const sets = (session.entries || {})[exerciseId];
    if (sets && sets.some((s) => s && s.reps)) return { date: session.date, sets };
  }
  return null;
}

function formatSets(sets, einseitig = false) {
  return sets
    .filter((s) => s && s.reps)
    .map((s) => {
      // Einseitig steht beides da — die Zahl allein verschweigt den Unterschied.
      const wdh = einseitig && typeof s.reps2 === 'number' ? `${s.reps}/${s.reps2}` : String(s.reps);
      return Number(s.weight) > 0
        ? `${String(s.weight).replace('.', ',')} kg × ${wdh}`
        : `${wdh} Wdh.`;
    })
    .join('  ·  ');
}

/* ---------------- Aufwärmen ----------------
   Aufgeklappt beim ersten Blick, danach eingeklappt — wer die Liste kennt,
   will sie nicht jedes Mal wegscrollen.
--------------------------------------------- */

/**
 * Verweis auf den Beweglichkeitstest, direkt unter dem Aufwärmen.
 *
 * Sichtbar ist er nur, wenn es etwas zu tun gibt: noch nie gemessen, oder die
 * letzte Messung ist alt. Ein Knopf, der immer da ist und meistens nichts
 * bedeutet, wird nach zwei Wochen nicht mehr gesehen.
 */
function beweglichkeitsZeile(ctx, dateKey) {
  if (dateKey !== localDateKey()) return null;

  const brauchbar = (ctx.state.mobility || []).filter(hasResults);
  const letzte = brauchbar.length ? brauchbar[brauchbar.length - 1] : null;
  if (letzte && !dueAgain(letzte.date, dateKey)) return null;

  const tage = letzte ? daysSince(letzte.date, dateKey) : null;
  return el('div', { class: 'card stack mt-16' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Beweglichkeit' }),
      el('span', { class: 'pill pill-kcal', text: letzte ? 'fällig' : 'noch offen' })),
    el('p', { class: 'small', text: letzte
      ? `Zuletzt vor ${tage} Tagen gemessen. Etwa alle ${RETEST_DAYS} Tage lohnt sich ein neuer Durchgang.`
      : 'Fünf Prüfungen, etwa zehn Minuten, ohne Hilfsmittel. Danach weißt du, '
        + 'wo dein Körper steht und woran sich das Dehnen messen lässt.' }),
    el('button', { class: 'btn btn-block', type: 'button', onClick: () => ctx.startMobility() },
      letzte ? 'Neu messen' : 'Test durchführen'));
}

function warmupCard(day, hatTechnik) {
  const items = warmupFor(day, hatTechnik);
  if (!items.length) return null;

  const details = el('details', { class: 'card warmup' },
    el('summary', null,
      el('span', { class: 'warmup-title', text: 'Aufwärmen' }),
      el('span', { class: 'warmup-time', text: `${warmupMinutes(items)} Min` })),
    ...items.map((item) => el('div', { class: 'warmup-item' },
      el('div', { class: 'warmup-name', text: item.name }),
      el('div', { class: 'warmup-detail', text: item.detail }))));

  // Beim ersten Öffnen an einem Tag offen, danach zugeklappt.
  const schluessel = 'warmup-zu';
  details.open = sessionStorage.getItem(schluessel) !== '1';
  details.addEventListener('toggle', () => {
    try { sessionStorage.setItem(schluessel, details.open ? '0' : '1'); } catch { /* egal */ }
  });

  return details;
}

/* ---------------- Pausenuhr ----------------
   Die Pause steht in der Vorgabe — 150 Sekunden nach einer Grundübung, 75 nach
   einer Isolationsübung. Wer sie schätzt, macht sie fast immer zu kurz. Deshalb
   läuft sie automatisch los, sobald ein Satz abgehakt ist, und meldet sich am
   Ende. Die Leiste klebt unten, damit sie beim Scrollen nicht verschwindet.
--------------------------------------------- */

let pausenLeiste = null;

function pauseStoppen() {
  if (!pausenLeiste) return;
  clearInterval(pausenLeiste.ticker);
  try { pausenLeiste.wakeLock?.release(); } catch { /* egal */ }
  pausenLeiste.node.remove();
  pausenLeiste = null;
}

/**
 * Startet die Pause. Läuft schon eine, wird sie ersetzt — der zuletzt
 * abgehakte Satz bestimmt, worauf gewartet wird.
 */
function pauseStarten(sekunden, uebungsname, audioAn = true) {
  pauseStoppen();

  const ende = Date.now() + sekunden * 1000;
  let gemeldet = false;
  let audio = null;

  const clock = el('div', { class: 'pause-clock tabular' });
  const label = el('div', { class: 'pause-label' }, uebungsname);

  const zeichnen = () => {
    const rest = Math.max(0, Math.round((ende - Date.now()) / 1000));
    clock.textContent = `${String(Math.floor(rest / 60)).padStart(2, '0')}:${String(rest % 60).padStart(2, '0')}`;
    if (rest === 0 && !gemeldet) {
      gemeldet = true;
      clock.classList.add('vorbei');
      label.textContent = 'Pause vorbei — nächster Satz';
      try { navigator.vibrate?.([200, 100, 200]); } catch { /* egal */ }
      if (audio) { beep(audio, 0.2, 660); setTimeout(() => beep(audio, 0.2, 880), 280); }
      // Nach dem Signal noch kurz stehen lassen, dann verschwinden.
      setTimeout(() => { if (pausenLeiste && pausenLeiste.ende === ende) pauseStoppen(); }, 8000);
    }
  };

  if (audioAn) {
    try {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      audio.resume?.();
    } catch { audio = null; }
  }

  const node = el('div', { class: 'pausenleiste' },
    el('div', { class: 'grow' }, label, el('div', { class: 'pause-hint', text: 'Pause läuft' })),
    clock,
    el('button', {
      class: 'btn btn-sm', type: 'button',
      onClick: () => { pauseStarten(Math.max(0, Math.round((ende - Date.now()) / 1000)) + 30, uebungsname, false); },
    }, '+30 s'),
    // Kein aria-label hier: es würde den sichtbaren Text überschreiben, und
    // Vorlesesoftware sagte dann etwas anderes, als danebensteht.
    el('button', {
      class: 'btn btn-sm', type: 'button',
      onClick: () => pauseStoppen(),
    }, 'Fertig'));

  document.body.append(node);
  zeichnen();

  const ticker = setInterval(zeichnen, 250);
  pausenLeiste = { node, ticker, ende, wakeLock: null };
  laufendeUhren.add(pauseStoppen);

  navigator.wakeLock?.request('screen')
    .then((lock) => { if (pausenLeiste) pausenLeiste.wakeLock = lock; })
    .catch(() => {});
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

function exerciseBlock(prescription, week, session, sessions, dateKey, onChange, aktionen, tempo, profile) {
  const exercise = exerciseById(prescription.id);
  if (!exercise) return null;

  const adjusted = forWeek(prescription, week);
  const einseitig = isUnilateral(prescription.id);
  const stand = ladderFor(prescription.id);
  const pause = restSeconds(prescription, tempo);
  const last = lastPerformance(sessions, prescription.id, dateKey);
  const entries = session.entries[prescription.id] || (session.entries[prescription.id] = []);

  const rows = [];
  for (let i = 0; i < adjusted.sets; i++) {
    const stored = entries[i] || {};

    // Bei Körpergewichtsübungen zählt die Wiederholung; das Zusatzgewicht darf leer bleiben.
    const isComplete = (set) => !!set.reps
      && (!einseitig || !!set.reps2)
      && (prescription.loadless || set.weight != null);

    // Der Haken sieht aus wie ein Kästchen — also muss er sich auch wie eines
    // verhalten. Tippen übernimmt die Vorschläge aus den Platzhaltern: das
    // Gewicht vom letzten Mal und die untere Wiederholungszahl. Nochmal tippen
    // leert den Satz wieder.
    const tick = el('button', {
      class: `settick${isComplete(stored) ? ' on' : ''}`,
      type: 'button',
      'aria-label': `Satz ${i + 1} als geschafft markieren`,
    }, '✓');

    const update = (ausGeste = false) => {
      const warVoll = isComplete(entries[i] || {});
      const lies = (feld) =>
        feld.value.trim() === '' ? null : Math.round(parseNumber(feld.value));
      entries[i] = {
        weight: weightInput.value.trim() === '' ? null : parseNumber(weightInput.value),
        reps: lies(repsInput),
        // Nur bei einseitigen Übungen. Bleibt sonst undefiniert, damit alte
        // Einträge und neue dieselbe Form haben.
        ...(einseitig ? { reps2: lies(reps2Input) } : {}),
      };
      const istVoll = isComplete(entries[i]);
      tick.classList.toggle('on', istVoll);

      // Frisch abgehakt und nicht der letzte Satz? Dann beginnt jetzt die Pause.
      if (istVoll && !warVoll && i < adjusted.sets - 1) {
        pauseStarten(pause, exercise.name, ausGeste);
      }
      onChange();
    };

    tick.addEventListener('click', () => {
      if (isComplete(entries[i] || {})) {
        weightInput.value = '';
        repsInput.value = '';
        if (einseitig) reps2Input.value = '';
        update(true);
        return;
      }

      // Leere Felder mit dem füllen, was ohnehin als Vorschlag dort steht.
      if (!repsInput.value.trim()) repsInput.value = repsInput.placeholder;
      if (einseitig && !reps2Input.value.trim()) reps2Input.value = repsInput.value;
      if (!weightInput.value.trim()) {
        const vorschlag = parseNumber(weightInput.placeholder);
        if (vorschlag > 0) weightInput.value = String(vorschlag).replace('.', ',');
      }
      update(true);

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
      'aria-label': einseitig ? `Satz ${i + 1}, Wiederholungen links` : `Satz ${i + 1}, Wiederholungen`,
      placeholder: String(prescription.reps[0]),
      value: stored.reps != null ? String(stored.reps) : '',
      onChange: update,
    });

    const reps2Input = einseitig
      ? el('input', {
          class: 'input setinput', type: 'text', inputmode: 'numeric',
          'aria-label': `Satz ${i + 1}, Wiederholungen rechts`,
          placeholder: String(prescription.reps[0]),
          value: stored.reps2 != null ? String(stored.reps2) : '',
          onChange: update,
        })
      : null;

    rows.push(el('div', { class: einseitig ? 'setrow setrow-zwei' : 'setrow' },
      el('span', { class: 'setnum tabular', text: String(i + 1) }),
      weightInput, repsInput, reps2Input, tick));
  }

  return el('div', { class: 'exblock' },
    el('div', { class: 'exblock-head' },
      el('span', { class: 'exblock-name', text: exercise.name }),
      el('span', { class: 'exblock-group', text: GROUP_LABEL[exercise.group] || exercise.group })),
    el('p', { class: 'exblock-rx tabular',
      text: `${adjusted.sets} Sätze · ${prescription.reps[0]}–${prescription.reps[1]} Wdh. · RIR ${adjusted.rir} · ${pause} s Pause` }),
    el('p', { class: 'exblock-last',
      text: last ? `Zuletzt ${formatDateKey(last.date)}: ${formatSets(last.sets, einseitig)}` : 'Noch keine Werte aufgezeichnet.' }),
    el('div', { class: einseitig ? 'setlabels setlabels-zwei' : 'setlabels' },
      el('span'), el('span', { text: prescription.loadless ? 'Zusatz-kg' : 'kg' }),
      el('span', { text: einseitig ? 'Wdh. li' : 'Wdh.' }),
      einseitig ? el('span', { text: 'Wdh. re' }) : null,
      el('span')),
    ...rows,
    el('p', { class: 'exblock-cue' },
      el('strong', { text: 'Nächster Schritt: ' }),
      nextStep(prescription, last ? last.sets : null, adjusted.rir),
      el('span', { class: 'exblock-hint', text: exercise.cue })),
    leiterZeile(prescription, exercise, sessions, dateKey, profile, aktionen),
    el('div', { class: 'stufenwahl' },
      el('button', {
        class: 'btn btn-ghost btn-sm', type: 'button', onClick: aktionen.tauschen,
      }, 'Zu schwer — andere Übung'),
      stand && harderRung(prescription.id, profile)
        ? el('button', {
            class: 'btn btn-ghost btn-sm', type: 'button', onClick: aktionen.hoch,
          }, 'Zu leicht — härtere Stufe')
        : null));
}

/**
 * Wo die Übung auf ihrer Leiter steht, und der Hinweis, wenn es Zeit für die
 * nächste Sprosse ist.
 *
 * Der Hinweis kommt erst nach zwei Einheiten in Folge am oberen Ende. Nach
 * einer einzelnen guten Einheit umzustellen wäre verfrüht — ein guter Tag ist
 * noch keine neue Stufe.
 */
function leiterZeile(prescription, exercise, sessions, dateKey, profile, aktionen) {
  const stand = ladderFor(exercise.id);
  if (!stand) return null;

  const serie = topOutStreak(sessions, prescription, dateKey);
  const naechste = harderRung(exercise.id, profile);
  const position = `Stufe ${stand.index + 1} von ${stand.leiter.stufen.length} · ${stand.leiter.name}`;

  if (serie >= STREAK_FOR_NEXT && naechste) {
    return el('div', { class: 'leiter leiter-reif' },
      el('p', { class: 'leiter-titel' },
        el('strong', { text: 'Zeit für die nächste Stufe. ' }),
        `${serie}× hintereinander alle Sätze auf ${prescription.reps[1]} Wiederholungen — `
        + 'mehr Wiederholungen bringen jetzt weniger als eine schwerere Variante.'),
      el('button', {
        class: 'btn btn-primary btn-sm btn-block', type: 'button', onClick: aktionen.hoch,
      }, `Weiter zu: ${naechste.exercise.name}`),
      el('p', { class: 'leiter-pos', text: position }));
  }

  return el('p', { class: 'leiter-pos' }, position
    + (naechste ? ` · als nächstes ${naechste.exercise.name}` : ' · oberste Stufe'));
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
  const energy = energyPlan(profile, ctx.state.kcalAdjust);

  // Die Einheit muss vor dem Tag geladen werden: holt sie eine ausgefallene
  // nach, gilt deren Plan und nicht der des heutigen Wochentags.
  const session = (await getSession(dateKey)) || {
    date: dateKey, entries: {}, skills: {}, done: false,
  };
  if (!session.skills) session.skills = {};   // Einheiten von vor den Fähigkeiten

  const nachholTag = session.holtNach
    ? dayForWeekday(plan, new Date(`${session.holtNach}T12:00:00`).getDay())
    : null;
  const geplanterTag = nachholTag || dayForWeekday(plan, weekday);

  // Unterwegs zählt nicht der gespeicherte Plan, sondern das, was im Zimmer
  // geht. Der Plan selbst bleibt unangetastet — der Schalter ist umkehrbar.
  const tempo = ctx.settings.pausen || 'normal';
  const unterwegs = ctx.settings.unterwegs === true;
  const umgerechnet = unterwegs && geplanterTag ? travelDay(geplanterTag, profile, pickNearestRung) : null;
  const day = umgerechnet
    ? { ...geplanterTag, exercises: umgerechnet.exercises }
    : geplanterTag;

  const head = viewHead(
    day ? day.name : 'Ruhetag',
    `${formatDateKey(dateKey)} · ${BLOCK_WEEKS[week].label}`
      + (nachholTag ? ` · nachgeholt vom ${WOCHENTAG[new Date(`${session.holtNach}T12:00:00`).getDay()]}` : ''),
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

  body.push(unterwegsKarte(ctx, unterwegs, umgerechnet));

  if (!day) {
    // Am Ruhetag zuerst, was offen ist — danach der Trost.
    const nachholen = nachholKarte(ctx, plan, sessions, dateKey);
    if (nachholen) body.push(nachholen);

    // Ein Ruhetag ist der beste Tag für die zehn Minuten Beweglichkeitstest.
    const dehnRuhe = beweglichkeitsZeile(ctx, dateKey);
    if (dehnRuhe) body.push(dehnRuhe);

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
    session.dayName = day.name;
    session.template = day.template;

    let pending = null;
    const persist = () => {
      // Beim Tippen nicht bei jedem Zeichen schreiben — kurz sammeln.
      clearTimeout(pending);
      pending = setTimeout(() => { saveSession(session).then(() => ctx.refreshTraining()); }, 400);
    };

    // Technik zuerst, danach die Kraftübungen. Unterwegs fallen Fähigkeiten
    // weg, die eine Stange oder einen Barren brauchen — im Zimmer steht keiner.
    const skillBlocks = (profile.skills || [])
      .filter((id) => !unterwegs || !(skillById(id) || {}).gear)
      .map((id) => skillBlock(id, session, ctx, persist))
      .filter(Boolean);

    const warmup = warmupCard(day, skillBlocks.length > 0);
    if (warmup) body.push(warmup);

    // Der Beweglichkeitstest stand bisher nur ganz unten im Fortschritt. Hier
    // gehört er hin: Aufwärmen und Dehnen ist der Moment, in dem man wissen
    // will, wo man steht.
    const dehnKarte = beweglichkeitsZeile(ctx, dateKey);
    if (dehnKarte) body.push(dehnKarte);

    if (skillBlocks.length) {
      body.push(el('h2', { class: 'section-title', text: 'Technik zuerst' }));
      body.push(el('div', { class: 'card card-flush' }, ...skillBlocks));
      body.push(el('h2', { class: 'section-title', text: 'Krafttraining' }));
    }

    const dayIndex = plan.days.indexOf(geplanterTag);

    /**
     * Übung austauschen. Die abgelehnte wird gemerkt, damit sie auch bei einem
     * späteren Neubau des Plans nicht zurückkommt.
     */
    const tauschen = async (exerciseIndex) => {
      const alteId = day.exercises[exerciseIndex].id;

      // Unterwegs steht die Übung gar nicht im gespeicherten Plan — der Tausch
      // greift deshalb nicht am Plan an, sondern an der Sperrliste. Die
      // Umrechnung übergeht gesperrte Übungen und nimmt die nächste.
      if (unterwegs) {
        const gesperrt = [...new Set([...(profile.blocked || []), alteId])];
        const nachher = travelDay(geplanterTag, { ...profile, blocked: gesperrt }, pickNearestRung);
        const neue = nachher.exercises.length === day.exercises.length
          ? nachher.exercises[exerciseIndex]
          : null;

        if (!neue || neue.id === alteId) {
          toast('Ohne Ausrüstung gibt es dafür keinen Ersatz mehr.');
          return;
        }

        await setTrainingProfile({ ...profile, blocked: gesperrt });
        if (session.entries[alteId]) {
          delete session.entries[alteId];
          await saveSession(session);
        }
        await ctx.refreshTraining();
        ctx.reload();
        toast(`Getauscht: ${exerciseById(neue.id).name}.`);
        return;
      }

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

    /**
     * Eine Sprosse der Variantenleiter hoch oder runter.
     *
     * Die verlassene Übung landet nicht in der Sperrliste, sondern in
     * `outgrown`: sie ist nicht ungeeignet, sondern erledigt. Der Unterschied
     * zählt, weil die Sperrliste im Plan als „aussortiert" auftaucht — und
     * „zu leicht geworden" ist das Gegenteil davon.
     */
    const stufeWechseln = async (exerciseIndex, richtung) => {
      const alteId = day.exercises[exerciseIndex].id;
      const ziel = richtung > 0 ? harderRung(alteId, profile) : easierRung(alteId, profile);

      if (!ziel) {
        toast(richtung > 0
          ? 'Das ist die schwerste Stufe, die mit deiner Ausrüstung geht.'
          : 'Leichter geht es auf dieser Leiter nicht.');
        return;
      }

      const outgrown = richtung > 0
        ? [...new Set([...(profile.outgrown || []), alteId])]
        // Abwärts wird nichts erledigt — im Gegenteil, die verlassene Stufe
        // darf wiederkommen, sobald sie wieder passt.
        : (profile.outgrown || []).filter((id) => id !== ziel.exercise.id);

      const neuesProfil = { ...profile, outgrown };

      if (!unterwegs) {
        await setPlan(setExercise(plan, neuesProfil, dayIndex, exerciseIndex, ziel.exercise.id));
      }
      await setTrainingProfile(neuesProfil);

      if (session.entries[alteId]) {
        delete session.entries[alteId];
        await saveSession(session);
      }

      await ctx.refreshTraining();
      ctx.reload();
      toast(`${richtung > 0 ? 'Eine Stufe höher' : 'Eine Stufe zurück'}: ${ziel.exercise.name}.`);
    };

    const blocks = day.exercises
      .map((p, i) => exerciseBlock(p, week, session, sessions, dateKey, persist, {
        tauschen: () => tauschen(i),
        hoch: () => stufeWechseln(i, +1),
        runter: () => stufeWechseln(i, -1),
      }, tempo, profile))
      .filter(Boolean);

    body.push(pausenKarte(ctx, tempo, day.exercises));
    body.push(el('div', { class: 'card card-flush mt-16' }, ...blocks));

    // Der Block läuft nach Kalender. Sprechen die letzten sieben Tage gegen
    // eine schwere Woche, sagt die App das — und bietet an, die
    // Entlastungswoche vorzuziehen. Umgestellt wird nur auf Knopfdruck.
    const kurzeNacht = (n) => nachtVoll(n) && schlafDauer(n) < SOLL_MIN;
    const deload = deloadHinweis({
      plan, sessions, sleep: ctx.state.sleep, dateKey, kurzeNacht,
    });
    if (deload.schwer && deload.gruende.length) {
      body.push(el('div', { class: 'card stack mt-16' },
        el('div', { class: 'row-between' },
          el('h3', { class: 'card-title', text: 'Diese Woche ist als schwere Woche geplant' }),
          el('span', { class: 'pill pill-kcal', text: BLOCK_WEEKS[week].label.split('· ')[1] })),
        el('p', { class: 'small',
          text: `Dagegen spricht: ${deload.gruende.join(' und ')}. Mehr Sätze bei weniger `
            + 'Reserve sind dann kein Fortschritt, sondern Verschleiß.' }),
        el('button', {
          class: 'btn btn-block', type: 'button',
          onClick: async () => {
            // Den Block um eine Woche vorziehen: aus „Schwer" wird „Deload",
            // der Rhythmus bleibt, nur die Phase verschiebt sich.
            const neuStart = shiftDateKey(plan.createdAt, 7);
            await setPlan({ ...plan, createdAt: neuStart });
            await ctx.refreshTraining();
            ctx.reload();
            toast('Entlastungswoche vorgezogen.');
          },
        }, 'Entlastungswoche vorziehen'),
        el('p', { class: 'hint',
          text: 'Verschiebt den Vierwochenblock um eine Woche. Die schwere Woche kommt '
            + 'danach, nur eben ausgeruht.' })));
    }

    // Harter Sport am Vortag und heute dieselbe Muskelgruppe — das summiert sich.
    const gestern = shiftDateKey(dateKey, -1);
    const gesternSport = (ctx.state.sportWoche || [])
      .filter((a) => a.date === gestern && (a.minutes || 0) >= 45);
    if (gesternSport.length) {
      const beine = day.exercises.some((p) => {
        const e = exerciseById(p.id);
        return e && ['quad', 'ham', 'glute'].includes(e.group);
      });
      if (beine) {
        const namen = [...new Set(gesternSport.map((a) => activityById(a.type)?.name || a.type))];
        body.push(el('div', { class: 'note mt-16' },
          el('strong', { text: `Gestern ${namen.join(' und ')}. ` }),
          'Heute stehen Beine an, und die haben von gestern noch etwas mitzutragen. '
          + 'Wenn die ersten Sätze zäh gehen, ist das der Grund — dann lieber eine '
          + 'Wiederholung weniger als eine schlechte mehr.'));
      }
    }

    // Nach einer kurzen Nacht ist die Kraft messbar niedriger. Kein Verbot,
    // aber die Entscheidung „heute lieber nicht" soll man treffen können,
    // bevor man im dritten Satz merkt, dass nichts geht.
    const nacht = (ctx.state.sleep || []).find((n) => n.date === dateKey);
    if (nacht && nachtVoll(nacht) && schlafDauer(nacht) < SOLL_MIN) {
      const kurz = schlafDauer(nacht) < 5 * 60;
      body.push(el('div', { class: 'note mt-16' },
        el('strong', { text: `Letzte Nacht ${schlafDauerText(schlafDauer(nacht))}. ` }),
        kurz
          ? 'Nach so einer Nacht ist die Kraft deutlich niedriger und das Risiko höher. '
            + 'Wenn es zäh wird, ist Auslassen die bessere Entscheidung — der Grund dafür steht unten.'
          : 'Etwas unter der Empfehlung. Kein Grund auszusetzen, aber wundere dich nicht, '
            + 'wenn die letzten Wiederholungen heute schwerer gehen.'));
    }

    const ausfallen = ausfallenKarte(ctx, session, day, dateKey);
    if (ausfallen) body.push(el('div', { class: 'mt-16' }, ausfallen));

    // Auch an Trainingstagen erreichbar: wer erst am nächsten Morgen dazu
    // kommt, den Ausfall einzutragen, käme sonst gar nicht an den richtigen
    // Tag heran und bucht ihn auf den heutigen.
    const offeneTage = nachholKarte(ctx, plan, sessions, dateKey, { nachholenMoeglich: false });
    if (offeneTage) body.push(el('div', { class: 'mt-16' }, offeneTage));

    body.push(el('button', {
      class: 'btn btn-primary btn-block btn-lg mt-16', type: 'button',
      onClick: async () => {
        session.done = true;
        delete session.skipped;
        delete session.reason;
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
