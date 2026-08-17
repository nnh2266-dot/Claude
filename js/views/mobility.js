/**
 * Beweglichkeitstest: durchführen und den Verlauf ansehen.
 *
 * Die Messung selbst ist die Arbeit — deshalb steht bei jeder Prüfung, wie
 * gemessen wird und was abgelesen wird. Ohne das misst man beim zweiten Mal
 * anders als beim ersten, und der Vergleich wäre wertlos.
 */

import { el, mount, viewHead, iconButton, field, toast, emptyState } from '../ui.js';
import { localDateKey, formatDateKey, parseNumber } from '../nutrition.js';
import { saveMobilityTest } from '../store.js';
import {
  MOBILITY_TESTS, fieldsFor, compare, summarise, daysSince, RETEST_DAYS,
} from '../mobility.js';

/** Läuft gerade eine Messung? Dann stehen hier die eingetippten Werte. */
let messung = null;

export function begin() {
  messung = {};
}

const einsNach = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
const mitVorzeichen = (n) => (n > 0 ? '+' : '') + einsNach(n);

/** Letzte abgeschlossene Messung vor einer bestimmten, oder die letzte überhaupt. */
function vorherige(tests, ausser) {
  const sortiert = [...tests].sort((a, b) => (a.date < b.date ? 1 : -1));
  return sortiert.find((t) => t.date !== ausser) || null;
}

/* ---------------- Messung durchführen ---------------- */

function testKarte(test, vorwerte) {
  const felder = fieldsFor(test);

  const eingaben = felder.map((f) => {
    const input = el('input', {
      class: 'input', type: 'text', inputmode: 'text',
      placeholder: test.unit === 's' ? 'Sekunden' : 'cm',
    });
    const gespeichert = (messung[test.id] || {})[f];
    input.value = gespeichert != null ? String(gespeichert).replace('.', ',') : '';
    input.addEventListener('input', () => {
      const roh = input.value.trim();
      messung[test.id] = { ...(messung[test.id] || {}) };
      // Minuswerte sind hier normal: die Finger kommen nicht bis zu den Zehen,
      // die Hände überlappen hinter dem Rücken. parseNumber liest das Vorzeichen.
      messung[test.id][f] = roh === '' ? null : parseNumber(roh);
    });
    return { feld: f, input };
  });

  const vorher = vorwerte ? summarise(test, vorwerte) : null;

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: test.name }),
      el('span', { class: 'muted small', text: test.unit === 's' ? 'Sekunden' : 'Zentimeter' })),
    el('p', { class: 'muted small', text: test.target }),

    el('details', { class: 'bridge-details' },
      el('summary', { text: 'So wird gemessen' }),
      el('p', { class: 'small mt-16', text: test.how }),
      el('p', { class: 'small', style: { marginTop: '8px' } },
        el('strong', { text: 'Ablesen: ' }), test.reading)),

    el('div', { class: felder.length > 1 ? 'grid-2' : '' },
      ...eingaben.map(({ feld, input }) =>
        field(feld === 'wert' ? 'Messwert' : feld === 'links' ? 'Links' : 'Rechts', input))),

    vorher != null
      ? el('p', { class: 'hint', text: `Beim letzten Mal: ${einsNach(vorher)} ${test.unit}` })
      : null);
}

/* ---------------- Ansicht ---------------- */

