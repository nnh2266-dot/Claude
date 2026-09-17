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
import {
  saveMeal, deleteMeal, saveFavorite, saveDraft, loadDraft, clearStoredDraft,
  queuePhoto, deletePending, getMealsByDate,
} from '../store.js';
import { processPhoto, blobToBase64 } from '../image.js';
import {
  analysePhoto, analyseText, parseChatResponse, ApiError, textChatPrompt, photoChatPrompt,
} from '../claude.js';
import {
  MEAL_TYPES, sumItems, scaleItems, parseNumber, formatGram,
  localDateKey, newId,
} from '../nutrition.js';
import { scoreMeal, GRENZEN } from '../mealscore.js';

/** Zustand der laufenden Bearbeitung. */
let session = null;

/**
 * Die übrigen Mahlzeiten des bearbeiteten Tages.
 * Gebraucht für die Einordnung: „passt in den Rest des Tages" lässt sich nur
 * beantworten, wenn man weiß, was sonst noch drinsteht.
 */
let tagesMahlzeiten = [];

let photoUrl = null;

/**
 * Nach dieser Zeit gilt ein liegengebliebener Entwurf als vergessen und wird
 * beim Start verworfen, statt den Nutzer wieder in den Editor zu werfen.
 */
const DRAFT_MAX_AGE_MS = 12 * 60 * 60 * 1000;

/* ---------------- Entwurf sichern und wiederherstellen ---------------- */

/** Schreibt die laufende Bearbeitung weg. Blobs überstehen IndexedDB. */
export async function persistSession() {
  if (!session) return;
  const { draftRef, ...rest } = session;
  try {
    await saveDraft({ ...rest, analysing: false, savedAt: Date.now() });
  } catch (err) {
    // Kein Grund, die Bearbeitung abzubrechen — nur die Absicherung fehlt dann.
    console.warn('Entwurf konnte nicht gesichert werden:', err);
  }
}

/** Verwirft den gesicherten Entwurf. */
async function forgetStoredDraft() {
  try {
    await clearStoredDraft();
  } catch {
    /* Nicht kritisch. */
  }
}

/**
 * Holt einen gesicherten Entwurf zurück, etwa nachdem die App beim Wechsel in
 * die Claude-App aus dem Speicher geflogen ist.
 * @returns {Promise<boolean>} ob etwas wiederhergestellt wurde
 */
export async function restoreDraft(ctx) {
  let stored;
  try {
    stored = await loadDraft();
  } catch {
    return false;
  }

  if (!stored) return false;

  if (!Number.isFinite(stored.savedAt) || Date.now() - stored.savedAt > DRAFT_MAX_AGE_MS) {
    await forgetStoredDraft();
    return false;
  }

  const marker = { mode: stored.mode, restored: true };
  session = { ...stored, analysing: false, draftRef: marker };
  ctx.state.draft = marker;
  ctx.state.date = stored.dateKey || ctx.state.date;
  return true;
}

/** Beendet die Bearbeitung und räumt alles auf. */
async function endSession(ctx) {
  ctx.clearDraft();
  session = null;
  releasePhotoUrl();
  await forgetStoredDraft();
}

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
      description: '',
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
    description: draft.description || '',
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
  await persistSession();

  ctx.openEditor(draft);
  await runAnalysis(ctx);
}

/**
 * Ein aufgehobenes Foto wieder aufnehmen und auswerten.
 *
 * Läuft durch dieselbe Sitzung wie ein frisches Foto, damit auch dieselben
 * Korrekturmöglichkeiten gelten — Portionsregler, Zutaten ändern, Hinweis
 * nachtragen. Aus der Warteschlange verschwindet der Eintrag erst, wenn die
 * Sitzung steht; bricht etwas vorher ab, ist das Foto noch da.
 */
export async function startFromPending(eintrag, ctx) {
  const draft = {
    mode: 'photo',
    dateKey: eintrag.date,
    photoBlob: eintrag.blob,
    thumbBlob: eintrag.thumb,
    description: eintrag.hint || '',
    mealType: eintrag.mealType || null,
  };

  session = buildSession(draft);
  session.description = eintrag.hint || '';
  session.draftRef = draft;
  await persistSession();

  await deletePending(eintrag.id);
  await ctx.refreshPending();

  ctx.openEditor(draft);
  await runAnalysis(ctx);
}

