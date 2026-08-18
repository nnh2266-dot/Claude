/**
 * Krafteinordnung: wie stark jede Muskelgruppe gemessen am eigenen Körper ist
 * und wie die Gruppen zueinander stehen.
 *
 * Die Zahlen kommen aus strength.js. Hier steht die Darstellung — und der
 * Hinweis, wie belastbar sie sind. Eine Einordnung ohne diesen Hinweis lädt
 * dazu ein, sie für eine Messung zu halten; sie ist ein Anhaltspunkt.
 */

import { el, mount, viewHead, iconButton, emptyState } from '../ui.js';
import { localDateKey, formatDateKey, shiftDateKey } from '../nutrition.js';
import {
  groupStrength, balance, setsByGroup, neglected, niveauFor,
  RATED_COUNT, EXERCISE_COUNT,
} from '../strength.js';

const einsNach = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
const zweiNach = (n) => String(Math.round(n * 100) / 100).replace('.', ',');

/** Die Leistung in Worten: „22 Wdh." oder „1,25 × Körpergewicht (100 kg)". */
function leistungText(b) {
  if (b.art === 'wdh') return `${Math.round(b.wert)} Wdh.`;
  const kg = b.koerper ? ` (${Math.round(b.wert * b.koerper)} kg)` : '';
  return `${zweiNach(b.wert)} × Körpergewicht${kg}`;
}

/** Was bis zum nächsten Niveau fehlt. */
function zielText(b) {
  if (!b.ziel || !b.zielNiveau) return 'Oberes Ende der Tabelle erreicht.';
  if (b.art === 'wdh') {
    const fehlt = Math.ceil(b.ziel - b.wert);
    return `Noch ${fehlt} ${fehlt === 1 ? 'Wiederholung' : 'Wiederholungen'} bis „${b.zielNiveau.name}".`;
  }
  const fehlt = Math.round((b.ziel - b.wert) * (b.koerper || 0));
  return `Noch rund ${fehlt} kg bis „${b.zielNiveau.name}".`;
}

function gruppenZeile(g) {
  const b = g.bewertet;

  if (!b) {
    return el('div', { class: 'scorerow' },
      el('div', { class: 'row-between' },
        el('div', { class: 'grow' },
          el('div', { class: 'scorerow-name', text: g.label }),
          el('div', { class: 'muted small',
            text: `Aufgezeichnet, aber ohne Richtwert: ${g.uebungen.map((u) => u.name).join(', ')}` }))));
  }

  return el('div', { class: 'scorerow' },
    el('div', { class: 'row-between' },
      el('div', { class: 'grow' },
        el('div', { class: 'scorerow-name', text: g.label }),
        el('div', { class: 'muted small', text: `${b.niveau.name} · ${b.name}: ${leistungText(b)}` })),
      el('div', { class: 'scorerow-num tabular', text: String(b.punkte) })),
    el('div', { class: 'scorebar' }, el('i', { style: { width: `${Math.max(2, b.punkte)}%` } })),
    el('div', { class: 'hint', text: zielText(b) }));
}

function verhaeltnisZeile(v) {
  const spanne = Math.max(v.links.punkte, v.rechts.punkte) || 1;

  const seite = (s) => el('div', { class: 'grow' },
    el('div', { class: 'row-between' },
      el('span', { class: 'small', text: s.label }),
      el('span', { class: 'small tabular', text: String(s.punkte) })),
    el('div', { class: 'scorebar' },
      el('i', { style: { width: `${Math.max(2, (s.punkte / spanne) * 100)}%` } })));

  return el('div', { class: 'scorerow' },
    el('div', { class: 'row-between' },
      el('div', { class: 'scorerow-name', text: v.name }),
      el('span', {
        class: `pill ${v.schief ? 'pill-kcal' : 'pill-ok'}`,
        text: v.schief ? `${Math.abs(v.diff)} Punkte Unterschied` : 'ausgewogen',
      })),
    el('div', { class: 'stack-sm' }, seite(v.links), seite(v.rechts)),
    v.schief
      ? el('p', { class: 'hint',
          text: `${v.schwaecher} hinkt hinterher. Dort bringt eine Übung mehr als überall `
            + 'sonst — und auf Dauer ist das die Stelle, an der es zwickt.' })
      : el('p', { class: 'hint', text: 'Beide Seiten liegen nah beieinander. So soll es sein.' }));
}

