/**
 * Beckenboden: Kachel auf der Tagesleiste und die geführte Übung.
 *
 * Die Übung braucht eine Uhr, die von selbst weiterläuft — anders als beim
 * Krafttraining. Dort misst man eine Leistung und tippt danach, hier folgt man
 * einer Ansage: anspannen, halten, loslassen, wieder. Wer dabei auf den Zähler
 * schauen muss, macht die Übung nicht richtig, deshalb sagen Ton und Vibration
 * jeden Wechsel an und der Bildschirm bleibt nur an, damit man sie zur Not
 * ablesen kann.
 *
 * Das Loslassen bekommt genauso viel Platz und Ansage wie das Anspannen. Das
 * ist keine Höflichkeit gegenüber der Pause, sondern der Punkt: Ein
 * Beckenboden, der nur noch anspannt und nicht mehr loslässt, macht eigene
 * Probleme.
 */

import {
  el, mount, viewHead, iconButton, toast, beep, laufendeUhren,
} from '../ui.js';
import { addKegelRun, removeKegelRun } from '../store.js';
import { localDateKey, shiftDateKey } from '../nutrition.js';
import {
  STUFEN, ablauf, dauerSekunden, stufeNach, bisNaechste, dayCount, streak, gesamt,
  ANLEITUNG, NUTZEN, ARZT, GENUG_AM_TAG, DURCHGAENGE_JE_STUFE,
} from '../kegel.js';

const BELEG_TEXT = { gut: 'gut belegt', mittel: 'mittelmäßig belegt' };

/* ---------------- Kachel für die Tagesleiste ---------------- */

export function kegelStatus(ctx, dateKey) {
  const heute = dayCount(ctx.state.kegel, dateKey);
  return {
    id: 'becken',
    icon: '🔺',
    label: 'Becken',
    wert: heute ? `${heute}×` : '—',
    zustand: heute >= 2 ? 'gut' : heute ? 'offen' : 'leer',
  };
}

/* ---------------- Karte hinter der Kachel ---------------- */

export function kegelSection(ctx, dateKey) {
  const eintraege = ctx.state.kegel || [];
  const heute = dayCount(eintraege, dateKey);
  const bisher = gesamt(eintraege);
  const s = stufeNach(bisher);
  const serie = streak(eintraege, dateKey, shiftDateKey);
  const fehlt = bisNaechste(bisher);
  const minuten = Math.round(dauerSekunden(s) / 60);

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Beckenboden' }),
      el('span', { class: `pill ${heute ? 'pill-ok' : 'pill-kcal'} tabular`,
        text: heute ? `${heute}× heute` : 'offen' })),

    el('div', { class: 'row-between' },
      el('span', { class: 'small' },
        el('strong', { text: `Stufe ${s.nr} · ${s.name}` })),
      el('span', { class: 'muted small tabular',
        text: `${s.halten.wiederholungen}× ${s.halten.sekunden} s · ${s.schnell.wiederholungen} schnelle · ${minuten} Min` })),

    el('p', { class: 'muted small', text: s.ziel }),

    serie >= 3
      ? el('p', { class: 'hint', text: `${serie} Tage in Folge.` })
      : null,

    fehlt !== null && bisher > 0
      ? el('p', { class: 'muted small',
          text: `Noch ${fehlt} ${fehlt === 1 ? 'Durchgang' : 'Durchgänge'} bis Stufe ${s.nr + 1}.` })
      : null,

    // Ab drei am Tag bringt mehr nichts und kann schaden. Das steht da, statt
    // stillschweigend weiterzuzählen.
    heute >= GENUG_AM_TAG
      ? el('p', { class: 'hint',
          text: `${heute} Durchgänge heute — das reicht. Mehr bringt nichts, und ein `
            + 'dauerhaft angespannter Beckenboden macht eigene Probleme.' })
      : null,

    el('div', { class: 'row' },
      el('button', {
        class: 'btn btn-primary grow', type: 'button',
        onClick: () => { begin(); ctx.go('kegel'); },
      }, heute ? 'Noch ein Durchgang' : 'Durchgang starten'),
      heute
        ? el('button', {
            class: 'btn', type: 'button',
            onClick: async () => {
              await removeKegelRun(dateKey);
              await ctx.refreshDaily();
              ctx.reload();
              toast('Zurückgenommen.');
            },
          }, 'Rückgängig')
        : null));
}

