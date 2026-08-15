/**
 * Trainingsplanung: Übungsdatenbank, Plangenerator, Satzvorgaben, Progression.
 * Wie nutrition.js bewusst ohne DOM-Zugriff, damit alles einzeln prüfbar bleibt.
 */

import { MINUTES_PER_SKILL } from './skills.js';

/* ---------------- Übungsdatenbank ----------------
   [id, Name, Muskelgruppe, c|i, Umgebung, Einschränkungen, Ausführungshinweis]
   Umgebung: g = Studio, d = Kurzhanteln, b = Bänder, w = Körpergewicht
--------------------------------------------------- */

const RAW = [
  // Brust
  ['bp','Bankdrücken Langhantel','brust','c','g','schulter','Schulterblätter zusammen, Ellbogen ~45°.'],
  ['bpdb','Bankdrücken Kurzhantel','brust','c','gd','','Am tiefsten Punkt Dehnung spüren, nicht abfedern.'],
  ['incdb','Schrägbank Kurzhantel','brust','c','gd','','30–35° Neigung, Handgelenke gerade.'],
  ['incbb','Schrägbankdrücken Langhantel','brust','c','g','schulter','Stange zur oberen Brust führen.'],
  ['chpress','Brustpresse Maschine','brust','c','g','','Sitz so, dass die Griffe auf Brusthöhe sind.'],
  ['pushup','Liegestütze','brust','c','gdbw','','Körper bleibt eine Linie, Po anspannen.'],
  ['dips','Dips','brust','c','gw','schulter','Leicht vorlehnen für mehr Brust.'],
  ['cfly','Kabel-Fly','brust','i','g','','Leichte Ellbogenbeugung halten, Brust zusammendrücken.'],
  ['dbfly','Kurzhantel-Fly','brust','i','gd','schulter','Kontrolliert öffnen, nur bis Brusthöhe.'],
  ['bfly','Band-Fly','brust','i','b','','Am Endpunkt eine Sekunde halten.'],
  ['pushele','Liegestütze erhöht','brust','c','w','','Hände auf Stuhl oder Tisch — die leichtere Variante.'],
  // Rücken, vertikal
  ['pullup','Klimmzüge','ruecken','c','gw','','Brust zur Stange, Schulterblätter zuerst.'],
  ['latpull','Latzug','ruecken','c','g','','Ellbogen nach unten-hinten ziehen.'],
  ['blat','Band-Latzug','ruecken','c','b','','Band über den Türanker, Zug bis zur Brust.'],
  ['negpull','Negativ-Klimmzüge','ruecken','c','gw','','Drei bis fünf Sekunden kontrolliert ablassen.'],
  ['pullover','Überzüge','ruecken','i','gd','schulter','Nur so weit, wie die Rippen unten bleiben.'],
  // Rücken, horizontal
  ['bbrow','Langhantelrudern','ruecken','c','g','ruecken','Rücken flach, Zug zum Bauchnabel.'],
  ['dbrow','Kurzhantelrudern einarmig','ruecken','c','gd','','Hüfte bleibt parallel, kein Rotieren.'],
  ['cabrow','Kabelrudern sitzend','ruecken','c','g','','Brust raus, Ellbogen eng am Körper.'],
  ['tbar','T-Bar Rudern','ruecken','c','g','ruecken','Neutraler Rücken, kein Schwung.'],
  ['brow','Band-Rudern','ruecken','c','b','','Band um die Füße, Ellbogen nach hinten.'],
  ['invrow','Sling- oder Schrägrudern','ruecken','c','gw','','Je flacher der Körper, desto schwerer.'],
  ['tablerow','Rudern unter dem Tisch','ruecken','c','w','','Unter einen stabilen Tisch legen, an der Kante hochziehen. Körper bleibt gerade.'],
  ['towelrow','Handtuch-Rudern am Türrahmen','ruecken','c','w','','Handtuch um den Türgriff, zurücklehnen und zur Tür ziehen. Über die Fußstellung dosieren.'],
  ['superman','Superman am Boden','ruecken','i','w','ruecken','Bauchlage, Arme und Beine anheben, zwei Sekunden halten.'],
  ['facep','Face Pull','rdelt','i','gb','','Auf Augenhöhe ziehen, Daumen nach hinten.'],
  ['revfly','Reverse Fly','rdelt','i','gd','','Leicht vorgebeugt, Arme fast gestreckt.'],
  ['ytw','Y-T-W am Boden','rdelt','i','w','','Bauchlage, Arme nacheinander in Y-, T- und W-Form anheben. Daumen zeigen nach oben.'],
  // Beine, Vorderseite
  ['squat','Kniebeuge Langhantel','quad','c','g','knie,ruecken','Knie folgen den Fußspitzen, Tiefe nach Beweglichkeit.'],
  ['goblet','Goblet Squat','quad','c','gd','knie','Gewicht vor der Brust, Oberkörper aufrecht.'],
  ['legpress','Beinpresse','quad','c','g','knie','Unterer Rücken bleibt am Polster.'],
  ['bulg','Bulgarian Split Squat','quad','c','gdw','knie','Hinteres Bein nur zum Balancieren nutzen.'],
  ['lunge','Ausfallschritte','quad','c','gdw','knie','Schritt lang genug, Knie über dem Fuß.'],
  ['legext','Beinstrecker','quad','i','g','knie','Oben kurz halten, langsam ablassen.'],
  ['bwsq','Körpergewicht-Kniebeuge','quad','c','w','','Langsam runter, zwei Sekunden halten, explosiv hoch.'],
  ['stepup','Step-Ups','quad','c','gdw','knie','Kraft aus dem oberen Bein, nicht abdrücken.'],
  ['hack','Hack Squat','quad','c','g','knie','Füße mittig, ganze Fußsohle belastet.'],
  // Beine, Rückseite und Hüfte
  ['dl','Kreuzheben','ham','c','g','ruecken','Stange am Körper, Hüfte und Brust steigen gleichzeitig.'],
  ['rdl','Rumänisches Kreuzheben','ham','c','gd','ruecken','Hüfte nach hinten, Rücken flach, Dehnung hinten spüren.'],
  ['legcurl','Beinbeuger','ham','i','g','','Hüfte bleibt unten, kein Hohlkreuz.'],
  ['hipth','Hip Thrust','glute','c','gd','','Rippen unten lassen, oben eine Sekunde zusammendrücken.'],
  ['gbridge','Glute Bridge','glute','c','dw','','Fersen drücken, Po fest anspannen.'],
  ['gm','Good Mornings','ham','c','g','ruecken','Leichtes Gewicht, Bewegung aus der Hüfte.'],
  ['nordic','Nordic Curls','ham','i','w','','So weit wie kontrollierbar, dann abfangen.'],
  ['kick','Kabel-Kickback','glute','i','g','','Standbein leicht gebeugt, kein Hohlkreuz.'],
  ['bhipth','Band Hip Thrust','glute','c','b','','Band über die Hüfte, oben halten.'],
  // Schultern
  ['ohp','Schulterdrücken Langhantel','schulter','c','g','schulter','Po und Bauch fest, Stange über die Mitte des Kopfes.'],
  ['dbohp','Schulterdrücken Kurzhantel','schulter','c','gd','','Handflächen leicht zueinander drehen.'],
  ['arnold','Arnold Press','schulter','c','gd','schulter','Rotation langsam, kein Schwung.'],
  ['pikepu','Pike Push-Ups','schulter','c','w','schulter','Hüfte hoch, Kopf Richtung Boden.'],
  ['latraise','Seitheben Kurzhantel','sdelt','i','gd','','Kleiner Finger führt, nur bis Schulterhöhe.'],
  ['clat','Seitheben Kabel','sdelt','i','g','','Konstante Spannung, langsam ablassen.'],
  ['blat2','Band-Seitheben','sdelt','i','b','','Oben eine Sekunde halten.'],
  ['frontr','Frontheben','sdelt','i','gd','','Kein Schwung aus der Hüfte.'],
  // Bizeps
  ['bbcurl','Langhantel-Curls','bizeps','i','g','handgelenk','Ellbogen bleiben am Körper.'],
  ['dbcurl','Kurzhantel-Curls','bizeps','i','gd','','Ganz strecken, dann sauber beugen.'],
  ['hamcurl','Hammer Curls','bizeps','i','gd','','Neutraler Griff, trainiert auch den Unterarm.'],
  ['ccurl','Kabel-Curls','bizeps','i','g','','Spannung auch unten halten.'],
  ['bcurl','Band-Curls','bizeps','i','b','','Langsam zurücklassen, etwa drei Sekunden.'],
  ['chinup','Chin-Ups','bizeps','c','gw','','Untergriff, Brust zur Stange.'],
  // Trizeps
  ['pushdown','Trizepsdrücken Kabel','trizeps','i','g','','Oberarme fixiert, unten kurz halten.'],
  ['cgbp','Enges Bankdrücken','trizeps','c','g','handgelenk,schulter','Griff schulterbreit, Ellbogen eng.'],
  ['ohext','Überkopf-Trizeps','trizeps','i','gd','ellbogen','Dehnung hinten spüren, Ellbogen ruhig.'],
  ['benchdip','Bankdips','trizeps','i','w','schulter','Hüfte nah an der Bank.'],
  ['bpush','Band-Pushdown','trizeps','i','b','','Am Endpunkt den Trizeps fest anspannen.'],
  ['diapu','Diamant-Liegestütze','trizeps','c','w','handgelenk','Hände unter der Brust, Ellbogen eng.'],
  // Waden
  ['calf','Wadenheben stehend','waden','i','gd','','Volle Dehnung unten, oben eine Sekunde.'],
  ['calfm','Wadenheben Maschine','waden','i','g','','Langsames Tempo, keine Wippbewegung.'],
  ['calf1','Wadenheben einbeinig','waden','i','dw','','Auf einer Stufe für mehr Bewegungsumfang.'],
  // Rumpf
  ['plank','Unterarmstütz','core','i','w','','Po anspannen, Rippen runter. Wiederholungen sind hier Sekunden.'],
  ['hlr','Hängendes Beinheben','core','i','gw','','Becken einrollen, kein Schwingen.'],
  ['ccrunch','Kabel-Crunch','core','i','g','','Mit den Rippen einrollen, nicht mit der Hüfte.'],
  ['abwheel','Ab Wheel','core','i','gd','ruecken','Nur so weit, wie der Rücken flach bleibt.'],
  ['sideplank','Seitstütz','core','i','w','','Hüfte hoch, Schulter über dem Ellbogen.'],
  ['deadbug','Dead Bug','core','i','w','','Unterer Rücken bleibt am Boden.'],
  ['rtwist','Russian Twist','core','i','dw','ruecken','Die Brustwirbelsäule rotiert, nicht die Lende.'],
];

