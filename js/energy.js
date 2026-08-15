/**
 * Energiebedarf und Zielwerte — die Brücke zwischen Trainingsplan und
 * Nährwerten. Aus dem Profil ergeben sich Tagesziele, die an Trainingstagen
 * höher liegen als an Ruhetagen. Wie training.js ohne DOM-Zugriff.
 */

import { roundKcal, shiftDateKey, localDateKey } from './nutrition.js';
import { dayForWeekday } from './training.js';

export const ACTIVITY_FACTOR = { sitzend: 1.20, leicht: 1.35, mittel: 1.50, hoch: 1.65 };

export const ACTIVITY_LABEL = {
  sitzend: 'Sitzend', leicht: 'Leicht aktiv', mittel: 'Aktiv', hoch: 'Sehr aktiv',
};

/** Kalorienanpassung je Ziel, und die Gewichtsveränderung, die dazugehört. */
const GOAL_SETTINGS = {
  abnehmen: { factor: -0.18, proteinPerKg: 2.2, weeklyRate: -0.6 },
  form:     { factor: -0.05, proteinPerKg: 2.0, weeklyRate: 0 },
  aufbau:   { factor: 0.12,  proteinPerKg: 1.8, weeklyRate: 0.25 },
};

export function weeklyRateFor(goal) {
  return (GOAL_SETTINGS[goal] || GOAL_SETTINGS.form).weeklyRate;
}

/**
 * Grundumsatz, Gesamtbedarf und die Tagesziele für Trainings- und Ruhetage.
 *
 * Grundumsatz nach Mifflin-St Jeor, oder nach Katch-McArdle sobald ein
 * Körperfettanteil bekannt ist — das ist dann die genauere Formel, weil sie
 * auf die fettfreie Masse geht statt auf Größe und Alter.
 */
export function energyPlan(profile, kcalAdjust = 0) {
  const { weight, height, age, sex } = profile;
  const goal = GOAL_SETTINGS[profile.goal] || GOAL_SETTINGS.form;

  let bmr;
  if (profile.bodyfat && profile.bodyfat > 3 && profile.bodyfat < 60) {
    const lean = weight * (1 - profile.bodyfat / 100);
    bmr = 370 + 21.6 * lean;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'm' ? 5 : -161);
  }

  const base = bmr * (ACTIVITY_FACTOR[profile.activity] || 1.35);
  const sessionBurn = 0.075 * weight * profile.sessionLength; // ~0,075 kcal je kg und Minute
  const tdee = (base * 7 + sessionBurn * profile.days) / 7;

  // Nie unter das 1,1-fache des Grundumsatzes, auch nicht im Defizit.
  const target = Math.max(tdee * (1 + goal.factor) + kcalAdjust, bmr * 1.1);

  // Kalorien von Ruhe- auf Trainingstage verschieben, ohne die Wochensumme zu
  // ändern. Bei sechs Trainingstagen müsste ein einziger Ruhetag die ganze
  // Umverteilung tragen — deshalb der Deckel bei 15 % des Tagesziels.
  const restDays = 7 - profile.days;
  const shift = restDays > 0
    ? Math.min(sessionBurn * 0.6, 400, (target * 0.15 * restDays) / profile.days)
    : 0;

  const trainingKcal = target + shift;
  const restKcal = restDays > 0 ? target - (shift * profile.days) / restDays : target;

  // Bei hohem Körperfettanteil geht das Eiweiß auf eine fettärmere Bezugsmasse,
  // sonst käme eine unnötig hohe Menge heraus.
  const reference = profile.bodyfat && profile.bodyfat > 25
    ? weight * (1 - (profile.bodyfat - 20) / 100)
    : weight;

  const protein = Math.round(reference * goal.proteinPerKg);
  const fat = Math.round(Math.max(reference * 0.8, (target * 0.20) / 9));

  const macrosFor = (kcal) => ({
    kcal: roundKcal(kcal),
    protein,
    fat,
    carbs: Math.max(30, Math.round((kcal - protein * 4 - fat * 9) / 4)),
  });

  return {
    bmr: Math.round(bmr),
    base: Math.round(base),
    sessionBurn: Math.round(sessionBurn),
    tdee: Math.round(tdee),
    target: Math.round(target),
    proteinPerKg: goal.proteinPerKg,
    water: Math.round(weight * 0.035 * 10) / 10,
    training: macrosFor(trainingKcal),
    rest: macrosFor(restKcal),
    average: macrosFor(target),
  };
}

/**
 * Tagesziel für ein bestimmtes Datum: an Trainingstagen die höheren Werte.
 * Ohne Profil bleibt es bei den von Hand gesetzten Zielen.
 */
