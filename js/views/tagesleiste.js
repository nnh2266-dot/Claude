/**
 * Die Tagesleiste: Schlaf, Sport, Trinken und Ergänzung auf einem Streifen.
 *
 * Vorher standen die vier als vier volle Karten untereinander, jede mit
 * Überschrift, Erklärtext und Knöpfen. Zusammen waren das gut zwei
 * Bildschirmhöhen, an denen man jeden Tag vorbeiscrollt — für vier Zahlen, die
 * man im Vorbeigehen prüfen will.
 *
 * Jetzt sind es vier Kacheln mit je einer Zahl und einem Zustand. Antippen
 * klappt genau eine davon auf; die volle Karte ist dieselbe wie vorher, sie
 * liegt nur nicht mehr dauernd offen. Welche offen war, überlebt das
 * Neuzeichnen — sonst würde die Karte bei jedem Eintrag zuklappen, und genau
 * dann will man noch etwas eintragen.
 *
 * Aufgeklappt bleibt immer nur eine. Zwei gleichzeitig wären wieder der alte
 * Zustand, nur mit mehr Klickerei davor.
 */

import { el } from '../ui.js';
import { localDateKey } from '../nutrition.js';
import { dayTotals } from '../activities.js';
import { duration as schlafDauer, isComplete as nachtVoll, formatDauer, SOLL_MIN } from '../sleep.js';
import { dailyGoal as wasserZiel, formatMl } from '../water.js';
import { resolve as suppsAufloesen, dayStatus as suppStand } from '../supplements.js';

import { sleepSection } from './sleep.js';
import { activitySection } from './activity.js';
import { waterSection } from './water.js';
import { supplementSection } from './supplements.js';

/** Welche Kachel offen ist. Überlebt das Neuzeichnen, nicht den Neustart. */
const SCHLUESSEL = 'tagesleiste-offen';

function offeneKachel() {
  try { return sessionStorage.getItem(SCHLUESSEL) || null; } catch { return null; }
}

function setOffeneKachel(id) {
  try {
    if (id) sessionStorage.setItem(SCHLUESSEL, id);
    else sessionStorage.removeItem(SCHLUESSEL);
  } catch { /* egal */ }
}

/**
 * Zustand je Kachel.
 *
 * Drei Stufen, und die mittlere ist die wichtige: „offen" heißt, dass heute
 * noch etwas fehlt, was heute noch geht. Grau heißt, dass nichts eingetragen
 * ist — das ist etwas anderes als eine Null.
 */
function kacheln(ctx, dateKey) {
  const heute = localDateKey();
  const kg = ctx.state.profile?.weight || null;
  const liste = [];

  /* Schlaf */
  const nacht = (ctx.state.sleep || []).find((n) => n.date === dateKey);
  const dauer = nacht && nachtVoll(nacht) ? schlafDauer(nacht) : null;
  liste.push({
    id: 'schlaf',
    icon: '🌙',
    label: 'Schlaf',
    wert: dauer !== null ? formatDauer(dauer) : (nacht?.zuBett ? 'halb' : '—'),
    zustand: dauer === null ? 'leer' : dauer >= SOLL_MIN ? 'gut' : 'offen',
  });

  /* Sport */
  const sport = dayTotals(ctx.state.activities || [], kg);
  liste.push({
    id: 'sport',
    icon: '🏃',
    label: 'Sport',
    wert: sport.minuten ? `${sport.minuten} min` : '—',
    zustand: sport.minuten ? 'gut' : 'leer',
  });

  /* Trinken */
  const trainingsMinuten = ctx.state.plan && ctx.goalsFor(dateKey).kind === 'training'
    ? (ctx.state.profile?.sessionLength || 0)
    : 0;
  const ziel = wasserZiel(kg, sport.minuten + trainingsMinuten);
  const ml = (ctx.state.water || []).find((w) => w.date === dateKey)?.ml || 0;
  liste.push({
    id: 'trinken',
    icon: '💧',
    label: 'Trinken',
    wert: ziel ? formatMl(ml) : (ml ? formatMl(ml) : '—'),
    unter: ziel ? `von ${formatMl(ziel)}` : null,
    zustand: !ml ? 'leer' : (ziel && ml >= ziel * 0.9) ? 'gut' : 'offen',
  });

  /* Nahrungsergänzung — nur wenn eingerichtet oder noch nicht abgelehnt */
  const supps = suppsAufloesen(ctx.state.suppListe || []);
  const abgelehnt = (() => {
    try { return localStorage.getItem('supps-nein') === '1'; } catch { return false; }
  })();
  if (supps.length) {
    const stand = suppStand(supps, (ctx.state.supps || []).find((s) => s.date === dateKey));
    liste.push({
      id: 'ergaenzung',
      icon: '💊',
      label: 'Ergänzung',
      wert: `${stand.genommen}/${stand.gesamt}`,
      zustand: stand.vollstaendig ? 'gut' : stand.genommen ? 'offen' : 'leer',
    });
  } else if (!abgelehnt && dateKey === heute) {
    liste.push({
      id: 'ergaenzung', icon: '💊', label: 'Ergänzung', wert: 'offen', zustand: 'leer',
    });
  }

  return liste;
}

/** Die volle Karte hinter einer Kachel. */
function inhalt(id, ctx, dateKey) {
  if (id === 'schlaf') return sleepSection(ctx, dateKey, ctx.state.sleep);
  if (id === 'sport') return activitySection(ctx, dateKey, ctx.state.activities || []);
  if (id === 'trinken') return waterSection(ctx, dateKey, ctx.state.water);
  if (id === 'ergaenzung') return supplementSection(ctx, dateKey);
  return null;
}

export function tagesleiste(ctx, dateKey) {
  const liste = kacheln(ctx, dateKey);
  if (!liste.length) return null;

  let offen = offeneKachel();
  // Eine Kachel, die es heute nicht gibt, darf nicht aufgeklappt bleiben.
  if (offen && !liste.some((k) => k.id === offen)) { offen = null; setOffeneKachel(null); }

  const umschalten = (id) => {
    setOffeneKachel(offen === id ? null : id);
    ctx.reload();
  };

  const streifen = el('div', { class: 'tagesleiste' },
    ...liste.map((k) => el('button', {
      class: `tageskachel zu-${k.zustand}${offen === k.id ? ' offen' : ''}`,
      type: 'button',
      'aria-expanded': offen === k.id ? 'true' : 'false',
      'aria-label': `${k.label}: ${k.wert}${k.unter ? ` ${k.unter}` : ''}`,
      onClick: () => umschalten(k.id),
    },
      el('span', { class: 'kachelikon', 'aria-hidden': 'true', text: k.icon }),
      el('span', { class: 'kachellabel', text: k.label }),
      el('span', { class: 'kachelwert tabular', text: k.wert }),
      k.unter ? el('span', { class: 'kachelunter tabular', text: k.unter }) : null)));

  const geoeffnet = offen ? inhalt(offen, ctx, dateKey) : null;

  return el('div', { class: 'leistenblock' },
    streifen,
    geoeffnet ? el('div', { class: 'kachelinhalt', 'data-anker': offen }, geoeffnet) : null);
}

/**
 * Von außen eine Kachel öffnen — der Überblick oben verlinkt dorthin.
 * Ohne das würde ein Knopf „Trinken eintragen" auf eine zugeklappte Kachel
 * scrollen und nichts zeigen.
 */
export function oeffneKachel(id) {
  setOffeneKachel(id);
}
