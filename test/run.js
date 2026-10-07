#!/usr/bin/env node
/**
 * Der Prüflauf.
 *
 *   node test/run.js              alles
 *   node test/run.js logik plaene nur diese Gruppen
 *
 * Die Ansichtsprüfungen brauchen Playwright und Chromium. Sind sie nicht
 * erreichbar, fällt genau diese Gruppe durch und sagt warum — der Rest läuft.
 *
 *   NODE_PATH=$(npm root -g) node test/run.js
 *
 * Ausgang: 0, wenn nichts durchgefallen ist. Sonst 1.
 */

const GRUPPEN = [
  ['logik', './faelle/logik.js'],
  ['quelltext', './faelle/statisch.js'],
  ['plaene', './faelle/plaene.js'],
  ['ansichten', './faelle/ansichten.js'],
  ['wege', './faelle/wege.js'],
  ['daten', './faelle/daten.js'],
  ['auswertung', './faelle/auswertung.js'],
  ['verlauf', './faelle/verlauf.js'],
  ['dauerlauf', './faelle/dauerlauf.js'],
];

const gewaehlt = process.argv.slice(2);
const laufen = GRUPPEN.filter(([name]) => !gewaehlt.length || gewaehlt.includes(name));

const GRUEN = '\u001b[32m';
const ROT = '\u001b[31m';
const GRAU = '\u001b[90m';
const AUS = '\u001b[0m';

let gesamt = 0;
let durchgefallen = 0;
const start = Date.now();

for (const [name, pfad] of laufen) {
  let lauf;
  const begonnen = Date.now();
  try {
    const modul = await import(pfad);
    lauf = await modul.default();
  } catch (fehler) {
    console.log(`\n${ROT}✗ ${name}${AUS} — Gruppe konnte nicht laufen: ${fehler.message}`);
    durchgefallen += 1;
    gesamt += 1;
    continue;
  }

  const schlecht = lauf.ergebnisse.filter((e) => !e.ok);
  gesamt += lauf.ergebnisse.length;
  durchgefallen += schlecht.length;

  const zeichen = schlecht.length ? `${ROT}✗${AUS}` : `${GRUEN}✓${AUS}`;
  const dauer = ((Date.now() - begonnen) / 1000).toFixed(1);
  console.log(`\n${zeichen} ${lauf.name} — ${lauf.ergebnisse.length} Prüfungen, `
    + `${schlecht.length} durchgefallen ${GRAU}(${dauer} s)${AUS}`);

  for (const e of lauf.ergebnisse) {
    if (e.ok) console.log(`    ${GRAU}·${AUS} ${e.titel}`);
    else console.log(`    ${ROT}✗ ${e.titel}${AUS}${e.detail ? `\n      ${GRAU}${e.detail}${AUS}` : ''}`);
  }
}

const dauer = ((Date.now() - start) / 1000).toFixed(1);
console.log(`\n${'─'.repeat(52)}`);
if (durchgefallen) {
  console.log(`${ROT}${durchgefallen} von ${gesamt} Prüfungen durchgefallen${AUS} ${GRAU}(${dauer} s)${AUS}`);
  process.exit(1);
}
console.log(`${GRUEN}Alle ${gesamt} Prüfungen bestanden${AUS} ${GRAU}(${dauer} s)${AUS}`);
