/**
 * Trainingsansicht: die Einheit des Tages zum Mitschreiben, oder der Ruhetag
 * mit dem, was dann zählt. Darunter das Tagesgewicht — daraus lernt die App,
 * ob die Kalorien stimmen.
 */

import {
  el, mount, viewHead, emptyState, toast, iconButton,
  beep, mmss, laufendeUhren, stoppeAlleUhren,
} from '../ui.js';
import { localDateKey, formatDateKey, parseNumber, shiftDateKey } from '../nutrition.js';
import {
  getSession, saveSession, saveWeight, setSkillLevel, setPlan, setTrainingProfile,
  setSetting,
} from '../store.js';
import {
  exerciseById, GROUP_LABEL, blockWeek, forWeek, dayForWeekday, nextStep, BLOCK_WEEKS,
  travelDay, restSeconds, sessionMinutes, REST_TEMPO,
  replaceExercise, setExercise, removeExercise, missedDays, SKIP_REASONS, deloadHinweis,
  isUnilateral, isTimed, repRange, setSides, GRUPPEN_BUENDEL, withoutBundles, spareDay, LIMIT_LABEL,
  weeklyVolume, sessionSpanne,
} from '../training.js';
import { schonungsKarte, activeLimits } from './schonung.js';
import {
  ladderFor, harderRung, easierRung, pickNearestRung, topOutStreak, bottomOutStreak,
  STREAK_FOR_NEXT,
  sameLadderGroups, wiederholtBewegung,
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
  skillBlocked,
} from '../skills.js';
import { belastungsverlauf, uebungsVerlauf, rueckgang, rueckgangText } from '../verlauf.js';
import { weekStart } from '../report.js';

const WOCHENTAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/**
 * Eine Einheit bewusst ausfallen lassen, mit Grund.
 *
 * Der Grund ist kein Schmuck. Ohne ihn steht im Wochenbericht nur „ausgefallen",
 * und das liest sich gleich, ob man verreist war oder es vergessen hat. Nach
 * einer durchwachten Nacht ist Nichttrainieren die richtige Entscheidung — die
 * App soll dafür nicht schimpfen.
 */
/**
 * Welche Muskelgruppen ein Tag hauptsächlich trainiert.
 * Ohne das ist die Auswahl beim Tauschen ein Ratespiel aus Namen wie
 * „Ganzkörper B" — und genau die Frage, die man hat, ist ja: sind da Beine drin?
 */
function gruppenVon(day, grenze = 4) {
  const zaehler = new Map();
  for (const rx of day.exercises || []) {
    const uebung = exerciseById(rx.id);
    if (!uebung) continue;
    zaehler.set(uebung.group, (zaehler.get(uebung.group) || 0) + 1);
  }
  return [...zaehler.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, grenze)
    .map(([g]) => GROUP_LABEL[g] || g);
}

/**
 * Heute eine andere Einheit machen.
 *
 * Der Plan legt Wochentage fest, das Leben hält sich nicht daran. Der häufigste
 * Fall ist nicht „ich kann heute gar nicht", sondern „heute passt eine andere
 * besser" — vor einem Spiel keine Beine, mit Muskelkater keine Wiederholung
 * derselben Gruppe, ohne Stange nichts zum Ziehen.
 *
 * Getauscht wird nur für heute. Der Plan selbst bleibt stehen, und der
 * verdrängte Tag landet in der Liste der offenen Einheiten, statt still zu
 * verschwinden.
 */
