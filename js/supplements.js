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
    kost: {
      vegetarisch: 'Für dich besonders: Kreatin steckt fast nur in Fleisch und Fisch. Ohne '
        + 'die ist dein Muskelspeicher von vornherein niedriger, und die Wirkung fällt in '
        + 'Studien entsprechend deutlicher aus als bei Mischköstlern.',
      vegan: 'Für dich besonders: Kreatin steckt fast nur in Fleisch und Fisch, über die '
        + 'Nahrung nimmst du also praktisch keines auf. Der Speicher ist dadurch niedriger '
        + 'und die Wirkung fällt deutlicher aus als bei Mischköstlern. Auf „vegan" achten — '
        + 'Monohydrat ist es fast immer, die Kapselhülle nicht immer.',
    },
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
    kost: {
      vegetarisch: 'Molkenpulver ist vegetarisch. Wer lieber pflanzlich will: Soja kommt '
        + 'dem Aminosäureprofil von Molke am nächsten, Erbse und Reis gemischt ebenfalls.',
      vegan: 'Soja allein reicht aus. Erbse und Reis einzeln haben Lücken im '
        + 'Aminosäureprofil, gemischt gleichen sie sich aus — deshalb die vielen '
        + 'Mehrkomponenten-Pulver.',
    },
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
    kost: {
      vegetarisch: 'Ohne Fisch bleibt praktisch nichts übrig: Lein-, Walnuss- und Rapsöl '
        + 'liefern ALA, und davon rechnet der Körper nur wenige Prozent in EPA und DHA um. '
        + 'Wer nicht auf Fischöl will, nimmt Algenöl — daher stammt das EPA im Fisch '
        + 'ohnehin.',
      vegan: 'Algenöl statt Fischöl. Das ist die ursprüngliche Quelle — Fische reichern '
        + 'EPA und DHA nur aus Algen an. Lein- und Walnussöl liefern ALA, das reicht nicht.',
    },
  },
  {
    id: 'b12',
    name: 'Vitamin B12',
    beleg: 'gut',
    menge: '10–250 µg täglich',
    zeit: 'morgens',
    wofuer: 'B12 kommt praktisch nur aus tierischen Lebensmitteln. Bei veganer Ernährung '
      + 'notwendig, bei gemischter Kost überflüssig.',
    hinweis: 'Hier geht es nicht um Leistung, sondern um einen echten Mangel mit '
      + 'bleibenden Folgen — und der zeigt sich erst nach Jahren, wenn die Leberreserve '
      + 'aufgebraucht ist.',
    wirkt: [],
    kost: {
      vegetarisch: 'Bei dir kommt es auf die Menge an: Milchprodukte und Eier enthalten '
        + 'B12, aber wenig. Wer selten beides isst, liegt schnell im unteren Bereich. Ein '
        + 'Blutwert klärt das — raten hilft hier nicht.',
      vegan: 'Für dich ist das kein Extra, sondern Pflicht. Es gibt keine verlässliche '
        + 'pflanzliche Quelle; Algen und Sauerkraut zählen nicht.',
    },
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
    kost: {
      vegetarisch: 'Hülsenfrüchte und Vollkorn enthalten Zink, aber auch Phytat, das die '
        + 'Aufnahme bremst. Einweichen, Keimen und Sauerteig bauen Phytat ab — das bringt '
        + 'in der Regel mehr als eine Tablette.',
      vegan: 'Hülsenfrüchte und Vollkorn enthalten Zink, aber auch Phytat, das die '
        + 'Aufnahme bremst. Einweichen, Keimen und Sauerteig bauen Phytat ab — das bringt '
        + 'in der Regel mehr als eine Tablette.',
    },
  },
  {
    id: 'eisen',
    name: 'Eisen',
    beleg: 'mittel',
    menge: '10–20 mg täglich',
    zeit: 'morgens',
    wofuer: 'Nur bei nachgewiesenem Mangel. Der macht sich als Müdigkeit und schneller '
      + 'Erschöpfung im Training bemerkbar — beides hat aber auch ein Dutzend andere Gründe.',
    hinweis: 'Ohne Blutbild nicht einnehmen. Zu viel Eisen lagert sich ein und ist dann '
      + 'nicht mehr loszuwerden — das ist kein Vitamin, bei dem der Überschuss einfach '
      + 'ausgeschieden wird.',
    wirkt: [],
    kost: {
      vegetarisch: 'Pflanzliches Eisen wird schlechter aufgenommen als das aus Fleisch. '
        + 'Vitamin C zur selben Mahlzeit verbessert das deutlich — Paprika oder ein Glas '
        + 'Orangensaft zu den Linsen. Kaffee und Tee direkt danach bremsen es.',
      vegan: 'Pflanzliches Eisen wird schlechter aufgenommen als das aus Fleisch. '
        + 'Vitamin C zur selben Mahlzeit verbessert das deutlich — Paprika oder ein Glas '
        + 'Orangensaft zu den Linsen. Kaffee und Tee direkt danach bremsen es.',
    },
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
export function resolve(gewaehlt, kost = 'misch') {
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
      // Was sich durch die Ernährungsform ändert — bei Kreatin und B12 ist das
      // kein Detail, sondern der Kern der Sache.
      kostHinweis: katalog?.kost?.[kost] || null,
      wirkt: katalog?.wirkt || [],
      eigen: !katalog,
    };
  });
}