export const EXERCISES = RAW.map((r) => ({
  id: r[0], name: r[1], group: r[2], type: r[3], env: r[4],
  avoid: r[5] ? r[5].split(',') : [], cue: r[6],
}));

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function exerciseById(id) {
  return BY_ID.get(id) || null;
}

export const GROUP_LABEL = {
  brust: 'Brust', ruecken: 'Rücken', quad: 'Beine vorne', ham: 'Beine hinten',
  glute: 'Gesäß', schulter: 'Schultern', sdelt: 'Seitliche Schulter',
  rdelt: 'Hintere Schulter', bizeps: 'Bizeps', trizeps: 'Trizeps',
  waden: 'Waden', core: 'Rumpf',
};

/**
 * Übungen, die ein Gerät brauchen, das nicht jeder zuhause hat.
 * Das ist unabhängig von der Hantelfrage: ein Klimmzug braucht kein Gewicht,
 * aber sehr wohl eine Stange. Bank und Stuhl stehen hier nicht — irgendeine
 * Sitzgelegenheit gibt es überall.
 */
export const GEAR = {
  pullup: 'stange', negpull: 'stange', chinup: 'stange', hlr: 'stange', invrow: 'stange',
  dips: 'barren',
};

export const GEAR_LABEL = {
  stange: 'Klimmzugstange',
  barren: 'Dip-Barren oder zwei stabile Stühle',
};

