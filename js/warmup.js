/**
 * Aufwärmen vor der Einheit.
 *
 * Kein starres Programm, sondern eine kurze Liste, die sich aus dem Tag
 * ergibt: erst der Kreislauf, dann Mobilisation genau für die Gelenke, die
 * gleich arbeiten, zum Schluss ein Aufwärmsatz an der ersten Übung.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

import { exerciseById } from './training.js';

/** Immer dabei — ohne erhöhten Puls bringt Mobilisation wenig. */
const ALLGEMEIN = {
  id: 'puls',
  name: 'Kreislauf hochbringen',
  detail: 'Zwei Minuten zügig gehen, Treppe, Seilspringen oder Hampelmänner. '
    + 'Bis die Atmung merklich tiefer wird.',
  seconds: 120,
};

/**
 * Mobilisation je Muskelgruppe. Ausgewählt wird nach den Gruppen, die am
 * jeweiligen Tag drankommen — Beintag braucht keine Schulterkreise.
 */
const NACH_GRUPPE = {
  brust:    { id: 'brust', name: 'Schultern öffnen', seconds: 40,
              detail: 'Arme groß kreisen, dann die Hände hinter dem Rücken falten und die Brust öffnen — 20 Sekunden, locker. Wo ein Türrahmen ist, geht auch der.' },
  ruecken:  { id: 'ruecken', name: 'Schulterblätter wecken', seconds: 40,
              detail: 'Zehn Mal Schulterblätter zusammenziehen und lösen, dann Katze-Kuh im Vierfüßler.' },
  schulter: { id: 'schulter', name: 'Schultergürtel kreisen', seconds: 40,
              detail: 'Arme vorwärts und rückwärts kreisen, danach zehn Wandrutscher mit dem Rücken zur Wand.' },
  sdelt:    { id: 'sdelt', name: 'Seitliche Schulter lockern', seconds: 30,
              detail: 'Arme seitlich anheben und kleine Kreise, zwanzig Mal je Richtung.' },
  rdelt:    { id: 'rdelt', name: 'Hintere Schulter lockern', seconds: 30,
              detail: 'Arme vor der Brust kreuzen und öffnen, zwanzig Mal im Wechsel.' },
  quad:     { id: 'quad', name: 'Hüfte und Knie mobilisieren', seconds: 60,
              detail: 'Zehn tiefe Kniebeugen ohne Gewicht, danach zehn Ausfallschritte im Wechsel.' },
  ham:      { id: 'ham', name: 'Rückseite wecken', seconds: 45,
              detail: 'Zehn Mal gestrecktes Bein schwingen je Seite, dann fünf Good Mornings ohne Gewicht.' },
  glute:    { id: 'glute', name: 'Gesäß aktivieren', seconds: 45,
              detail: 'Fünfzehn Glute Bridges am Boden, oben jeweils kurz zusammendrücken.' },
  waden:    { id: 'waden', name: 'Sprunggelenke lösen', seconds: 30,
              detail: 'Zwanzig Wadenheben, dann das Knie über die Zehen schieben, je Seite zehn Mal.' },
  bizeps:   { id: 'arme', name: 'Ellbogen aufwärmen', seconds: 30,
              detail: 'Arme locker beugen und strecken, zwanzig Mal, ohne Gewicht.' },
  trizeps:  { id: 'arme', name: 'Ellbogen aufwärmen', seconds: 30,
              detail: 'Arme locker beugen und strecken, zwanzig Mal, ohne Gewicht.' },
  core:     { id: 'core', name: 'Rumpf anschalten', seconds: 30,
              detail: 'Dreißig Sekunden Unterarmstütz, bewusst Po und Bauch anspannen.' },
};

/** Wie lang das Aufwärmen ungefähr dauert, in Minuten aufgerundet. */
export function warmupMinutes(items) {
  const sekunden = items.reduce((summe, item) => summe + item.seconds, 0);
  return Math.max(1, Math.round(sekunden / 60));
}

/**
 * Stellt das Aufwärmen für einen Trainingstag zusammen.
 *
 * @param {object} day        Tag aus dem Plan
 * @param {boolean} hatTechnik  Stehen Fähigkeiten an? Dann fällt der Aufwärmsatz
 *                              knapper aus, weil die Technik selbst schon aufwärmt.
 */
export function warmupFor(day, hatTechnik = false) {
  if (!day || !day.exercises || !day.exercises.length) return [];

  const gruppen = [];
  for (const vorgabe of day.exercises) {
    const uebung = exerciseById(vorgabe.id);
    if (!uebung) continue;
    const eintrag = NACH_GRUPPE[uebung.group];
    // Bizeps und Trizeps teilen sich einen Eintrag — nicht doppelt aufnehmen.
    if (eintrag && !gruppen.some((g) => g.id === eintrag.id)) gruppen.push(eintrag);
  }

  // Drei Mobilisationen reichen. Die ersten Übungen des Tages wiegen am
  // schwersten, deshalb bleibt die Reihenfolge des Plans erhalten.
  const items = [ALLGEMEIN, ...gruppen.slice(0, 3)];

  const erste = exerciseById(day.exercises[0].id);
  if (erste && !hatTechnik) {
    items.push({
      id: 'aufwaermsatz',
      name: `Aufwärmsatz: ${erste.name}`,
      detail: 'Ein bis zwei leichte Sätze mit etwa der Hälfte des Arbeitsgewichts, '
        + 'acht Wiederholungen. Ohne Anstrengung, nur um die Bewegung zu bahnen.',
      seconds: 90,
    });
  }

  return items;
}
