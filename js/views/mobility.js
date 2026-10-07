/**
 * Beweglichkeitstest: durchführen und den Verlauf ansehen.
 *
 * Der Test läuft Schritt für Schritt, eine Prüfung pro Bildschirm. Das ist
 * nicht Zierde: man hat die Hände beim Messen selten frei und liest die
 * Anleitung, bevor man sich hinsetzt. Fünf Karten übereinander würde man
 * scrollend suchen, während man in der Vorbeuge sitzt.
 *
 * Der Aufbau steht offen da, nicht eingeklappt — er ist der eigentliche Inhalt.
 * Am Ende jeder Prüfung wird nichts abgelesen, sondern ausgewählt.
 */

import { el, mount, viewHead, iconButton, toast, emptyState } from '../ui.js';
import { localDateKey, formatDateKey, parseNumber } from '../nutrition.js';
import { saveMobilityTest } from '../store.js';
import {
  MOBILITY_TESTS, fieldsFor, compare, summarise, standLabel, deltaUnit, topStage,
  filledSides, hasResults, daysSince, RETEST_DAYS, KNAPP,
  overallScore, testScore, bandFor, asymmetries,
} from '../mobility.js';

/** Läuft gerade eine Messung? Dann stehen hier die Werte und der Schritt. */
let messung = null;

/** Welche Seite gerade eingetragen wird, je Prüfung. */
let aktiveSeite = {};

/** Abbruchfunktion der Stoppuhr, damit sie beim Neuzeichnen nicht weiterläuft. */
let uhrAbbrechen = null;

/** Datum der Messung, deren Auswertung gerade gezeigt wird. */
let ergebnisVon = null;

export function begin() {
  messung = { werte: {}, schritt: 0 };
  aktiveSeite = {};
  ergebnisVon = null;
}

/** Öffnet die Auswertung einer bereits gespeicherten Messung. */
export function showResult(dateKey) {
  messung = null;
  ergebnisVon = dateKey;
}

const einsNach = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
const mitVorzeichen = (n) => (n > 0 ? '+' : '') + einsNach(n);