/** Welche Umgebungscodes eine Ausrüstung freischaltet.
 *  Wer ein Studio hat, bekommt keine Band-Übungen vorgeschlagen — dort steht
 *  für dieselbe Bewegung immer das bessere Gerät. */
export const EQUIPMENT_CODES = { studio: 'gdw', home: 'dw', band: 'bw', bw: 'w' };

export const EQUIPMENT_LABEL = {
  studio: 'Fitnessstudio', home: 'Kurzhanteln zuhause',
  band: 'Widerstandsbänder', bw: 'nur Körpergewicht',
};

export const LIMIT_LABEL = {
  knie: 'Knie', schulter: 'Schulter', ruecken: 'Unterer Rücken',
  handgelenk: 'Handgelenk', ellbogen: 'Ellbogen',
};

/** Ersatzgruppe, wenn eine Muskelgruppe mit der vorhandenen Ausrüstung gar
 *  nicht trainierbar ist — etwa die seitliche Schulter ohne jedes Gerät. */
const FALLBACK_GROUP = {
  sdelt: 'schulter', rdelt: 'ruecken', glute: 'ham', waden: 'quad', ham: 'glute',
  // Ohne Stange und Hanteln bleibt für die Arme nichts Eigenes übrig. Rudern
  // trainiert den Bizeps mit, Drücken den Trizeps — besser als ein leerer Slot.
  bizeps: 'ruecken', trizeps: 'brust',
};

