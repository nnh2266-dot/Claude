/**
 * Erfassen und Bearbeiten einer Mahlzeit.
 *
 * Vier Wege führen hierher:
 *   'photo'    — frisches Kamerafoto, wird analysiert
 *   'manual'   — leerer Eintrag von Hand
 *   'edit'     — bestehende Mahlzeit bearbeiten
 *   'favorite' — aus einem Favoriten vorbefüllt
 *
 * Das Ergebnis der KI ist immer nur ein Vorschlag: jede Zahl bleibt editierbar,
 * und der Portionsregler skaliert alles auf einen Schlag.
 */

import { el, mount, viewHead, iconButton, field, toast, confirmAction } from '../ui.js';
import { saveMeal, deleteMeal, saveFavorite } from '../store.js';
import { processPhoto, blobToBase64 } from '../image.js';
import { analysePhoto, ApiError } from '../claude.js';
import {
  MEAL_TYPES, sumItems, scaleItems, parseNumber, formatGram,
  localDateKey, newId,
} from '../nutrition.js';

/** Zustand der laufenden Bearbeitung. */
let session = null;

let photoUrl = null;

function releasePhotoUrl() {
  if (photoUrl) {
    URL.revokeObjectURL(photoUrl);
    photoUrl = null;
  }
}

/** Mahlzeitentyp aus der Uhrzeit raten — spart bei den meisten Einträgen einen Tipp. */
function guessMealType(timestamp = Date.now()) {
  const hour = new Date(timestamp).getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}

/** Zeitstempel für einen Tag: heute die aktuelle Uhrzeit, sonst 12:00. */
function timestampForDate(dateKey) {
  if (dateKey === localDateKey()) return Date.now();
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
}

function emptyItem() {
  return { name: '', grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0 };
}

/** Baut den Bearbeitungszustand aus dem Entwurf auf. */
function buildSession(draft) {
  const mode = draft.mode || 'manual';

  if (mode === 'edit') {
    const meal = draft.meal;
    return {
      mode,
      id: meal.id,
      dateKey: meal.date,
      timestamp: meal.timestamp,
      name: meal.name,
      mealType: meal.mealType,
      note: meal.note || '',
      items: meal.items.map((it) => ({ ...it })),
      baseItems: meal.items.map((it) => ({ ...it })),
      portion: 100,
      photoBlob: meal.photo || null,
      thumbBlob: meal.thumb || null,
      source: meal.source || 'manual',
      confidence: meal.confidence || null,
      analysing: false,
      error: null,
      aiNote: '',
      makeFavorite: false,
    };
  }

  const dateKey = draft.dateKey || localDateKey();
  const timestamp = timestampForDate(dateKey);
  const items = draft.items ? draft.items.map((it) => ({ ...it })) : [];

  return {
    mode,
    id: null,
    dateKey,
    timestamp,
    name: draft.name || '',
    mealType: draft.mealType || guessMealType(timestamp),
    note: '',
    items,
    baseItems: items.map((it) => ({ ...it })),
    portion: 100,
    photoBlob: draft.photoBlob || null,
    thumbBlob: draft.thumbBlob || null,
    source: mode === 'photo' ? 'ai' : mode === 'favorite' ? 'favorite' : 'manual',
    confidence: null,
    analysing: mode === 'photo',
    error: null,
    aiNote: '',
    makeFavorite: false,
  };
}

/* ---------------- Foto-Einstieg ---------------- */

/**
 * Wird von app.js aufgerufen, sobald ein Foto gewählt wurde.
 * Öffnet sofort den Editor und analysiert im Hintergrund.
 */
export async function startFromFile(file, ctx) {
  let processed;
  try {
    processed = await processPhoto(file);
  } catch (err) {
    ctx.toast(err.message || 'Das Foto konnte nicht verarbeitet werden.', 'err');
    return;
  }

  const draft = {
    mode: 'photo',
    dateKey: ctx.state.date || localDateKey(),
    photoBlob: processed.photo,
    thumbBlob: processed.thumb,
  };

  // Die Sitzung wird hier schon aufgebaut, damit die Analyse nicht mit dem
  // Rendern der Route um die Wette läuft: render() erkennt die passende
  // draftRef und übernimmt sie, statt neu zu bauen.
  session = buildSession(draft);
  session.draftRef = draft;

  ctx.openEditor(draft);
  await runAnalysis(ctx);
}

