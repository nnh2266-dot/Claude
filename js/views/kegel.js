/**
 * Beckenboden: Kachel auf der Tagesleiste und die geführten Übungen.
 *
 * Zwei Übungen, nicht eine. Der Kraftdurchgang ist das, was überall „Kegel"
 * heißt: anspannen, halten, loslassen. Der Lösen-Durchgang ist das Gegenteil
 * und steht gleichberechtigt daneben, weil ein Beckenboden, der nur noch
 * zumacht, eigene Probleme macht — bei Erektion und Samenerguss ist genau das
 * eine bekannte Ursache. Wer hier nur die Kraftseite anbietet, verkauft die
 * halbe Übung als ganze.
 *
 * Beide brauchen eine Uhr, die von selbst weiterläuft — anders als beim
 * Krafttraining. Dort misst man eine Leistung und tippt danach, hier folgt man
 * einer Ansage. Wer dabei auf den Zähler schauen muss, macht die Übung nicht
 * richtig, deshalb sagen Ton und Vibration jeden Wechsel an und der Bildschirm
 * bleibt nur an, damit man sie zur Not ablesen kann.
 */

import {
  el, mount, viewHead, iconButton, toast, beep, laufendeUhren,
} from '../ui.js';
import { addKegelRun, removeKegelRun } from '../store.js';
import { localDateKey, shiftDateKey } from '../nutrition.js';
import {
  STUFEN, POSITION, ablauf, loesenAblauf, loesenSekunden, dauerSekunden,
  stufeNach, bisNaechste, dayCount, dayLoesen, streak, gesamt,
  ANLEITUNG, LOESEN_ANLEITUNG, NUTZEN, SEX, DAUER, ANZEICHEN_FEST, ANZEICHEN_RAT,
  ARZT, DOSIS, DOSIS_TEXT, WARUM_KURZ, GENUG_AM_TAG, DURCHGAENGE_JE_STUFE,
} from '../kegel.js';

const BELEG_TEXT = { gut: 'gut belegt', mittel: 'mittelmäßig belegt', kein: 'nicht belegt' };

const ohneSterne = (t) => t.replace(/\*\*/g, '');

/* ---------------- Kachel für die Tagesleiste ---------------- */

export function kegelStatus(ctx, dateKey) {
  const heute = dayCount(ctx.state.kegel, dateKey);
  const geloest = dayLoesen(ctx.state.kegel, dateKey);
  return {
    id: 'becken',
    icon: '🔺',
    label: 'Becken',
    // Über der Tagesmenge steht die blanke Zahl — „3/2" liest sich wie ein Fehler.
    wert: heute ? (heute > DOSIS ? `${heute}×` : `${heute}/${DOSIS}`) : (geloest ? 'gelöst' : '—'),
    zustand: heute >= DOSIS ? 'gut' : (heute || geloest) ? 'offen' : 'leer',
  };
}

/* ---------------- Karte hinter der Kachel ---------------- */