/* ---------------- Splits ---------------- */

const SLOTS = {
  fbA:   ['brust:c','ruecken:c','quad:c','ham:c','sdelt:i','trizeps:i','bizeps:i','core:i'],
  fbB:   ['schulter:c','ruecken:c','ham:c','quad:c','brust:i','bizeps:i','trizeps:i','core:i'],
  fbC:   ['brust:c','ruecken:c','quad:c','glute:c','sdelt:i','rdelt:i','bizeps:i','core:i'],
  push:  ['brust:c','schulter:c','brust:c','sdelt:i','trizeps:i','trizeps:i','core:i'],
  pull:  ['ruecken:c','ruecken:c','ruecken:c','rdelt:i','bizeps:i','bizeps:i','core:i'],
  legs:  ['quad:c','ham:c','quad:c','ham:i','glute:c','waden:i','core:i'],
  upper: ['brust:c','ruecken:c','schulter:c','ruecken:c','sdelt:i','bizeps:i','trizeps:i'],
  lower: ['quad:c','ham:c','quad:c','ham:i','glute:c','waden:i','core:i'],
};

const SPLITS = {
  1: { name: 'Ganzkörper', days: [['Ganzkörper','fbA']] },
  2: { name: 'Ganzkörper 2×', days: [['Ganzkörper A','fbA'],['Ganzkörper B','fbB']] },
  3: { name: 'Ganzkörper 3×', days: [['Ganzkörper A','fbA'],['Ganzkörper B','fbB'],['Ganzkörper C','fbC']] },
  '3ppl': { name: 'Push / Pull / Beine', days: [['Push','push'],['Pull','pull'],['Beine','legs']] },
  4: { name: 'Oberkörper / Unterkörper', days: [['Oberkörper A','upper'],['Unterkörper A','lower'],['Oberkörper B','upper'],['Unterkörper B','lower']] },
  5: { name: 'Push / Pull / Beine + OK / UK', days: [['Push','push'],['Pull','pull'],['Beine','legs'],['Oberkörper','upper'],['Unterkörper','lower']] },
  6: { name: 'Push / Pull / Beine 2×', days: [['Push A','push'],['Pull A','pull'],['Beine A','legs'],['Push B','push'],['Pull B','pull'],['Beine B','legs']] },
};