/** Ruft die API auf und schreibt das Ergebnis in die laufende Sitzung. */
async function runAnalysis(ctx) {
  if (!session || !session.photoBlob) return;

  session.analysing = true;
  session.error = null;
  rerender(ctx);

  try {
    const settings = ctx.settings;
    const base64 = await blobToBase64(session.photoBlob);
    const result = await analysePhoto({
      apiKey: settings.apiKey,
      model: settings.model,
      base64,
      mediaType: 'image/jpeg',
    });

    session.name = result.dish;
    session.items = result.items.map((it) => ({ ...it }));
    session.baseItems = result.items.map((it) => ({ ...it }));
    session.portion = 100;
    session.confidence = result.confidence;
    session.aiNote = result.note;
    session.source = 'ai';

    if (!result.items.length) {
      session.error = {
        message: 'Auf dem Foto war kein Essen zu erkennen. Trag die Mahlzeit bitte von Hand ein.',
        retriable: true,
      };
    }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Die Analyse ist fehlgeschlagen.';
    // Das Foto bleibt erhalten — die Mahlzeit lässt sich weiterhin von Hand eintragen.
    session.error = { message, retriable: err instanceof ApiError ? err.retriable : true };
  } finally {
    session.analysing = false;
    rerender(ctx);
  }
}

/* ---------------- Rendern ---------------- */

let currentContainer = null;

function rerender(ctx) {
  const container = currentContainer || document.getElementById('view-capture');
  if (!container || !session) return;
  currentContainer = container;
  draw(container, ctx);
}

/** Aktualisiert die Summenleiste ohne komplettes Neu-Rendern. */
function updateTotalsStrip(root) {
  const totals = sumItems(session.items);
  const set = (key, value) => {
    const node = root.querySelector(`[data-total="${key}"]`);
    if (node) node.textContent = value;
  };
  set('kcal', String(totals.kcal));
  set('protein', formatGram(totals.protein));
  set('carbs', formatGram(totals.carbs));
  set('fat', formatGram(totals.fat));
}

function numberInput(item, key, label, spanClass, root) {
  const input = el('input', {
    type: 'text',
    inputmode: 'decimal',
    value: key === 'kcal' ? String(Math.round(item[key])) : formatGram(item[key]),
    'data-item-field': key,
    onInput: (event) => {
      item[key] = parseNumber(event.target.value);
      // Manuelle Änderung wird zur neuen Basis, damit der Regler nicht
      // wieder darüberbügelt.
      session.baseItems = session.items.map((it) => ({ ...it }));
      session.portion = 100;
      const slider = root.querySelector('[data-portion]');
      if (slider) slider.value = '100';
      const readout = root.querySelector('[data-portion-label]');
      if (readout) readout.textContent = '100 %';
      updateTotalsStrip(root);
    },
  });

  return el('label', { class: spanClass }, label, input);
}

function itemRow(item, index, ctx, root) {
  return el(
    'div',
    { class: 'item-row' },
    el(
      'div',
      { class: 'item-row-top' },
      el('input', {
        class: 'input grow',
        type: 'text',
        value: item.name,
        placeholder: 'z. B. Vollkornbrot',
        'aria-label': `Name der Komponente ${index + 1}`,
        onInput: (event) => { item.name = event.target.value; },
      }),
      iconButton('trash', 'Komponente entfernen', () => {
        session.items.splice(index, 1);
        session.baseItems = session.items.map((it) => ({ ...it }));
        session.portion = 100;
        rerender(ctx);
      })
    ),
    el(
      'div',
      { class: 'item-grid' },
      numberInput(item, 'grams', 'Menge g', 'span-3', root),
      numberInput(item, 'kcal', 'kcal', 'span-3', root),
      numberInput(item, 'protein', 'Eiweiß', 'span-2', root),
      numberInput(item, 'carbs', 'KH', 'span-2', root),
      numberInput(item, 'fat', 'Fett', 'span-2', root)
    )
  );
}

function photoSection() {
  releasePhotoUrl();
  if (!session.photoBlob) return null;

  photoUrl = URL.createObjectURL(session.photoBlob);

  return el(
    'div',
    { class: 'photo-frame' },
    el('img', { src: photoUrl, alt: 'Foto der Mahlzeit' }),
    session.analysing
      ? el(
          'div',
          { class: 'analysing' },
          el('div', { class: 'spinner', 'aria-hidden': 'true' }),
          el('p', { text: 'Nährwerte werden geschätzt …' })
        )
      : null
  );
}