/** Ruft die API auf und schreibt das Ergebnis in die laufende Sitzung. */
async function runAnalysis(ctx) {
  if (!session || !session.photoBlob) return;

  // Ohne Verbindung gar nicht erst anfragen: der Fehlschlag dauert sonst bis
  // zum Zeitablauf, und die Meldung danach erklärt nichts.
  if (navigator.onLine === false) {
    session.error = {
      message: 'Keine Verbindung. Das Foto lässt sich aufheben und später auswerten — '
        + 'oder du trägst die Mahlzeit gleich von Hand ein.',
      retriable: true,
      offline: true,
    };
    rerender(ctx);
    await persistSession();
    return;
  }

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
      // Was der Nutzer dazugeschrieben hat — „im Restaurant", „mit viel Öl",
      // „das ist Dinkel". Beim ersten Durchlauf leer.
      hint: session.description || '',
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
    // Ab hier steckt Arbeit im Entwurf, die nicht verloren gehen darf.
    await persistSession();
  }
}

/**
 * Legt das Foto in die Warteschlange und verlässt den Editor.
 *
 * Kein Platzhalter in den Mahlzeiten: ein Eintrag mit null Kalorien würde in
 * Tagessumme, Zielen und Bericht mitzählen und die Zahlen still verfälschen.
 * Bis zur Auswertung ist die Mahlzeit schlicht noch nicht erfasst — das ist
 * die Wahrheit, und der Bericht darf sie ruhig sagen.
 */
async function fuerSpaeterAufheben(ctx) {
  if (!session || !session.photoBlob) return;

  try {
    await queuePhoto({
      dateKey: session.dateKey || localDateKey(),
      blob: session.photoBlob,
      thumb: session.thumbBlob,
      hint: session.description || '',
      mealType: session.mealType || null,
    });
  } catch (err) {
    console.error(err);
    toast('Das Foto ließ sich nicht aufheben.', 'err');
    return;
  }

  await forgetStoredDraft();
  session = null;
  ctx.clearDraft();
  await ctx.refreshPending();
  ctx.go('today');
  toast('Foto aufgehoben. Es wartet auf der Tagesansicht.');
}

