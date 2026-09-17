/**
 * Fortschrittsfotos: aufnehmen, vergleichen, löschen.
 *
 * Die Waage misst eine Zahl, das Foto misst das, was die Zahl nicht zeigt —
 * bei gleichbleibendem Gewicht kann sich die Form deutlich ändern. Deshalb
 * steht hier zuerst der Vergleich zweier Aufnahmen nebeneinander und erst
 * darunter die Liste.
 *
 * Die Bilder verlassen das Gerät nicht. Sie gehen ausdrücklich auch nicht an
 * die Anthropic-API — anders als die Essensfotos wird hier nichts analysiert.
 */

import { el, mount, viewHead, iconButton, toast, emptyState, confirmAction } from '../ui.js';
import { localDateKey, formatDateKey } from '../nutrition.js';
import { saveProgressPhoto, listProgressPhotos, deleteProgressPhoto } from '../store.js';
import { processPhoto } from '../image.js';

/** Welche zwei Aufnahmen gerade verglichen werden. */
let vergleich = { links: null, rechts: null };

/** Objekt-URLs dieser Ansicht, damit sie beim Neuzeichnen freigegeben werden. */
let urls = [];

function bildUrl(blob) {
  const url = URL.createObjectURL(blob);
  urls.push(url);
  return url;
}

function aufraeumen() {
  for (const url of urls) URL.revokeObjectURL(url);
  urls = [];
}

const tageZwischen = (a, b) =>
  Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);

/** Öffnet Kamera bzw. Auswahl und speichert das Ergebnis. */
async function aufnehmen(ctx) {
  const input = el('input', { type: 'file', accept: 'image/*', capture: 'environment' });
  input.style.display = 'none';
  document.body.append(input);

  const datei = await new Promise((resolve) => {
    input.addEventListener('change', () => resolve(input.files?.[0] || null), { once: true });
    // Bricht jemand ab, feuert 'change' nie. Der Wächter räumt dann auf.
    window.addEventListener('focus', () => setTimeout(() => resolve(input.files?.[0] || null), 600), { once: true });
    input.click();
  });

  input.remove();
  if (!datei) return;

  try {
    const { photo, thumb } = await processPhoto(datei);
    await saveProgressPhoto(localDateKey(), photo, thumb);
    await ctx.refreshPhotos();
    toast('Foto gespeichert.');
    ctx.reload();
  } catch (err) {
    console.error(err);
    toast('Das Bild ließ sich nicht verarbeiten.', 'err');
  }
}

/* ---------------- Ansicht ---------------- */

