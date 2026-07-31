/*
  Macht aus dem ElevenLabs-Orbit-Video die Bildkachel für die Dreh-Bedienung
  und setzt sie in index.html ein.

  Einmalig auszuführen, sobald das Video vorliegt:

      node werkzeug/orbit-zu-kachel.js nackenfrei-orbit.mp4

  Kein ffmpeg nötig — das Springen im Video und das Freistellen übernimmt
  Chromium. Voraussetzung ist nur playwright-core und der vorinstallierte
  Browser.

  Wichtig zum Video: gleichmäßige Winkelgeschwindigkeit, konstante Höhe und
  konstanter Abstand, Beleuchtung fest zur Kamera, Hintergrund weiß. Jede
  Beschleunigung im Video wird beim Ziehen zu einem Ruckeln.
*/
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const FRAMES = 24;
const COLS = 6;
const ROWS = 4;
const CELL = 600;

const CHROME = process.env.CHROME_PATH
  || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const video = process.argv[2];
if (!video) {
  console.error('Aufruf: node werkzeug/orbit-zu-kachel.js <video.mp4>');
  process.exit(1);
}
const videoPfad = path.resolve(video);
if (!fs.existsSync(videoPfad)) {
  console.error('Video nicht gefunden:', videoPfad);
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await (await browser.newContext()).newPage();

  // Das Video über file:// laden, damit kein Server nötig ist.
  await page.setContent(
    `<video id="v" src="file://${videoPfad}" muted playsinline></video>`
  );
  await page.waitForFunction(() => {
    const v = document.getElementById('v');
    return v && v.readyState >= 2 && v.duration > 0;
  }, null, { timeout: 30000 });

  const kachel = await page.evaluate(async (cfg) => {
    const v = document.getElementById('v');

    const springe = (t) => new Promise((ok) => {
      const fertig = () => { v.removeEventListener('seeked', fertig); ok(); };
      v.addEventListener('seeked', fertig);
      v.currentTime = t;
    });

    /* Freistellen: Flood Fill von den Bildrändern. Nur zusammenhängender
       heller Hintergrund verschwindet, eingeschlossene helle Flächen wie
       der Chromring bleiben. Alles Erreichte wird voll transparent — eine
       Rampe würde weiße Schatten als Halo stehen lassen. Der Schwellwert
       ist an diesem Produkt erprobt. */
    const CUT = 168;
    const freistellen = (g, w, h) => {
      const id = g.getImageData(0, 0, w, h);
      const d = id.data;
      const lum = (i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const alpha = new Float32Array(w * h).fill(1);
      const seen = new Uint8Array(w * h);
      const stack = [];
      for (let x = 0; x < w; x++) stack.push(x, x + (h - 1) * w);
      for (let y = 0; y < h; y++) stack.push(y * w, w - 1 + y * w);
      while (stack.length) {
        const q = stack.pop();
        if (seen[q] || lum(q * 4) < CUT) continue;
        seen[q] = 1; alpha[q] = 0;
        const x = q % w, y = (q / w) | 0;
        if (x > 0) stack.push(q - 1);
        if (x < w - 1) stack.push(q + 1);
        if (y > 0) stack.push(q - w);
        if (y < h - 1) stack.push(q + w);
      }
      // Kante um einen Pixel mitteln, sonst treppt sie.
      const soft = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let s = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
          s += alpha[yy * w + xx]; n++;
        }
        soft[y * w + x] = s / n;
      }
      for (let q = 0; q < w * h; q++) d[q * 4 + 3] = Math.round(soft[q] * 255);
      g.putImageData(id, 0, 0);
    };

    const zelle = document.createElement('canvas');
    zelle.width = zelle.height = cfg.CELL;
    const zg = zelle.getContext('2d', { willReadFrequently: true });

    const blatt = document.createElement('canvas');
    blatt.width = cfg.COLS * cfg.CELL;
    blatt.height = cfg.ROWS * cfg.CELL;
    const bg = blatt.getContext('2d');

    /* Das letzte Bild eines sauberen Orbits gleicht dem ersten. Deshalb
       wird bis kurz vor Schluss abgetastet, sonst gäbe es ein Duplikat. */
    for (let i = 0; i < cfg.FRAMES; i++) {
      await springe((i / cfg.FRAMES) * v.duration * 0.995);
      zg.clearRect(0, 0, cfg.CELL, cfg.CELL);
      // Quadratisch mittig aus dem 16:9-Bild schneiden.
      const s = Math.min(v.videoWidth, v.videoHeight);
      zg.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s,
                   0, 0, cfg.CELL, cfg.CELL);
      freistellen(zg, cfg.CELL, cfg.CELL);
      bg.drawImage(zelle, (i % cfg.COLS) * cfg.CELL,
                   Math.floor(i / cfg.COLS) * cfg.CELL);
    }
    return blatt.toDataURL('image/webp', 0.85);
  }, { FRAMES, COLS, ROWS, CELL });

  await browser.close();

  const html = path.join(__dirname, '..', 'index.html');
  let s = fs.readFileSync(html, 'utf8');
  const vorher = s.length;
  const ersatz = `<div class="spin" id="spin360" role="img" tabindex="0" `
    + `data-frames="${FRAMES}" data-cols="${COLS}" `
    + `style="background-image:url(${kachel})"`;
  const treffer = s.replace(/<div class="spin" id="spin360" role="img" tabindex="0"[^>]*/, ersatz);
  if (treffer === s) {
    console.error('Das Element #spin360 wurde in index.html nicht gefunden.');
    process.exit(1);
  }
  fs.writeFileSync(html, treffer);

  console.log(`Kachel: ${FRAMES} Bilder, ${COLS}×${ROWS}, ${Math.round(kachel.length / 1024)} KB`);
  console.log(`index.html: ${Math.round(vorher / 1024)} KB → ${Math.round(treffer.length / 1024)} KB`);
})();
