/**
 * Schlaf und Morgenlicht.
 *
 * Ein Eintrag steht für eine Nacht und trägt das Datum des **Aufwachens** —
 * die Nacht vom 30. auf den 31. liegt unter dem 31. Das ist die Sicht, in der
 * man morgens denkt („heute Nacht habe ich schlecht geschlafen"), und sie
 * macht den Vergleich mit dem Trainingstag einfach: derselbe Schlüssel.
 *
 * Das Licht am Morgen ist kein Beiwerk. Die innere Uhr stellt sich am
 * Tageslicht, und zwar an dem in der ersten Stunde nach dem Aufwachen. Draußen
 * sind es an einem trüben Tag noch tausende Lux, am Fenster drinnen ein
 * Bruchteil davon — deshalb wird ausdrücklich „draußen" gefragt und nicht
 * „hell gehabt".
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/** Ab wann eine eingetragene Zubettgeh-Zeit zur kommenden Nacht zählt. */
const NACHT_GRENZE = 5;

/** Empfehlung für die Dauer, in Minuten. */
export const SOLL_MIN = 7 * 60;
export const SOLL_MAX = 9 * 60;

/** Fenster für das Licht am Morgen, in Minuten nach dem Aufwachen. */
export const LICHT_FENSTER = 60;

/** Wie lange draußen mindestens sinnvoll ist. */
export const LICHT_MINUTEN = 10;

