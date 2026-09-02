/**
 * Essensvorschläge.
 *
 * Die Frage, die abends um sieben tatsächlich im Raum steht, ist nicht „was ist
 * gesund", sondern: **mir fehlen noch 700 Kalorien und 60 Gramm Eiweiß, und ich
 * habe keine Idee.** Genau darauf antwortet dieses Modul.
 *
 * Zwei Quellen, in dieser Reihenfolge:
 *
 * 1. **Deine Favoriten.** Was du schon einmal gegessen und gespeichert hast,
 *    passt zu deinem Geschmack, deiner Küche und deinem Einkauf. Ein Vorschlag
 *    von hier lässt sich mit einem Tippen eintragen, weil die Nährwerte schon
 *    dastehen. Das schlägt jede fremde Idee.
 * 2. **Eine kleine eingebaute Liste** einfacher Sachen, für den Anfang und für
 *    Lücken, die deine Favoriten nicht füllen. Bewusst kurz und bewusst
 *    langweilig: das sind Bausteine, keine Rezepte.
 *
 * Beides läuft ohne Verbindung und ohne API-Key. Wer Lust auf etwas Neues hat,
 * kann in der App zusätzlich Claude fragen — das ist ein eigener Knopf und
 * ausdrücklich nicht der Normalfall.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/**
 * Kostformen.
 *
 * Sie steuern nur die eingebauten Bausteine, nie die eigenen Favoriten — was
 * du selbst gespeichert hast, ist per Definition das, was du isst. Und sie sind
 * keine Regel: Wer sich vegetarisch ernährt und zweimal im Monat Fisch isst,
 * trägt den Fisch einfach ein. Die Einstellung entscheidet, was die App
 * vorschlägt, nicht was erlaubt ist.
 */
export const KOSTFORMEN = {
  misch:       { label: 'Alles',        kurz: 'Mischkost' },
  vegetarisch: { label: 'Vegetarisch',  kurz: 'kein Fleisch, kein Fisch' },
  vegan:       { label: 'Vegan',        kurz: 'keine Tierprodukte' },
};

/** Welche Bausteine eine Kostform zulässt. */
const ERLAUBT = {
  vegan:       new Set(['vegan']),
  vegetarisch: new Set(['vegan', 'vegetarisch']),
  misch:       new Set(['vegan', 'vegetarisch', 'misch']),
};

/**
 * Eingebaute Bausteine.
 *
 * Nährwerte gerundet und je Portion, wie man sie tatsächlich isst. Sie sind
 * Anhaltspunkte — beim Eintragen lassen sie sich korrigieren, und wer genau
 * misst, kommt ohnehin auf andere Zahlen.
 *
 * `kost` nennt die strengste Ernährungsform, in die ein Baustein noch passt.
 */