function tauschKarte(ctx, plan, sessions, session, day, dateKey) {
  if (session.done || session.skipped) return null;

  const wochentag = new Date(`${dateKey}T12:00:00`).getDay();
  const eigenerTag = dayForWeekday(plan, wochentag);
  const getauscht = typeof session.swapWeekday === 'number';
  const ohne = session.ohneGruppen || [];

  const buendelSchalten = async (id) => {
    const neu = ohne.includes(id) ? ohne.filter((x) => x !== id) : [...ohne, id];
    session.ohneGruppen = neu;
    await saveSession(session);
    await ctx.refreshTraining();
    ctx.reload();
    toast(neu.includes(id)
      ? `${GRUPPEN_BUENDEL[id].label} heute weggelassen.`
      : `${GRUPPEN_BUENDEL[id].label} wieder dabei.`);
  };

  // Nur Bündel anbieten, die im heutigen Tag überhaupt vorkommen.
  const moeglich = Object.entries(GRUPPEN_BUENDEL).filter(([id]) =>
    ohne.includes(id) || withoutBundles(day, [id]).exercises.length < (day.exercises || []).length);

  const weglassen = moeglich.length
    ? el('div', { class: 'stack' },
        el('div', { class: 'suppzeit', text: 'Oder nur eine Gruppe weglassen' }),
        ...moeglich.map(([id, b]) => el('button', {
          class: `tauschzeile${ohne.includes(id) ? ' aus' : ''}`, type: 'button',
          'aria-pressed': ohne.includes(id) ? 'true' : 'false',
          onClick: () => buendelSchalten(id),
        },
          el('div', { class: 'grow' },
            el('div', { class: 'tauschname', text: `Ohne ${b.label}` }),
            el('div', { class: 'muted small', text: b.warum })),
          el('span', { class: 'muted small', text: ohne.includes(id) ? 'weggelassen' : '' }))))
    : null;

  const setzen = async (weekday, name) => {
    session.swapWeekday = weekday;
    // Die Übungen des alten Tages gehören nicht zum neuen.
    session.entries = {};
    session.dayName = name;
    await saveSession(session);
    await ctx.refreshTraining();
    ctx.reload();
    toast(`Heute ${name}.`);
  };

  const zurueck = async () => {
    session.swapWeekday = null;
    session.entries = {};
    session.dayName = eigenerTag ? eigenerTag.name : '';
    await saveSession(session);
    await ctx.refreshTraining();
    ctx.reload();
    toast('Zurück zum Plan.');
  };

  if (getauscht || ohne.length) {
    const teile = [];
    if (getauscht) {
      teile.push(`Statt ${eigenerTag ? eigenerTag.name : 'der geplanten Einheit'} machst du `
        + `heute ${day.name}. ${eigenerTag ? eigenerTag.name : 'Die geplante Einheit'} steht ab `
        + 'morgen unter den offenen Einheiten.');
    }
    if (ohne.length) {
      teile.push(`${ohne.map((id) => GRUPPEN_BUENDEL[id].label).join(' und ')} heute `
        + 'weggelassen — im Wochenbericht steht das Volumen entsprechend niedriger.');
    }

    return el('div', { class: 'card stack' },
      el('div', { class: 'row-between' },
        el('h3', { class: 'card-title', text: 'Heute angepasst' }),
        el('span', { class: 'pill pill-kcal', text: 'nur heute' })),
      ...teile.map((t) => el('p', { class: 'small', text: t })),
      weglassen,
      getauscht
        ? el('button', { class: 'btn btn-block', type: 'button', onClick: zurueck },
            'Doch die geplante Einheit')
        : null);
  }

  // Zur Auswahl: alle anderen Tage des Plans. Der eigene fehlt — ihn zu
  // „tauschen" wäre ein Nichts.
  const andere = (plan.days || []).filter((d) => d.weekday !== wochentag);
  if (!andere.length) return null;

  const zeile = (d) => el('button', {
    class: 'tauschzeile', type: 'button',
    onClick: () => setzen(d.weekday, d.name),
  },
    el('div', { class: 'grow' },
      el('div', { class: 'tauschname', text: d.name }),
      el('div', { class: 'muted small', text: gruppenVon(d).join(' · ') })),
    el('span', { class: 'muted small', text: WOCHENTAG[d.weekday].slice(0, 2) }));

  return el('details', { class: 'card klappkarte' },
    el('summary', null,
      el('span', { class: 'grow', text: 'Heute passt das nicht?' }),
      el('span', { class: 'muted small', text: 'anpassen' })),
    el('div', { class: 'stack mt-16' },
      el('p', { class: 'muted small',
        text: 'Nur für heute — der Plan bleibt stehen. Typische Gründe: morgen ein Spiel '
          + 'oder Wettkampf, Muskelkater in der Gruppe, die dran wäre, oder ein Gerät '
          + 'fehlt.' }),
      // Bei einem Ganzkörperplan steht in jedem Tag alles drin. Dann bringt
      // Tauschen wenig und Weglassen alles — deshalb steht der Hinweis dabei.
      andere.length
        ? el('div', { class: 'stack' },
            el('div', { class: 'suppzeit', text: 'Andere Einheit machen' }),
            ...andere.map(zeile))
        : null,
      weglassen));
}

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

  return el('details', { class: 'card klappkarte' },
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
/**
 * Zweimal dieselbe Bewegung an einem Tag.
 *
 * Kommt auf zwei Wegen zustande. Beim Tauschen, wenn für die abgewählte Übung
 * nur noch eine Sprosse übrig ist, die schon besetzt ist — dagegen hilft der
 * Filter im Tausch, aber nicht immer: Ohne Ausrüstung gibt es für die Rückseite
 * der Beine schlicht nichts anderes. Und beim Bauen des Plans, wenn eine Gruppe
 * zwei Plätze hat und alle Übungen dieser Gruppe auf derselben Leiter stehen —
 * ohne Geräte trifft das auf jede Kniebeugevariante zu.
 *
 * Gemeldet wird deshalb nur, wo es sicher ein Versehen ist, und das sind genau
 * zwei Fälle:
 *
 * 1. **Die ganze Leiter an einem Tag.** Bei der Hüftstreckung gibt es nur zwei
 *    Sprossen — beidbeinige und einbeinige Glute Bridge. Wer beide dastehen
 *    hat, hat dieselbe Übung zweimal, einmal leicht und einmal schwer.
 * 2. **Der Tausch hat es gerade angerichtet.** Dann steht es auf dem Tag
 *    vermerkt, und die Karte weiß, dass sie gemeint ist.
 *
 * Ausdrücklich **nicht** gemeldet wird der Beintag ohne Geräte mit Kniebeuge,
 * Step-Up und Bulgarian Split Squat. Die stehen zwar auf einer Leiter, sind
 * aber drei Übungen, die sich unterschiedlich anfühlen — und ohne Geräte gibt
 * es für zwei Kniebeugeplätze gar nichts anderes. Eine Karte, die jeden
 * Beintag lang dasteht, ist keine Warnung mehr, sondern Möblierung.
 *
 * Wer die Doppelung behalten will, sagt einmal „passt so" und wird zu dieser
 * Kombination nicht wieder gefragt.
 */
const DOPPELT_OK = 'dopplung-ok';

function dopplungAbgenickt(schluessel) {
  try { return (localStorage.getItem(DOPPELT_OK) || '').split(',').includes(schluessel); }
  catch { return false; }
}

function dopplungAbnicken(schluessel) {
  try {
    const alt = (localStorage.getItem(DOPPELT_OK) || '').split(',').filter(Boolean);
    localStorage.setItem(DOPPELT_OK, [...new Set([...alt, schluessel])].join(','));
  } catch { /* egal */ }
}

function dopplungsKarte(ctx, plan, day, dayIndex, unterwegs) {
  const gruppen = sameLadderGroups((day.exercises || []).map((e) => e.id))
    .filter((g) => g.stufen.length >= g.leiter.stufen.length || day.dopplung === g.leiter.id);
  if (!gruppen.length) return null;

  // Immer nur eine auf einmal. Zwei solche Karten übereinander liest niemand.
  //
  // Welche zuerst: die mit dem kleinsten Abstand auf der Leiter. Zwei
  // benachbarte Sprossen sind wirklich dieselbe Übung — beidbeinige und
  // einbeinige Glute Bridge. Drei Sprossen auseinander fühlt sich dagegen nach
  // zwei Übungen an, auch wenn dieselbe Leiter darunter liegt.
  const abstand = (g) => {
    const idx = g.stufen.map((x) => x.index).sort((a, b) => a - b);
    return Math.min(...idx.slice(1).map((v, i) => v - idx[i]));
  };
  const treffer = gruppen
    .map((g) => ({ ...g, schluessel: [...g.stufen].map((x) => x.id).sort().join('-') }))
    .filter((g) => !dopplungAbgenickt(g.schluessel))
    .sort((a, b) => abstand(a) - abstand(b))[0];
  if (!treffer) return null;

  const sortiert = [...treffer.stufen].sort((a, b) => a.index - b.index);
  const leichteste = sortiert[0];
  const schwerste = sortiert[sortiert.length - 1];
  const nameVon = (x) => exerciseById(x.id)?.name || x.id;

  // Streichen nur, wenn danach noch ein Tag übrig bleibt, der diesen Namen
  // verdient — und nicht unterwegs, wo der Tag ohnehin nur gerechnet ist.
  const darfStreichen = !unterwegs && (day.exercises || []).length >= 5;

  return el('div', { class: 'card stack mt-16' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Zweimal dieselbe Bewegung' }),
      el('span', { class: 'pill pill-kcal', text: treffer.leiter.name })),

    el('p', { class: 'small' },
      `${sortiert.map(nameVon).join(' und ')} sind Sprossen derselben Leiter — dieselbe `
      + 'Bewegung, nur unterschiedlich schwer. Wenn die schwerere sauber geht, ist die '
      + 'leichtere kein Arbeitssatz mehr, sondern Aufwärmen.'),

    el('p', { class: 'muted small' },
      `Die schwerere ist ${nameVon(schwerste)} — das ist der Satz, der zählt.`),

    el('div', { class: 'row' },
      darfStreichen
        ? el('button', {
            class: 'btn grow', type: 'button',
            onClick: async () => {
              await setPlan(removeExercise(plan, dayIndex, leichteste.platz));
              await ctx.refreshTraining();
              ctx.reload();
              toast(`${nameVon(leichteste)} gestrichen.`);
            },
          }, `${nameVon(leichteste)} streichen`)
        : null,
      el('button', {
        class: 'btn grow', type: 'button',
        onClick: () => { dopplungAbnicken(treffer.schluessel); ctx.reload(); },
      }, 'Passt so')),

    el('p', { class: 'hint',
      text: darfStreichen
        ? 'Streichen lässt den Tag eine Übung kürzer. Das ist besser als zwei, die '
          + 'dasselbe tun — und die gestrichene kannst du weiter als Aufwärmsatz machen, '
          + 'sie zählt dann nur nicht mit.'
        : 'Mit deiner Ausrüstung steht für diese Bewegung nichts anderes zur Wahl. '
          + 'Dann mach die leichtere bewusst als Aufwärmen und gib beim schwereren Satz '
          + 'alles — das ist der ganze Unterschied.' }));
}

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

  return el('details', { class: 'card klappkarte' },
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

/**
 * Alle aufgezeichneten Leistungen einer Übung, neueste zuerst.
 * Für den Vergleich „besser als letztes Mal" braucht es zwei, nicht eine.
 */
function performanceHistory(sessions, exerciseId, beforeDate, wieViele = 2) {
  const raus = [];
  for (const session of [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (session.date >= beforeDate) continue;
    const sets = (session.entries || {})[exerciseId];
    if (sets && sets.some((s) => s && s.reps)) raus.push({ date: session.date, sets });
    if (raus.length >= wieViele) break;
  }
  return raus;
}

/**
 * Eine Zeile, die sagt, ob es vorangeht.
 *
 * Der Grund, warum es sie gibt: Im Block stand bisher nur „Zuletzt: 14 Wdh."
 * und daneben, auf welcher Leitersprosse man steht. Ob sich zwischen der
 * vorletzten und der letzten Einheit etwas getan hat, musste man selbst im
 * Kopf ausrechnen — und wenn man das nicht tut, fühlt sich jede Woche gleich
 * an. Die App hat die Zahlen, sie hat sie nur nicht verglichen.
 *
 * Verglichen wird das beste Satzergebnis: bei Lastübungen das Gewicht, sonst
 * die Wiederholungen beziehungsweise Sekunden. Einseitig zählt die schwächere
 * Seite, wie überall.
 */
function fortschrittsZeile(verlauf, prescription, oben, einseitig, zeit) {
  if (!verlauf.length) return null;

  const bestes = (eintrag) => {
    const werte = (eintrag.sets || []).filter((x) => x && x.reps).map((x) => ({
      last: Number(x.weight) || 0,
      wdh: einseitig ? (setSides(x).schwaechste ?? Number(x.reps)) : Number(x.reps),
    }));
    if (!werte.length) return null;
    // Schwerster Satz, bei gleichem Gewicht der mit den meisten Wiederholungen.
    return werte.sort((a, b) => b.last - a.last || b.wdh - a.wdh)[0];
  };

  const jetzt = bestes(verlauf[0]);
  if (!jetzt) return null;
  const einheit = zeit ? 's' : 'Wdh.';

  const teile = [];
  const davor = verlauf[1] ? bestes(verlauf[1]) : null;
  if (davor) {
    if (jetzt.last !== davor.last && jetzt.last > 0 && davor.last > 0) {
      const d = Math.round((jetzt.last - davor.last) * 10) / 10;
      teile.push(`${d > 0 ? '+' : ''}${String(d).replace('.', ',')} kg gegenüber der Einheit davor`);
    } else if (jetzt.wdh !== davor.wdh) {
      const d = jetzt.wdh - davor.wdh;
      teile.push(`${d > 0 ? '+' : ''}${d} ${einheit} gegenüber der Einheit davor`);
    } else {
      teile.push('gleich wie die Einheit davor');
    }
  }

  // Wie weit bis zum oberen Rand des Bereichs — das ist der Punkt, an dem es
  // weitergeht: mehr Gewicht oder die nächste Sprosse.
  if (!prescription.loadless || !jetzt.last) {
    const fehlt = oben - jetzt.wdh;
    if (fehlt > 0) teile.push(`noch ${fehlt} ${einheit} bis zum oberen Rand`);
    else teile.push('oberer Rand erreicht');
  }

  if (!teile.length) return null;
  return el('p', { class: 'exblock-fortschritt small' },
    el('strong', { text: 'Fortschritt: ' }), teile.join(' · '));
}

function formatSets(sets, einseitig = false, zeit = false) {
  return sets
    .filter((s) => s && s.reps)
    .map((s) => {
      // Einseitig steht beides da — die Zahl allein verschweigt den Unterschied.
      const wdh = einseitig && typeof s.reps2 === 'number' ? `${s.reps}/${s.reps2}` : String(s.reps);
      return Number(s.weight) > 0
        ? `${String(s.weight).replace('.', ',')} kg × ${wdh}${zeit ? ' s' : ''}`
        : `${wdh} ${zeit ? 's' : 'Wdh.'}`;
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
  const zeit = isTimed(prescription.id);
  const [unten, oben] = repRange(prescription);
  const einheit = zeit ? 's' : 'Wdh.';
  const stand = ladderFor(prescription.id);
  const pause = restSeconds(prescription, tempo);
  const verlauf = performanceHistory(sessions, prescription.id, dateKey);
  const last = verlauf[0] || null;

  // Geht es bei dieser Übung seit mehreren Einheiten zurück? Das steht hier und
  // nicht nur im Fortschritt, weil die Entscheidung — heute weniger, dafür
  // sauber — genau jetzt ansteht. Gerechnet aus den Sätzen, die schon da sind.
  const rueck = rueckgang(uebungsVerlauf(sessions, prescription.id, { bis: dateKey }));
  const echterRueckgang = rueck.ja && rueck.lage === 'rueckgang';
  const entries = session.entries[prescription.id] || (session.entries[prescription.id] = []);

  const rows = [];
  // Bei Halteübungen schreibt die Uhr in die Felder. Je Satz ein Schreiber,
  // damit sie nicht wissen muss, wie eine Zeile aufgebaut ist.
  const zeitSchreiber = [];
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
      // Die Uhr zeigt an, welcher Satz als Nächstes dran ist. Wer von Hand
      // einträgt, soll sie nicht auf einem alten Stand stehen lassen.
      uhr?.refresh?.();
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

    const wasGemessen = zeit ? 'Sekunden' : 'Wiederholungen';
    const repsInput = el('input', {
      class: 'input setinput', type: 'text', inputmode: 'numeric',
      'aria-label': einseitig ? `Satz ${i + 1}, ${wasGemessen} links` : `Satz ${i + 1}, ${wasGemessen}`,
      placeholder: String(unten),
      value: stored.reps != null ? String(stored.reps) : '',
      onChange: update,
    });

    const reps2Input = einseitig
      ? el('input', {
          class: 'input setinput', type: 'text', inputmode: 'numeric',
          'aria-label': `Satz ${i + 1}, ${wasGemessen} rechts`,
          placeholder: String(unten),
          value: stored.reps2 != null ? String(stored.reps2) : '',
          onChange: update,
        })
      : null;

    zeitSchreiber.push((sekunden) => {
      repsInput.value = String(sekunden);
      if (einseitig && !reps2Input.value.trim()) reps2Input.focus();
      update(true);
    });

    rows.push(el('div', { class: einseitig ? 'setrow setrow-zwei' : 'setrow' },
      el('span', { class: 'setnum tabular', text: String(i + 1) }),
      weightInput, repsInput, reps2Input, tick));
  }

  // Gehalten wird mit der Uhr, nicht im Kopf gezählt. Dieselbe Uhr wie bei den
  // Fähigkeiten: Start, halten, beim Runterkommen wieder tippen — die Sekunden
  // stehen dann im Satz.
  const uhr = zeit
    ? holdTimer({
        target: unten,
        sets: adjusted.sets,
        nextEmpty: () => {
          for (let i = 0; i < adjusted.sets; i += 1) {
            if (!entries[i] || entries[i].reps == null) return i;
          }
          return null;
        },
        write: (i, sekunden) => zeitSchreiber[i] && zeitSchreiber[i](sekunden),
      })
    : null;

  // RIR heißt „so viele Wiederholungen noch im Tank". Bei einer Halteübung
  // gibt es die nicht — dort ist der Abbruch die Form, nicht die Zahl.
  // „3 Sätze" bei einer einseitigen Übung heißt dreimal links und dreimal
  // rechts. Ohne den Zusatz wundert man sich beim sechsten Durchgang, warum
  // das Ende nicht kommt.
  const satzText = einseitig ? `${adjusted.sets} Sätze je Seite` : `${adjusted.sets} Sätze`;
  const rxText = zeit
    ? `${satzText} · ${unten}–${oben} s halten · ${pause} s Pause`
    : `${satzText} · ${unten}–${oben} Wdh. · RIR ${adjusted.rir} · ${pause} s Pause`;

  return el('div', { class: 'exblock' },
    el('div', { class: 'exblock-head' },
      el('span', { class: 'exblock-name', text: exercise.name }),
      el('span', { class: 'exblock-group', text: GROUP_LABEL[exercise.group] || exercise.group })),
    el('p', { class: 'exblock-rx tabular', text: rxText }),
    el('p', { class: 'exblock-last',
      text: last ? `Zuletzt ${formatDateKey(last.date)}: ${formatSets(last.sets, einseitig, zeit)}` : 'Noch keine Werte aufgezeichnet.' }),
    fortschrittsZeile(verlauf, prescription, oben, einseitig, zeit),
    echterRueckgang
      ? el('p', { class: 'exblock-rueckgang small', text: rueckgangText(rueck) })
      : null,
    uhr ? uhr.node : null,
    el('div', { class: einseitig ? 'setlabels setlabels-zwei' : 'setlabels' },
      el('span'), el('span', { text: prescription.loadless ? 'Zusatz-kg' : 'kg' }),
      el('span', { text: einseitig ? `${einheit} li` : einheit }),
      einseitig ? el('span', { text: `${einheit} re` }) : null,
      el('span')),
    ...rows,
    el('p', { class: 'exblock-cue' },
      el('strong', { text: 'Nächster Schritt: ' }),
      nextStep(prescription, last ? last.sets : null, adjusted.rir),
      el('span', { class: 'exblock-hint', text: exercise.cue })),
    leiterZeile(prescription, exercise, sessions, dateKey, profile, aktionen),
    /**
     * Die beiden Wege auf der Leiter — hoch und runter.
     *
     * „Runter" gab es hier nie. Die Funktion dahinter war vollständig
     * geschrieben, `aktionen.runter` hing am Übungsblock, easierRung rechnete
     * die leichtere Sprosse aus — nur der Knopf fehlte. Dazu kam, dass der
     * Tauschknopf früher „Zu schwer — andere Übung" hieß; nach dem Umbenennen
     * stand das Wort „schwer" nirgends mehr, und wer eine Übung nicht schaffte,
     * fand nur noch das dauerhafte Aussortieren.
     *
     * Das sind aber zwei verschiedene Dinge. „Zu schwer" heißt: eine Stufe
     * zurück, dieselbe Bewegung, leichtere Variante — und die verlassene Stufe
     * darf wiederkommen, sobald sie wieder passt. „Aussortieren" heißt: diese
     * Übung will ich nicht mehr sehen. Wer das eine meint und nur das andere
     * findet, verliert eine Bewegung aus seinem Plan, weil er einen schlechten
     * Tag hatte.
     */
    stand && (easierRung(prescription.id, profile) || harderRung(prescription.id, profile))
      ? el('div', { class: 'stufenwahl' },
          easierRung(prescription.id, profile)
            ? el('button', {
                class: 'btn btn-ghost btn-sm', type: 'button', onClick: aktionen.runter,
              }, '← Zu schwer')
            : null,
          harderRung(prescription.id, profile)
            ? el('button', {
                class: 'btn btn-ghost btn-sm', type: 'button', onClick: aktionen.hoch,
              }, 'Zu leicht →')
            : null)
      : null,
    el('div', { class: 'stufenwahl' },
      el('button', {
        class: 'btn btn-ghost btn-sm', type: 'button', onClick: aktionen.tauschen,
      // Hieß „Zu schwer — andere Übung". Der Knopf tut aber mehr: Er sortiert
      // die Übung dauerhaft aus, und die Gründe dafür sind nicht nur „zu
      // schwer" — manche Übung mag man einfach nicht, und eine Übung, die man
      // nicht mag, macht man schlecht oder gar nicht. Der Knopf heißt jetzt,
      // was er tut.
      }, 'Andere Übung — diese aussortieren')));
}

/**
 * Wo die Übung auf ihrer Leiter steht — und der Hinweis, wenn es Zeit ist,
 * eine Sprosse zu wechseln. In beide Richtungen.
 *
 * Nach oben kam der Hinweis schon immer, nach unten lange nicht. Das war eine
 * Schieflage mit Folgen: „Zu leicht" kostet ein paar verschenkte Wochen, „zu
 * schwer" kostet die Technik und irgendwann die Lust. Wer eine Stufe zu hoch
 * steht, macht schlechte Wiederholungen, wird nicht stärker und hört im
 * Zweifel ganz auf — und die App sah dabei zu.
 *
 * Beide Hinweise kommen erst nach zwei Einheiten in Folge. Ein guter Tag ist
 * noch keine neue Stufe, ein schlechter noch kein Rückschritt.
 *
 * Steht eine Übung ohne Leiter zu hoch, bleibt nur der Tausch — auch das wird
 * jetzt gesagt, statt zu schweigen, weil zufällig keine Leiter danebensteht.
 */
function leiterZeile(prescription, exercise, sessions, dateKey, profile, aktionen) {
  const stand = ladderFor(exercise.id);
  const [unten, oben] = repRange(prescription);
  const zeit = isTimed(prescription.id);
  const einheit = zeit ? 'Sekunden' : 'Wiederholungen';

  const hoch = topOutStreak(sessions, prescription, dateKey);
  const runter = bottomOutStreak(sessions, prescription, dateKey);
  const naechste = stand ? harderRung(exercise.id, profile) : null;
  const leichtere = stand ? easierRung(exercise.id, profile) : null;

  // Zu schwer zuerst: Wer beides gleichzeitig auslöst, hat widersprüchliche
  // Einheiten — dann ist die vorsichtigere Antwort die richtige.
  if (runter >= STREAK_FOR_NEXT) {
    const grund = `${runter}× hintereinander unter ${unten} ${einheit} — auf dieser Stufe `
      + 'kommen keine sauberen Sätze mehr zustande.';
    if (leichtere) {
      return el('div', { class: 'leiter leiter-schwer' },
        el('p', { class: 'leiter-titel' },
          el('strong', { text: 'Diese Stufe ist zu schwer. ' }), grund
          + ' Eine Stufe zurück ist kein Rückschritt: Die leichtere Variante mit sauberer '
          + 'Ausführung bringt mehr als die schwerere mit halben Wiederholungen.'),
        el('button', {
          class: 'btn btn-primary btn-sm btn-block', type: 'button', onClick: aktionen.runter,
        }, `Zurück zu: ${leichtere.exercise.name}`),
        el('p', { class: 'leiter-pos',
          text: `Stufe ${stand.index + 1} von ${stand.leiter.stufen.length} · ${stand.leiter.name}` }));
    }
    // Keine leichtere Sprosse da — dann hilft nur eine andere Übung.
    return el('div', { class: 'leiter leiter-schwer' },
      el('p', { class: 'leiter-titel' },
        el('strong', { text: 'Diese Übung ist zu schwer. ' }), grund
        + (stand
          ? ' Leichter geht es auf dieser Leiter nicht — eine andere Übung für dieselbe '
            + 'Muskelgruppe ist hier der Weg.'
          : ' Für diese Übung gibt es keine leichtere Variante — eine andere für dieselbe '
            + 'Muskelgruppe ist hier der Weg.')),
      el('button', {
        class: 'btn btn-primary btn-sm btn-block', type: 'button', onClick: aktionen.tauschen,
      }, 'Andere Übung wählen'));
  }

  if (!stand) return null;
  const position = `Stufe ${stand.index + 1} von ${stand.leiter.stufen.length} · ${stand.leiter.name}`;

  if (hoch >= STREAK_FOR_NEXT && naechste) {
    return el('div', { class: 'leiter leiter-reif' },
      el('p', { class: 'leiter-titel' },
        el('strong', { text: 'Zeit für die nächste Stufe. ' }),
        `${hoch}× hintereinander über ${oben} ${einheit} — `
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
  // Getauscht: heute gilt die Einheit eines anderen Wochentags. Sonntag ist 0,
  // deshalb der Typtest statt einer Wahrheitsprüfung.
  const tauschTag = typeof session.swapWeekday === 'number'
    ? dayForWeekday(plan, session.swapWeekday)
    : null;
  const eigenerTag = dayForWeekday(plan, weekday);
  const geplanterTag = nachholTag || tauschTag || eigenerTag;

  // Unterwegs zählt nicht der gespeicherte Plan, sondern das, was im Zimmer
  // geht. Der Plan selbst bleibt unangetastet — der Schalter ist umkehrbar.
  const tempo = ctx.settings.pausen || 'normal';
  const unterwegs = ctx.settings.unterwegs === true;

  // Geschonte Gelenke wirken über dieselbe Prüfung wie die dauerhaften aus dem
  // Fragebogen — nur eben erst hier, beim Anzeigen, und ohne den Plan neu zu
  // bauen.
  const schonung = ctx.settings.schonung || [];
  const grenzen = activeLimits(schonung);
  const profileMitSchonung = grenzen.length
    ? { ...profile, limits: [...(profile.limits || []), ...grenzen] }
    : profile;

  const umgerechnet = unterwegs && geplanterTag
    ? travelDay(geplanterTag, profileMitSchonung, pickNearestRung)
    : null;
  const nachReise = umgerechnet
    ? { ...geplanterTag, exercises: umgerechnet.exercises }
    : geplanterTag;

  // Nach dem Umrechnen schonen, nicht davor: sonst käme über die
  // Zimmer-Variante eine Übung herein, die aufs kranke Gelenk geht.
  const geschont = grenzen.length && nachReise
    ? spareDay(nachReise, profileMitSchonung, pickNearestRung)
    : null;
  const vollerTag = geschont
    ? { ...nachReise, exercises: geschont.exercises }
    : nachReise;
  // Weggelassene Gruppen zuletzt: erst umrechnen, dann filtern — sonst käme
  // über die Zimmer-Variante eine Beinübung wieder herein.
  const day = vollerTag ? withoutBundles(vollerTag, session.ohneGruppen || []) : vollerTag;

  const head = viewHead(
    day ? day.name : 'Ruhetag',
    `${formatDateKey(dateKey)} · ${BLOCK_WEEKS[week].label}`
      + (nachholTag ? ` · nachgeholt vom ${WOCHENTAG[new Date(`${session.holtNach}T12:00:00`).getDay()]}` : '')
      + (tauschTag && eigenerTag ? ` · statt ${eigenerTag.name}` : ''),
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

  // Direkt darunter: Was heute geschont wird und warum der Plan anders aussieht.
  body.push(el('div', { class: 'mt-16' },
    schonungsKarte(ctx, { getauscht: geschont ? geschont.getauscht : [] })));

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
    // Fähigkeiten, die auf ein geschontes Gelenk gehen, pausieren mit. Ein
    // Handstand mit gereiztem Handgelenk ist genau das, was man gerade nicht
    // üben will — und ohne diese Zeile stünde er weiter im Plan.
    const pausierteSkills = (profile.skills || [])
      .map((id) => ({ id, treffer: skillBlocked(id, grenzen) }))
      .filter((x) => x.treffer);

    const skillBlocks = (profile.skills || [])
      .filter((id) => !unterwegs || !(skillById(id) || {}).gear)
      .filter((id) => !skillBlocked(id, grenzen))
      .map((id) => skillBlock(id, session, ctx, persist))
      .filter(Boolean);

    if (pausierteSkills.length) {
      body.push(el('div', { class: 'note mt-16' },
        el('strong', { text: 'Technik pausiert. ' }),
        `${pausierteSkills.map((x) => skillById(x.id).name).join(' und ')} `
        + `${pausierteSkills.length === 1 ? 'geht' : 'gehen'} auf `
        + `${[...new Set(pausierteSkills.flatMap((x) => x.treffer))]
            .map((t) => LIMIT_LABEL[t]).join(' und ')} — solange geschont wird, steht `
        + 'das aus. Der Fortschritt bleibt gespeichert.'));
    }

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

      // Was heute schon dransteht, ohne die Übung, die gerade weggeht: Der
      // Ersatz soll keine Bewegung wiederholen, die eine Reihe weiter unten
      // ohnehin kommt.
      const sonstImTag = day.exercises.filter((_, j) => j !== exerciseIndex).map((e) => e.id);
      const { plan: neuerPlan, ersatz, dopplung } = replaceExercise(
        plan, profile, dayIndex, exerciseIndex,
        { meide: (e) => wiederholtBewegung(e, sonstImTag) },
      );

      if (!ersatz) {
        toast('Dafür gibt es mit deiner Ausrüstung keinen Ersatz mehr.');
        return;
      }

      const blocked = [...new Set([...(profile.blocked || []), alteId])];
      await setTrainingProfile({ ...profile, blocked });
      // Blieb nur eine Sprosse übrig, die heute schon besetzt ist, dann merkt
      // sich der Tag das — sonst müsste die Karte raten, ob die Doppelung
      // gewollt ist oder gerade erst entstanden.
      const merker = ladderFor(ersatz.id)?.leiter.id || null;
      await setPlan(dopplung && merker
        ? {
            ...neuerPlan,
            days: neuerPlan.days.map((d, i) => (i === dayIndex ? { ...d, dopplung: merker } : d)),
          }
        : neuerPlan);

      // Aufgezeichnete Sätze der alten Übung gehören nicht zur neuen.
      if (session.entries[alteId]) {
        delete session.entries[alteId];
        await saveSession(session);
      }

      await ctx.refreshTraining();
      ctx.reload();
      // Wenn nichts anderes übrig war, muss der Hinweis stehen — sonst wundert
      // man sich später, warum dieselbe Bewegung zweimal im Tag steht.
      toast(dopplung
        ? `Getauscht: ${exerciseById(ersatz.id).name}. Achtung — dieselbe Bewegung wie eine `
          + 'andere Übung heute. Der Hinweis oben sagt, was du damit machst.'
        : `Getauscht: ${exerciseById(ersatz.id).name}.`);
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
        // Räumt der Aufstieg eine Dopplung auf, soll der Ersatz nicht gleich
        // die nächste Bewegung wiederholen. Was heute schon dransteht, weiß
        // nur die Ansicht — ladders.js kennt den Tag nicht.
        const sonstImTag = day.exercises
          .filter((_, i) => i !== exerciseIndex)
          .map((x) => x.id);
        await setPlan(setExercise(plan, neuesProfil, dayIndex, exerciseIndex, ziel.exercise.id,
          { meide: (e) => wiederholtBewegung(e, sonstImTag) }));
      }
      await setTrainingProfile(neuesProfil);

      if (session.entries[alteId]) {
        delete session.entries[alteId];
        await saveSession(session);
      }

      await ctx.refreshTraining();
      ctx.reload();

      // Vier der Leitern wechseln unterwegs von beidseitig auf einseitig —
      // Kniebeuge, Hüftstreckung, Hüfte beugen und das waagerechte Drücken.
      // Eine einseitige Übung dauert doppelt so lang, und über Monate wächst
      // die Einheit dadurch aus dem Zeitfenster heraus, ohne dass je jemand
      // etwas gesagt hätte. Gekürzt wird trotzdem nicht: Eine Übung stillschweigend
      // zu streichen, weil man gerade aufgestiegen ist, wäre die schlechtere
      // Überraschung. Gesagt wird es.
      const nachher = richtung > 0
        ? sessionSpanne(dayForWeekday(plan, new Date(`${dateKey}T12:00:00`).getDay()),
          profile, tempo, plan.zyklus)
        : null;
      const laenger = nachher && nachher.ueberzieht
        ? ` Die Einheit dauert damit rund ${nachher.normal} Minuten statt der `
          + `${nachher.budget}, die du eingestellt hast — ${ziel.exercise.name} wird je Seite `
          + 'gemacht. Wenn das zu lang ist, hilft ein Trainingstag mehr in der Woche.'
        : '';
      toast(`${richtung > 0 ? 'Eine Stufe höher' : 'Eine Stufe zurück'}: ${ziel.exercise.name}.${laenger}`);
    };

    const blocks = day.exercises
      .map((p, i) => exerciseBlock(p, week, session, sessions, dateKey, persist, {
        tauschen: () => tauschen(i),
        hoch: () => stufeWechseln(i, +1),
        runter: () => stufeWechseln(i, -1),
      }, tempo, profile))
      .filter(Boolean);

    // Mit den Sätzen dieser Woche gerechnet — in der schweren Woche ist die
    // Einheit rund ein Viertel länger, und das gehört an die Zahl, die man
    // liest, bevor man anfängt.
    body.push(pausenKarte(ctx, tempo, day.exercises.map((x) => ({ ...x, sets: forWeek(x, week).sets }))));

    // Vor die Übungsliste, nicht dahinter: Wer scrollt, um die erste Übung zu
    // sehen, hat den Hinweis sonst schon hinter sich.
    const doppelt = dopplungsKarte(ctx, plan, day, dayIndex, unterwegs);
    if (doppelt) body.push(doppelt);

    body.push(el('div', { class: 'card card-flush mt-16' }, ...blocks));

    /**
     * Sätze von Übungen, die heute nicht mehr im Plan stehen.
     *
     * Passiert, wenn der Plan umgebaut wird, während eine Einheit läuft — oder
     * wenn eine Übung getauscht wurde, nachdem schon Sätze standen. Die Daten
     * bleiben gespeichert und zählen im Bericht, waren hier aber unsichtbar.
     * Unsichtbar und gelöscht sieht für den Nutzer gleich aus, und das ist der
     * schlechtere der beiden Eindrücke.
     */
    const imPlan = new Set(day.exercises.map((p2) => p2.id));
    const verwaist = Object.entries(session.entries || {})
      .map(([id, saetze]) => ({ id, saetze: (saetze || []).filter((x) => x && x.reps) }))
      .filter((x) => !imPlan.has(x.id) && x.saetze.length);

    if (verwaist.length) {
      const gesamt = verwaist.reduce((n, x) => n + x.saetze.length, 0);
      body.push(el('div', { class: 'card stack mt-16' },
        el('div', { class: 'row-between' },
          el('h3', { class: 'card-title', text: 'Nicht mehr im Plan' }),
          el('span', { class: 'pill pill-kcal tabular', text: `${gesamt} Sätze` })),
        el('p', { class: 'muted small',
          text: 'Diese Übungen stehen heute nicht mehr im Plan, du hast sie aber gemacht. '
            + 'Die Sätze bleiben gespeichert und zählen im Bericht mit.' }),
        el('div', { class: 'card-flush' },
          ...verwaist.map((x) => el('div', { class: 'calcrow' },
            el('div', { class: 'grow', text: exerciseById(x.id)?.name || x.id }),
            el('div', { class: 'tabular small',
              text: formatSets(x.saetze, isUnilateral(x.id), isTimed(x.id)) }))))));
    }

    // Der Block läuft nach Kalender. Sprechen die letzten sieben Tage gegen
    // eine schwere Woche, sagt die App das — und bietet an, die
    // Entlastungswoche vorzuziehen. Umgestellt wird nur auf Knopfdruck.
    const kurzeNacht = (n) => nachtVoll(n) && schlafDauer(n) < SOLL_MIN;
    const deload = deloadHinweis({
      plan, sessions, sleep: ctx.state.sleep, dateKey, kurzeNacht,
    });

    // Vierter Grund, der nichts Neues zum Eintragen braucht: Die bewegte Last
    // steigt seit Wochen, ohne dass je eine leichtere dazwischen lag. Das kommt
    // aus den Sätzen, die ohnehin schon gespeichert sind.
    const belastung = belastungsverlauf(
      weeklyVolume(sessions, ctx.state.profile?.weight), weekStart(dateKey),
    );
    if (deload.schwer && belastung.warnung === 'anstieg') {
      deload.gruende.push(`die bewegte Last ist ${belastung.anstiege} Wochen in Folge gestiegen, `
        + 'ohne eine leichtere dazwischen');
    }
    if (deload.schwer && belastung.warnung === 'sprung') {
      deload.gruende.push(`die bewegte Last ist zur Vorwoche um ${belastung.sprungProzent} Prozent gesprungen`);
    }

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

    // Tauschen steht vor Ausfallenlassen: Wenn heute etwas nicht passt, ist
    // eine andere Einheit fast immer die bessere Antwort als keine.
    const tausch = tauschKarte(ctx, plan, sessions, session, vollerTag, dateKey);
    if (tausch) body.push(el('div', { class: 'mt-16' }, tausch));

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