/** Schätzt aus der Beschreibung und schreibt das Ergebnis in die Sitzung. */
async function runTextAnalysis(ctx) {
  if (!session) return;

  const description = String(session.description || '').trim();
  if (!description) {
    session.error = { message: 'Beschreib zuerst, was du gegessen hast.', retriable: false };
    rerender(ctx);
    return;
  }

  session.analysing = true;
  session.error = null;
  rerender(ctx);

  try {
    const result = await analyseText({
      apiKey: ctx.settings.apiKey,
      model: ctx.settings.model,
      description,
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
        message: 'Daraus ließ sich keine Mahlzeit lesen. Beschreib es etwas genauer '
          + 'oder trag die Werte von Hand ein.',
        retriable: true,
      };
    }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Die Schätzung ist fehlgeschlagen.';
    // Die Beschreibung bleibt stehen — nichts von der Eingabe geht verloren.
    session.error = { message, retriable: err instanceof ApiError ? err.retriable !== false : true };
  } finally {
    session.analysing = false;
    rerender(ctx);
    await persistSession();
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

/**
 * Textfeld für beide Wege. Beim Textweg ist es die Mahlzeit selbst, beim Foto
 * der Zusatzhinweis — ein Bild zeigt nicht, ob im Öl gebraten wurde, ob das
 * Brot Dinkel ist oder wie groß die Schüssel wirklich war.
 */
function descriptionCard(ctx) {
  const perText = session.mode === 'text';
  const perFoto = !!session.photoBlob;
  if (!perText && !perFoto) return null;

  const field = el('textarea', {
    class: 'input',
    rows: perText ? '3' : '2',
    placeholder: perText
      ? 'z. B. zwei Scheiben Vollkornbrot mit Butter und Gouda, dazu ein Apfel'
      : 'z. B. in Olivenöl gebraten · große Portion · Reis ist Vollkorn',
  });
  // Bei einem textarea kommt der Inhalt aus dem Textknoten — ein value-Attribut
  // bliebe wirkungslos, und der Text wäre nach dem Schätzen verschwunden.
  field.value = session.description || '';
  field.addEventListener('input', () => { session.description = field.value; });

  const beschriftung = () => {
    if (session.analysing) return 'Wird geschätzt …';
    if (perText) return session.items.length ? 'Neu schätzen' : 'Nährwerte schätzen';
    return 'Mit Hinweis neu schätzen';
  };

  const button = el('button', {
    class: `btn btn-block${perText ? ' btn-primary' : ''}`,
    type: 'button',
    disabled: session.analysing,
    onClick: () => {
      session.description = field.value;
      if (perText) runTextAnalysis(ctx);
      else runAnalysis(ctx);
    },
  }, beschriftung());

  return el('div', { class: 'card stack' },
    el('h3', { class: 'bridge-title',
      text: perText ? 'Was hast du gegessen?' : 'Etwas dazuschreiben?' }),
    field,
    button,
    el('p', { class: 'hint',
      text: perText
        ? 'Je genauer die Mengen, desto besser die Schätzung. Ohne Mengenangabe wird '
          + 'eine übliche Portion angenommen. Danach lässt sich jede Zahl von Hand ändern.'
        : 'Alles, was man dem Foto nicht ansieht: Zubereitungsfett, Portionsgröße, '
          + 'Zutaten unter der Sauce. Der Knopf schätzt mit dem Hinweis neu.' }));
}

/* ---------------- Chat-Brücke ---------------- */

/**
 * Aufklappbares Prompt-Feld. Der Inhalt wird erst beim Aufklappen gesetzt:
 * beim Textweg steckt die Beschreibung im Prompt, und die tippt der Nutzer
 * erst ein, nachdem die Karte gezeichnet wurde.
 */
function promptDetails(promptText) {
  const field = el('textarea', { class: 'input mt-16', rows: '6', readonly: true });
  const details = el(
    'details',
    { class: 'bridge-details' },
    el('summary', { text: 'Prompt zum Selbst-Markieren anzeigen' }),
    field
  );
  const fill = () => { field.value = promptText(); };
  details.addEventListener('toggle', () => { if (details.open) fill(); });
  fill();
  return details;
}

/** Kopiert Text, mit Rückmeldung ob es geklappt hat. */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Schickt das Foto per Teilen-Dialog an eine andere App, sonst als Download. */
async function sharePhoto(blob) {
  const file = new File([blob], 'mahlzeit.jpg', { type: 'image/jpeg' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Mahlzeit' });
      return 'geteilt';
    } catch (err) {
      // Abbruch durch den Nutzer ist kein Fehler.
      if (err?.name === 'AbortError') return 'abgebrochen';
    }
  }

  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: 'mahlzeit.jpg' });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'heruntergeladen';
}

/**
 * Analyse ohne API-Key: Prompt und Foto wandern von Hand durch die Claude-App,
 * die Antwort kommt hier wieder herein.
 */