/** Schwerpunkt → zusätzlicher Slot, und an welchen Tagen er sinnvoll ist. */
const FOCUS_SLOT = { brust:'brust:i', ruecken:'ruecken:c', beine:'quad:i', schulter:'sdelt:i', arme:'bizeps:i', po:'glute:c', core:'core:i' };
const FOCUS_DAYS = {
  brust: ['push','fbA','upper'], ruecken: ['pull','fbB','upper'], beine: ['legs','lower','fbA'],
  schulter: ['push','upper','fbB'], arme: ['pull','push','upper'], po: ['legs','lower','fbC'],
  core: ['fbA','legs','lower'],
};

export const FOCUS_LABEL = {
  brust: 'Brust', ruecken: 'Rücken', schulter: 'Schultern', arme: 'Arme',
  beine: 'Beine', po: 'Gesäß', core: 'Bauch',
};

/* ---------------- Satzvorgaben ---------------- */

const LEVELS = {
  anfaenger:       { compound: 3, isolation: 2, rir: 3 },
  fortgeschritten: { compound: 4, isolation: 3, rir: 2 },
  erfahren:        { compound: 4, isolation: 3, rir: 1 },
};

export const LEVEL_LABEL = {
  anfaenger: 'Anfänger', fortgeschritten: 'Fortgeschritten', erfahren: 'Erfahren',
};

export const GOAL_LABEL = {
  abnehmen: 'Fett verlieren', form: 'Form verbessern', aufbau: 'Muskeln aufbauen',
};

/**
 * Übungen ohne Zusatzgewicht: der Fortschritt läuft über Wiederholungen und
 * schwerere Varianten statt über die Hantel — deshalb höhere Wiederholungszahlen.
 */
function isLoadless(exercise, profile) {
  return profile.equipment === 'bw' || profile.equipment === 'band' || exercise.env === 'w';
}

function prescribe(exercise, profile, isFirst) {
  const level = LEVELS[profile.level] || LEVELS.fortgeschritten;
  const sets = (exercise.type === 'c' ? level.compound : level.isolation) + (isFirst ? 1 : 0);
  const loadless = isLoadless(exercise, profile);

  let reps;
  if (exercise.group === 'core') reps = [10, 20];
  else if (loadless) reps = exercise.type === 'c' ? [10, 20] : [12, 20];
  else if (exercise.type === 'c') reps = profile.goal === 'aufbau' ? [5, 8] : [6, 10];
  else reps = [10, 15];

  return {
    id: exercise.id,
    sets,
    reps,
    rir: level.rir,
    loadless,
    rest: exercise.type === 'c' ? 150 : 75,
  };
}

/* ---------------- Plangenerator ---------------- */

/**
 * Baut den Wochenplan aus dem Profil.
 * `seed` verschiebt die Übungsauswahl, ohne Split und Struktur zu ändern —
 * dafür gibt es in der Ansicht den Knopf „Andere Übungen wählen".
 */