export async function render(container, ctx) {
  aufraeumen();

  const fotos = await listProgressPhotos();
  const heute = localDateKey();

  const head = viewHead('Fortschrittsfotos',
    fotos.length === 1 ? '1 Aufnahme' : `${fotos.length} Aufnahmen`,
    iconButton('back', 'Zurück', () => ctx.go('progress')));

  const knopf = el('button', {
    class: 'btn btn-primary btn-block btn-lg', type: 'button',
    onClick: () => aufnehmen(ctx),
  }, fotos.some((f) => f.date === heute) ? 'Heutiges Foto ersetzen' : 'Foto aufnehmen');

  if (!fotos.length) {
    mount(container, head, el('div', null,
      el('div', { class: 'card' },
        emptyState('Noch keine Aufnahme',
          'Ein Foto alle paar Wochen, immer gleiche Stelle, gleiches Licht, gleiche Haltung. '
          + 'Nach zwei Monaten siehst du damit, was die Waage nicht zeigt.'),
        knopf),
      el('div', { class: 'card stack mt-16' },
        el('h3', { class: 'card-title', text: 'Damit der Vergleich etwas taugt' }),
        el('ol', { class: 'howto' },
          el('li', { text: 'Immer dieselbe Stelle im Raum, dieselbe Beleuchtung — Tageslicht von vorn, nicht von oben.' }),
          el('li', { text: 'Gleicher Abstand: markier dir, wo das Handy steht und wo du stehst.' }),
          el('li', { text: 'Gleiche Haltung, Arme locker seitlich, entspannt ausatmen. Nicht anspannen — sonst vergleichst du Posen.' }),
          el('li', { text: 'Morgens vor dem Frühstück, wie beim Wiegen.' })),
        el('p', { class: 'hint',
          text: 'Die Fotos bleiben auf dem Gerät und werden nirgendwohin geschickt — auch nicht zur Analyse.' }))));
    return;
  }

  /* Vergleich: standardmäßig die erste gegen die letzte Aufnahme. */
  const linksDatum = vergleich.links && fotos.some((f) => f.date === vergleich.links)
    ? vergleich.links : fotos[0].date;
  const rechtsDatum = vergleich.rechts && fotos.some((f) => f.date === vergleich.rechts)
    ? vergleich.rechts : fotos[fotos.length - 1].date;

  const links = fotos.find((f) => f.date === linksDatum);
  const rechts = fotos.find((f) => f.date === rechtsDatum);
  const abstand = tageZwischen(linksDatum, rechtsDatum);

  const seite = (foto, welche) => el('figure', { class: 'vglseite' },
    el('img', { class: 'vglbild', src: bildUrl(foto.blob), alt: `Aufnahme vom ${formatDateKey(foto.date)}` }),
    el('figcaption', { class: 'muted small', text: formatDateKey(foto.date) }));

  const vergleichKarte = el('div', { class: 'card stack' },
    el('h3', { class: 'card-title', text: 'Vergleich' }),
    el('div', { class: 'vergleich' }, seite(links), seite(rechts)),
    el('p', { class: 'hint',
      text: abstand === 0
        ? 'Beide Aufnahmen sind vom selben Tag — such unten zwei verschiedene aus.'
        : `${Math.abs(abstand)} Tage dazwischen. Antippen einer Aufnahme unten setzt die rechte Seite.` }));

  /* Liste aller Aufnahmen */
  const kacheln = fotos.map((foto) => el('div', { class: 'fotokachel' },
    el('button', {
      class: 'fotoknopf', type: 'button',
      'aria-pressed': foto.date === rechtsDatum || foto.date === linksDatum ? 'true' : 'false',
      onClick: () => {
        // Immer die ältere links, die neuere rechts — sonst steht der
        // Fortschritt verkehrt herum da.
        if (foto.date === rechtsDatum || foto.date === linksDatum) return;
        const beide = [linksDatum, foto.date].sort();
        vergleich = { links: beide[0], rechts: beide[1] };
        ctx.reload();
      },
    }, el('img', { src: bildUrl(foto.thumb), alt: '' })),
    el('div', { class: 'muted small', text: formatDateKey(foto.date) }),
    el('button', {
      class: 'btn btn-sm', type: 'button',
      onClick: async () => {
        if (!confirmAction(`Aufnahme vom ${formatDateKey(foto.date)} löschen?`)) return;
        await deleteProgressPhoto(foto.date);
        vergleich = { links: null, rechts: null };
        await ctx.refreshPhotos();
        ctx.reload();
        toast('Aufnahme gelöscht.');
      },
    }, 'Löschen')));

  mount(container, head, el('div', null,
    vergleichKarte,
    el('div', { class: 'mt-16' }, knopf),
    el('h2', { class: 'section-title', text: 'Alle Aufnahmen' }),
    el('div', { class: 'fotogitter' }, ...kacheln),
    el('p', { class: 'hint mt-16',
      text: 'Die Fotos bleiben auf dem Gerät. Sie werden nicht hochgeladen und nicht analysiert.' })));
}

/** Karte für die Fortschrittsansicht. */
export function photoSection(ctx) {
  const fotos = ctx.state.photos || [];

  const knopf = el('button', {
    class: 'btn btn-block', type: 'button',
    onClick: () => ctx.go('photos'),
  }, fotos.length ? 'Fotos ansehen' : 'Erstes Foto aufnehmen');

  if (!fotos.length) {
    return el('div', { class: 'card' },
      emptyState('Noch keine Fotos',
        'Bei gleichem Gewicht kann sich die Form deutlich ändern — das sieht man nur '
        + 'auf einem Bild. Alle paar Wochen eins, immer gleich aufgenommen.'),
      knopf);
  }

  const erste = fotos[0];
  const letzte = fotos[fotos.length - 1];
  const abstand = tageZwischen(erste.date, letzte.date);

  return el('div', null,
    el('div', { class: 'card stack' },
      el('div', { class: 'row-between' },
        el('div', { class: 'grow' },
          el('div', { text: `${fotos.length} ${fotos.length === 1 ? 'Aufnahme' : 'Aufnahmen'}` }),
          el('div', { class: 'muted small',
            text: abstand > 0 ? `über ${abstand} Tage` : `seit ${formatDateKey(erste.date)}` })),
        el('div', { class: 'fotostreifen' },
          ...fotos.slice(-3).map((f) => el('img', { class: 'fotomini', src: bildUrl(f.thumb), alt: '' })))),
      knopf));
}
