/** Statischer Server über dem Projektordner — nur für die Prüfung. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPEN = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

export function starte(port) {
  const server = http.createServer((anfrage, antwort) => {
    let datei = path.join(WURZEL, decodeURIComponent(anfrage.url.split('?')[0]));
    if (datei.endsWith('/')) datei += 'index.html';
    fs.readFile(datei, (fehler, inhalt) => {
      if (fehler) { antwort.writeHead(404); antwort.end('nicht gefunden'); return; }
      antwort.writeHead(200, {
        'Content-Type': `${TYPEN[path.extname(datei)] || 'text/plain'}; charset=utf-8`,
      });
      antwort.end(inhalt);
    });
  });
  return new Promise((fertig) => server.listen(port, () => fertig(server)));
}