/**
 * Reihenfolge im Katalog: Was durch die Ernährungsform an Bedeutung gewinnt,
 * steht oben. Bei vegetarischer Kost sind das Kreatin, B12, Omega-3 und Eisen —
 * genau die vier, die man sonst überliest, weil sie zwischen neun anderen
 * stehen.
 */
export function sortForDiet(liste, kost = 'misch') {
  if (kost === 'misch') return [...liste];
  const relevant = (s) => Boolean(s.kost && s.kost[kost]);
  return [...liste].sort((a, b) => Number(relevant(b)) - Number(relevant(a)));
}

/** Gilt für dieses Mittel bei dieser Kostform ein eigener Hinweis? */
export function hasDietNote(supplement, kost = 'misch') {
  return Boolean(supplement?.kost && supplement.kost[kost]);
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

/* ---------------- Empfehlung ---------------- */

/** Von Oktober bis März steht die Sonne hierzulande zu tief für Vitamin D. */
const DUNKLE_MONATE = new Set([9, 10, 11, 0, 1, 2]);

const rang = { klar: 0, pruefen: 1, spar: 2 };

/**
 * Was für **diesen** Nutzer sinnvoll ist.
 *
 * Bisher stand zu jedem Mittel nur, wie gut es allgemein belegt ist — und die
 * Entscheidung blieb beim Nutzer. Das war ehrlich, aber es half nicht: Neun
 * Einträge mit je drei Absätzen sind eine Bibliothek, keine Antwort.
 *
 * Diese Funktion trifft die Auswahl, aber nur aus dem, was die App tatsächlich
 * weiß: Ernährungsform, Ziel, Trainingstage, Körpergewicht, Eiweißaufnahme der
 * letzten Tage, Jahreszeit. Jede Empfehlung nennt den Grund, und wo der Grund
 * ein Blutwert wäre, steht das statt einer Zahl.
 *
 * Drei Töpfe, und der dritte ist der wichtigste:
 *   klar     — lohnt sich für dich, mit Begründung aus deinen Daten
 *   pruefen  — kann sinnvoll sein, hängt aber an etwas, das die App nicht weiß
 *   spar     — dafür gibt es bei dir keinen Grund
 *
 * Ein Empfehlungssystem, das nie „nein" sagt, ist ein Verkaufskatalog.
 *
 * @param {object} p
 *   profile        Trainingsprofil (ernaehrung, weight, goal, days)
 *   proteinZiel    Tagesziel in Gramm
 *   proteinSchnitt gemessener Schnitt der letzten Tage, oder null
 *   monat          0–11, für die Jahreszeit
 *   schlaeftKurz   liegt der Schlafschnitt unter der Empfehlung?
 */
export function empfehlung(p) {
  const kost = p.profile?.ernaehrung || 'misch';
  const trainiert = (p.profile?.days || 0) >= 2;
  const monat = typeof p.monat === 'number' ? p.monat : new Date().getMonth();
  const aus = [];

  const sag = (id, topf, grund) => {
    const k = supplementById(id);
    if (k) aus.push({ id, name: k.name, beleg: k.beleg, menge: k.menge, topf, grund });
  };

  /* Kreatin */
  if (trainiert) {
    sag('kreatin', 'klar', kost === 'misch'
      ? 'Das am besten belegte Mittel im Kraftsport, und du trainierst regelmäßig. '
        + 'Wirkt unabhängig vom Zeitpunkt, ohne Ladephase.'
      : 'Doppelt sinnvoll bei dir: bestbelegtes Mittel im Kraftsport — und weil Kreatin '
        + 'fast nur in Fleisch und Fisch steckt, ist dein Speicher von vornherein '
        + 'niedriger. Die Wirkung fällt dadurch stärker aus als bei Mischköstlern.');
  } else {
    sag('kreatin', 'pruefen', 'Wirkt vor allem in Verbindung mit Krafttraining. Ohne '
      + 'regelmäßige Einheiten bringt es wenig.');
  }

  /* Eiweißpulver — hängt daran, ob das Ziel ohne erreicht wird */
  const ziel = p.proteinZiel || 0;
  const schnitt = typeof p.proteinSchnitt === 'number' ? p.proteinSchnitt : null;
  if (ziel && schnitt !== null && schnitt < ziel * 0.85) {
    sag('eiweiss', 'klar',
      `Du liegst im Schnitt bei ${Math.round(schnitt)} g statt ${Math.round(ziel)} g. `
      + (kost === 'misch'
        ? 'Eine Portion schließt die Lücke, ohne dass du mehr kochen musst.'
        : 'Pflanzlich ist das die eigentliche Arbeit — eine Portion nimmt dir davon '
          + 'ein Drittel ab.'));
  } else if (ziel && schnitt !== null) {
    sag('eiweiss', 'spar',
      `Du erreichst dein Eiweißziel im Schnitt schon über das Essen (${Math.round(schnitt)} g `
      + `von ${Math.round(ziel)} g). Dann ist Pulver nur eine teure Form von Essen.`);
  } else {
    sag('eiweiss', 'pruefen', 'Erst ein paar Tage Mahlzeiten eintragen — dann sieht die '
      + 'App, ob du dein Eiweißziel ohne Pulver erreichst.');
  }

  /* Vitamin D — Jahreszeit */
  if (DUNKLE_MONATE.has(monat)) {
    sag('vitd', 'pruefen',
      'Von Oktober bis März steht die Sonne hierzulande zu tief, um genug zu bilden — '
      + 'in dieser Zeit sind viele niedrig. Sicher weiß es nur ein Blutwert, und '
      + 'Auffüllen hilft nur, wenn tatsächlich zu wenig da ist.');
  } else {
    sag('vitd', 'spar',
      'Im Sommerhalbjahr reicht bei den meisten das Tageslicht. Ab Oktober lohnt die '
      + 'Frage neu.');
  }

  /* Omega-3 */
  if (kost === 'misch') {
    sag('omega3', 'pruefen',
      'Sinnvoll, wenn du selten fetten Fisch isst. Zweimal die Woche Lachs oder Hering '
      + 'ersetzt die Kapseln.');
  } else {
    sag('omega3', 'klar',
      'Ohne Fisch kommt kaum EPA und DHA zusammen — Lein- und Walnussöl liefern nur ALA, '
      + 'und davon rechnet der Körper wenige Prozent um. Algenöl ist die Quelle, aus der '
      + 'auch der Fisch sein EPA hat.');
  }

  /* B12 */
  if (kost === 'vegan') {
    sag('b12', 'klar',
      'Bei veganer Ernährung keine Option, sondern Pflicht: Es gibt keine verlässliche '
      + 'pflanzliche Quelle, und ein Mangel zeigt sich erst nach Jahren — dann aber mit '
      + 'bleibenden Folgen.');
  } else if (kost === 'vegetarisch') {
    sag('b12', 'pruefen',
      'Milch und Eier enthalten B12, aber wenig. Wenn beides selten auf dem Teller '
      + 'liegt, lohnt ein Blutwert — raten hilft hier nicht.');
  } else {
    sag('b12', 'spar', 'Bei gemischter Kost kommt genug über das Essen.');
  }

  /* Koffein */
  sag('koffein', p.schlaeftKurz ? 'pruefen' : 'pruefen',
    p.schlaeftKurz
      ? 'Wirkt zuverlässig auf die Leistung — aber deine Nächte sind ohnehin kurz, und '
        + 'Koffein verlängert sie nicht. Wenn, dann nur vormittags.'
      : 'Wirkt zuverlässig auf die Leistung. Kein Muss, und nach 15 Uhr kostet es '
        + 'Tiefschlaf, auch wenn das Einschlafen klappt.');

  /* Eisen und Zink */
  if (kost === 'misch') {
    sag('eisen', 'spar', 'Ohne nachgewiesenen Mangel nicht sinnvoll, und zu viel Eisen '
      + 'lagert sich ein.');
    sag('zink', 'spar', 'Bei gemischter Kost selten knapp.');
  } else {
    sag('eisen', 'pruefen',
      'Pflanzliches Eisen wird schlechter aufgenommen. Vor einer Tablette aber: Vitamin C '
      + 'zur selben Mahlzeit bringt oft mehr, und ohne Blutbild gehört Eisen nicht '
      + 'eingenommen — Überschuss lagert sich ein und geht nicht wieder weg.');
    sag('zink', 'pruefen',
      'Hülsenfrüchte und Vollkorn enthalten Zink, aber auch Phytat, das die Aufnahme '
      + 'bremst. Einweichen, Keimen und Sauerteig bringen meist mehr als eine Tablette.');
  }

  /* Der Rest */
  sag('magnesium', 'spar',
    'Wird viel verkauft, ist aber bei normaler Ernährung selten knapp — und ohne Mangel '
    + 'ist keine Wirkung zu erwarten.');
  sag('betaalanin', 'spar',
    'Hilft bei Belastungen von ein bis vier Minuten. Für schwere Sätze mit wenigen '
    + 'Wiederholungen bringt es nichts.');
  sag('multi', 'spar',
    'Als Absicherung gedacht, bei halbwegs abwechslungsreicher Ernährung ohne '
    + 'nachweisbaren Nutzen.');

  aus.sort((a, b) => rang[a.topf] - rang[b.topf]);
  return aus;
}

export const TOPF_LABEL = {
  klar:    { titel: 'Lohnt sich für dich', kurz: 'empfohlen' },
  pruefen: { titel: 'Kommt darauf an',     kurz: 'prüfen' },
  spar:    { titel: 'Spar dir das',        kurz: 'nicht nötig' },
};

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