/* ---------------- Die geführte Übung ---------------- */

/** Läuft gerade ein Durchgang? Überlebt keinen Ansichtswechsel. */
let laufend = null;

export function begin() {
  laufend = null;
}

/**
 * Der Ablauf als selbstlaufende Uhr.
 *
 * Ein Abschnitt nach dem anderen, jeder mit eigener Dauer. Gewechselt wird über
 * die Wanduhr und nicht über einen Zähler, der hochzählt: Ein Handy, das
 * zwischendurch den Bildschirm abschaltet, drosselt Zeitgeber — die verstrichene
 * Zeit stimmt trotzdem.
 */
function uhr(schritte, { aufSchritt, fertig }) {
  let i = 0;
  let beginn = Date.now();
  let ticker = null;
  let audio = null;
  let wakeLock = null;

  const abbrechen = () => {
    if (ticker) clearInterval(ticker);
    ticker = null;
    try { wakeLock?.release(); } catch { /* egal */ }
    wakeLock = null;
    laufendeUhren.delete(abbrechen);
  };

  const ansagen = (schritt) => {
    try { navigator.vibrate?.(schritt.art === 'an' ? [140] : [60]); } catch { /* egal */ }
    if (!audio) return;
    // Anspannen höher als Loslassen — man soll die beiden ohne Hinsehen
    // auseinanderhalten können.
    if (schritt.art === 'an') beep(audio, 0.14, 880);
    else if (schritt.art === 'aus') beep(audio, 0.14, 520);
    else if (schritt.art === 'fertig') { beep(audio, 0.2, 660); setTimeout(() => beep(audio, 0.25, 880), 240); }
  };

  const weiter = () => {
    i += 1;
    beginn = Date.now();
    if (i >= schritte.length) { abbrechen(); fertig(); return; }
    ansagen(schritte[i]);
    aufSchritt(schritte[i], i, schritte[i].sekunden);
  };

  try {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    audio.resume?.();
  } catch { audio = null; }
  navigator.wakeLock?.request('screen').then((lock) => { wakeLock = lock; }).catch(() => {});

  laufendeUhren.add(abbrechen);
  ansagen(schritte[0]);
  aufSchritt(schritte[0], 0, schritte[0].sekunden);

  ticker = setInterval(() => {
    const rest = schritte[i].sekunden - (Date.now() - beginn) / 1000;
    if (rest <= 0) weiter();
    else aufSchritt(schritte[i], i, rest);
  }, 100);

  return { abbrechen };
}

