/**
 * Prüfungen am Quelltext selbst — schnell, ohne Browser.
 * Fängt die Sorte Fehler, die man erst Wochen später bemerkt: eine Klasse im
 * Code, die es im Stylesheet nicht gibt, eine Fassung, die nicht zur
 * Offline-Kennung passt, ein Import ins Leere.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neuerLauf } from '../pruefen.js';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lies = (rel) => readFileSync(path.join(WURZEL, rel), 'utf8');

function alleJs(ordner = 'js', raus = []) {
  for (const eintrag of readdirSync(path.join(WURZEL, ordner), { withFileTypes: true })) {
    const rel = path.join(ordner, eintrag.name);
    if (eintrag.isDirectory()) alleJs(rel, raus);
    else if (eintrag.name.endsWith('.js')) raus.push(rel);
  }
  return raus;
}

export default async function laufen() {
  const p = neuerLauf('Quelltext');
  const dateien = alleJs();

  /* ---------- Fassung ---------- */
  const version = lies('js/version.js').match(/APP_VERSION = '([^']+)'/)?.[1];
  const cache = lies('sw.js').match(/CACHE_VERSION = 'naehrwerte-v([^']+)'/)?.[1];
  p.gleich(cache, version, 'Fassung und Offline-Kennung stimmen überein');

  /* ---------- Importe zeigen auf vorhandene Dateien ---------- */
  const kaputt = [];
  for (const datei of dateien) {
    const inhalt = lies(datei);
    for (const treffer of inhalt.matchAll(/from\s+'(\.[^']+)'/g)) {
      const ziel = path.resolve(path.dirname(path.join(WURZEL, datei)), treffer[1]);
      try { readFileSync(ziel); } catch { kaputt.push(`${datei} → ${treffer[1]}`); }
    }
  }
  p.leer(kaputt, 'Jeder Import zeigt auf eine vorhandene Datei');

  /* ---------- Jede Ansicht im Verzeichnis hat ihren Platz im HTML ---------- */
  const html = lies('index.html');
  const app = lies('js/app.js');
  const routen = [...app.matchAll(/^\s{2}([a-z]+): \w+View,$/gm)].map((m) => m[1]);
  const fehlend = routen.filter((r) => !html.includes(`id="view-${r}"`));
  p.ist(routen.length >= 15, `${routen.length} Ansichten im Verzeichnis`);
  p.leer(fehlend, 'Jede eingetragene Ansicht hat einen Platz im HTML');

  /* ---------- Klassen im Code gibt es im Stylesheet ---------- */
  const css = lies('css/app.css');
  const unbekannt = new Set();
  for (const datei of dateien) {
    for (const treffer of lies(datei).matchAll(/class:\s*'([^'$`]+)'/g)) {
      for (const klasse of treffer[1].split(/\s+/).filter(Boolean)) {
        if (!css.includes(`.${klasse}`)) unbekannt.add(`${klasse} (${datei})`);
      }
    }
  }
  p.leer([...unbekannt], 'Jede fest geschriebene Klasse steht im Stylesheet');

  /* ---------- Der Offline-Speicher kennt alle Dateien ---------- */
  const sw = lies('sw.js');
  const nichtGelistet = dateien.filter((d) => !sw.includes(`/${d}`) && !sw.includes(`'${d}'`)
    && !sw.includes(`./${d}`));
  p.leer(nichtGelistet, 'Jede Moduldatei steht im Offline-Speicher');

  /* ---------- Keine Modellnamen in dem, was veröffentlicht wird ----------
     Ausgenommen der API-Teil: Dort sind Modellkennungen der Sinn der Sache,
     der Nutzer wählt sie selbst aus. Überall sonst haben sie nichts zu suchen. */
  const verraeter = [];
  for (const datei of [...dateien, 'index.html', 'sw.js', 'css/app.css']) {
    if (datei === 'js/claude.js') continue;
    const inhalt = lies(datei);
    for (const wort of ['claude-opus', 'claude-sonnet', 'Anthropic-Modell']) {
      if (inhalt.includes(wort)) verraeter.push(`${datei}: ${wort}`);
    }
  }
  p.leer(verraeter, 'Keine Modellkennungen im ausgelieferten Code');

  /* ---------- Deutsche Zahlen: kein Punkt als Dezimaltrenner in Texten ---------- */
  const zahlen = [];
  for (const datei of dateien) {
    for (const treffer of lies(datei).matchAll(/text:\s*`[^`]*?\b\d+\.\d+\s*(kg|l|kcal|g)\b/g)) {
      zahlen.push(`${datei}: ${treffer[0].slice(0, 60)}`);
    }
  }
  p.leer(zahlen, 'Keine englischen Dezimalpunkte in angezeigten Zahlen');

  return p;
}