export const BAUSTEINE = [
  /* --- Eiweißträger mit wenig Kalorien: der Fall, der am häufigsten fehlt --- */
  { name: 'Magerquark mit Beeren', kcal: 230, protein: 33, carbs: 18, fat: 1,
    grams: 350, zeit: ['breakfast', 'snack', 'dinner'], schnell: true, kost: 'vegetarisch' },
  { name: 'Skyr mit Honig', kcal: 200, protein: 27, carbs: 20, fat: 1,
    grams: 300, zeit: ['breakfast', 'snack'], schnell: true, kost: 'vegetarisch' },
  { name: 'Hüttenkäse auf Vollkornbrot', kcal: 300, protein: 24, carbs: 32, fat: 8,
    grams: 200, zeit: ['breakfast', 'dinner'], schnell: true, kost: 'vegetarisch' },
  { name: 'Rührei aus drei Eiern mit Brot', kcal: 420, protein: 27, carbs: 30, fat: 21,
    grams: 250, zeit: ['breakfast', 'dinner'], schnell: true, kost: 'vegetarisch' },
  { name: 'Griechischer Joghurt mit Nüssen', kcal: 320, protein: 20, carbs: 14, fat: 20,
    grams: 250, zeit: ['breakfast', 'snack'], schnell: true, kost: 'vegetarisch' },
  { name: 'Eiweißshake mit Milch', kcal: 280, protein: 35, carbs: 20, fat: 6,
    grams: 400, zeit: ['snack', 'breakfast'], schnell: true, kost: 'vegetarisch' },
  { name: 'Sojajoghurt mit Beeren und Leinsamen', kcal: 260, protein: 16, carbs: 24, fat: 11,
    grams: 300, zeit: ['breakfast', 'snack'], schnell: true, kost: 'vegan' },
  { name: 'Eiweißshake mit Sojamilch', kcal: 270, protein: 33, carbs: 18, fat: 6,
    grams: 400, zeit: ['snack', 'breakfast'], schnell: true, kost: 'vegan' },
  { name: 'Hähnchenbrust mit Reis und Gemüse', kcal: 550, protein: 48, carbs: 55, fat: 12,
    grams: 450, zeit: ['lunch', 'dinner'], schnell: false, kost: 'misch' },
  { name: 'Thunfisch aus der Dose mit Vollkornnudeln', kcal: 520, protein: 42, carbs: 62, fat: 9,
    grams: 380, zeit: ['lunch', 'dinner'], schnell: true, kost: 'misch' },
  { name: 'Lachsfilet mit Kartoffeln', kcal: 600, protein: 40, carbs: 45, fat: 27,
    grams: 400, zeit: ['lunch', 'dinner'], schnell: false, kost: 'misch' },

  /* --- Warme Hauptmahlzeiten --- */
  { name: 'Linsen mit Feta und Tomaten', kcal: 480, protein: 27, carbs: 48, fat: 18,
    grams: 400, zeit: ['lunch', 'dinner'], schnell: false, kost: 'vegetarisch' },
  { name: 'Halloumi mit Ofengemüse und Couscous', kcal: 580, protein: 30, carbs: 52, fat: 26,
    grams: 420, zeit: ['lunch', 'dinner'], schnell: false, kost: 'vegetarisch' },
  { name: 'Linsenbolognese mit Vollkornnudeln', kcal: 620, protein: 31, carbs: 88, fat: 14,
    grams: 480, zeit: ['lunch', 'dinner'], schnell: false, kost: 'vegan' },
  { name: 'Kichererbsen-Curry mit Reis', kcal: 590, protein: 24, carbs: 82, fat: 17,
    grams: 500, zeit: ['lunch', 'dinner'], schnell: false, kost: 'vegan' },
  { name: 'Tofu-Pfanne mit Brokkoli und Reis', kcal: 520, protein: 34, carbs: 54, fat: 17,
    grams: 450, zeit: ['lunch', 'dinner'], schnell: true, kost: 'vegan' },
  { name: 'Bohnen-Chili mit Mais', kcal: 450, protein: 25, carbs: 60, fat: 11,
    grams: 500, zeit: ['lunch', 'dinner'], schnell: false, kost: 'vegan' },
  { name: 'Tempeh mit Süßkartoffel und Spinat', kcal: 560, protein: 36, carbs: 52, fat: 20,
    grams: 450, zeit: ['lunch', 'dinner'], schnell: false, kost: 'vegan' },
  { name: 'Nudeln mit Hackfleischsoße', kcal: 750, protein: 42, carbs: 82, fat: 26,
    grams: 500, zeit: ['lunch', 'dinner'], schnell: false, kost: 'misch' },
  { name: 'Wrap mit Hähnchen und Avocado', kcal: 600, protein: 38, carbs: 48, fat: 27,
    grams: 350, zeit: ['lunch', 'dinner'], schnell: true, kost: 'misch' },

  /* --- Sättigung bei wenig Kalorien --- */
  { name: 'Großer Salat mit Ei und Kichererbsen', kcal: 380, protein: 22, carbs: 30, fat: 18,
    grams: 500, zeit: ['lunch', 'dinner'], schnell: false, kost: 'vegetarisch' },
  { name: 'Linsensuppe mit Gemüse', kcal: 320, protein: 20, carbs: 44, fat: 6,
    grams: 500, zeit: ['lunch', 'dinner'], schnell: false, kost: 'vegan' },
  { name: 'Gemüsesuppe mit Hühnchen', kcal: 300, protein: 28, carbs: 22, fat: 10,
    grams: 500, zeit: ['lunch', 'dinner'], schnell: false, kost: 'misch' },
  { name: 'Edamame mit Salz', kcal: 190, protein: 18, carbs: 12, fat: 8,
    grams: 200, zeit: ['snack'], schnell: true, kost: 'vegan' },
  { name: 'Apfel mit Handvoll Mandeln', kcal: 230, protein: 6, carbs: 24, fat: 13,
    grams: 180, zeit: ['snack'], schnell: true, kost: 'vegan' },
  { name: 'Karotten und Gurke mit Hummus', kcal: 200, protein: 7, carbs: 18, fat: 11,
    grams: 250, zeit: ['snack'], schnell: true, kost: 'vegan' },

  /* --- Wenn viel übrig ist --- */
  { name: 'Haferflocken mit Banane und Erdnussmus', kcal: 620, protein: 22, carbs: 78, fat: 24,
    grams: 400, zeit: ['breakfast'], schnell: true, kost: 'vegan' },
  { name: 'Porridge mit Sojamilch, Nüssen und Datteln', kcal: 660, protein: 25, carbs: 84, fat: 25,
    grams: 450, zeit: ['breakfast'], schnell: true, kost: 'vegan' },
];


