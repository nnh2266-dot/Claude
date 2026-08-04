import AsyncStorage from '@react-native-async-storage/async-storage';
import { unlocked } from './training';
import type { Lang } from './i18n';

const KEY = 'kegel.v1';

export interface State {
  tested: boolean;
  maxHold: number;
  flicks: number;
  level: number;
  points: number;
  hardStreak: number;
  total: number;
  streak: number;
  lastDay: string | null;
  days: string[];
  seen: string[]; // Übungen, deren Freischaltung schon gezeigt wurde
  lastRetest: number; // Einheiten-Stand des letzten Nachtests
  haptics: boolean;
  reminder: boolean;
  reminderHour: number;
  reminderMinute: number;
  lang: Lang | null; // null = wie das Gerät
}

export const defaults = (): State => ({
  tested: false,
  maxHold: 0,
  flicks: 0,
  level: 1,
  points: 0,
  hardStreak: 0,
  total: 0,
  streak: 0,
  lastDay: null,
  days: [],
  seen: [],
  lastRetest: 0,
  haptics: true,
  reminder: false,
  reminderHour: 8,
  reminderMinute: 0,
  lang: null,
});

export async function load(): Promise<State> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  } catch {
    return defaults();
  }
}

export async function save(state: State): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Speicher nicht verfügbar — die App läuft trotzdem weiter
  }
}

/* ---------- Tage ---------- */

/** YYYY-MM-DD in lokaler Zeit. */
export const today = () => dayOffset(0);

export function dayOffset(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Trägt eine abgeschlossene Einheit ein und führt den Streak fort. */
export function recordSession(state: State): State {
  const day = today();
  const next = { ...state, days: [...state.days] };
  if (!next.days.includes(day)) {
    next.days.push(day);
    next.days = next.days.slice(-120);
    next.streak = next.lastDay === dayOffset(1) ? next.streak + 1 : 1;
    next.lastDay = day;
  }
  next.total++;
  return next;
}

/** Übung, deren Freischaltung noch nicht gezeigt wurde. */
export function pendingUnlock(state: State) {
  return unlocked(state.level).find((e) => !state.seen.includes(e.id));
}

/** Steht ein Nachtest an? */
export const retestDue = (state: State, every: number) =>
  state.total >= every && state.total - state.lastRetest >= every;