export function kegelSection(ctx, dateKey) {
  const eintraege = ctx.state.kegel || [];
  const heute = dayCount(eintraege, dateKey);
  const geloest = dayLoesen(eintraege, dateKey);
  const bisher = gesamt(eintraege);
  const s = stufeNach(bisher);
  const serie = streak(eintraege, dateKey, shiftDateKey);
  const fehlt = bisNaechste(bisher);
  const minuten = Math.round(dauerSekunden(s) / 60);
  const pos = POSITION[s.position] || POSITION.liegend;

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Beckenboden' }),
      el('span', { class: `pill ${heute >= DOSIS ? 'pill-ok' : 'pill-kcal'} tabular`,
        text: heute > DOSIS ? `${heute}× heute` : `${heute} von ${DOSIS} heute` })),

    // „Kegel" steht dabei, weil das der Name ist, unter dem man danach sucht.
    el('p', { class: 'muted small', text: 'Kegel-Übungen — anderer Name, dieselbe Sache.' }),

    el('div', { class: 'row-between' },
      el('span', { class: 'small' },
        el('strong', { text: `Stufe ${s.nr} · ${s.name}` }),
        el('span', { class: 'muted', text: ` · ${pos.kurz}` })),
      el('span', { class: 'muted small tabular',
        text: `${s.halten.wiederholungen}× ${s.halten.sekunden} s · ${s.schnell.wiederholungen} schnelle · ${minuten} Min` })),

    el('p', { class: 'muted small', text: s.ziel }),

    // Die häufigste Frage überhaupt, deshalb ungefragt beantwortet.
    heute < DOSIS
      ? el('p', { class: 'muted small', text: DOSIS_TEXT })
      : heute < GENUG_AM_TAG
        ? el('p', { class: 'hint', text: 'Zwei geschafft — das reicht für heute.' })
        : null,

    serie >= 3
      ? el('p', { class: 'hint', text: `${serie} Tage in Folge.` })
      : null,

    fehlt !== null && bisher > 0
      ? el('p', { class: 'muted small',
          text: `Noch ${fehlt} ${fehlt === 1 ? 'Durchgang' : 'Durchgänge'} bis Stufe ${s.nr + 1}.` })
      : null,

    geloest
      ? el('p', { class: 'muted small',
          text: `${geloest}× gelöst heute — zählt nicht auf die Stufe, gehört aber dazu.` })
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
        onClick: () => { begin('kraft'); ctx.go('kegel'); },
      }, heute ? 'Noch ein Durchgang' : 'Durchgang starten'),
      el('button', {
        class: 'btn', type: 'button',
        onClick: () => { begin('loesen'); ctx.go('kegel'); },
      }, 'Lösen')),

    heute || geloest
      ? el('button', {
          class: 'btn btn-block', type: 'button',
          onClick: async () => {
            await removeKegelRun(dateKey, heute ? 'kraft' : 'loesen');
            await ctx.refreshDaily();
            ctx.reload();
            toast('Zurückgenommen.');
          },
        }, 'Letzten Durchgang zurücknehmen')
      : null);
}

/* ---------------- Die geführten Übungen ---------------- */

/** Läuft gerade ein Durchgang? Überlebt keinen Ansichtswechsel. */
let laufend = null;
/** Welche der beiden Übungen die Ansicht zeigt. */
let modus = 'kraft';

