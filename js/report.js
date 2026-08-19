/**
 * Tages- und Wochenbericht.
 *
 * Der Bericht soll ehrlich sein, und ehrlich heißt konkret. „Bleib dran!" ist
 * keine Rückmeldung — „drei von vier Einheiten, die vom Donnerstag fehlt" ist
 * eine. Deshalb entsteht hier kein Fließtext aus Textbausteinen, sondern eine
 * Liste von Befunden mit einer Bewertung: gut, schlecht oder schlicht eine
 * Tatsache. Was die App nicht weiß, sagt sie auch — eine Woche ohne
 * eingetragene Gewichte ist ein Befund und keine Lücke zum Überspielen.
 *
 * Alles wird lokal gerechnet. Der Bericht funktioniert offline und kostet
 * nichts, und er sagt jeden Tag dasselbe zu denselben Zahlen.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

import { localDateKey, shiftDateKey } from './nutrition.js';
import { targetsForDate, weightTrend, calorieAdvice, weeklyRateFor } from './energy.js';
import { exerciseById, dayForWeekday, blockWeek, BLOCK_WEEKS, SKIP_REASONS } from './training.js';
import { skillById, levelIndex } from './skills.js';
import { hasResults, dueAgain, overallScore, RETEST_DAYS } from './mobility.js';

/** Ein Befund. `art` steuert nur die Darstellung, nicht den Inhalt. */
const gut = (text) => ({ art: 'gut', text });
const schlecht = (text) => ({ art: 'schlecht', text });
const fakt = (text) => ({ art: 'neutral', text });

const einsNach = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
const prozent = (n) => `${n > 0 ? '+' : ''}${einsNach(n)} %`;

const WOCHENTAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/** Tagessumme der Mahlzeiten. */
function tagesSumme(meals) {
  return (meals || []).reduce((s, m) => ({
    kcal: s.kcal + (m.totals?.kcal || 0),
    protein: s.protein + (m.totals?.protein || 0),
    carbs: s.carbs + (m.totals?.carbs || 0),
    fat: s.fat + (m.totals?.fat || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

/** Gezählte Sätze einer Einheit, und wie viele davon vollständig sind. */
export function sessionSets(session) {
  let geplant = 0;
  let voll = 0;
  for (const sets of Object.values(session?.entries || {})) {
    for (const set of sets || []) {
      geplant += 1;
      if (set && set.reps) voll += 1;
    }
  }
  return { geplant, voll };
}

/* ---------------- Tagesbericht ---------------- */

/**
 * Kurzer Bericht über einen einzelnen Tag.
 *
 * @param {object} data  profile, plan, sessions, weights, meals (nur dieser Tag),
 *                       kcalAdjust, goals, dateKey
 */
export function dailyReport(data) {
  const {
    profile, plan, sessions = [], weights = [], meals = [],
    kcalAdjust = 0, goals, dateKey = localDateKey(),
  } = data;

  const befunde = [];
  const weekday = new Date(`${dateKey}T12:00:00`).getDay();
  const tag = plan ? dayForWeekday(plan, weekday) : null;
  const session = sessions.find((s) => s.date === dateKey) || null;

  /* Training */
  if (tag) {
    const saetze = sessionSets(session);
    if (session && session.done) {
      befunde.push(gut(`${tag.name} abgeschlossen, ${saetze.voll} Sätze aufgezeichnet.`));
    } else if (saetze.voll > 0) {
      befunde.push(fakt(`${tag.name} angefangen: ${saetze.voll} ${saetze.voll === 1 ? 'Satz steht' : 'Sätze stehen'}, abgeschlossen ist die Einheit nicht.`));
    } else if (session && session.skipped) {
      const r = SKIP_REASONS[session.reason];
      befunde.push(fakt(`${tag.name} heute ausgelassen${r ? `, ${r.text}` : ''}. Das ist in Ordnung.`));
    } else {
      befunde.push(schlecht(`${tag.name} steht heute an und ist noch nicht angefangen.`));
    }
  } else {
    // Ruhetag: nur dann ein Lob, wenn davor auch trainiert wurde.
    const gestern = sessions.find((s) => s.date === shiftDateKey(dateKey, -1));
    befunde.push(gestern && gestern.done
      ? fakt('Ruhetag nach einer Einheit — genau dafür ist er da.')
      : fakt('Ruhetag.'));
  }

  /* Kalorien */
  const ziele = targetsForDate(profile, plan, kcalAdjust, dateKey, goals);
  const summe = tagesSumme(meals);

  if (!meals.length) {
    befunde.push(schlecht('Heute noch nichts eingetragen. Ohne Mahlzeiten weiß die App nicht, ob die Kalorien stimmen.'));
  } else {
    const abw = summe.kcal - ziele.kcal;
    const anteil = ziele.kcal ? Math.abs(abw) / ziele.kcal : 0;
    const text = `${Math.round(summe.kcal)} von ${ziele.kcal} kcal (${abw > 0 ? '+' : ''}${Math.round(abw)}).`;
    befunde.push(anteil <= 0.08 ? gut(text) : fakt(text));

    const eiweiss = Math.round(summe.protein);
    if (eiweiss < ziele.protein * 0.85) {
      befunde.push(schlecht(`Eiweiß bei ${eiweiss} g statt ${ziele.protein} g. Daran hängt der Muskelerhalt.`));
    } else {
      befunde.push(gut(`Eiweiß bei ${eiweiss} g von ${ziele.protein} g.`));
    }
  }

  /* Gewicht */
  const heutigesGewicht = weights.find((w) => w.date === dateKey);
  if (heutigesGewicht) {
    befunde.push(fakt(`Gewicht heute: ${einsNach(heutigesGewicht.kg)} kg.`));
  } else {
    const luecke = weights.length
      ? tageZwischen([...weights].sort((a, b) => (a.date < b.date ? -1 : 1)).pop().date, dateKey)
      : null;
    befunde.push(luecke === null || luecke > 2
      ? schlecht(luecke === null
          ? 'Noch kein Gewicht eingetragen. Ohne Gewichte kann die App die Kalorien nicht nachsteuern.'
          : `Seit ${luecke} Tagen kein Gewicht eingetragen — die Kalorienkorrektur läuft blind.`)
      : fakt('Heute noch kein Gewicht eingetragen.'));
  }

  return {
    dateKey,
    titel: `${WOCHENTAG[weekday]}, ${dateKey.slice(8)}.${dateKey.slice(5, 7)}.`,
    trainingstag: Boolean(tag),
    befunde,
  };
}

function tageZwischen(von, bis) {
  return Math.round((new Date(`${bis}T12:00:00`) - new Date(`${von}T12:00:00`)) / 86400000);
}

/* ---------------- Wochenbericht ---------------- */

/** Montag der Woche, in der ein Datum liegt. */
export function weekStart(dateKey) {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Volumen einer Einheit in kg × Wiederholungen. */
function sessionVolume(session, bodyweight) {
  const angenommen = (bodyweight || 70) * 0.5;
  let volumen = 0;
  for (const sets of Object.values(session?.entries || {})) {
    for (const set of sets || []) {
      if (!set || !set.reps) continue;
      volumen += (Number(set.weight) > 0 ? Number(set.weight) : angenommen) * set.reps;
    }
  }
  return volumen;
}

/**
 * Ausführlicher Bericht über eine Woche (Montag bis Sonntag).
 *
 * @param {object} data  profile, plan, sessions, weights, mealsByDate (Map),
 *                       mobility, skillLevels, kcalAdjust, goals, dateKey
 */
export function weeklyReport(data) {
  const {
    profile, plan, sessions = [], weights = [], mealsByDate = {},
    mobility = [], skillLevels = {}, kcalAdjust = 0, goals, dateKey = localDateKey(),
  } = data;

  const montag = weekStart(dateKey);
  const tage = Array.from({ length: 7 }, (_, i) => shiftDateKey(montag, i));
  const bisHeute = tage.filter((d) => d <= dateKey);
  const vorMontag = shiftDateKey(montag, -7);
  const vorTage = Array.from({ length: 7 }, (_, i) => shiftDateKey(vorMontag, i));

  const abschnitte = [];

  /* --- Training --- */
  const geplant = tage.filter((d) => {
    const wd = new Date(`${d}T12:00:00`).getDay();
    return plan && dayForWeekday(plan, wd);
  });
  const geplantBisHeute = geplant.filter((d) => d <= dateKey);
  const gemacht = bisHeute.filter((d) => sessions.some((s) => s.date === d && s.done));
  const bewusst = bisHeute.filter((d) => sessions.some((s) => s.date === d && s.skipped && !s.done));
  const angefangen = bisHeute.filter((d) =>
    sessions.some((s) => s.date === d && !s.done && sessionSets(s).voll > 0));
  const verpasst = geplantBisHeute.filter((d) => !gemacht.includes(d) && d < dateKey);

  const vollstaendig = bisHeute.length === 7;
  const offenNochDieseWoche = geplant.length - geplantBisHeute.length;

  const training = [];
  if (gemacht.length >= geplantBisHeute.length && geplantBisHeute.length > 0) {
    training.push(gut(`${gemacht.length} von ${geplant.length} Einheiten abgeschlossen.`));
  } else if (vollstaendig) {
    training.push(fakt(`${gemacht.length} von ${geplant.length} geplanten Einheiten abgeschlossen.`));
  } else {
    // Mitten in der Woche ist „0 von 3" kein Befund, sondern eine Uhrzeit.
    training.push(fakt(`${gemacht.length} von ${geplantBisHeute.length} bis heute fälligen Einheiten abgeschlossen`
      + (offenNochDieseWoche ? `, ${offenNochDieseWoche} stehen diese Woche noch an.` : '.')));
  }

  // Bewusst ausgelassen ist etwas anderes als vergessen. Wer nach einer
  // durchwachten Nacht nicht trainiert, trifft eine Entscheidung — und die
  // gehört als Tatsache in den Bericht, nicht als Vorwurf.
  const mitGrund = [];
  const ohneGrund = [];
  for (const d of verpasst) {
    const s = sessions.find((x) => x.date === d);
    if (s && s.movedTo) continue;                       // woanders nachgeholt
    if (s && s.skipped) mitGrund.push({ d, grund: s.reason });
    else ohneGrund.push(d);
  }

  if (mitGrund.length) {
    const teile = mitGrund.map(({ d, grund }) => {
      const name = WOCHENTAG[new Date(`${d}T12:00:00`).getDay()];
      const r = SKIP_REASONS[grund];
      return r ? `${name} (${r.text})` : name;
    });
    training.push(fakt(`Bewusst ausgelassen: ${teile.join(', ')}.`));
  }
  if (ohneGrund.length) {
    const namen = ohneGrund.map((d) => WOCHENTAG[new Date(`${d}T12:00:00`).getDay()]);
    training.push(schlecht(`Ausgefallen ohne Eintrag: ${namen.join(', ')}.`));
  }

  const nachgeholt = bisHeute.filter((d) => {
    const s = sessions.find((x) => x.date === d);
    return s && s.holtNach && s.done;
  });
  if (nachgeholt.length) {
    training.push(gut(`${nachgeholt.length} ${nachgeholt.length === 1 ? 'Einheit' : 'Einheiten'} nachgeholt.`));
  }
  if (angefangen.length) {
    training.push(schlecht(`${angefangen.length} Einheit${angefangen.length === 1 ? '' : 'en'} angefangen, aber nie abgeschlossen.`));
  }

  const volWoche = bisHeute.reduce((s, d) =>
    s + sessionVolume(sessions.find((x) => x.date === d), profile?.weight), 0);
  const volVor = vorTage.reduce((s, d) =>
    s + sessionVolume(sessions.find((x) => x.date === d), profile?.weight), 0);

  if (volWoche > 0 && volVor > 0) {
    const delta = ((volWoche - volVor) / volVor) * 100;
    const woche = plan ? blockWeek(plan, dateKey) : 0;
    const deload = BLOCK_WEEKS[woche] && BLOCK_WEEKS[woche].factor < 1;
    const einheitenVor = vorTage.filter((d) => sessions.some((x) => x.date === d && sessionSets(x).voll > 0)).length;
    const einheitenJetzt = bisHeute.filter((d) => sessions.some((x) => x.date === d && sessionSets(x).voll > 0)).length;
    const text = `Bewegte Last ${Math.round(volWoche).toLocaleString('de-DE')} kg gegenüber ${Math.round(volVor).toLocaleString('de-DE')} kg in der Vorwoche (${prozent(delta)}).`;

    if (deload) {
      training.push(fakt(`${text} Diese Woche ist die Entlastungswoche — weniger ist hier der Plan.`));
    } else if (einheitenJetzt !== einheitenVor) {
      // Ohne diesen Zusatz liest sich ein Sprung wie Fortschritt, obwohl er
      // nur daher kommt, dass eine Einheit mehr oder weniger stattfand.
      training.push(fakt(`${text} Der Vergleich hinkt: ${einheitenJetzt} Einheiten diese Woche gegenüber ${einheitenVor} in der Vorwoche.`));
    } else {
      training.push(delta >= -2 ? gut(text) : schlecht(text));
    }
  } else if (volWoche > 0) {
    training.push(fakt(`Bewegte Last ${Math.round(volWoche).toLocaleString('de-DE')} kg. Ab der zweiten Woche gibt es einen Vergleich.`));
  }

  abschnitte.push({ titel: 'Training', befunde: training });

  /* --- Übungen, die sich bewegt haben --- */
  const bewegung = uebungsFortschritt(sessions, bisHeute, vorTage);
  if (bewegung.length) abschnitte.push({ titel: 'Einzelne Übungen', befunde: bewegung });

  /* --- Ernährung --- */
  const ernaehrung = [];
  const tageMitEssen = bisHeute.filter((d) => (mealsByDate[d] || []).length);
  const luecken = bisHeute.length - tageMitEssen.length;

  if (!tageMitEssen.length) {
    ernaehrung.push(schlecht('Diese Woche keine einzige Mahlzeit eingetragen.'));
  } else {
    let summeKcal = 0;
    let summeProtein = 0;
    let getroffen = 0;
    let drueber = 0;
    let drunter = 0;

    for (const d of tageMitEssen) {
      const s = tagesSumme(mealsByDate[d]);
      const z = targetsForDate(profile, plan, kcalAdjust, d, goals);
      summeKcal += s.kcal;
      summeProtein += s.protein;
      const abw = s.kcal - z.kcal;
      if (Math.abs(abw) <= z.kcal * 0.08) getroffen += 1;
      else if (abw > 0) drueber += 1;
      else drunter += 1;
    }

    const schnitt = Math.round(summeKcal / tageMitEssen.length);
    ernaehrung.push(fakt(`Im Schnitt ${schnitt} kcal an ${tageMitEssen.length} erfassten Tagen.`));
    ernaehrung.push(getroffen >= tageMitEssen.length / 2
      ? gut(`${getroffen} Tage im Ziel, ${drueber} darüber, ${drunter} darunter.`)
      : schlecht(`Nur ${getroffen} Tage im Ziel, ${drueber} darüber, ${drunter} darunter.`));

    const proteinSchnitt = Math.round(summeProtein / tageMitEssen.length);
    const proteinZiel = targetsForDate(profile, plan, kcalAdjust, dateKey, goals).protein;
    ernaehrung.push(proteinSchnitt >= proteinZiel * 0.9
      ? gut(`Eiweiß im Schnitt ${proteinSchnitt} g bei einem Ziel von ${proteinZiel} g.`)
      : schlecht(`Eiweiß im Schnitt nur ${proteinSchnitt} g bei einem Ziel von ${proteinZiel} g.`));

    // Der laufende Tag ist keine Lücke — der ist noch nicht vorbei.
    const echteLuecken = bisHeute
      .filter((d) => d < dateKey && !(mealsByDate[d] || []).length).length;
    if (echteLuecken) {
      ernaehrung.push(schlecht(`An ${echteLuecken} vergangenen Tag${echteLuecken === 1 ? '' : 'en'} nichts eingetragen. Der Schnitt oben gilt nur für die erfassten Tage und sieht dadurch besser aus, als die Woche war.`));
    }
  }
  abschnitte.push({ titel: 'Ernährung', befunde: ernaehrung });

  /* --- Gewicht --- */
  const gewicht = [];
  const wochenGewichte = bisHeute.filter((d) => weights.some((w) => w.date === d));
  // Vier Werte pro Woche sind das Ziel; mitten in der Woche gilt der anteilige
  // Wert, sonst steht am Dienstag ein Versäumnis da, das noch keines ist.
  const noetig = Math.max(1, Math.round((4 * bisHeute.length) / 7));
  gewicht.push(wochenGewichte.length >= noetig
    ? gut(`An ${wochenGewichte.length} von ${bisHeute.length} Tagen gewogen.`)
    : schlecht(`Nur an ${wochenGewichte.length} von ${bisHeute.length} Tagen gewogen. Unter vier Werten pro Woche ist der Trend Zufall.`));

  const trend = weightTrend(weights, dateKey);
  if (trend && trend.ready) {
    const ziel = weeklyRateFor(profile?.goal);
    gewicht.push(fakt(`Sieben-Tage-Schnitt ${einsNach(trend.average7)} kg, das sind ${prozent(trend.percent)} gegenüber der Woche davor. Zielrate: ${prozent(ziel)}.`));

    const rat = calorieAdvice(profile, weights, dateKey);
    if (rat && rat.onTrack) gewicht.push(gut('Das liegt im Zielkorridor. Kalorien bleiben, wie sie sind.'));
    else if (rat) {
      gewicht.push(schlecht(`Abweichung von ${prozent(rat.deviation)} — die App schlägt ${rat.delta > 0 ? '+' : ''}${rat.delta} kcal pro Tag vor. Im Fortschritt lässt sich das übernehmen.`));
    }
  } else if (trend) {
    gewicht.push(fakt('Für einen Trend fehlen noch Werte: es braucht zwei Wochen mit je mindestens zwei Messungen.'));
  }
  abschnitte.push({ titel: 'Gewicht', befunde: gewicht });

  /* --- Fähigkeiten und Beweglichkeit --- */
  const sonstiges = [];
  for (const id of profile?.skills || []) {
    const skill = skillById(id);
    if (!skill) continue;
    const stufe = levelIndex(skill, skillLevels);
    const geuebt = bisHeute.filter((d) => {
      const s = sessions.find((x) => x.date === d);
      return s && s.skills && (s.skills[id] || []).some((v) => v);
    }).length;
    sonstiges.push(geuebt
      ? fakt(`${skill.name}: an ${geuebt} Tag${geuebt === 1 ? '' : 'en'} geübt, Stufe ${stufe + 1} von ${skill.levels.length}.`)
      : schlecht(`${skill.name}: diese Woche nicht geübt.`));
  }

  const letzteMessung = [...mobility].filter(hasResults).pop();
  if (!letzteMessung) {
    sonstiges.push(fakt('Beweglichkeit noch nie gemessen. Der Test dauert zehn Minuten und braucht nichts.'));
  } else if (dueAgain(letzteMessung.date, dateKey)) {
    sonstiges.push(schlecht(`Beweglichkeitstest ist fällig — die letzte Messung ist ${tageZwischen(letzteMessung.date, dateKey)} Tage her (empfohlen alle ${RETEST_DAYS}).`));
  } else {
    const punkte = overallScore(letzteMessung);
    if (punkte) sonstiges.push(fakt(`Beweglichkeit zuletzt ${punkte.punkte} von 100 (${punkte.band.name}).`));
  }
  if (sonstiges.length) abschnitte.push({ titel: 'Fähigkeiten und Beweglichkeit', befunde: sonstiges });

  /* --- Fazit --- */
  const schlechte = abschnitte.flatMap((a) => a.befunde).filter((b) => b.art === 'schlecht').length;
  const gute = abschnitte.flatMap((a) => a.befunde).filter((b) => b.art === 'gut').length;

  return {
    von: montag,
    bis: shiftDateKey(montag, 6),
    vollstaendig,
    abschnitte,
    fazit: fazitSatz(gute, schlechte, gemacht.length + bewusst.length, geplantBisHeute.length, vollstaendig),
  };
}

/**
 * Ein Satz, der nicht schönredet und nicht dramatisiert.
 *
 * `faellig` sind die bis heute fälligen Einheiten, nicht die der ganzen Woche —
 * am Dienstag ist eine Einheit am Freitag nicht „versäumt".
 */
function fazitSatz(gute, schlechte, gemacht, faellig, vollstaendig) {
  if (!gute && !schlechte) return 'Zu wenig eingetragen, um etwas darüber zu sagen.';

  const fehlend = Math.max(0, faellig - gemacht);

  if (fehlend > 0) {
    const einheit = `${fehlend} Einheit${fehlend === 1 ? '' : 'en'}`;
    return vollstaendig
      ? `${einheit} fehlen. Das ist der Punkt, an dem sich die nächste Woche entscheidet — alles andere ist zweitrangig.`
      : `${einheit} aus dieser Woche ${fehlend === 1 ? 'ist' : 'sind'} noch offen. Nachholen geht, solange die Woche läuft.`;
  }

  if (schlechte === 0) {
    return vollstaendig
      ? 'Eine Woche ohne Schwachstelle. Genau so weiter.'
      : 'Bis hierher ohne Schwachstelle.';
  }
  if (schlechte <= 2) return 'Das Training steht. Die Punkte oben sind Feinschliff, keine Baustelle.';
  if (schlechte > gute) return 'Mehr Baustellen als Erfolge. Nimm dir für nächste Woche einen einzigen Punkt vor, nicht alle.';
  return 'Solide Woche mit ein paar offenen Punkten.';
}

/**
 * Übungen, die sich gegenüber der Vorwoche bewegt haben.
 * Verglichen wird der beste Satz je Übung, nicht das Volumen — das reagiert
 * sonst allein auf einen zusätzlichen Trainingstag.
 */
function uebungsFortschritt(sessions, wocheTage, vorTage) {
  const bester = (tage) => {
    const map = new Map();
    for (const d of tage) {
      const session = sessions.find((s) => s.date === d);
      for (const [id, sets] of Object.entries(session?.entries || {})) {
        for (const set of sets || []) {
          if (!set || !set.reps) continue;
          const w = Number(set.weight) || 0;
          const score = w > 0 ? w * (1 + set.reps / 30) : set.reps;
          if (!map.has(id) || score > map.get(id).score) map.set(id, { score, weight: w, reps: set.reps });
        }
      }
    }
    return map;
  };

  const jetzt = bester(wocheTage);
  const vorher = bester(vorTage);
  const rauf = [];
  const runter = [];

  for (const [id, wert] of jetzt) {
    const alt = vorher.get(id);
    if (!alt) continue;
    const name = exerciseById(id)?.name || id;
    const wie = wert.weight > 0 ? `${einsNach(wert.weight)} kg × ${wert.reps}` : `${wert.reps} Wdh.`;
    const wieAlt = alt.weight > 0 ? `${einsNach(alt.weight)} kg × ${alt.reps}` : `${alt.reps} Wdh.`;
    if (wert.score > alt.score) rauf.push(`${name} ${wieAlt} → ${wie}`);
    else if (wert.score < alt.score) runter.push(`${name} ${wieAlt} → ${wie}`);
  }

  const befunde = [];
  if (rauf.length) befunde.push(gut(`Besser als letzte Woche: ${rauf.join('; ')}`));
  if (runter.length) befunde.push(schlecht(`Schlechter als letzte Woche: ${runter.join('; ')}`));
  if (!rauf.length && !runter.length && jetzt.size) {
    befunde.push(fakt('Keine Übung hat sich gegenüber der Vorwoche verändert.'));
  }
  return befunde;
}