/* ---------------- Ansicht ---------------- */

export async function render(container, ctx) {
  const profile = ctx.state.profile;
  const sessions = ctx.state.sessions || [];

  const head = viewHead('Krafteinordnung',
    profile ? `bezogen auf ${einsNach(profile.weight)} kg Körpergewicht` : '',
    iconButton('back', 'Zurück', () => ctx.go('progress')));

  if (!profile) {
    mount(container, head, el('div', { class: 'card' },
      emptyState('Noch kein Profil',
        'Die Einordnung rechnet mit deinem Körpergewicht. Das steht im Fragebogen.')));
    return;
  }

  const gruppen = groupStrength(sessions, profile);
  const bewertete = gruppen.filter((g) => g.bewertet);

  if (!bewertete.length) {
    mount(container, head, el('div', { class: 'card' },
      emptyState('Noch keine Sätze mit Richtwert',
        'Trag deine Sätze im Training ein. Sobald von einer Muskelgruppe eine Übung '
        + 'mit Richtwert dabei ist, steht hier, wo du stehst.')));
    return;
  }

  const body = [];

  const schnitt = Math.round(
    bewertete.reduce((s, g) => s + g.bewertet.punkte, 0) / bewertete.length
  );

  body.push(el('div', { class: 'card stack' },
    el('div', { class: 'score' },
      el('div', { class: 'score-num tabular', text: String(schnitt) },
        el('span', { class: 'score-of', text: ' / 100' })),
      el('div', { class: 'score-band', text: niveauFor(schnitt).name })),
    el('p', { class: 'small',
      text: `Mittel über ${bewertete.length} eingeordnete ${bewertete.length === 1 ? 'Muskelgruppe' : 'Muskelgruppen'}.` }),
    el('p', { class: 'hint',
      text: 'Gemessen wird gegen Richtwerte, die auf dein Körpergewicht bezogen sind — '
        + 'bei Lastübungen als Vielfaches davon, bei Körpergewichtsübungen steckt der '
        + 'Bezug schon in der Übung.' })));

  /* Je Gruppe */
  body.push(el('h2', { class: 'section-title', text: 'Muskelgruppen' }));
  body.push(el('div', { class: 'card stack' }, ...gruppen.map(gruppenZeile)));

  if (bewertete.length >= 2) {
    const staerkste = bewertete[0];
    const schwaechste = bewertete[bewertete.length - 1];
    if (staerkste.bewertet.punkte - schwaechste.bewertet.punkte >= 15) {
      body.push(el('div', { class: 'note mt-16' },
        el('strong', { text: `Größter Abstand: ${schwaechste.label} zu ${staerkste.label}. ` }),
        `${schwaechste.bewertet.punkte} gegen ${staerkste.bewertet.punkte} Punkte. `
        + 'Ein Rückstand von mehr als fünfzehn Punkten ist kein Zufall mehr.'));
    }
  }

  /* Verhältnisse */
  const verhaeltnisse = balance(gruppen);
  if (verhaeltnisse.length) {
    body.push(el('h2', { class: 'section-title', text: 'Verhältnisse' }));
    body.push(el('div', { class: 'card stack' }, ...verhaeltnisse.map(verhaeltnisZeile)));
  }

  /* Wohin die Arbeit geht */
  const vonDatum = shiftDateKey(localDateKey(), -28);
  const verteilung = setsByGroup(sessions, vonDatum);

  if (verteilung.gesamt) {
    body.push(el('h2', { class: 'section-title', text: 'Wohin die Arbeit geht' }));
    body.push(el('div', { class: 'card stack' },
      el('p', { class: 'muted small',
        text: `${verteilung.gesamt} Sätze in den letzten vier Wochen.` }),
      ...verteilung.gruppen.map((g) => el('div', { class: 'scorerow' },
        el('div', { class: 'row-between' },
          el('span', { class: 'small', text: g.label }),
          el('span', { class: 'small tabular',
            text: `${g.saetze} ${g.saetze === 1 ? 'Satz' : 'Sätze'} · ${g.anteil} %` })),
        el('div', { class: 'scorebar' },
          el('i', { style: { width: `${Math.max(2, g.anteil * 2)}%` } }))))));

    const vergessen = neglected(ctx.state.plan, sessions, vonDatum);
    if (vergessen.length) {
      body.push(el('div', { class: 'note mt-16' },
        el('strong', { text: 'Vier Wochen ohne einen Satz: ' }),
        `${vergessen.map((v) => v.label).join(', ')}. Steht im Plan, kam aber nicht vor.`));
    }
  }

  /* Ehrlichkeit über die Zahlen */
  body.push(el('div', { class: 'card stack mt-16' },
    el('h3', { class: 'card-title', text: 'Was die Zahlen wert sind' }),
    el('ul', { class: 'caveats' },
      el('li', { text: 'Die Richtwerte sind grobe Erfahrungswerte. Hebelverhältnisse, Alter und Trainingsjahre verschieben sie um zehn bis zwanzig Punkte in beide Richtungen.' }),
      el('li', { text: `Nur ${RATED_COUNT} der ${EXERCISE_COUNT} Übungen haben einen Richtwert. Wo keiner steht, wird nichts erfunden.` }),
      el('li', { text: 'Das Einwiederholungsmaximum wird aus deinem besten Satz geschätzt und dabei bei zwölf Wiederholungen gedeckelt — darüber überschätzt die Formel deutlich.' }),
      el('li', { text: 'Gerechnet wird mit deinem besten Satz überhaupt, nicht mit dem aus dieser Woche. Nach einer langen Pause steht hier zu viel.' })),
    el('p', { class: 'hint',
      text: 'Nützlich ist der Vergleich der Gruppen untereinander — der leidet unter '
        + 'all dem weit weniger als die absolute Zahl.' })));

  mount(container, head, el('div', null, ...body));
}