export function targetsForDate(profile, plan, kcalAdjust, dateKey, fallbackGoals) {
  if (!profile || !plan) return { ...fallbackGoals, kind: 'manual', dayName: null };

  const weekday = new Date(`${dateKey}T12:00:00`).getDay();
  const day = dayForWeekday(plan, weekday);
  const energy = energyPlan(profile, kcalAdjust);
  const targets = day ? energy.training : energy.rest;

  return { ...targets, kind: day ? 'training' : 'rest', dayName: day ? day.name : null };
}

/* ---------------- Gewichtsverlauf ---------------- */

/**
 * Gleitender 7-Tage-Schnitt gegen die Vorwoche. Einzelne Tageswerte schwanken
 * über ein Kilo durch Wasser und Darminhalt — erst der Schnitt zeigt den Trend.
 */
export function weightTrend(weights, todayKey = localDateKey()) {
  const sorted = [...(weights || [])].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!sorted.length) return null;

  const latest = sorted[sorted.length - 1];
  if (sorted.length === 1) {
    return { latest: latest.kg, average7: latest.kg, ready: false, count: 1 };
  }

  const meanBetween = (after, until) => {
    const picked = sorted.filter((w) => w.date > after && w.date <= until);
    return picked.length
      ? { value: picked.reduce((sum, w) => sum + w.kg, 0) / picked.length, count: picked.length }
      : null;
  };

  const current = meanBetween(shiftDateKey(todayKey, -7), todayKey);
  const previous = meanBetween(shiftDateKey(todayKey, -14), shiftDateKey(todayKey, -7));

  if (!current || !previous || current.count < 2 || previous.count < 2) {
    return {
      latest: latest.kg,
      average7: current ? current.value : latest.kg,
      ready: false,
      count: sorted.length,
    };
  }

  const deltaKg = current.value - previous.value;
  return {
    latest: latest.kg,
    average7: current.value,
    previous7: previous.value,
    deltaKg,
    percent: (deltaKg / current.value) * 100,
    ready: true,
    count: sorted.length,
  };
}

/**
 * Vergleicht die gemessene Veränderung mit der Zielrate und schlägt eine
 * Korrektur vor. Die Formeln oben sind Schätzungen — das hier ist die
 * Rückmeldung aus der Wirklichkeit, und sie hat Vorrang.
 *
 * 1 kg Körpermasse entspricht etwa 7700 kcal.
 */
export function calorieAdvice(profile, weights, todayKey = localDateKey()) {
  const trend = weightTrend(weights, todayKey);
  if (!trend || !trend.ready) return null;

  const wanted = weeklyRateFor(profile.goal);
  const deviation = trend.percent - wanted;

  // Unter einem Viertel Prozentpunkt ist der Unterschied Messrauschen.
  if (Math.abs(deviation) < 0.22) return { onTrack: true, trend, wanted, deviation };

  const raw = -(deviation / 100) * trend.average7 * 7700 / 7;
  const delta = Math.max(-300, Math.min(300, Math.round(raw / 25) * 25));

  return { onTrack: false, trend, wanted, deviation, delta };
}

/** Alle Zahlen des Energieplans als erklärte Liste — für die Plan-Ansicht. */
export function energyBreakdown(profile, kcalAdjust) {
  const energy = energyPlan(profile, kcalAdjust);
  const goalNote = {
    abnehmen: '−18 % für den Fettabbau',
    form: '−5 %, dafür viel Eiweiß',
    aufbau: '+12 % für den Aufbau',
  }[profile.goal];

  return [
    ['Grundumsatz', `${energy.bmr} kcal`,
      profile.bodyfat ? 'Katch-McArdle über die fettfreie Masse' : 'Mifflin-St Jeor'],
    ['Alltag ohne Training', `${energy.base} kcal`, 'Grundumsatz × Aktivitätsfaktor'],
    ['Pro Einheit zusätzlich', `+${energy.sessionBurn} kcal`, `${profile.sessionLength} Minuten Krafttraining`],
    ['Gesamtbedarf', `${energy.tdee} kcal`, 'über die Woche gemittelt'],
    ['Dein Ziel', `${energy.target} kcal`,
      goalNote + (kcalAdjust ? ` · Anpassung ${kcalAdjust > 0 ? '+' : ''}${kcalAdjust} kcal` : '')],
    ['Eiweiß', `${energy.average.protein} g`, `${String(energy.proteinPerKg).replace('.', ',')} g pro kg Körpergewicht`],
    ['Wasser', `${String(energy.water).replace('.', ',')} l`, 'Richtwert, an Trainingstagen eher mehr'],
  ];
}