function chatBridgeCard(ctx) {
  // Der Textweg braucht kein Foto: die Beschreibung steckt schon im Prompt,
  // damit im Chat nur eingefügt und abgeschickt werden muss.
  const perText = session.mode === 'text';
  const promptText = () => (perText
    ? textChatPrompt(session.description)
    : photoChatPrompt(session.description));

  const answer = el('textarea', {
    class: 'input',
    rows: '4',
    placeholder: 'Antwort aus dem Chat hier einfügen …',
  });

  const status = el('p', { class: 'hint' });

  // Eigene Referenz statt event.currentTarget: das ist nach einem await
  // bereits null, weil die Ereignisauslieferung dann abgeschlossen ist.
  const copyButton = el(
    'button',
    {
      class: 'btn btn-block',
      type: 'button',
      onClick: async () => {
        await persistSession();
        if (perText && !String(session.description || '').trim()) {
          status.textContent = 'Beschreib zuerst oben, was du gegessen hast.';
          return;
        }
        const ok = await copyToClipboard(promptText());
        status.textContent = ok
          ? (perText
              ? 'Prompt samt Beschreibung kopiert. In der Claude-App einfügen und abschicken.'
              : 'Prompt kopiert. Jetzt in der Claude-App einfügen.')
          : 'Kopieren ging nicht — nimm den Prompt aus dem Feld unten.';
        if (ok) copyButton.textContent = 'Prompt kopiert ✓';
      },
    },
    'Prompt kopieren'
  );

  const step = (n, label, control) =>
    el(
      'div',
      { class: 'bridge-step' },
      el('span', { class: 'bridge-num', text: String(n) }),
      el('div', { class: 'grow' }, el('p', { class: 'bridge-label', text: label }), control)
    );

  return el(
    'div',
    { class: 'card stack' },
    el('h3', { class: 'bridge-title', text: 'Über die Claude-App analysieren' }),
    el('p', { class: 'hint' },
      'Kostet nichts extra, wenn du ohnehin ein Claude-Abo hast — dafür etwas ' +
      'Kopierarbeit pro Mahlzeit. Gut geeignet, um die Schätzqualität auszuprobieren, ' +
      'bevor du Guthaben auflädst.'
      + (perText ? ' Beim Textweg reicht Kopieren und Einfügen, ein Foto braucht es nicht.' : '')),

    step(1, perText ? 'Anweisung samt Beschreibung kopieren' : 'Anweisung für Claude kopieren', copyButton),

    perText ? null : step(2, 'Foto an die Claude-App geben',
      el(
        'button',
        {
          class: 'btn btn-block',
          type: 'button',
          onClick: async () => {
            if (!session.photoBlob) return;
            // Vor dem Wechsel in die andere App sichern — von dort kommt der
            // Nutzer unter Umständen in eine neu gestartete Seite zurück.
            await persistSession();
            const how = await sharePhoto(session.photoBlob);
            if (how === 'heruntergeladen') {
              status.textContent = 'Foto gespeichert — häng es in der Claude-App an den Prompt.';
            } else if (how === 'geteilt') {
              status.textContent = 'Foto geteilt. Prompt dazu einfügen und abschicken.';
            }
          },
        },
        'Foto teilen oder speichern'
      )),

    step(perText ? 2 : 3, 'Antwort zurück einfügen',
      el(
        'div',
        { class: 'stack-sm' },
        answer,
        el(
          'button',
          {
            class: 'btn btn-primary btn-block',
            type: 'button',
            onClick: () => {
              try {
                const result = parseChatResponse(answer.value);

                session.name = result.dish;
                session.items = result.items.map((it) => ({ ...it }));
                session.baseItems = result.items.map((it) => ({ ...it }));
                session.portion = 100;
                session.confidence = result.confidence;
                session.aiNote = result.note;
                session.source = 'chat';
                session.error = null;
                session.showBridge = false;

                toast('Werte übernommen.');
                rerender(ctx);
                persistSession();
              } catch (err) {
                status.innerHTML = '';
                status.append(
                  el('span', {
                    style: { color: 'var(--danger)' },
                    text: err instanceof ApiError ? err.message : 'Die Antwort ließ sich nicht lesen.',
                  })
                );
              }
            },
          },
          'Werte übernehmen'
        )
      )),

    status,

    promptDetails(promptText),

    el('p', { class: 'hint' },
      'Chat öffnen: ',
      el('a', {
        href: 'https://claude.ai/new',
        target: '_blank',
        rel: 'noopener',
        style: { color: 'var(--kcal)', fontWeight: '600' },
        text: 'claude.ai',
      }),
      ' — oder die Claude-App auf dem Handy.')
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

/**
 * Was diese Mahlzeit für den Tag tut — direkt unter den Summen, wo man beim
 * Eintragen ohnehin hinschaut.
 *
 * Bewusst keine Note und kein Ampelsymbol: Die App weiß nur vier Zahlen und
 * kann daraus nicht ableiten, ob etwas gesund ist. Sie kann sagen, wie viel
 * Eiweiß dabei ist, wie sättigend es je Kalorie sein dürfte und ob es in den
 * Rest des Tages passt. Genau das steht da, und die Grenze steht darunter.
 */
function einordnungsKarte(ctx) {
  const totals = sumItems(session.items);
  if (!totals.kcal) return null;

  // Was vor dieser Mahlzeit noch übrig war. Beim Bearbeiten zählt sie selbst
  // nicht mit, sonst wäre der Rest doppelt abgezogen.
  const ziele = ctx.goalsFor(session.dateKey);
  const andere = tagesMahlzeiten
    .filter((m) => m.id !== session.id)
    .reduce((sum, m) => sum + (m.totals?.kcal || 0), 0);
  const rest = ziele ? { kcal: ziele.kcal - andere } : null;

  const wert = scoreMeal({ totals, items: session.items }, rest);
  if (!wert) return null;

  const punkt = (d) => (d ? el('div', { class: `einordnungzeile stufe-${d.stufe}` },
    el('span', { class: 'einordnungpunkt', 'aria-hidden': 'true' }),
    el('span', { text: d.text })) : null);

  return el('div', { class: 'card stack einordnung' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Was das für heute heißt' }),
      wert.label ? el('span', { class: 'pill pill-kcal', text: wert.label }) : null),
    punkt(wert.eiweiss),
    punkt(wert.dichte),
    punkt(wert.passung),
    el('p', { class: 'muted small', text: GRENZEN }));
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
    await endSession(ctx);
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
  await endSession(ctx);
  ctx.go('today');
  toast('Mahlzeit gelöscht.');
}

function draw(container, ctx) {
  const root = el('div');

  // Ohne API-Key ist die Chat-Brücke der einzige Weg zur Analyse — dann
  // steht sie gleich offen statt hinter einem weiteren Tipp.
  if (session.showBridge === undefined) {
    session.showBridge = !ctx.settings.apiKey;
  }

  const head = viewHead(
    session.mode === 'edit' ? 'Bearbeiten' : 'Neue Mahlzeit',
    null,
    session.id
      ? iconButton('trash', 'Mahlzeit löschen', () => handleDelete(ctx))
      : null,
    iconButton('close', 'Abbrechen', async () => {
      if (session.items.length && !confirmAction('Diese Mahlzeit verwerfen?')) return;
      await endSession(ctx);
      ctx.go('today');
    })
  );

  const blocks = [];

  const photo = photoSection();
  if (photo) blocks.push(photo);

  const description = descriptionCard(ctx);
  if (description) blocks.push(description);

  if (session.error) {
    blocks.push(
      el(
        'div',
        { class: 'banner banner-error' },
        el('strong', { text: 'Analyse nicht möglich' }),
        session.error.message,
        session.error.retriable && (session.photoBlob || session.mode === 'text')
          ? el(
              'div',
              { class: 'row mt-16' },
              el(
                'button',
                {
                  class: 'btn grow', type: 'button',
                  onClick: () => (session.mode === 'text' ? runTextAnalysis(ctx) : runAnalysis(ctx)),
                },
                'Nochmal versuchen'
              ),
              // Nur beim Foto: eine Beschreibung kann man später ohnehin
              // nochmal eintippen, ein Moment mit dem Teller kommt nicht wieder.
              session.photoBlob
                ? el(
                    'button',
                    {
                      class: 'btn btn-primary grow', type: 'button',
                      onClick: () => fuerSpaeterAufheben(ctx),
                    },
                    'Für später aufheben'
                  )
                : null
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

  // Chat-Brücke: Analyse ohne API-Key — für Foto wie für Beschreibung
  if ((session.photoBlob || session.mode === 'text') && !session.analysing) {
    if (session.showBridge) {
      blocks.push(chatBridgeCard(ctx));
    } else {
      blocks.push(
        el(
          'button',
          {
            class: 'btn btn-ghost btn-block',
            type: 'button',
            onClick: () => {
              session.showBridge = true;
              rerender(ctx);
            },
          },
          'Stattdessen über die Claude-App analysieren'
        )
      );
    }
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

  const einordnung = einordnungsKarte(ctx);
  if (einordnung) blocks.push(el('div', { class: 'mt-16' }, einordnung));

  // Notiz und Favorit
  blocks.push(
    el(
      'div',
      { class: 'card mt-16 stack' },
      field(
        'Notiz für dich',
        el('textarea', {
          class: 'input',
          rows: '2',
          placeholder: 'optional — z. B. „hat lange gesättigt" oder „nächstes Mal weniger"',
          onInput: (event) => { session.note = event.target.value; },
        }, session.note),
        // Ohne diesen Satz sieht die Notiz aus wie das Hinweisfeld weiter oben,
        // beeinflusst die Zahlen aber nicht.
        'Wird mit der Mahlzeit gespeichert und ändert die Schätzung nicht.'
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
    tagesMahlzeiten = await getMealsByDate(session.dateKey);
  }

  draw(container, ctx);
}
