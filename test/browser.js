/**
 * Zugang zum Browser für die Ansichtsprüfungen.
 *
 * Über `createRequire`, weil Playwright global installiert ist und die
 * ES-Modul-Auflösung NODE_PATH nicht kennt. Fehlt es, sagen die Prüfungen das
 * und überspringen sich, statt mit einem Stapelauszug abzubrechen.
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const require = createRequire(import.meta.url);

const MOEGLICHE_BROWSER = [
  process.env.CHROMIUM_PFAD,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

export function browserPfad() {
  return MOEGLICHE_BROWSER.find((p) => existsSync(p)) || null;
}

export function ladePlaywright() {
  try { return require('playwright'); } catch { return null; }
}

/** null, wenn keine Ansichtsprüfung möglich ist — mit Begründung. */
export function warumNicht() {
  if (!ladePlaywright()) return 'Playwright ist nicht erreichbar (NODE_PATH=$(npm root -g) setzen).';
  if (!browserPfad()) return 'Kein Chromium gefunden (CHROMIUM_PFAD setzen).';
  return null;
}
