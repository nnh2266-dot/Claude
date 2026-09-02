/**
 * Einordnung einzelner Mahlzeiten.
 *
 * Eine Vorbemerkung, weil sie die ganze Bauart erklärt: Diese App bewertet
 * **kein Essen als gut oder schlecht**. Sie kennt vier Zahlen — Kalorien,
 * Eiweiß, Kohlenhydrate, Fett — und daraus lässt sich nicht ableiten, ob etwas
 * gesund ist. Ballaststoffe, Zucker, Salz, Vitamine, Verarbeitungsgrad: nichts
 * davon steht in den Daten. Ein Riegel und eine Linsensuppe können dieselben
 * vier Zahlen haben.
 *
 * Was sich ableiten lässt, ist etwas anderes und Nützlicheres: **was diese
 * Mahlzeit für deinen Tag tut.** Bringt sie Eiweiß, von dem du 2,2 g je
 * Kilogramm brauchst? Sättigt sie für ihre Kalorien? Passt sie in das, was
 * heute noch übrig ist? Das sind Fragen über deinen Plan, nicht über den
 * moralischen Wert eines Lebensmittels — und sie sind aus den vorhandenen
 * Zahlen ehrlich zu beantworten.
 *
 * Deshalb heißt hier nichts „ungesund". Ein Stück Kuchen bekommt keine schlechte
 * Note, sondern den Hinweis, dass es wenig Eiweiß bringt und viele Kalorien auf
 * wenig Volumen — was stimmt und was man auch gerne isst.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/**
 * Eiweiß je 100 kcal.
 * Zur Einordnung: Magerquark liegt bei etwa 17, Hähnchenbrust bei 22, Brot bei
 * 3, Öl bei 0. Ab etwa 7,5 trägt eine Mahlzeit ihr Eiweißziel mit.
 */
export const EIWEISS_GUT = 7.5;
export const EIWEISS_MITTEL = 4;

/**
 * Kalorien je 100 Gramm.
 * Der beste Schätzer für Sättigung, den vier Zahlen hergeben: Wasser und
 * Ballaststoffe machen Volumen ohne Kalorien, Fett macht Kalorien ohne Volumen.
 */
export const DICHTE_LEICHT = 150;
export const DICHTE_DICHT = 350;

const bewerte = (wert, gut, mittel, richtung = 'hoch') => {
  if (wert === null) return null;
  const besser = richtung === 'hoch'
    ? (a, b) => a >= b
    : (a, b) => a <= b;
  if (besser(wert, gut)) return 'gut';
  if (besser(wert, mittel)) return 'mittel';
  return 'schwach';
};

/**
 * Einordnung einer Mahlzeit.
 *
 * @param {object} meal     mit `totals` und `items`
 * @param {object} [rest]   { kcal, protein } — was heute noch übrig ist, vor
 *                          dieser Mahlzeit gerechnet. Fehlt es, entfällt die
 *                          dritte Einordnung.
 * @returns {{ eiweiss, dichte, passung, gramm, label, satz, punkte }}
 */