function mmss(sekunden) {
  const m = Math.floor(sekunden / 60);
  const s = sekunden % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Letzte Messung mit brauchbaren Werten, ohne die von heute. */
function vorherige(tests, ausser) {
  return [...tests]
    .filter((t) => t.date !== ausser && hasResults(t))
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null;
}

/* ---------------- Eine Prüfung ---------------- */

function anleitung(test) {
  return el('div', { class: 'stack' },
    el('h3', { class: 'howto-head', text: 'So gehts' }),
    el('ol', { class: 'howto' }, ...test.setup.map((s) => el('li', { text: s }))),
    el('h3', { class: 'howto-head', text: 'Zählt nicht' }),
    el('ul', { class: 'nogo' }, ...test.notCounted.map((s) => el('li', { text: s }))));
}

/** Chips zum Umschalten zwischen links und rechts, mit dem Stand daneben. */
function seitenwahl(test, werte, aufWechsel) {
  const gruppe = el('div', { class: 'chips' });

  for (const feld of ['links', 'rechts']) {
    const wert = werte[feld];
    const label = feld === 'links' ? 'Links' : 'Rechts';
    const chip = el('button', {
      class: 'chip', type: 'button',
      'aria-pressed': aktiveSeite[test.id] === feld ? 'true' : 'false',
      onClick: () => { aktiveSeite[test.id] = feld; aufWechsel(); },
    }, typeof wert === 'number' ? `${label} · ${einsNach(wert + 1)}` : label);
    gruppe.append(chip);
  }

  return gruppe;
}

/** Die Stufenliste. Ein Tipp setzt die Stufe für die gerade aktive Seite. */
function stufenliste(test, neuZeichnen) {
  const felder = fieldsFor(test);
  const feld = test.perSide ? (aktiveSeite[test.id] || 'links') : 'stufe';
  const werte = messung.werte[test.id] || {};
  const gewaehlt = werte[feld];

  const liste = el('div', { class: 'optcards' });

  test.stages.forEach(([titel, beschreibung], i) => {
    const genau = gewaehlt === i;
    const knapp = gewaehlt === i - KNAPP;
    const karte = el('button', {
      class: 'optcard', type: 'button',
      'aria-pressed': genau || knapp ? 'true' : 'false',
      onClick: () => {
        messung.werte[test.id] = { ...werte };
        // Nochmal auf dieselbe Stufe: wieder abwählen. Sonst bleibt man an
        // einem Fehlgriff kleben, ohne Weg zurück.
        messung.werte[test.id][feld] = genau ? undefined : i;
        if (messung.werte[test.id][feld] === undefined) delete messung.werte[test.id][feld];

        // Nach der ersten Seite gleich zur zweiten springen, solange die noch
        // leer ist — sonst trägt man versehentlich zweimal dieselbe ein.
        if (test.perSide && !genau) {
          const andere = feld === 'links' ? 'rechts' : 'links';
          if (typeof messung.werte[test.id][andere] !== 'number') aktiveSeite[test.id] = andere;
        }
        neuZeichnen();
      },
    },
      el('span', { class: 'optcard-title', text: `${i + 1}. ${titel}` }),
      beschreibung ? el('span', { class: 'optcard-desc', text: beschreibung }) : null,
      knapp ? el('span', { class: 'optcard-meta', text: 'knapp' }) : null);
    liste.append(karte);
  });

  const knappMoeglich = typeof gewaehlt === 'number' && gewaehlt > 0;
  const istKnapp = typeof gewaehlt === 'number' && !Number.isInteger(gewaehlt);

  const knappSchalter = el('button', {
    class: 'chip', type: 'button', disabled: !knappMoeglich,
    'aria-pressed': istKnapp ? 'true' : 'false',
    onClick: () => {
      const jetzt = messung.werte[test.id][feld];
      messung.werte[test.id][feld] = istKnapp ? Math.ceil(jetzt) : jetzt - KNAPP;
      neuZeichnen();
    },
  }, 'Hat gerade so gereicht');

  return el('div', { class: 'stack' },
    liste,
    el('div', { class: 'chips mt-16' }, knappSchalter),
    el('p', { class: 'hint' },
      'Zwischen zwei Stufen? Nimm die höhere und tipp auf „Hat gerade so '
      + 'gereicht" — das zählt als halbe Stufe.'),
    felder.length > 1 && filledSides(test, messung.werte[test.id]) < 2
      ? el('p', { class: 'hint', text: 'Beide Seiten eintragen — sie sind selten gleich.' })
      : null);
}

/** Stoppuhr für die tiefe Hocke. */
function stoppuhr(test, neuZeichnen) {
  const werte = messung.werte[test.id] || {};
  let start = null;
  let ticker = null;
  let wakeLock = null;

  const uhr = el('div', { class: 'timer-clock tabular', text: mmss(werte.sekunden || 0) });
  const knopf = el('button', { class: 'btn btn-primary btn-lg timer-btn', type: 'button' },
    werte.sekunden ? 'Nochmal messen' : 'Start');
  const hinweis = el('div', { class: 'timer-hint' },
    werte.sekunden ? 'Gespeichert. Ein neuer Lauf überschreibt den Wert.' : 'Tipp auf Start, sobald du unten bist.');

  const aufraeumen = () => {
    if (ticker) clearInterval(ticker);
    ticker = null;
    start = null;
    try { wakeLock?.release(); } catch { /* egal */ }
    wakeLock = null;
  };
  uhrAbbrechen = aufraeumen;

  const stoppen = () => {
    if (start === null) return;
    const sekunden = Math.min(test.maxSeconds, Math.max(1, Math.round((Date.now() - start) / 1000)));
    aufraeumen();
    messung.werte[test.id] = { ...werte, sekunden };
    try { navigator.vibrate?.([140, 80, 140]); } catch { /* egal */ }
    neuZeichnen();
  };

  knopf.addEventListener('click', () => {
    if (start !== null) { stoppen(); return; }
    start = Date.now();
    knopf.textContent = 'Stopp';
    hinweis.textContent = 'Läuft. Stopp, sobald die Fersen abheben.';
    uhr.textContent = mmss(0);
    ticker = setInterval(() => {
      // Wer die App wegtippt, während die Uhr läuft, soll sie nicht im
      // Hintergrund weiterlaufen lassen. Die Ansicht selbst merkt nichts vom
      // Wechsel, also fragt die Uhr nach.
      if (document.getElementById('view-mobility')?.hidden) { aufraeumen(); return; }
      const s = Math.round((Date.now() - start) / 1000);
      uhr.textContent = mmss(s);
      if (s >= test.maxSeconds) stoppen();
    }, 250);
    // Der Bildschirm darf nicht ausgehen, während man in der Hocke sitzt.
    navigator.wakeLock?.request('screen').then((l) => { wakeLock = l; }).catch(() => {});
  });

  const tippen = el('input', {
    class: 'input', type: 'text', inputmode: 'numeric', placeholder: 'Sekunden',
    value: werte.sekunden ? String(werte.sekunden) : '',
  });
  tippen.addEventListener('change', () => {
    const zahl = parseNumber(tippen.value.trim());
    messung.werte[test.id] = Number.isFinite(zahl) && zahl > 0
      ? { sekunden: Math.min(test.maxSeconds, Math.round(zahl)) }
      : {};
  });

  return el('div', null,
    el('div', { class: 'timer' }, uhr, knopf, hinweis),
    el('details', { class: 'bridge-details' },
      el('summary', { text: 'Lieber selbst gestoppt?' }),
      el('p', { class: 'small mt-16', text: 'Dann trag die Sekunden hier ein.' }),
      tippen));
}

/* ---------------- Auswertung ---------------- */

/** Balken mit Punktzahl für eine einzelne Prüfung. */
function punktZeile(test, punkte, vorher) {
  const band = bandFor(punkte);
  const vergleich = typeof vorher === 'number' ? punkte - vorher : null;

  return el('div', { class: 'scorerow' },
    el('div', { class: 'row-between' },
      el('div', { class: 'grow' },
        el('div', { class: 'scorerow-name', text: test.name }),
        el('div', { class: 'muted small', text: band.name })),
      vergleich
        ? el('span', {
            class: `pill ${vergleich > 0 ? 'pill-ok' : 'pill-kcal'} tabular`,
            text: `${mitVorzeichen(vergleich)}`,
          })
        : null,
      el('div', { class: 'scorerow-num tabular', text: String(punkte) })),
    el('div', { class: 'scorebar' },
      el('i', { style: { width: `${Math.max(2, punkte)}%` } })));
}

function ergebnisAnsicht(container, ctx, record) {
  const alle = (ctx.state.mobility || []).filter(hasResults);
  const davor = vorherige(alle, record.date);
  const jetzt = overallScore(record);
  const alt = davor ? overallScore(davor) : null;

  const head = viewHead('Auswertung',
    formatDateKey(record.date),
    iconButton('back', 'Zurück', () => { ergebnisVon = null; ctx.go('progress'); }));

  const gesamtDelta = alt ? jetzt.punkte - alt.punkte : null;

  const kopf = el('div', { class: 'card stack' },
    el('div', { class: 'score' },
      el('div', { class: 'score-num tabular', text: String(jetzt.punkte) },
        el('span', { class: 'score-of', text: ' / 100' })),
      el('div', { class: 'score-band', text: jetzt.band.name }),
      gesamtDelta
        ? el('span', {
            class: `pill ${gesamtDelta > 0 ? 'pill-ok' : 'pill-kcal'} tabular`,
            text: `${mitVorzeichen(gesamtDelta)} Punkte gegenüber ${formatDateKey(davor.date)}`,
          })
        : null),
    el('p', { class: 'small', text: jetzt.band.text }),
    el('p', { class: 'hint',
      text: jetzt.anzahl === jetzt.von
        ? 'Gerechnet aus allen fünf Prüfungen.'
        : `Gerechnet aus ${jetzt.anzahl} von ${jetzt.von} Prüfungen — übersprungene zählen nicht mit.` }));

  const zeilen = el('div', { class: 'card stack' },
    el('h3', { class: 'card-title', text: 'Die einzelnen Prüfungen' }),
    ...jetzt.einzeln.map(({ test, punkte }) =>
      punktZeile(test, punkte, davor ? testScore(test, davor.results[test.id]) : null)));

  const hebel = jetzt.anzahl > 1
    ? el('div', { class: 'note' },
        el('strong', { text: `Größter Hebel: ${jetzt.schwaechste.test.name}. ` }),
        `${jetzt.schwaechste.test.why} Am anderen Ende steht `
        + `${jetzt.staerkste.test.name} mit ${jetzt.staerkste.punkte} Punkten.`)
    : null;

  const schief = asymmetries(record);
  const seiten = schief.length
    ? el('div', { class: 'card stack' },
        el('h3', { class: 'card-title', text: 'Ungleiche Seiten' }),
        el('p', { class: 'muted small' },
          'Das verschluckt die Gesamtzahl: im Mittel sieht ein Unterschied '
          + 'unauffällig aus. Beim Dehnen lohnt es, die schwächere Seite länger zu halten.'),
        ...schief.map((s) => el('div', { class: 'calcrow' },
          el('div', { class: 'grow' },
            el('div', { text: s.test.name }),
            el('div', { class: 'muted small', text: `${s.schwaecher} ist die schwächere Seite` })),
          el('div', { class: 'tabular',
            text: `${einsNach(s.unterschied)} ${s.unterschied === 1 ? 'Stufe' : 'Stufen'}` }))))
    : null;

  const einordnung = el('p', { class: 'hint' },
    'Die Punkte vergleichen dich mit gängigen Richtwerten, nicht mit anderen Menschen: '
    + 'die Zehen erreichen, das Knie eine Handbreit vor der Wand, die Finger an der '
    + 'unteren Schulterblattspitze — dort liegt jeweils die Grenze zu „gut". Ihr '
    + 'eigentlicher Wert liegt darin, dass du sie in vier Wochen wieder ausrechnen kannst.');

  const fertig = el('button', {
    class: 'btn btn-primary btn-block btn-lg mt-16', type: 'button',
    onClick: () => { ergebnisVon = null; ctx.go('progress'); },
  }, 'Fertig');

  mount(container, head, el('div', null,
    kopf,
    el('div', { class: 'mt-16' }, zeilen),
    hebel ? el('div', { class: 'mt-16' }, hebel) : null,
    seiten ? el('div', { class: 'mt-16' }, seiten) : null,
    el('div', { class: 'mt-16' }, einordnung),
    fertig));
}

/* ---------------- Ansicht ---------------- */

export async function render(container, ctx) {
  if (uhrAbbrechen) { uhrAbbrechen(); uhrAbbrechen = null; }

  // Auswertung einer gespeicherten Messung — nicht der Test selbst.
  if (ergebnisVon) {
    const record = (ctx.state.mobility || []).find((t) => t.date === ergebnisVon);
    if (record && hasResults(record)) { ergebnisAnsicht(container, ctx, record); return; }
    ergebnisVon = null;
  }

  if (!messung) messung = { werte: {}, schritt: 0 };

  const heute = localDateKey();
  const letzte = vorherige(ctx.state.mobility || [], heute);
  const schritte = MOBILITY_TESTS.length + 1;   // Einleitung plus die Prüfungen
  const schritt = Math.min(messung.schritt, schritte - 1);
  const neuZeichnen = () => ctx.reload();

  const zurueck = () => {
    if (uhrAbbrechen) { uhrAbbrechen(); uhrAbbrechen = null; }
    if (schritt === 0) { messung = null; ctx.go('progress'); return; }
    messung.schritt = schritt - 1;
    neuZeichnen();
  };

  const head = viewHead('Beweglichkeitstest',
    schritt === 0 ? 'Vorbereitung' : `Prüfung ${schritt} von ${MOBILITY_TESTS.length}`,
    iconButton('back', 'Zurück', zurueck));

  const balken = el('div', { class: 'stepbar' },
    ...Array.from({ length: schritte }, (_, i) =>
      el('i', { class: i <= schritt ? 'on' : '' })));

  const body = [balken];

  if (schritt === 0) {
    body.push(el('div', { class: 'card stack' },
      el('h2', { class: 'card-title', text: 'Fünf Prüfungen, etwa zehn Minuten' }),
      el('p', { class: 'small' },
        'Du brauchst nichts außer einer Wand und etwas Platz auf dem Boden. Kein '
        + 'Maßband: bei jeder Prüfung schaust du nach, wie weit du kommst, und '
        + 'wählst aus einer Liste die Beschreibung, die passt.'),
      el('p', { class: 'hint' },
        'Beweg dich vorher fünf Minuten locker. Kalt gemessen fällt jeder Wert '
        + 'schlechter aus, und wer mal warm und mal kalt misst, vergleicht nichts.'),
      el('p', { class: 'hint' },
        'Barfuß, in Kleidung, in der du dich bewegen kannst. Zwei Prüfungen gehen '
        + 'je Seite einzeln — die Hüften und Schultern sind selten gleich.'),
      el('p', { class: 'hint' },
        `Sinnvoll etwa alle ${RETEST_DAYS} Tage. Öfter zu messen zeigt vor allem `
        + 'Tagesform, nicht Fortschritt.'),
      letzte
        ? el('p', { class: 'hint', text: `Deine letzte Messung: ${formatDateKey(letzte.date)}.` })
        : null));
  } else {
    const test = MOBILITY_TESTS[schritt - 1];
    if (test.perSide && !aktiveSeite[test.id]) aktiveSeite[test.id] = 'links';

    const vorwert = letzte ? summarise(test, letzte.results[test.id]) : null;
    const vorLabel = vorwert == null
      ? null
      : standLabel(test, letzte.results[test.id]) || `Stufe ${einsNach(vorwert + 1)} im Mittel`;

    body.push(el('div', { class: 'card stack' },
      el('h2', { class: 'card-title', text: test.name }),
      el('p', { class: 'muted small', text: test.why }),
      anleitung(test)));

    body.push(el('div', { class: 'card stack mt-16' },
      el('h3', { class: 'card-title',
        text: test.kind === 'zeit' ? 'Zeit nehmen' : 'Wie weit bist du gekommen?' }),
      test.sideNote ? el('p', { class: 'muted small', text: test.sideNote }) : null,
      test.perSide ? seitenwahl(test, messung.werte[test.id] || {}, neuZeichnen) : null,
      test.kind === 'zeit' ? stoppuhr(test, neuZeichnen) : stufenliste(test, neuZeichnen),
      vorLabel ? el('p', { class: 'hint', text: `Beim letzten Mal: ${vorLabel}` }) : null));
  }

  const letzterSchritt = schritt === schritte - 1;

  const weiter = el('button', {
    class: 'btn btn-primary grow', type: 'button',
    onClick: async () => {
      if (!letzterSchritt) {
        messung.schritt = schritt + 1;
        neuZeichnen();
        return;
      }

      // Leere Prüfungen weglassen — lieber drei ehrliche Werte als fünf, von
      // denen zwei geraten sind.
      const ergebnisse = {};
      for (const test of MOBILITY_TESTS) {
        const werte = messung.werte[test.id];
        if (!werte) continue;
        const gefuellt = Object.fromEntries(
          Object.entries(werte).filter(([, v]) => typeof v === 'number' && Number.isFinite(v))
        );
        if (Object.keys(gefuellt).length) ergebnisse[test.id] = gefuellt;
      }

      if (!Object.keys(ergebnisse).length) {
        toast('Noch keine einzige Prüfung eingetragen.');
        return;
      }

      await saveMobilityTest(heute, ergebnisse);
      await ctx.refreshTraining();
      // Erst die Auswertung, dann der Fortschritt. Die Zahl ist der Lohn für
      // zehn Minuten Messen — die soll man nicht suchen müssen.
      messung = null;
      ergebnisVon = heute;
      neuZeichnen();
      toast('Messung gespeichert.');
    },
  }, letzterSchritt ? 'Messung speichern' : schritt === 0 ? 'Los gehts' : 'Weiter');

  const ueberspringen = schritt > 0 && !letzterSchritt
    ? el('button', {
        class: 'btn', type: 'button',
        onClick: () => { messung.schritt = schritt + 1; neuZeichnen(); },
      }, 'Überspringen')
    : null;

  body.push(el('div', { class: 'row mt-16' },
    schritt > 0 ? el('button', { class: 'btn', type: 'button', onClick: zurueck }, 'Zurück') : null,
    ueberspringen,
    weiter));

  mount(container, head, el('div', null, ...body));
}

/* ---------------- Verlauf, eingebunden im Fortschritt ---------------- */

/**
 * Karte für die Fortschrittsansicht: letzter Stand je Prüfung samt
 * Veränderung zur Messung davor.
 */
export function mobilitySection(ctx) {
  const heute = localDateKey();
  const brauchbar = (ctx.state.mobility || []).filter(hasResults);
  const letzte = brauchbar.length ? brauchbar[brauchbar.length - 1] : null;
  const davor = letzte ? vorherige(brauchbar, letzte.date) : null;
  const tage = letzte ? daysSince(letzte.date, heute) : null;

  const knopf = el('button', {
    class: 'btn btn-block', type: 'button',
    onClick: () => ctx.startMobility(),
  }, letzte ? 'Neue Messung' : 'Test durchführen');

  if (!letzte) {
    return el('div', { class: 'card' },
      emptyState('Noch nicht gemessen',
        'Fünf Prüfungen, etwa zehn Minuten, ohne Hilfsmittel. Danach siehst du alle '
        + 'paar Wochen schwarz auf weiß, ob sich beim Dehnen etwas tut.'),
      knopf);
  }

  const zeilen = MOBILITY_TESTS.map((test) => {
    const jetzt = summarise(test, letzte.results[test.id]);
    if (jetzt == null) return null;

    const vorher = davor ? summarise(test, davor.results[test.id]) : null;
    const vergleich = vorher != null ? compare(test, jetzt, vorher) : null;

    // Bei ungleichen Seiten gibt es keine ehrliche Beschriftung — dann steht
    // dort, worum es bei der Prüfung überhaupt geht.
    const label = test.kind === 'zeit' ? null : standLabel(test, letzte.results[test.id]);
    const stand = test.kind === 'zeit'
      ? `${einsNach(jetzt)} s`
      : `${einsNach(jetzt + 1)} / ${topStage(test) + 1}`;

    return el('div', { class: 'calcrow' },
      el('div', { class: 'grow' },
        el('div', { text: test.name }),
        el('div', { class: 'muted small', text: label || test.why })),
      vergleich && !vergleich.gleich
        ? el('span', {
            class: `pill ${vergleich.besser ? 'pill-ok' : 'pill-kcal'} tabular`,
            text: `${mitVorzeichen(vergleich.delta)} ${deltaUnit(test, vergleich.delta)}`,
          })
        : null,
      el('div', { class: 'tabular', text: stand }));
  }).filter(Boolean);

  const punkte = overallScore(letzte);
  const altePunkte = davor ? overallScore(davor) : null;
  const gesamtDelta = punkte && altePunkte ? punkte.punkte - altePunkte.punkte : null;

  const kopf = punkte
    ? el('button', {
        class: 'card scorecard', type: 'button',
        onClick: () => { showResult(letzte.date); ctx.go('mobility'); },
      },
        el('div', { class: 'score-num tabular', text: String(punkte.punkte) },
          el('span', { class: 'score-of', text: ' / 100' })),
        el('div', { class: 'grow' },
          el('div', { class: 'score-band', text: punkte.band.name }),
          el('div', { class: 'muted small',
            text: punkte.anzahl === punkte.von
              ? 'Aus allen fünf Prüfungen'
              : `Aus ${punkte.anzahl} von ${punkte.von} Prüfungen` })),
        gesamtDelta
          ? el('span', {
              class: `pill ${gesamtDelta > 0 ? 'pill-ok' : 'pill-kcal'} tabular`,
              text: mitVorzeichen(gesamtDelta),
            })
          : null)
    : null;

  return el('div', null,
    kopf,
    el('div', { class: kopf ? 'card card-flush mt-16' : 'card card-flush' }, ...zeilen),
    el('p', { class: 'hint mt-16',
      text: (tage === 0 ? 'Heute gemessen' : `Letzte Messung vor ${tage} ${tage === 1 ? 'Tag' : 'Tagen'}`)
        + (davor ? ', verglichen mit der Messung davor.' : '. Beim nächsten Mal gibt es einen Vergleich.')
        + (punkte ? ' Tipp auf die Punktzahl für die ganze Auswertung.' : '') }),
    el('div', { class: 'mt-16' }, knopf));
}
