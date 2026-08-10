/**
 * Anthropic-API-Client für die Foto-Analyse.
 *
 * Läuft direkt aus dem Browser. Das erlaubt Anthropic ausdrücklich, wenn der
 * Header `anthropic-dangerous-direct-browser-access: true` gesetzt ist — genau
 * für Apps, in denen der Nutzer seinen eigenen Schlüssel mitbringt. Dadurch
 * braucht diese App keinen Server und keinen Proxy.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

/** Auswahl in den Einstellungen. Kosten sind Schätzungen pro Foto. */
export const MODELS = [
  {
    id: 'claude-haiku-4-5',
    label: 'Haiku 4.5',
    cost: 'ca. 0,4 Cent pro Foto',
    hint: 'Schnell und günstig. Für Essenserkennung völlig ausreichend.',
  },
  {
    id: 'claude-sonnet-5',
    label: 'Sonnet 5',
    cost: 'ca. 1,2 Cent pro Foto',
    hint: 'Genauer bei komplizierten Tellern mit vielen Komponenten.',
  },
  {
    id: 'claude-opus-5',
    label: 'Opus 5',
    cost: 'ca. 2 Cent pro Foto',
    hint: 'Beste Erkennung, für diese Aufgabe aber meist überdimensioniert.',
  },
];

/** Fehler mit einer Meldung, die man dem Nutzer direkt zeigen kann. */
export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'unknown', retriable = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
    this.retriable = retriable;
  }
}

const SYSTEM_PROMPT = `Du bist Ernährungsexperte und schätzt Nährwerte von Mahlzeiten anhand eines Fotos.

Vorgehen:
1. Zerlege die Mahlzeit in ihre einzelnen Komponenten (z. B. "Spaghetti", "Bolognese-Sauce", "Parmesan"). Fasse nicht alles zu einem Eintrag zusammen.
2. Schätze für jede Komponente die Menge in Gramm. Nutze sichtbare Größenvergleiche: ein Essteller misst etwa 26 cm, eine Gabel etwa 19 cm, ein Trinkglas fasst etwa 250 ml.
3. Gib für jede Komponente Kalorien, Eiweiß, Kohlenhydrate und Fett an — passend zur geschätzten Grammzahl, nicht pro 100 g.
4. Achte darauf, dass die Werte zusammenpassen: Kalorien entsprechen ungefähr Eiweiß × 4 + Kohlenhydrate × 4 + Fett × 9.
5. Schätze lieber realistisch als vorsichtig. Zubereitungsfett (Öl, Butter) gehört dazu, auch wenn man es nicht sieht.

Feld "dish": kurzer, alltagsnaher Name der Mahlzeit auf Deutsch, z. B. "Spaghetti Bolognese".
Feld "confidence": "hoch", wenn die Komponenten klar erkennbar sind; "mittel" bei verdeckten oder vermischten Speisen; "niedrig", wenn vieles geraten ist.
Feld "note": ein kurzer Satz auf Deutsch dazu, worauf die Schätzung beruht oder was unsicher bleibt.

Ist auf dem Bild kein Essen zu erkennen: "dish" auf "Kein Essen erkannt" setzen, "items" leer lassen, "confidence" auf "niedrig".`;

const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    name:    { type: 'string',  description: 'Name der Komponente auf Deutsch' },
    grams:   { type: 'number',  description: 'Geschätzte Menge in Gramm' },
    kcal:    { type: 'number',  description: 'Kalorien dieser Menge' },
    protein: { type: 'number',  description: 'Eiweiß in Gramm' },
    carbs:   { type: 'number',  description: 'Kohlenhydrate in Gramm' },
    fat:     { type: 'number',  description: 'Fett in Gramm' },
  },
  required: ['name', 'grams', 'kcal', 'protein', 'carbs', 'fat'],
  additionalProperties: false,
};

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    dish:       { type: 'string' },
    confidence: { type: 'string', enum: ['hoch', 'mittel', 'niedrig'] },
    items:      { type: 'array', items: ITEM_SCHEMA },
    note:       { type: 'string' },
  },
  required: ['dish', 'confidence', 'items', 'note'],
  additionalProperties: false,
};

