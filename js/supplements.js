/**
 * Nahrungsergänzung.
 *
 * Zwei Dinge macht dieses Modul, und ein drittes ausdrücklich nicht.
 *
 * Es macht: eine tägliche Liste zum Abhaken, und es kennt die Wechselwirkungen
 * mit dem Rest der App — Kreatin verschiebt das Gewicht, Koffein verschiebt den
 * Schlaf, Eiweißpulver zählt aufs Eiweißziel. Genau daran hängt der Nutzen;
 * eine Häkchenliste allein wäre eine Notiz-App.
 *
 * Es macht nicht: dosieren. Zu jedem Mittel steht, wofür es belegt ist und wie
 * gut — mehr nicht. Was du brauchst, hängt an Blutwerten, Ernährung und
 * Vorerkrankungen, und das weiß diese App nicht. Die Mengen unten sind die in
 * der Literatur üblichen Größenordnungen, keine Empfehlung an dich.
 *
 * Die Belegstufen sind bewusst grob und ehrlich:
 *   gut     — mehrfach in kontrollierten Studien bestätigt
 *   mittel  — Wirkung plausibel, aber kleiner oder von der Ausgangslage abhängig
 *   duenn   — wird viel verkauft, hält der Prüfung kaum stand
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/** Wann am Tag ein Mittel üblicherweise genommen wird. */
export const ZEITEN = {
  morgens:  { label: 'Morgens',        kurz: 'früh' },
  mittags:  { label: 'Mittags',        kurz: 'mittags' },
  vor:      { label: 'Vor dem Sport',  kurz: 'vorher' },
  nach:     { label: 'Nach dem Sport', kurz: 'danach' },
  abends:   { label: 'Abends',         kurz: 'abends' },
  egal:     { label: 'Egal wann',      kurz: 'egal' },
};

export const BELEG_LABEL = {
  gut:    'gut belegt',
  mittel: 'mittelmäßig belegt',
  duenn:  'dünn belegt',
};

/**
 * Die Auswahlliste. `zeit` ist der Vorschlag, den man beim Einrichten ändern
 * kann — er ist nicht Teil der Wirkung.
 */
export const SUPPLEMENTS = [
  {
    id: 'kreatin',
    name: 'Kreatin-Monohydrat',
    beleg: 'gut',
    menge: '3–5 g täglich',
    zeit: 'egal',
    wofuer: 'Mehr Wiederholungen in kurzen, harten Sätzen. Das am besten untersuchte '
      + 'Mittel im Kraftsport überhaupt.',
    hinweis: 'Der Zeitpunkt ist egal — es zählt, dass der Speicher voll ist, nicht wann '
      + 'du es nimmst. Eine Ladephase braucht es nicht.',
    // Diese Marken steuern die Hinweise im Rest der App.
    wirkt: ['gewicht'],
  },
  {
    id: 'eiweiss',
    name: 'Eiweißpulver',
    beleg: 'gut',
    menge: '20–40 g je Portion',
    zeit: 'nach',
    wofuer: 'Kein Wundermittel, sondern Essen in praktischer Form. Nützlich, wenn du dein '
      + 'Eiweißziel sonst nicht erreichst.',
    hinweis: 'Trag die Portion als Mahlzeit ein, nicht nur hier als Häkchen — sonst fehlt '
      + 'sie in der Tagessumme und im Eiweißziel.',
    wirkt: ['eiweiss'],
  },
  {
    id: 'koffein',
    name: 'Koffein',
    beleg: 'gut',
    menge: '3–6 mg je kg Körpergewicht',
    zeit: 'vor',
    wofuer: 'Messbar mehr Kraft und Ausdauer, und die Einheit fühlt sich leichter an.',
    hinweis: 'Die Halbwertszeit liegt bei fünf bis sechs Stunden. Nachmittags genommen '
      + 'ist abends noch die Hälfte im Blut — das kostet Tiefschlaf, auch wenn du '
      + 'problemlos einschläfst.',
    wirkt: ['schlaf'],
  },
  {
    id: 'vitd',
    name: 'Vitamin D3',
    beleg: 'mittel',
    menge: '1000–2000 IE täglich',
    zeit: 'morgens',
    wofuer: 'Zwischen Oktober und März steht die Sonne hierzulande zu tief, um genug zu '
      + 'bilden. Bei niedrigem Spiegel bringt Auffüllen etwas — bei normalem nichts.',
    hinweis: 'Der einzige Weg, das zu wissen, ist ein Blutwert. Ohne Messung ist es geraten.',
    wirkt: [],
  },
  {
    id: 'omega3',
    name: 'Omega-3 (EPA/DHA)',
    beleg: 'mittel',
    menge: '1–2 g EPA + DHA täglich',
    zeit: 'egal',
    wofuer: 'Sinnvoll, wenn du selten fetten Fisch isst. Wer zweimal die Woche Lachs oder '
      + 'Hering isst, braucht die Kapseln nicht.',
    hinweis: 'Auf der Packung steht meist die Ölmenge, nicht der EPA/DHA-Gehalt. Der steht '
      + 'kleiner darunter und ist der Wert, auf den es ankommt.',
    wirkt: [],
  },
  {
    id: 'b12',
    name: 'Vitamin B12',
    beleg: 'gut',
    menge: '10–250 µg täglich',
    zeit: 'morgens',
    wofuer: 'Notwendig bei veganer Ernährung — B12 kommt praktisch nur aus tierischen '
      + 'Lebensmitteln. Bei gemischter Kost überflüssig.',
    hinweis: 'Hier geht es nicht um Leistung, sondern um einen echten Mangel mit '
      + 'bleibenden Folgen. Wenn du vegan isst, ist das kein Extra.',
    wirkt: [],
  },
  {
    id: 'magnesium',
    name: 'Magnesium',
    beleg: 'duenn',
    menge: '200–400 mg täglich',
    zeit: 'abends',
    wofuer: 'Wird gegen Krämpfe und für den Schlaf verkauft. Ein echter Mangel ist bei '
      + 'normaler Ernährung selten, und ohne Mangel ist auch keine Wirkung zu erwarten.',
    hinweis: 'Größere Mengen wirken abführend. Wenn du es nimmst, dann eher niedrig dosiert.',
    wirkt: [],
  },
  {
    id: 'betaalanin',
    name: 'Beta-Alanin',
    beleg: 'mittel',
    menge: '3–5 g täglich',
    zeit: 'egal',
    wofuer: 'Hilft bei Belastungen von etwa einer bis vier Minuten. Für schwere Sätze mit '
      + 'wenigen Wiederholungen bringt es nichts.',
    hinweis: 'Kribbeln in Gesicht und Händen ist normal und harmlos. Die Wirkung baut sich '
      + 'über Wochen auf, nicht am Tag der Einnahme.',
    wirkt: [],
  },
  {
    id: 'zink',
    name: 'Zink',
    beleg: 'duenn',
    menge: '10–25 mg täglich',
    zeit: 'abends',
    wofuer: 'Nur bei nachgewiesenem Mangel sinnvoll.',
    hinweis: 'Dauerhaft hohe Mengen stören die Kupferaufnahme. Das ist eines der wenigen '
      + 'Mittel, bei denen mehr klar schlechter ist.',
    wirkt: [],
  },
  {
    id: 'multi',
    name: 'Multivitamin',
    beleg: 'duenn',
    menge: '1 Tablette täglich',
    zeit: 'morgens',
    wofuer: 'Als Absicherung gedacht. Bei halbwegs abwechslungsreicher Ernährung ist kein '
      + 'Nutzen nachweisbar.',
    hinweis: 'Schadet in üblicher Dosierung nicht, ersetzt aber kein Gemüse.',
    wirkt: [],
  },
];