export async function render(container, ctx) {
  const dateKey = localDateKey();
  const bisher = gesamt(ctx.state.kegel || []);
  const s = stufeNach(bisher);
  const schritte = ablauf(s);

  const head = viewHead('Beckenboden',
    `Stufe ${s.nr} · ${s.name}`,
    iconButton('back', 'Zurück', () => {
      laufend?.abbrechen();
      laufend = null;
      ctx.go('today');
    }));

  /* --- Anzeige --- */
  const kreis = el('div', { class: 'kegelkreis' });
  const wort = el('div', { class: 'kegelwort', text: 'Bereit?' });
  const zaehler = el('div', { class: 'kegelzahl tabular', text: '' });
  const fortschritt = el('div', { class: 'muted small', text: '' });

  const knopf = el('button', { class: 'btn btn-primary btn-block btn-lg', type: 'button' });

  const zeigen = (schritt, index, rest) => {
    const sek = Math.max(0, Math.ceil(rest));
    kreis.className = `kegelkreis k-${schritt.art}${schritt.schnell ? ' schnell' : ''}`;
    wort.textContent = schritt.text;
    zaehler.textContent = schritt.sekunden > 1 ? String(sek) : '';
    fortschritt.textContent = schritt.nummer
      ? `${schritt.nummer} von ${schritt.von}${schritt.schnell ? ' · schnelle' : ''}`
      : '';
    // Die Skala läuft über die Dauer des Abschnitts, damit man am Kreis sieht,
    // wie lange noch — ohne die Zahl zu lesen.
    const anteil = schritt.sekunden ? 1 - rest / schritt.sekunden : 1;
    kreis.style.setProperty('--anteil', String(Math.min(1, Math.max(0, anteil))));
  };

  const beenden = async () => {
    laufend = null;
    await addKegelRun(dateKey, s.nr);
    await ctx.refreshDaily();
    kreis.className = 'kegelkreis k-fertig';
    wort.textContent = 'Fertig.';
    zaehler.textContent = '';
    fortschritt.textContent = `Durchgang eingetragen · ${dayCount(ctx.state.kegel, dateKey)}× heute`;
    knopf.textContent = 'Zurück zur Übersicht';
    knopf.onclick = () => ctx.go('today');
  };

  const starten = () => {
    knopf.textContent = 'Abbrechen';
    knopf.onclick = () => {
      laufend?.abbrechen();
      laufend = null;
      ctx.reload();
      toast('Abgebrochen — nichts eingetragen.');
    };
    laufend = uhr(schritte, { aufSchritt: zeigen, fertig: beenden });
  };

  const minuten = Math.round(dauerSekunden(s) / 60);
  knopf.textContent = `Start · rund ${minuten} ${minuten === 1 ? 'Minute' : 'Minuten'}`;
  knopf.onclick = starten;

  // Die Zahl steht im Kreis, nicht darunter — beim Halten schaut man auf einen
  // Punkt, nicht auf zwei.
  kreis.append(zaehler);
  const uhrKarte = el('div', { class: 'card stack kegelkarte' },
    kreis, wort, fortschritt, knopf);

  /* --- Anleitung --- */
  const anleitung = el('details', { class: 'card klappkarte mt-16' },
    el('summary', null,
      el('span', { class: 'grow', text: 'Wie es richtig geht' }),
      el('span', { class: 'muted small', text: 'wichtig' })),
    el('div', { class: 'stack mt-16' },
      ...ANLEITUNG.map((t) => el('p', { class: 'small', text: t })),
      el('p', { class: 'hint', text: ARZT.replace(/\*\*/g, '') })));

  /* --- Wofür --- */
  const nutzen = el('details', { class: 'card klappkarte mt-16' },
    el('summary', null,
      el('span', { class: 'grow', text: 'Wofür es belegt ist' }),
      el('span', { class: 'muted small', text: 'und wofür nicht' })),
    el('div', { class: 'stack mt-16' },
      ...NUTZEN.map((n) => el('div', { class: 'row-between' },
        el('span', { class: 'small grow', text: n.text }),
        el('span', { class: `pill supppill supp-${n.beleg}`, text: BELEG_TEXT[n.beleg] }))),
      el('p', { class: 'muted small',
        text: 'Für „stärkerer Orgasmus" oder „mehr Leistung im Sport" gibt es keinen '
          + 'belastbaren Beleg. Das steht hier, weil das die Versprechen sind, mit denen '
          + 'solche Übungen sonst verkauft werden.' })));

  /* --- Stufen --- */
  const stufenListe = el('details', { class: 'card klappkarte mt-16' },
    el('summary', null,
      el('span', { class: 'grow', text: 'Die Stufen' }),
      el('span', { class: 'muted small', text: `${DURCHGAENGE_JE_STUFE} Durchgänge je Stufe` })),
    el('div', { class: 'card-flush mt-16' },
      ...STUFEN.map((x) => el('div', { class: 'calcrow' },
        el('div', { class: 'grow' },
          el('div', { text: `${x.nr}. ${x.name}${x.nr === s.nr ? ' · jetzt' : ''}` }),
          el('div', { class: 'muted small', text: x.ziel })),
        el('div', { class: 'tabular small',
          text: `${x.halten.wiederholungen}× ${x.halten.sekunden} s` })))));

  mount(container, head, el('div', null, uhrKarte, anleitung, nutzen, stufenListe));
}