function headers(apiKey) {
  return {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': API_VERSION,
    // Erlaubt den Aufruf direkt aus dem Browser (CORS).
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

/** Übersetzt API- und Netzwerkfehler in verständliche deutsche Meldungen. */
async function toApiError(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    /* Antwort ohne JSON-Körper — dann reicht der Statuscode. */
  }

  const detail = body?.error?.message || '';
  const type = body?.error?.type || '';
  const status = response.status;

  if (status === 401) {
    return new ApiError(
      'Der API-Key wurde nicht akzeptiert. Bitte in den Einstellungen prüfen — er beginnt mit „sk-ant-".',
      { status, kind: 'auth' }
    );
  }
  if (status === 403) {
    return new ApiError('Dieser API-Key hat keine Berechtigung für diese Anfrage.', { status, kind: 'auth' });
  }
  if (status === 404) {
    return new ApiError(
      'Das eingestellte Modell gibt es nicht (mehr). Bitte in den Einstellungen ein anderes wählen.',
      { status, kind: 'model' }
    );
  }
  if (status === 400 && /credit balance|billing|too low/i.test(detail)) {
    return new ApiError(
      'Das Guthaben deines Anthropic-Kontos ist aufgebraucht. Unter console.anthropic.com aufladen.',
      { status, kind: 'credit' }
    );
  }
  if (status === 413 || /too large|request_too_large/i.test(type)) {
    return new ApiError('Das Foto ist zu groß für eine Anfrage.', { status, kind: 'size' });
  }
  if (status === 429) {
    return new ApiError('Zu viele Anfragen hintereinander. Bitte kurz warten und nochmal versuchen.', {
      status, kind: 'rate', retriable: true,
    });
  }
  if (status >= 500) {
    return new ApiError('Anthropic ist gerade überlastet. In ein paar Sekunden nochmal versuchen.', {
      status, kind: 'server', retriable: true,
    });
  }

  return new ApiError(detail || `Unerwarteter Fehler von der API (Status ${status}).`, {
    status,
    kind: 'unknown',
  });
}

/** Ein fehlgeschlagener fetch heißt fast immer: kein Netz oder blockiert. */
function networkError(err) {
  return new ApiError(
    'Keine Verbindung zur Anthropic-API. Prüfe deine Internetverbindung — ' +
      'ein Werbeblocker oder eine Firewall kann die Anfrage ebenfalls blockieren.',
    { status: 0, kind: 'network', retriable: true, cause: err }
  );
}

async function callApi(apiKey, body) {
  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw networkError(err);
  }

  if (!response.ok) throw await toApiError(response);
  return response.json();
}

/** Erster Textblock einer Antwort. */
function firstText(message) {
  const block = (message.content || []).find((b) => b.type === 'text');
  return block ? block.text : '';
}

/**
 * Kurzer, sehr billiger Aufruf, um Key und Guthaben zu prüfen.
 * @returns {Promise<{model: string}>}
 */
export async function testConnection(apiKey, model) {
  if (!apiKey) throw new ApiError('Es ist noch kein API-Key hinterlegt.', { kind: 'auth' });

  const message = await callApi(apiKey, {
    model,
    max_tokens: 8,
    messages: [{ role: 'user', content: 'Antworte nur mit dem Wort OK.' }],
  });

  return { model: message.model || model };
}

/** Wandelt einen Wert robust in eine nicht-negative Zahl. */
function num(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Analysiert ein Foto und liefert die geschätzten Nährwerte.
 *
 * @param {object} options
 * @param {string} options.apiKey
 * @param {string} options.model
 * @param {string} options.base64    Bilddaten ohne 'data:'-Präfix
 * @param {string} [options.mediaType]
 * @param {string} [options.hint]    Optionaler Hinweis des Nutzers
 * @returns {Promise<{dish: string, confidence: string, note: string, items: Array}>}
 */
export async function analysePhoto({ apiKey, model, base64, mediaType = 'image/jpeg', hint = '' }) {
  if (!apiKey) {
    throw new ApiError(
      'Für die Foto-Analyse fehlt der API-Key. Du findest das Feld unter „Mehr".',
      { kind: 'auth' }
    );
  }

  const userText = hint.trim()
    ? `Analysiere diese Mahlzeit. Zusatzinfo von mir: ${hint.trim()}`
    : 'Analysiere diese Mahlzeit.';

  const message = await callApi(apiKey, {
    model,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    // Structured Outputs: die Antwort ist garantiert JSON nach diesem Schema,
    // deshalb ist kein Herausparsen aus Fließtext nötig.
    output_config: {
      format: { type: 'json_schema', schema: RESULT_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: userText },
        ],
      },
    ],
  });

  if (message.stop_reason === 'refusal') {
    throw new ApiError('Die Analyse wurde abgelehnt. Bitte trage die Mahlzeit von Hand ein.', {
      kind: 'refusal',
    });
  }
  if (message.stop_reason === 'max_tokens') {
    throw new ApiError(
      'Die Antwort war zu lang und wurde abgeschnitten. Versuch es mit einem einfacheren Foto nochmal.',
      { kind: 'truncated', retriable: true }
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(firstText(message));
  } catch {
    throw new ApiError('Die Antwort der API war unverständlich. Bitte nochmal versuchen.', {
      kind: 'parse',
      retriable: true,
    });
  }

  const items = (Array.isArray(parsed.items) ? parsed.items : []).map((it) => ({
    name: String(it.name ?? '').trim() || 'Komponente',
    grams: num(it.grams),
    kcal: num(it.kcal),
    protein: num(it.protein),
    carbs: num(it.carbs),
    fat: num(it.fat),
  }));

  return {
    dish: String(parsed.dish ?? '').trim() || 'Mahlzeit',
    confidence: ['hoch', 'mittel', 'niedrig'].includes(parsed.confidence) ? parsed.confidence : null,
    note: String(parsed.note ?? '').trim(),
    items,
  };
}