export async function render(container, ctx) {
  if (!messung) messung = {};

  const heute = localDateKey();
  const tests = ctx.state.mobility || [];
  const letzte = vorherige(tests, heute);

  const head = viewHead('Beweglichkeitstest',
    letzte ? `zuletzt ${formatDateKey(letzte.date)}` : 'erste Messung',
    iconButton('back', 'Zurück', () => { messung = null; ctx.go('progress'); }));

  const einleitung = el('div', { class: 'card stack' },
    el('p', { class: 'small' },
      'Fünf Prüfungen, alle allein mit Maßband und Wand machbar. Wichtig ist nicht '
      + 'der einzelne Wert, sondern dass du beim nächsten Mal genauso misst — '
      + 'deshalb steht bei jeder Prüfung, wie es geht.'),
    el('p', { class: 'hint' },
      'Vorher fünf Minuten locker bewegen. Kalt gemessen fällt jeder Wert schlechter '
      + 'aus, und wenn du mal warm und mal kalt misst, vergleichst du nichts.'),
    el('p', { class: 'hint' },
      `Sinnvoll etwa alle ${RETEST_DAYS} Tage. Öfter zu messen zeigt vor allem `
      + 'Tagesform, nicht Fortschritt.'));

  const karten = MOBILITY_TESTS.map((test) =>
    testKarte(test, letzte ? letzte.results[test.id] : null));

  const speichern = el('button', {
    class: 'btn btn-primary btn-block btn-lg mt-16', type: 'button',
    onClick: async () => {
      // Leere Prüfungen einfach weglassen — lieber drei ehrliche Werte als
      // fünf, von denen zwei geraten sind.
      const ergebnisse = {};
      for (const test of MOBILITY_TESTS) {
        const werte = messung[test.id];
        if (!werte) continue;
        const gefuellt = Object.fromEntries(
          Object.entries(werte).filter(([, v]) => typeof v === 'number' && Number.isFinite(v))
        );
        if (Object.keys(gefuellt).length) ergebnisse[test.id] = gefuellt;
      }

      if (!Object.keys(ergebnisse).length) {
        toast('Trag mindestens einen Wert ein.');
        return;
      }

      await saveMobilityTest(heute, ergebnisse);
      await ctx.refreshTraining();
      messung = null;
      ctx.go('progress');
      toast('Messung gespeichert.');
    },
  }, 'Messung speichern');

  mount(container, head, einleitung, ...karten, speichern);
}

/* ---------------- Verlauf, eingebunden im Fortschritt ---------------- */

/**
 * Karte für die Fortschrittsansicht: letzter Stand je Prüfung samt
 * Veränderung zur vorletzten Messung.
 */
export function mobilitySection(ctx) {
  const heute = localDateKey();
  const tests = ctx.state.mobility || [];
  const letzte = tests.length ? tests[tests.length - 1] : null;
  const davor = letzte ? vorherige(tests, letzte.date) : null;
  const tage = letzte ? daysSince(letzte.date, heute) : null;

  const knopf = el('button', {
    class: 'btn btn-block', type: 'button',
    onClick: () => ctx.startMobility(),
  }, letzte ? 'Neue Messung' : 'Test durchführen');

  if (!letzte) {
    return el('div', { class: 'card' },
      emptyState('Noch nicht gemessen',
        'Fünf Prüfungen mit Maßband und Wand, etwa zehn Minuten. Danach siehst du '
        + 'alle paar Wochen schwarz auf weiß, ob sich beim Dehnen etwas tut.'),
      knopf);
  }

  const zeilen = MOBILITY_TESTS.map((test) => {
    const jetzt = summarise(test, letzte.results[test.id]);
    if (jetzt == null) return null;
    const vorher = davor ? summarise(test, davor.results[test.id]) : null;
    const vergleich = vorher != null ? compare(test, jetzt, vorher) : null;

    return el('div', { class: 'calcrow' },
      el('div', { class: 'grow' },
        el('div', { text: test.name }),
        el('div', { class: 'muted small', text: test.target })),
      vergleich && !vergleich.gleich
        ? el('span', {
            class: `pill ${vergleich.besser ? 'pill-ok' : 'pill-kcal'} tabular`,
            text: `${mitVorzeichen(vergleich.delta)} ${test.unit}`,
          })
        : null,
      el('div', { class: 'tabular', text: `${einsNach(jetzt)} ${test.unit}` }));
  }).filter(Boolean);

  return el('div', null,
    el('div', { class: 'card card-flush' }, ...zeilen),
    el('p', { class: 'hint mt-16',
      text: tage === 0
        ? 'Heute gemessen.'
        : `Letzte Messung vor ${tage} ${tage === 1 ? 'Tag' : 'Tagen'}`
          + (davor ? ', verglichen mit der Messung davor.' : '. Beim nächsten Mal gibt es einen Vergleich.') }),
    el('div', { class: 'mt-16' }, knopf));
}