export function scoreMeal(meal, rest = null) {
  const t = meal?.totals || {};
  const kcal = Number(t.kcal) || 0;
  const protein = Number(t.protein) || 0;
  const gramm = (meal?.items || []).reduce((s, i) => s + (Number(i.grams) || 0), 0);

  if (kcal <= 0) return null;

  /* 1. Eiweißdichte */
  const jeHundert = (protein / kcal) * 100;
  const eiweiss = {
    wert: Math.round(jeHundert * 10) / 10,
    stufe: bewerte(jeHundert, EIWEISS_GUT, EIWEISS_MITTEL),
    text: jeHundert >= EIWEISS_GUT
      ? `${Math.round(protein)} g Eiweiß — trägt dein Tagesziel mit.`
      : jeHundert >= EIWEISS_MITTEL
        ? `${Math.round(protein)} g Eiweiß — solide, aber nicht der Träger.`
        : `${Math.round(protein)} g Eiweiß — die Kalorien kommen woanders her.`,
  };

  /* 2. Energiedichte, nur mit Grammangaben */
  let dichte = null;
  if (gramm >= 30) {
    const jeHundertG = (kcal / gramm) * 100;
    dichte = {
      wert: Math.round(jeHundertG),
      stufe: bewerte(jeHundertG, DICHTE_LEICHT, DICHTE_DICHT, 'runter'),
      text: jeHundertG <= DICHTE_LEICHT
        ? `${Math.round(jeHundertG)} kcal je 100 g — viel Volumen, sättigt lange.`
        : jeHundertG <= DICHTE_DICHT
          ? `${Math.round(jeHundertG)} kcal je 100 g — normale Dichte.`
          : `${Math.round(jeHundertG)} kcal je 100 g — viel Energie auf wenig Menge.`,
    };
  }

  /* 3. Passung zum Rest des Tages */
  let passung = null;
  if (rest && typeof rest.kcal === 'number') {
    const danach = rest.kcal - kcal;
    passung = {
      wert: Math.round(danach),
      stufe: danach >= 0 ? 'gut' : danach >= -rest.kcal * 0.15 ? 'mittel' : 'schwach',
      text: danach >= 0
        ? `Danach bleiben ${Math.round(danach)} kcal für heute.`
        : `Damit bist du ${Math.abs(Math.round(danach))} kcal über dem Tagesziel.`,
    };
  }

  const stufen = [eiweiss, dichte, passung].filter(Boolean).map((d) => d.stufe);
  const punkte = stufen.length
    ? Math.round((stufen.reduce((s, x) => s + (x === 'gut' ? 2 : x === 'mittel' ? 1 : 0), 0)
        / (stufen.length * 2)) * 100)
    : null;

  return {
    eiweiss,
    dichte,
    passung,
    gramm: gramm || null,
    punkte,
    label: punkte === null ? null
      : punkte >= 70 ? 'Trägt den Tag'
      : punkte >= 40 ? 'Geht in Ordnung'
      : 'Kostet Spielraum',
    satz: satzFuer(eiweiss, dichte, passung),
  };
}

/**
 * Ein Satz, der die Mahlzeit einordnet — der Teil, den man tatsächlich liest.
 * Genannt wird das Auffälligste, nicht alles.
 */
function satzFuer(eiweiss, dichte, passung) {
  if (passung && passung.stufe === 'schwach') return passung.text;
  if (eiweiss.stufe === 'gut' && dichte && dichte.stufe === 'gut') {
    return 'Viel Eiweiß bei wenig Energiedichte — davon wirst du satt und behältst Spielraum.';
  }
  if (eiweiss.stufe === 'schwach' && dichte && dichte.stufe === 'schwach') {
    return 'Wenig Eiweiß, viele Kalorien auf wenig Menge. Als Genuss völlig in Ordnung — '
      + 'als Hauptmahlzeit lässt es dich eher früh wieder hungrig werden.';
  }
  if (eiweiss.stufe === 'gut') return eiweiss.text;
  if (dichte && dichte.stufe === 'gut') return dichte.text;
  if (eiweiss.stufe === 'schwach') return eiweiss.text;
  return 'Unauffällig — passt in einen normalen Tag.';
}

/**
 * Was die Einordnung nicht weiß. Gehört sichtbar dazu, sonst liest sich eine
 * gute Zahl wie ein Gesundheitszeugnis.
 */
export const GRENZEN = 'Gerechnet wird nur mit Kalorien und den drei Makros. Ballaststoffe, '
  + 'Zucker, Salz und Vitamine stehen nicht in den Daten — eine gute Zahl heißt hier '
  + 'nicht „gesund", sondern „passt zu deinem Plan".';

/**
 * Tagesbild aus allen Mahlzeiten: wo das Eiweiß herkommt und ob es sich
 * verteilt. Verteilung ist kein Nebenaspekt — der Muskel kann eine einzelne
 * riesige Eiweißportion nicht besser nutzen als drei mittlere.
 */
export function dayPicture(meals, ziele) {
  const gezaehlt = (meals || []).filter((m) => (m.totals?.kcal || 0) > 0);
  if (!gezaehlt.length) return null;

  const proteinJe = gezaehlt.map((m) => Number(m.totals.protein) || 0);
  const gesamt = proteinJe.reduce((a, b) => a + b, 0);
  const groesste = Math.max(...proteinJe);

  // Als „Eiweißmahlzeit" zählt, was mindestens 20 g bringt — darunter ist der
  // Reiz für den Muskelaufbau klein.
  const tragende = proteinJe.filter((p) => p >= 20).length;

  return {
    mahlzeiten: gezaehlt.length,
    protein: Math.round(gesamt),
    proteinZiel: ziele?.protein || null,
    tragende,
    // Konzentration: liegt mehr als die Hälfte des Eiweißes in einer Mahlzeit?
    einseitig: gesamt > 0 && groesste / gesamt > 0.55 && gezaehlt.length >= 3,
  };
}