export function buildPlan(profile, seed = 0) {
  const codes = EQUIPMENT_CODES[profile.equipment] || EQUIPMENT_CODES.studio;
  const limits = profile.limits || [];

  // Im Studio ist alles da; sonst zählt, was im Fragebogen angekreuzt wurde.
  const gear = profile.equipment === 'studio' ? Object.keys(GEAR_LABEL) : (profile.gear || []);

  // Im Training als zu schwer aussortierte Übungen bleiben draußen.
  const blocked = new Set(profile.blocked || []);

  const usable = EXERCISES.filter(
    (e) => [...e.env].some((c) => codes.includes(c))
      && !e.avoid.some((a) => limits.includes(a))
      && (!GEAR[e.id] || gear.includes(GEAR[e.id]))
      && !blocked.has(e.id)
  );

  let key = profile.days;
  if (profile.days === 3 && profile.level !== 'anfaenger') key = '3ppl';
  const split = SPLITS[key] || SPLITS[3];

  // Die Übungszahl folgt der Zeit pro Einheit: grob acht Minuten je Übung.
  // Technikarbeit läuft vor dem Krafttraining und braucht ihren eigenen Anteil —
  // sonst wird die Einheit heimlich länger, als sie angesagt war.
  const skillMinutes = (profile.skills || []).length * MINUTES_PER_SKILL;
  const strengthMinutes = Math.max(20, profile.sessionLength - skillMinutes);
  // Ohne Technik bleibt es bei mindestens vier Übungen. Mit Technik darf es eine
  // weniger sein — die Einheit ist dann trotzdem voll.
  const fewest = skillMinutes > 0 ? 3 : 4;
  const perSession = Math.min(9, Math.max(fewest, Math.round((strengthMinutes - 8) / 8)));

  const rotation = {};
  const pick = (spec, usedToday) => {
    const [group, type] = spec.split(':');
    let pool = usable.filter((e) => e.group === group && e.type === type);
    if (!pool.length) pool = usable.filter((e) => e.group === group);
    if (!pool.length && FALLBACK_GROUP[group]) pool = usable.filter((e) => e.group === FALLBACK_GROUP[group]);

    const free = pool.filter((e) => !usedToday.has(e.id));
    if (!free.length) return null; // keine Übung zweimal am selben Tag
    const n = (rotation[spec] = rotation[spec] || 0) + seed;
    rotation[spec]++;
    return free[n % free.length];
  };

  const days = split.days.map(([name, template], index) => {
    let specs = SLOTS[template].slice();

    for (const focus of profile.focus || []) {
      if ((FOCUS_DAYS[focus] || []).includes(template) && FOCUS_SLOT[focus]) {
        specs.splice(Math.min(3, specs.length), 0, FOCUS_SLOT[focus]);
      }
    }
    specs = specs.slice(0, perSession);

    const usedToday = new Set();
    const exercises = [];

    specs.forEach((spec, i) => {
      const exercise = pick(spec, usedToday);
      if (!exercise) return;
      usedToday.add(exercise.id);
      exercises.push(prescribe(exercise, profile, i === 0));
    });

    // Haben Einschränkungen oder fehlende Geräte Lücken gerissen: erst mit
    // Übungen aus denselben Muskelgruppen auffüllen, dann mit etwas Rumpfarbeit.
    const groups = new Set();
    for (const spec of specs) {
      const group = spec.split(':')[0];
      groups.add(group);
      if (FALLBACK_GROUP[group]) groups.add(FALLBACK_GROUP[group]);
    }

    const topUp = (allowed, max) => {
      let added = 0;
      while (exercises.length < perSession && added < max) {
        const candidates = usable.filter((e) => !usedToday.has(e.id) && allowed.includes(e.group));
        if (!candidates.length) return;
        rotation.__fill = (rotation.__fill || 0) + 1;
        const exercise = candidates[(rotation.__fill + seed) % candidates.length];
        usedToday.add(exercise.id);
        exercises.push(prescribe(exercise, profile, false));
        added++;
      }
    };

    topUp([...groups].filter((g) => g !== 'core'), perSession);
    topUp(['core'], 2);

    return {
      name,
      template,
      weekday: profile.weekdays[index] ?? null,
      short: exercises.length < perSession,
      exercises,
    };
  });

  return {
    createdAt: new Date().toISOString().slice(0, 10),
    seed,
    splitKey: String(key),
    splitName: split.name,
    perSession,
    skillMinutes,
    days,
  };
}

/**
 * Tauscht eine Übung gegen eine andere aus derselben Muskelgruppe.
 *
 * Gebraucht, wenn eine Übung im Training nicht geht — zu schwer, schmerzhaft,
 * Gerät belegt. Die abgelehnte wandert in `profile.blocked` und kommt auch bei
 * späteren Neubauten des Plans nicht wieder.
 *
 * @returns {{plan: object, ersatz: object|null}} neuer Plan und die neue Übung
 */