const BY_ID = new Map(SUPPLEMENTS.map((s) => [s.id, s]));

export function supplementById(id) {
  return BY_ID.get(id) || null;
}

/**
 * Die eingerichtete Liste zu vollständigen Einträgen auflösen.
 * Eigene Einträge ohne Katalogeintrag bleiben erhalten — wer etwas nimmt, das
 * hier nicht steht, soll es trotzdem abhaken können.
 *
 * @param {Array} gewaehlt  [{ id, zeit?, menge?, name? }]
 */
export function resolve(gewaehlt) {
  return (gewaehlt || []).map((eintrag) => {
    const katalog = supplementById(eintrag.id);
    return {
      id: eintrag.id,
      name: eintrag.name || katalog?.name || eintrag.id,
      menge: eintrag.menge || katalog?.menge || '',
      zeit: eintrag.zeit || katalog?.zeit || 'egal',
      beleg: katalog?.beleg || null,
      wofuer: katalog?.wofuer || null,
      hinweis: katalog?.hinweis || null,
      wirkt: katalog?.wirkt || [],
      eigen: !katalog,
    };
  });
}

/** Nach Tageszeit gruppiert, in der Reihenfolge von ZEITEN. */
export function byTime(aufgeloest) {
  const reihenfolge = Object.keys(ZEITEN);
  const gruppen = new Map();
  for (const s of aufgeloest) {
    if (!gruppen.has(s.zeit)) gruppen.set(s.zeit, []);
    gruppen.get(s.zeit).push(s);
  }
  return reihenfolge
    .filter((z) => gruppen.has(z))
    .map((z) => ({ zeit: z, label: ZEITEN[z].label, mittel: gruppen.get(z) }));
}

/** Stand eines Tages: wie viele der eingerichteten Mittel abgehakt sind. */
export function dayStatus(aufgeloest, eintrag) {
  const genommen = (eintrag && eintrag.taken) || {};
  const offen = aufgeloest.filter((s) => !genommen[s.id]);
  return {
    gesamt: aufgeloest.length,
    genommen: aufgeloest.length - offen.length,
    offen,
    vollstaendig: aufgeloest.length > 0 && offen.length === 0,
  };
}

/**
 * Serie: Tage in Folge, an denen alles abgehakt war.
 * Der heutige Tag zählt erst mit, wenn er vollständig ist.
 */
export function streak(aufgeloest, eintraege, bisDatum, shift) {
  if (!aufgeloest.length) return 0;
  const nach = new Map((eintraege || []).map((e) => [e.date, e]));
  const voll = (t) => dayStatus(aufgeloest, nach.get(t)).vollstaendig;

  let serie = 0;
  let tag = voll(bisDatum) ? bisDatum : shift(bisDatum, -1);
  for (let i = 0; i < 400; i += 1) {
    if (!voll(tag)) break;
    serie += 1;
    tag = shift(tag, -1);
  }
  return serie;
}

/**
 * Seit wann ein Mittel ununterbrochen genommen wird, in Tagen.
 * Gebraucht für den Kreatin-Hinweis: die Wassereinlagerung fällt in die ersten
 * Wochen, danach nicht mehr.
 */
export function daysOn(id, eintraege, bisDatum, shift) {
  const nach = new Map((eintraege || []).map((e) => [e.date, e]));
  let tage = 0;
  let tag = bisDatum;
  for (let i = 0; i < 400; i += 1) {
    if (!nach.get(tag)?.taken?.[id]) break;
    tage += 1;
    tag = shift(tag, -1);
  }
  return tage;
}