/** Welche Mahlzeitenart zu einer Uhrzeit passt. */
export function mealTypeForHour(stunde) {
  if (stunde < 11) return 'breakfast';
  if (stunde < 15) return 'lunch';
  if (stunde < 21) return 'dinner';
  return 'snack';
}

/**
 * Wie gut ein Kandidat in das passt, was noch übrig ist.
 *
 * Kein Optimierungsproblem, sondern eine Rangfolge nach drei Dingen: Er soll
 * nicht über den Rest hinausschießen, er soll das Eiweiß mitbringen, das noch
 * fehlt, und er soll zur Tageszeit passen. Mehr Feinheit würde eine Genauigkeit
 * vortäuschen, die die Nährwerte gar nicht haben.
 */
function passt(kandidat, rest, mealType) {
  const kcal = kandidat.kcal || 0;
  const protein = kandidat.protein || 0;
  if (kcal <= 0) return null;

  let punkte = 0;
  const gruende = [];

  /* Kalorien: der Kandidat sollte den Rest möglichst füllen, ohne ihn zu sprengen. */
  if (rest.kcal > 0) {
    const anteil = kcal / rest.kcal;
    if (anteil <= 1.05) {
      punkte += 40 * Math.min(1, anteil / 0.85);
    } else {
      // Darüber fällt es ab, statt hart auszuschließen: 100 kcal zu viel sind
      // kein Grund, einen sonst perfekten Vorschlag zu verschweigen.
      punkte += Math.max(0, 40 - (anteil - 1.05) * 90);
    }
  } else {
    // Nichts mehr übrig: dann zählt nur noch, dass es klein ist.
    punkte += Math.max(0, 25 - kcal / 20);
  }

  /* Eiweiß: was fehlt, soll gedeckt werden. */
  if (rest.protein > 5) {
    const deckung = Math.min(1, protein / rest.protein);
    punkte += 40 * deckung;
    if (deckung >= 0.5) gruende.push(`deckt ${Math.round(deckung * 100)} % vom fehlenden Eiweiß`);
  } else if (protein >= 20) {
    punkte += 10;
  }

  /* Tageszeit. */
  const zeiten = kandidat.zeit || [];
  if (!zeiten.length || zeiten.includes(mealType)) punkte += 20;
  else punkte += 4;

  if (kandidat.schnell) gruende.push('schnell gemacht');

  return { punkte, gruende };
}

/**
 * Vorschläge für den Rest des Tages.
 *
 * @param {object} opts
 *   rest       { kcal, protein } — was heute noch übrig ist
 *   favorites  gespeicherte Favoriten
 *   stunde     Tagesstunde, für die Mahlzeitenart
 *   kost       'misch' | 'vegetarisch' | 'vegan' — filtert nur die Bausteine
 *   anzahl     wie viele Vorschläge
 * @returns {Array<{name, quelle, kcal, protein, carbs, fat, grund, favorit}>}
 */
