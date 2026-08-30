/**
 * Daten aus Apple Health übernehmen.
 *
 * Vorweg die unangenehme Wahrheit: **eine direkte Verbindung gibt es nicht.**
 * HealthKit hat keine Web-Schnittstelle — nur native iOS-Apps mit der passenden
 * Berechtigung kommen daran. Eine Web-App im Browser, und das ist diese hier,
 * kann Health weder lesen noch schreiben, egal über welchen Umweg.
 *
 * Was geht, ist der Export: Health legt auf Wunsch eine Datei mit allem an,
 * und die lässt sich hier einlesen. Das ist Handarbeit und kein Abgleich, dafür
 * verlässt nichts das Gerät.
 *
 * Die Datei ist groß — mehrere hundert Megabyte sind normal, weil jeder
 * Schrittzähler-Eintrag seit Jahren drinsteht. Deshalb wird sie in Stücken
 * gelesen und mit einem Ausdruck durchsucht, statt sie als Ganzes in einen
 * XML-Baum zu laden; Letzteres bringt jeden Browser um.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

/** Wie viel auf einmal gelesen wird. Groß genug für Tempo, klein genug fürs RAM. */
const CHUNK = 4 * 1024 * 1024;

/**
 * Ein Datensatz kann an der Stückgrenze zerrissen werden. Deshalb bleibt am
 * Ende jedes Stücks ein Rest stehen, der vorne ans nächste geklebt wird.
 * Länger als der längste Datensatz muss er sein — 64 KB sind reichlich.
 */
const UEBERLAPPUNG = 64 * 1024;

/** Apple-Bezeichnung → Sportart dieser App. */
export const WORKOUT_MAP = {
  Running: 'laufen',
  Walking: 'gehen',
  Hiking: 'wandern',
  Cycling: 'rad',
  Swimming: 'schwimmen',
  Rowing: 'rudern',
  Yoga: 'yoga',
  Climbing: 'klettern',
  Soccer: 'ballsport', Basketball: 'ballsport', Tennis: 'ballsport',
  Volleyball: 'ballsport', Handball: 'ballsport', TableTennis: 'ballsport',
  Badminton: 'ballsport', Golf: 'ballsport',
  MartialArts: 'kampf', Boxing: 'kampf', Kickboxing: 'kampf', Wrestling: 'kampf',
  DanceInspiredTraining: 'tanzen', SocialDance: 'tanzen', Cardio_Dance: 'tanzen',
  Elliptical: 'sonstiges', StairClimbing: 'sonstiges', Stairs: 'sonstiges',
  HighIntensityIntervalTraining: 'sonstiges', CrossTraining: 'sonstiges',
  Pilates: 'yoga', Barre: 'yoga', MindAndBody: 'yoga',
};

/**
 * Krafttraining wird bewusst übergangen: das führt diese App selbst, mit
 * Sätzen und Gewichten. Ein zweiter Eintrag daneben würde die Kalorien doppelt
 * zählen und im Bericht wie eine Zusatzeinheit aussehen.
 */
export const IGNORIERT = new Set([
  'TraditionalStrengthTraining', 'FunctionalStrengthTraining', 'CoreTraining',
  'Flexibility', 'Cooldown', 'PreparationAndRecovery', 'Other',
]);

const RE_WORKOUT = /<Workout\b[\s\S]{0,4000}?(?:\/>|<\/Workout>)/g;
const RE_GEWICHT = /<Record[^>]*?type="HKQuantityTypeIdentifierBodyMass"[^>]*?\/>/g;

const attr = (text, name) => {
  const m = text.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : null;
};

/** „2026-08-01 08:12:00 +0200" → „2026-08-01". Der Export schreibt Ortszeit. */
const datumsschluessel = (wert) => (wert && wert.length >= 10 ? wert.slice(0, 10) : null);

/** Statistik aus einem Workout-Block, neuere Exporte legen sie verschachtelt ab. */
function statistik(block, typ) {
  const re = new RegExp(`<WorkoutStatistics[^>]*?type="HKQuantityTypeIdentifier${typ}"[^>]*?>`);
  const treffer = block.match(re);
  if (!treffer) return null;
  const summe = attr(treffer[0], 'sum');
  const zahl = Number(summe);
  return Number.isFinite(zahl) ? { wert: zahl, einheit: attr(treffer[0], 'unit') } : null;
}