export function replaceExercise(plan, profile, dayIndex, exerciseIndex) {
  const day = plan.days[dayIndex];
  const alt = day && day.exercises[exerciseIndex];
  if (!alt) return { plan, ersatz: null };

  const altExercise = exerciseById(alt.id);
  if (!altExercise) return { plan, ersatz: null };

  const codes = EQUIPMENT_CODES[profile.equipment] || EQUIPMENT_CODES.studio;
  const limits = profile.limits || [];
  const gear = profile.equipment === 'studio' ? Object.keys(GEAR_LABEL) : (profile.gear || []);
  const blocked = new Set([...(profile.blocked || []), alt.id]);
  const imTag = new Set(day.exercises.map((e) => e.id));

  const passt = (e) => [...e.env].some((c) => codes.includes(c))
    && !e.avoid.some((a) => limits.includes(a))
    && (!GEAR[e.id] || gear.includes(GEAR[e.id]))
    && !blocked.has(e.id)
    && !imTag.has(e.id);

  // Erst dieselbe Gruppe und Art, dann nur die Gruppe, dann die Ersatzgruppe.
  let auswahl = EXERCISES.filter((e) => passt(e) && e.group === altExercise.group && e.type === altExercise.type);
  if (!auswahl.length) auswahl = EXERCISES.filter((e) => passt(e) && e.group === altExercise.group);
  if (!auswahl.length && FALLBACK_GROUP[altExercise.group]) {
    auswahl = EXERCISES.filter((e) => passt(e) && e.group === FALLBACK_GROUP[altExercise.group]);
  }
  if (!auswahl.length) return { plan, ersatz: null };

  const ersatz = auswahl[0];
  const neueVorgabe = prescribe(ersatz, profile, exerciseIndex === 0);

  const days = plan.days.map((d, i) => (i !== dayIndex ? d : {
    ...d,
    exercises: d.exercises.map((e, j) => (j === exerciseIndex ? neueVorgabe : e)),
  }));

  return { plan: { ...plan, days }, ersatz };
}

/* ---------------- 4-Wochen-Block ----------------
   Woche 1 sammelt Werte mit mehr Reserve, Woche 3 geht näher ans Limit,
   Woche 4 ist Deload. Danach beginnt der Block von vorn — mit den Gewichten,
   die inzwischen erreicht wurden.
-------------------------------------------------- */

export const BLOCK_WEEKS = {
  1: { label: 'Woche 1 · Einfinden', setDelta: 0,  rirDelta: 1 },
  2: { label: 'Woche 2 · Aufbauen',  setDelta: 0,  rirDelta: 0 },
  3: { label: 'Woche 3 · Schwer',    setDelta: 1,  rirDelta: -1 },
  4: { label: 'Woche 4 · Deload',    setDelta: -1, rirDelta: 2 },
};

export function blockWeek(plan, todayKey) {
  if (!plan) return 1;
  const start = new Date(`${plan.createdAt}T12:00:00`);
  const now = new Date(`${todayKey}T12:00:00`);
  const days = Math.floor((now - start) / 86400000);
  return (Math.floor(Math.max(0, days) / 7) % 4) + 1;
}

/** Sätze und RIR einer Übung für die laufende Blockwoche. */
export function forWeek(prescription, week) {
  const mod = BLOCK_WEEKS[week] || BLOCK_WEEKS[1];
  const sets = mod.setDelta === -1
    ? Math.max(2, prescription.sets - Math.ceil(prescription.sets * 0.4))
    : Math.max(2, prescription.sets + mod.setDelta);
  return { sets, rir: Math.min(4, Math.max(0, prescription.rir + mod.rirDelta)) };
}

/** Den Trainingstag zu einem Datum finden, oder null an Ruhetagen. */
export function dayForWeekday(plan, weekday) {
  if (!plan) return null;
  return plan.days.find((d) => d.weekday === weekday) || null;
}