export function suggest({
  rest, favorites = [], stunde = new Date().getHours(), kost = 'misch', anzahl = 3,
}) {
  const mealType = mealTypeForHour(stunde);
  const ziel = {
    kcal: Math.max(0, Math.round(rest?.kcal || 0)),
    protein: Math.max(0, Math.round(rest?.protein || 0)),
  };

  const kandidaten = [];

  for (const fav of favorites) {
    const t = fav.totals || {};
    if (!t.kcal) continue;
    kandidaten.push({
      name: fav.name,
      quelle: 'favorit',
      favoritId: fav.id,
      kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat,
      zeit: fav.mealType ? [fav.mealType] : [],
      usedAt: fav.usedAt || 0,
    });
  }

  // Nur die Bausteine werden gefiltert. Favoriten bleiben unangetastet: Was
  // jemand selbst gespeichert hat, ist per Definition das, was er isst — und
  // eine App, die einem das eigene Essen wegfiltert, ist kaputt.
  const erlaubt = ERLAUBT[kost] || ERLAUBT.misch;
  for (const b of BAUSTEINE) {
    if (!erlaubt.has(b.kost)) continue;
    kandidaten.push({ ...b, quelle: 'baustein' });
  }

  const bewertet = [];
  for (const k of kandidaten) {
    const p = passt(k, ziel, mealType);
    if (!p) continue;
    // Eigene Favoriten bekommen einen Bonus: sie sind eintragbar mit einem
    // Tippen und treffen den eigenen Geschmack.
    const bonus = k.quelle === 'favorit' ? 12 : 0;
    bewertet.push({ ...k, punkte: p.punkte + bonus, gruende: p.gruende });
  }

  bewertet.sort((a, b) => b.punkte - a.punkte || (b.usedAt || 0) - (a.usedAt || 0));

  // Nicht dreimal fast dasselbe vorschlagen.
  const gewaehlt = [];
  for (const k of bewertet) {
    if (gewaehlt.length >= anzahl) break;
    const aehnlich = gewaehlt.some((g) =>
      Math.abs(g.kcal - k.kcal) < 60 && Math.abs(g.protein - k.protein) < 8);
    if (aehnlich) continue;
    gewaehlt.push(k);
  }

  return gewaehlt.map((k) => ({
    name: k.name,
    quelle: k.quelle,
    favoritId: k.favoritId || null,
    kcal: Math.round(k.kcal),
    protein: Math.round(k.protein || 0),
    carbs: Math.round(k.carbs || 0),
    fat: Math.round(k.fat || 0),
    grams: k.grams || 0,
    grund: k.gruende.length ? k.gruende.join(', ') : null,
  }));
}

/**
 * Der Prompt für den freiwilligen Weg über Claude.
 *
 * Getrennt gehalten, damit man ihn auch ohne API-Key lesen und in der
 * Claude-App verwenden kann — derselbe Weg wie bei den Essensfotos.
 */
export function suggestionPrompt(rest, { mealType, mag = [], kost = 'misch' } = {}) {
  const zeit = { breakfast: 'Frühstück', lunch: 'Mittagessen',
    dinner: 'Abendessen', snack: 'Snack' }[mealType] || 'Mahlzeit';

  const zeilen = [
    `Ich brauche Ideen für ein ${zeit}.`,
    `Übrig für heute: ${Math.round(rest.kcal)} kcal und ${Math.round(rest.protein)} g Eiweiß.`,
  ];
  if (kost === 'vegetarisch') zeilen.push('Ich esse vegetarisch — kein Fleisch, kein Fisch.');
  if (kost === 'vegan') zeilen.push('Ich esse vegan — keine tierischen Produkte.');
  if (mag.length) zeilen.push(`Das esse ich oft und gerne: ${mag.join(', ')}.`);
  zeilen.push(
    '',
    'Bitte drei Vorschläge, jeder mit einer Zeile Zutaten und den geschätzten Nährwerten',
    'im Format: Name — kcal / Eiweiß g / Kohlenhydrate g / Fett g.',
    'Nichts Aufwendiges, höchstens 20 Minuten Zubereitung.'
  );
  return zeilen.join('\n');
}