/** Ein Workout-Block → Aktivität dieser App, oder null. */
export function parseWorkout(block) {
  const roh = attr(block, 'workoutActivityType') || '';
  const kurz = roh.replace('HKWorkoutActivityType', '');
  if (IGNORIERT.has(kurz)) return { uebersprungen: kurz };

  const start = attr(block, 'startDate');
  const date = datumsschluessel(start);
  if (!date) return null;

  const dauer = Number(attr(block, 'duration'));
  const dauerEinheit = attr(block, 'durationUnit') || 'min';
  const minuten = Number.isFinite(dauer)
    ? Math.round(dauerEinheit === 'min' ? dauer : dauer / 60)
    : 0;
  if (!minuten) return null;

  // Erst die Attribute älterer Exporte, dann die verschachtelte Statistik.
  const streckeAttr = Number(attr(block, 'totalDistance'));
  const strecke = Number.isFinite(streckeAttr) && streckeAttr > 0
    ? { wert: streckeAttr, einheit: attr(block, 'totalDistanceUnit') }
    : statistik(block, 'DistanceWalkingRunning') || statistik(block, 'DistanceCycling')
      || statistik(block, 'DistanceSwimming');

  const kcalAttr = Number(attr(block, 'totalEnergyBurned'));
  const energie = Number.isFinite(kcalAttr) && kcalAttr > 0
    ? { wert: kcalAttr }
    : statistik(block, 'ActiveEnergyBurned');

  const km = strecke
    ? (strecke.einheit === 'm' ? strecke.wert / 1000 : strecke.wert)
    : null;

  return {
    // Feste Kennung aus Start und Art: ein zweiter Import überschreibt denselben
    // Eintrag, statt ihn zu verdoppeln.
    id: `health-${start.replace(/[^0-9]/g, '')}-${kurz || 'x'}`,
    date,
    type: WORKOUT_MAP[kurz] || 'sonstiges',
    minutes: minuten,
    km: km && km > 0 ? Math.round(km * 100) / 100 : null,
    kcal: energie && energie.wert > 0 ? Math.round(energie.wert) : null,
    intensity: 'mittel',
    note: `Aus Apple Health${kurz ? ` · ${kurz}` : ''}`,
    source: 'health',
  };
}

/** Ein Gewichts-Datensatz → { date, kg } oder null. */
export function parseGewicht(block) {
  const date = datumsschluessel(attr(block, 'startDate'));
  const wert = Number(attr(block, 'value'));
  const einheit = (attr(block, 'unit') || 'kg').toLowerCase();
  if (!date || !Number.isFinite(wert) || wert <= 0) return null;

  // Pfund kommen bei US-Geräten vor.
  const kg = einheit.startsWith('lb') ? wert * 0.45359237 : wert;
  if (kg < 25 || kg > 350) return null;
  return { date, kg: Math.round(kg * 10) / 10 };
}

/**
 * Liest eine Export.xml und liefert, was die App brauchen kann.
 *
 * @param {File} datei
 * @param {(anteil: number) => void} [aufFortschritt]  0 bis 1
 */
export async function parseExport(datei, aufFortschritt) {
  const workouts = new Map();
  const gewichte = new Map();
  let uebersprungen = 0;

  let rest = '';
  for (let pos = 0; pos < datei.size; pos += CHUNK) {
    const stueck = await datei.slice(pos, pos + CHUNK).text();
    const text = rest + stueck;

    for (const treffer of text.matchAll(RE_WORKOUT)) {
      const eintrag = parseWorkout(treffer[0]);
      if (!eintrag) continue;
      if (eintrag.uebersprungen) { uebersprungen += 1; continue; }
      workouts.set(eintrag.id, eintrag);
    }

    for (const treffer of text.matchAll(RE_GEWICHT)) {
      const eintrag = parseGewicht(treffer[0]);
      // Mehrere Messungen am Tag: die letzte gewinnt, wie beim Eintragen von Hand.
      if (eintrag) gewichte.set(eintrag.date, eintrag.kg);
    }

    rest = text.slice(-UEBERLAPPUNG);
    if (aufFortschritt) aufFortschritt(Math.min(1, (pos + CHUNK) / datei.size));
  }

  return {
    workouts: [...workouts.values()].sort((a, b) => (a.date < b.date ? -1 : 1)),
    gewichte: [...gewichte.entries()]
      .map(([date, kg]) => ({ date, kg }))
      .sort((a, b) => (a.date < b.date ? -1 : 1)),
    uebersprungen,
  };
}