/* ---------------- Progression ---------------- */

/**
 * Doppelte Progression: sitzen alle Sätze am oberen Ende des Wiederholungs-
 * bereichs, steigt beim nächsten Mal das Gewicht und die Wiederholungen gehen
 * zurück ans untere Ende.
 */
export function nextStep(prescription, lastSets, rir = prescription.rir) {
  const exercise = exerciseById(prescription.id);
  const [low, high] = prescription.reps;

  if (!lastSets || !lastSets.length) {
    return prescription.loadless
      ? `Sauber ausführen und bis ${rir} Wiederholungen vor dem Versagen gehen. Das ist dein Startwert.`
      : `Startgewicht finden: der letzte Satz endet mit ${rir} Wiederholungen im Tank.`;
  }

  const done = lastSets.filter((s) => s && s.reps);
  const allAtTop = done.length >= prescription.sets && done.every((s) => Number(s.reps) >= high);

  if (allAtTop && prescription.loadless) {
    return `Alle Sätze auf ${high} — jetzt die schwerere Variante: langsamer, größerer Bewegungsumfang oder einbeinig beziehungsweise einarmig.`;
  }

  const heaviest = Math.max(...done.map((s) => Number(s.weight) || 0));
  if (allAtTop && heaviest > 0) {
    const step = exercise && exercise.type === 'c' ? 2.5 : 1.25;
    const next = Math.round((heaviest + step) * 10) / 10;
    return `Alle Sätze auf ${high} — heute ${String(next).replace('.', ',')} kg und zurück auf ${low} Wiederholungen.`;
  }

  return 'Gewicht halten und pro Satz eine Wiederholung mehr schaffen als beim letzten Mal.';
}

/** Bestes Satzergebnis je Übung über alle aufgezeichneten Einheiten. */
export function personalBests(sessions) {
  const best = new Map();

  for (const session of [...sessions].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    for (const [id, sets] of Object.entries(session.entries || {})) {
      for (const set of sets || []) {
        if (!set || !set.reps) continue;
        const weight = Number(set.weight) || 0;
        // Mit Gewicht zählt das geschätzte Einwiederholungsmaximum (Epley),
        // ohne Gewicht die Wiederholungszahl. Beides bleibt getrennt.
        const score = weight > 0 ? weight * (1 + set.reps / 30) : set.reps;

        if (!best.has(id)) {
          best.set(id, { id, bodyweight: weight === 0, firstWeight: weight, firstReps: set.reps, score: null });
        }
        const entry = best.get(id);
        if (entry.score === null || score > entry.score) {
          Object.assign(entry, { score, weight, reps: set.reps, date: session.date });
        }
      }
    }
  }

  return [...best.values()]
    .map((e) => ({ ...e, name: exerciseById(e.id)?.name || e.id }))
    .sort((a, b) => (b.weight || 0) - (a.weight || 0) || b.score - a.score);
}

/**
 * Bewegte Last je Trainingswoche.
 * Körpergewichtssätze werden mit dem halben Körpergewicht angesetzt, sonst
 * bliebe das Diagramm für alle ohne Hanteln leer.
 */
export function weeklyVolume(sessions, bodyweight) {
  const assumed = (bodyweight || 70) * 0.5;
  const buckets = new Map();

  for (const session of sessions) {
    let volume = 0;
    for (const sets of Object.values(session.entries || {})) {
      for (const set of sets || []) {
        if (!set || !set.reps) continue;
        volume += (Number(set.weight) > 0 ? Number(set.weight) : assumed) * set.reps;
      }
    }
    if (!volume) continue;

    const date = new Date(`${session.date}T12:00:00`);
    const offset = (date.getDay() + 6) % 7; // Woche beginnt am Montag
    date.setDate(date.getDate() - offset);
    const monday = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    buckets.set(monday, (buckets.get(monday) || 0) + volume);
  }

  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-8)
    .map(([week, volume]) => ({ week, volume: Math.round(volume) }));
}