export function begin(art = 'kraft') {
  laufend = null;
  modus = art === 'loesen' ? 'loesen' : 'kraft';
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
    // auseinanderhalten können. Beim Lösen liegen beide Töne tiefer und näher
    // beieinander: Da soll nichts anspringen.
    if (schritt.art === 'an') beep(audio, 0.14, 880);
    else if (schritt.art === 'aus') beep(audio, 0.14, 520);
    else if (schritt.art === 'weit') beep(audio, 0.18, 440);
    else if (schritt.art === 'ruhe') beep(audio, 0.18, 330);
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
  const loesenModus = modus === 'loesen';
  const pos = POSITION[s.position] || POSITION.liegend;
  const schritte = loesenModus ? loesenAblauf() : ablauf(s);
  const sekunden = loesenModus ? loesenSekunden() : dauerSekunden(s);

  const head = viewHead(loesenModus ? 'Lösen' : 'Beckenboden',
    loesenModus ? 'Nichts anspannen — nur atmen' : `Stufe ${s.nr} · ${s.name} · ${pos.kurz}`,
    iconButton('back', 'Zurück', () => {
      laufend?.abbrechen();
      laufend = null;
      ctx.go('today');
    }));

  /* --- Anzeige --- */
  const kreis = el('div', { class: 'kegelkreis' });
  const wort = el('div', { class: 'kegelwort', text: 'Bereit?' });
  const zaehler = el('div', { class: 'kegelzahl tabular', text: '' });
  // Steht vor dem Start: Position und Tagesmenge. Sobald die Uhr läuft,
  // trägt dieselbe Zeile die Ansage des Abschnitts.
  const hinweis = el('div', { class: 'muted small' });
  const fortschritt = el('div', { class: 'muted small', text: '' });

  const knopf = el('button', { class: 'btn btn-primary btn-block btn-lg', type: 'button' });

  const zeigen = (schritt, index, rest) => {
    const sek = Math.max(0, Math.ceil(rest));
    kreis.className = `kegelkreis k-${schritt.art}${schritt.schnell ? ' schnell' : ''}`;
    wort.textContent = schritt.text;
    zaehler.textContent = schritt.sekunden > 1 ? String(sek) : '';
    hinweis.textContent = schritt.hinweis || '';
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
    await addKegelRun(dateKey, s.nr, loesenModus ? 'loesen' : 'kraft');
    await ctx.refreshDaily();
    kreis.className = 'kegelkreis k-fertig';
    wort.textContent = 'Fertig.';
    zaehler.textContent = '';
    hinweis.textContent = '';
    fortschritt.textContent = loesenModus
      ? `Gelöst · ${dayLoesen(ctx.state.kegel, dateKey)}× heute`
      : `Durchgang eingetragen · ${dayCount(ctx.state.kegel, dateKey)}× heute`;
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

  const minuten = Math.max(1, Math.round(sekunden / 60));
  if (!loesenModus) hinweis.textContent = `${pos.lang} ${DOSIS_TEXT}`;
  knopf.textContent = `Start · rund ${minuten} ${minuten === 1 ? 'Minute' : 'Minuten'}`;
  knopf.onclick = starten;

  // Die Zahl steht im Kreis, nicht darunter — beim Halten schaut man auf einen
  // Punkt, nicht auf zwei.
  kreis.append(zaehler);
  const uhrKarte = el('div', { class: 'card stack kegelkarte' },
    kreis, wort, hinweis, fortschritt, knopf);

  /* --- Anleitung, je nach Übung eine andere --- */
  const anleitung = el('details', { class: 'card klappkarte mt-16' },
    el('summary', null,
      el('span', { class: 'grow', text: 'Wie es richtig geht' }),
      el('span', { class: 'muted small', text: 'wichtig' })),
    el('div', { class: 'stack mt-16' },
      ...(loesenModus ? LOESEN_ANLEITUNG : ANLEITUNG).map((t) => el('p', { class: 'small', text: t })),
      loesenModus ? null : el('p', { class: 'hint', text: WARUM_KURZ }),
      el('p', { class: 'hint', text: ohneSterne(ARZT) })));

  /* --- Sex: der Grund, aus dem die meisten hier landen --- */
  const sex = el('details', { class: 'card klappkarte mt-16' },
    el('summary', null,
      el('span', { class: 'grow', text: 'Hilft das beim Sex?' }),
      el('span', { class: 'muted small', text: 'mit Zahlen' })),
    el('div', { class: 'stack mt-16' },
      ...SEX.map((x) => el('div', { class: 'stack-tight' },
        el('div', { class: 'row-between' },
          el('span', { class: 'small grow' }, el('strong', { text: x.titel })),
          el('span', { class: `pill supppill supp-${x.beleg === 'kein' ? 'duenn' : x.beleg}`,
            text: BELEG_TEXT[x.beleg] })),
        x.zahl ? el('div', { class: 'tabular', text: x.zahl }) : null,
        el('p', { class: 'muted small', text: x.text }))),
      el('p', { class: 'hint', text: DAUER })));

  /* --- Der zu feste Beckenboden --- */
  const fest = el('details', { class: 'card klappkarte mt-16' },
    el('summary', null,
      el('span', { class: 'grow', text: 'Wenn es sich fest anfühlt' }),
      el('span', { class: 'muted small', text: 'dann nicht anspannen' })),
    el('div', { class: 'stack mt-16' },
      el('p', { class: 'small',
        text: 'Ein dauerhaft verspannter Beckenboden verursacht dieselben Beschwerden, '
          + 'gegen die man hier trainiert — Erektionsprobleme, zu frühen Samenerguss, '
          + 'Schmerzen. Anspannen macht das schlimmer, nicht besser.' }),
      el('ul', { class: 'liste small' },
        ...ANZEICHEN_FEST.map((t) => el('li', { text: t }))),
      el('p', { class: 'hint', text: ohneSterne(ANZEICHEN_RAT) }),
      el('button', {
        class: 'btn btn-block', type: 'button',
        onClick: () => { begin('loesen'); ctx.reload(); },
      }, 'Lösen statt anspannen')));

  /* --- Wofür --- */
  const nutzen = el('details', { class: 'card klappkarte mt-16' },
    el('summary', null,
      el('span', { class: 'grow', text: 'Wofür es belegt ist' }),
      el('span', { class: 'muted small', text: 'und wofür nicht' })),
    el('div', { class: 'stack mt-16' },
      ...NUTZEN.map((n) => el('div', { class: 'row-between' },
        el('span', { class: 'small grow', text: n.text }),
        el('span', { class: `pill supppill supp-${n.beleg}`, text: BELEG_TEXT[n.beleg] })))));

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
        el('div', { class: 'small' },
          el('div', { class: 'tabular', text: `${x.halten.wiederholungen}× ${x.halten.sekunden} s` }),
          el('div', { class: 'muted', text: (POSITION[x.position] || {}).kurz || '' }))))));

  mount(container, head,
    el('div', null, uhrKarte, anleitung, sex, fest, nutzen, stufenListe));
}