function portionSlider(ctx, root) {
  if (!session.items.length) return null;

  return el(
    'div',
    { class: 'card' },
    el(
      'div',
      { class: 'row-between' },
      el('label', { class: 'macro-name', for: 'portion', text: 'Portionsgröße' }),
      el('span', { class: 'tabular muted small', 'data-portion-label': '', text: `${session.portion} %` })
    ),
    el('input', {
      id: 'portion',
      type: 'range',
      min: '25',
      max: '250',
      step: '5',
      value: String(session.portion),
      'data-portion': '',
      onInput: (event) => {
        session.portion = Number(event.target.value);
        session.items = scaleItems(session.baseItems, session.portion / 100);

        const readout = root.querySelector('[data-portion-label]');
        if (readout) readout.textContent = `${session.portion} %`;

        // Die Zahlenfelder direkt nachziehen, ohne den Fokus zu verlieren.
        const rows = root.querySelectorAll('.item-row');
        session.items.forEach((item, i) => {
          const row = rows[i];
          if (!row) return;
          for (const key of ['grams', 'kcal', 'protein', 'carbs', 'fat']) {
            const input = row.querySelector(`[data-item-field="${key}"]`);
            if (input) input.value = key === 'kcal' ? String(Math.round(item[key])) : formatGram(item[key]);
          }
        });

        updateTotalsStrip(root);
      },
    }),
    el('p', { class: 'hint', text: 'Skaliert alle Komponenten gleichzeitig — praktisch, wenn die Portion kleiner oder größer war als geschätzt.' })
  );
}

function totalsStrip() {
  const totals = sumItems(session.items);
  const cell = (key, value, label) =>
    el('div', null, el('b', { 'data-total': key, text: value }), el('span', { text: label }));

  return el(
    'div',
    { class: 'card totals-strip' },
    cell('kcal', String(totals.kcal), 'kcal'),
    cell('protein', formatGram(totals.protein), 'Eiweiß g'),
    cell('carbs', formatGram(totals.carbs), 'KH g'),
    cell('fat', formatGram(totals.fat), 'Fett g')
  );
}

async function handleSave(ctx) {
  if (!session.items.length) {
    toast('Bitte mindestens eine Komponente eintragen.', 'err');
    return;
  }

  const meal = {
    id: session.id || newId(),
    date: session.dateKey,
    timestamp: session.timestamp,
    mealType: session.mealType,
    name: session.name.trim() || 'Mahlzeit',
    items: session.items,
    note: session.note,
    photo: session.photoBlob,
    thumb: session.thumbBlob,
    source: session.source,
    confidence: session.confidence,
  };

  try {
    await saveMeal(meal);

    if (session.makeFavorite) {
      await saveFavorite({
        name: meal.name,
        mealType: meal.mealType,
        items: meal.items,
      });
    }

    const wasFavorite = session.makeFavorite;
    ctx.state.date = session.dateKey;
    ctx.clearDraft();
    session = null;
    releasePhotoUrl();
    ctx.go('today');
    toast(wasFavorite ? 'Gespeichert und als Favorit gemerkt.' : 'Mahlzeit gespeichert.');
  } catch (err) {
    console.error(err);
    toast('Speichern fehlgeschlagen.', 'err');
  }
}

async function handleDelete(ctx) {
  if (!session.id) return;
  if (!confirmAction('Diese Mahlzeit wirklich löschen?')) return;

  await deleteMeal(session.id);
  ctx.state.date = session.dateKey;
  ctx.clearDraft();
  session = null;
  releasePhotoUrl();
  ctx.go('today');
  toast('Mahlzeit gelöscht.');
}