/** „23:15" → 1395. Ungültiges gibt null. */
export function toMinutes(hhmm) {
  if (typeof hhmm !== 'string') return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** 1395 → „23:15". */
export function toClock(minuten) {
  if (typeof minuten !== 'number' || !Number.isFinite(minuten)) return '';
  const m = ((minuten % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** „7 h 50 min" aus Minuten. */
export function formatDauer(minuten) {
  if (typeof minuten !== 'number' || minuten <= 0) return null;
  const h = Math.floor(minuten / 60);
  const m = Math.round(minuten % 60);
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
}

/**
 * Zu welcher Nacht eine jetzt eingetragene Zubettgeh-Zeit gehört.
 *
 * Wer um 23:15 ins Bett geht, wacht morgen auf — der Eintrag gehört also zum
 * morgigen Datum. Wer um 01:30 geht, wacht heute auf. Die Grenze liegt bei
 * fünf Uhr früh, weil danach niemand mehr „schlafen geht", sondern aufsteht.
 */
export function nightKeyForBedtime(hhmm, heute, shift) {
  const minuten = toMinutes(hhmm);
  if (minuten === null) return null;
  return minuten < NACHT_GRENZE * 60 ? heute : shift(heute, 1);
}

/**
 * Ab welcher Stunde „Schlafen gehen" überhaupt eine sinnvolle Angabe ist.
 *
 * Vorher lag die Grenze bei zwölf Uhr mittags: Ab da bot die Karte an, das
 * Zubettgehen einzutragen, und schrieb die aktuelle Uhrzeit hin. Um vierzehn
 * Uhr geht aber niemand ins Bett — wer da tippt, meint die vergangene Nacht
 * und bekommt einen Eintrag für die kommende.
 */
export const ABEND_AB = 19;

/**
 * Wie eine Nacht heißt, wenn man vom heutigen Tag aus auf sie schaut.
 *
 * Ein Datum allein beantwortet die Frage nicht, die man im Kopf hat. „Nacht
 * auf den 4." zwingt zum Nachrechnen; „Letzte Nacht" nicht.
 */
export function nightLabel(key, heute, shift) {
  if (key === heute) return 'Letzte Nacht';
  if (key === shift(heute, 1)) return 'Kommende Nacht';
  if (key === shift(heute, -1)) return 'Vorletzte Nacht';
  return null;
}

/**
 * Schlafdauer aus Zubettgehen und Aufwachen.
 * Über Mitternacht wird gerechnet, indem die kleinere Zeit als „am Morgen"
 * gilt — bei 23:15 → 07:05 sind das 7 Stunden 50, nicht minus 16.
 */
export function duration(eintrag) {
  const bett = toMinutes(eintrag?.zuBett);
  const auf = toMinutes(eintrag?.aufgewacht);
  if (bett === null || auf === null) return null;
  return auf >= bett ? auf - bett : 1440 - bett + auf;
}

/** Wie die Dauer einzuordnen ist. */
export function rateDuration(minuten) {
  if (minuten === null) return null;
  if (minuten < 5 * 60) return { art: 'kurz', text: 'deutlich zu wenig' };
  if (minuten < SOLL_MIN) return { art: 'knapp', text: 'unter der Empfehlung' };
  if (minuten <= SOLL_MAX) return { art: 'gut', text: 'im empfohlenen Bereich' };
  return { art: 'lang', text: 'über der Empfehlung' };
}

/**
 * Kam das Licht früh genug?
 * @returns {{minutenNachAufwachen: number, imFenster: boolean, langGenug: boolean}|null}
 */
export function lightTiming(eintrag) {
  const auf = toMinutes(eintrag?.aufgewacht);
  const licht = toMinutes(eintrag?.licht?.zeit);
  if (auf === null || licht === null) return null;

  const abstand = licht >= auf ? licht - auf : 1440 - auf + licht;
  return {
    minutenNachAufwachen: abstand,
    imFenster: abstand <= LICHT_FENSTER,
    langGenug: (eintrag.licht.minuten || 0) >= LICHT_MINUTEN,
  };
}

/** Steht für diese Nacht schon alles? */
export function isComplete(eintrag) {
  return Boolean(eintrag && eintrag.zuBett && eintrag.aufgewacht);
}

/**
 * Auswertung über mehrere Nächte.
 * Gerechnet wird nur über vollständige Nächte — eine halb eingetragene würde
 * den Schnitt verfälschen, ohne dass man es der Zahl ansieht.
 */
export function summarise(eintraege) {
  const vollstaendig = (eintraege || []).filter(isComplete);
  const dauern = vollstaendig.map(duration).filter((d) => d !== null && d > 0);

  const mitLicht = (eintraege || []).filter((e) => e.licht && e.licht.zeit);
  const puenktlich = mitLicht.filter((e) => {
    const t = lightTiming(e);
    return t && t.imFenster && t.langGenug;
  });

  return {
    naechte: dauern.length,
    schnitt: dauern.length
      ? Math.round(dauern.reduce((a, b) => a + b, 0) / dauern.length)
      : null,
    kuerzeste: dauern.length ? Math.min(...dauern) : null,
    laengste: dauern.length ? Math.max(...dauern) : null,
    unterSoll: dauern.filter((d) => d < SOLL_MIN).length,
    lichtTage: mitLicht.length,
    lichtPuenktlich: puenktlich.length,
  };
}

/**
 * Wie viele Tage in Folge zuletzt Morgenlicht eingetragen ist.
 * Der Zähler bricht bei der ersten Lücke ab — das ist der Punkt an einer
 * Serie, sonst wäre sie keine.
 */
export function lightStreak(eintraege, bisDatum, shift) {
  const nach = new Map((eintraege || []).map((e) => [e.date, e]));
  const hatLicht = (t) => { const e = nach.get(t); return Boolean(e && e.licht && e.licht.zeit); };
  let serie = 0;
  // Solange heute noch nichts eingetragen ist, zählt die Serie bis gestern.
  // Sonst stünde jeden Morgen „0 Tage in Folge", obwohl nichts gerissen ist —
  // der Zähler würde die Serie kaputtmachen, die er belohnen soll.
  let tag = hatLicht(bisDatum) ? bisDatum : shift(bisDatum, -1);

  for (let i = 0; i < 400; i += 1) {
    const e = nach.get(tag);
    if (!e || !e.licht || !e.licht.zeit) break;
    serie += 1;
    tag = shift(tag, -1);
  }
  return serie;
}