/** Kompakte Karte für die Fortschrittsansicht. */
export function strengthSection(ctx) {
  const profile = ctx.state.profile;
  const gruppen = profile ? groupStrength(ctx.state.sessions || [], profile) : [];
  const bewertete = gruppen.filter((g) => g.bewertet);

  const knopf = el('button', {
    class: 'btn btn-block', type: 'button',
    onClick: () => ctx.go('strength'),
  }, 'Einordnung ansehen');

  if (!bewertete.length) {
    return el('div', { class: 'card' },
      emptyState('Noch keine Einordnung',
        'Sobald Sätze aufgezeichnet sind, steht hier, wie stark jede Muskelgruppe '
        + 'gemessen an deinem Körpergewicht ist.'),
      knopf);
  }

  const schnitt = Math.round(
    bewertete.reduce((s, g) => s + g.bewertet.punkte, 0) / bewertete.length
  );
  const schwaechste = bewertete[bewertete.length - 1];

  return el('div', null,
    el('button', {
      class: 'card scorecard', type: 'button',
      onClick: () => ctx.go('strength'),
    },
      el('div', { class: 'score-num tabular', text: String(schnitt) },
        el('span', { class: 'score-of', text: ' / 100' })),
      el('div', { class: 'grow' },
        el('div', { class: 'score-band', text: niveauFor(schnitt).name }),
        el('div', { class: 'muted small',
          text: `Schwächste Gruppe: ${schwaechste.label} (${schwaechste.bewertet.punkte})` }))),
    el('div', { class: 'card card-flush mt-16' },
      ...bewertete.slice(0, 4).map((g) => el('div', { class: 'calcrow' },
        el('div', { class: 'grow' },
          el('div', { text: g.label }),
          el('div', { class: 'muted small', text: g.bewertet.niveau.name })),
        el('div', { class: 'tabular', text: String(g.bewertet.punkte) })))),
    el('div', { class: 'mt-16' }, knopf));
}