function draw(container, ctx) {
  const root = el('div');

  const head = viewHead(
    session.mode === 'edit' ? 'Bearbeiten' : 'Neue Mahlzeit',
    null,
    session.id
      ? iconButton('trash', 'Mahlzeit löschen', () => handleDelete(ctx))
      : null,
    iconButton('close', 'Abbrechen', () => {
      ctx.clearDraft();
      session = null;
      releasePhotoUrl();
      ctx.go('today');
    })
  );

  const blocks = [];

  const photo = photoSection();
  if (photo) blocks.push(photo);

  if (session.error) {
    blocks.push(
      el(
        'div',
        { class: 'banner banner-error' },
        el('strong', { text: 'Analyse nicht möglich' }),
        session.error.message,
        session.error.retriable && session.photoBlob
          ? el(
              'div',
              { class: 'mt-16' },
              el(
                'button',
                { class: 'btn', type: 'button', onClick: () => runAnalysis(ctx) },
                'Nochmal versuchen'
              )
            )
          : null
      )
    );
  } else if (session.aiNote && !session.analysing) {
    const confidenceText = session.confidence
      ? `Sicherheit: ${session.confidence}. `
      : '';
    blocks.push(
      el(
        'div',
        { class: 'banner banner-info' },
        el('strong', { text: 'Schätzung von Claude' }),
        `${confidenceText}${session.aiNote} Prüf die Werte kurz und korrigiere, was nicht passt.`
      )
    );
  }

  // Name
  blocks.push(
    el(
      'div',
      { class: 'card stack' },
      field(
        'Name',
        el('input', {
          class: 'input',
          type: 'text',
          value: session.name,
          placeholder: 'z. B. Müsli mit Joghurt',
          onInput: (event) => { session.name = event.target.value; },
        })
      ),
      el(
        'div',
        { class: 'field' },
        el('label', { text: 'Mahlzeit' }),
        el(
          'div',
          { class: 'chips' },
          ...MEAL_TYPES.map((type) =>
            el('button', {
              class: 'chip',
              type: 'button',
              'aria-pressed': String(session.mealType === type.id),
              text: type.label,
              onClick: (event) => {
                session.mealType = type.id;
                for (const chip of event.currentTarget.parentElement.children) {
                  chip.setAttribute('aria-pressed', String(chip === event.currentTarget));
                }
              },
            })
          )
        )
      ),
      field(
        'Uhrzeit',
        el('input', {
          class: 'input',
          type: 'time',
          value: new Date(session.timestamp).toTimeString().slice(0, 5),
          onInput: (event) => {
            const [h, m] = event.target.value.split(':').map(Number);
            if (Number.isFinite(h) && Number.isFinite(m)) {
              const d = new Date(session.timestamp);
              d.setHours(h, m, 0, 0);
              session.timestamp = d.getTime();
            }
          },
        })
      )
    )
  );

  // Komponenten
  blocks.push(el('h2', { class: 'section-title', text: 'Komponenten' }));

  if (session.items.length) {
    blocks.push(
      el('div', null, ...session.items.map((item, i) => itemRow(item, i, ctx, root)))
    );
  } else if (!session.analysing) {
    blocks.push(
      el('p', { class: 'hint', style: { padding: '0 4px 8px' } },
        'Noch keine Komponenten. Füge unten eine hinzu.')
    );
  }

  blocks.push(
    el(
      'button',
      {
        class: 'btn btn-block mt-16',
        type: 'button',
        onClick: () => {
          session.items.push(emptyItem());
          session.baseItems = session.items.map((it) => ({ ...it }));
          session.portion = 100;
          rerender(ctx);
        },
      },
      'Komponente hinzufügen'
    )
  );

  const slider = portionSlider(ctx, root);
  if (slider) blocks.push(el('div', { class: 'mt-16' }, slider));

  blocks.push(el('div', { class: 'mt-16' }, totalsStrip()));

  // Notiz und Favorit
  blocks.push(
    el(
      'div',
      { class: 'card mt-16 stack' },
      field(
        'Notiz',
        el('textarea', {
          class: 'input',
          rows: '2',
          placeholder: 'optional — z. B. „im Restaurant, etwas mehr Öl"',
          onInput: (event) => { session.note = event.target.value; },
        }, session.note)
      ),
      el(
        'label',
        { class: 'row', style: { cursor: 'pointer' } },
        el('input', {
          type: 'checkbox',
          checked: session.makeFavorite,
          style: { width: '20px', height: '20px', accentColor: 'var(--kcal)' },
          onChange: (event) => { session.makeFavorite = event.target.checked; },
        }),
        el('span', { class: 'small', text: 'Als Favorit merken, um sie später mit einem Tipp einzutragen' })
      )
    )
  );

  blocks.push(
    el(
      'div',
      { class: 'editor-actions' },
      el(
        'button',
        {
          class: 'btn btn-primary btn-lg btn-block',
          type: 'button',
          disabled: session.analysing,
          onClick: () => handleSave(ctx),
        },
        session.mode === 'edit' ? 'Änderungen speichern' : 'Speichern'
      )
    )
  );

  root.append(...blocks.filter(Boolean));
  mount(container, head, root);
}

export async function render(container, ctx) {
  currentContainer = container;

  const draft = ctx.state.draft;
  if (!draft) {
    ctx.go('today');
    return;
  }

  // Neuer Entwurf? Dann Sitzung aufbauen. Bei einem laufenden Rendern
  // (z. B. nach der Analyse) bleibt die bestehende Sitzung erhalten.
  if (!session || session.draftRef !== draft) {
    session = buildSession(draft);
    session.draftRef = draft;
  }

  draw(container, ctx);
}
