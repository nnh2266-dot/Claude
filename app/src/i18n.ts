import { getLocales } from 'expo-localization';

const de = {
  appName: 'Beckenboden',
  level: 'Stufe {n}',
  back: 'Zurück',
  continue: 'Weiter',
  cancel: 'Abbrechen',

  /* ---- Übungen ---- */
  'ex.quick': 'Schnellspanner',
  'ex.quick.how': 'kurz anspannen, sofort lösen',
  'ex.quick.short': 'kurz anspannen',
  'ex.hold': 'Halten',
  'ex.hold.how': '{s} Sekunden halten',
  'ex.hold.short': '{s} s halten',
  'ex.longHold': 'Langes Halten',
  'ex.longHold.how': '{s} Sekunden halten',
  'ex.longHold.short': '{s} s halten',
  'ex.elevator': 'Aufzug',
  'ex.elevator.how': 'in 3 Stufen anspannen, oben halten, in 3 Stufen lösen',
  'ex.elevator.short': '3 Stufen hoch und runter',
  'ex.slowRelease': 'Langsames Lösen',
  'ex.slowRelease.how': 'anspannen, dann {s} Sekunden lang langsam lösen',
  'ex.slowRelease.short': '{s} s langsam lösen',
  'ex.pulse': 'Pulsieren',
  'ex.pulse.how': '{s} Sekunden auf halber Kraft pulsieren',
  'ex.pulse.short': '{s} s pulsieren',

  /* ---- Phasen ---- */
  'ph.tense': 'Anspannen',
  'ph.release': 'Loslassen',
  'ph.loose': 'Locker',
  'ph.releaseFully': 'Ganz loslassen',
  'ph.releaseSlowly': 'langsam lösen',
  'ph.pulsing': 'Pulsieren',
  'ph.step1': 'Stufe 1',
  'ph.step2': 'Stufe 2',
  'ph.step3': 'Stufe 3',
  'ph.holdTop': 'oben halten',
  'ph.setPause': 'Satzpause',
  'ph.relax': 'Entspannen',

  /* ---- Startbildschirm ---- */
  streak: 'Tage in Folge',
  totalSessions: 'Einheiten gesamt',
  weekDone: 'Heute erledigt · {n} von 7 Tagen',
  weekOpen: 'Letzte 7 Tage · {n} Einheiten',
  todaySession: 'Heutige Einheit · 6:00',
  unlockedCount: '{a} von {b} Übungen',
  nextFromLevel: ' · nächste ab Stufe {n}',
  allUnlocked: ' freigeschaltet',
  progressHint:
    'Noch {n} bis Stufe {lvl}. Nach jeder Einheit sagst du, wie es sich angefühlt hat — danach richtet sich das Tempo.',
  oneSession: 'eine Einheit',
  nSessions: '{n} Einheiten',
  startTraining: 'Training starten',
  trainAgain: 'Nochmal trainieren',
  settings: 'Einstellungen',
  redoTest: 'Test wiederholen',

  /* ---- Nachtest ---- */
  retestTitle: 'Zeit für einen Nachtest',
  retestText:
    'Du hast {n} Einheiten geschafft. Dein Maximum liegt noch bei {s} s aus dem letzten Test — wahrscheinlich kannst du inzwischen mehr. Ein kurzer Nachtest dauert etwa eine Minute.',
  retestNow: 'Nachtest starten',
  retestLater: 'Später',

  /* ---- Test ---- */
  testEyebrow: 'Eingangstest',
  techniqueTitle: 'So spannst du richtig an',
  techniqueLead:
    'Spanne die Muskeln an, mit denen du den Urinstrahl anhalten würdest — und zieh sie nach innen und oben.',
  techniqueLoose: 'Locker bleiben:',
  techniqueLooseText: 'Bauch, Po und Oberschenkel bleiben entspannt. Nur der Beckenboden arbeitet.',
  techniqueBreathe: 'Weiteratmen:',
  techniqueBreatheText: 'Halte nie die Luft an. Ruhig ein und aus.',
  techniqueNotToilet: 'Nicht beim Wasserlassen üben:',
  techniqueNotToiletText: 'Das ist nur zum Erspüren gedacht, nicht zum Training.',
  testPlan:
    'Gleich misst du zweimal: wie lange du halten kannst und wie schnell du anspannen kannst. Daraus baue ich dein Programm.',
  beginTest: 'Test beginnen',
  part1: 'Teil 1 · Halten',
  part2: 'Teil 2 · Schnellkraft',
  attemptOf: 'Versuch {n} von 3',
  holdReady: 'Spanne an, sobald du bereit bist — und halte so lange du kannst.',
  holdNow: 'Halten … tippe, sobald du nicht mehr kannst.',
  holdPause: 'Pause — locker lassen.',
  holdAgain: 'Nochmal: halte so lange du kannst.',
  holdDone: 'Sehr gut. Kurz durchatmen.',
  tenseNow: 'Jetzt anspannen',
  released: 'Losgelassen',
  toPart2: 'Weiter zu Teil 2',
  seeResult: 'Ergebnis ansehen',
  quickMsg: '10 Sekunden lang: kurz anspannen, sofort loslassen — und bei jeder Wiederholung tippen.',
  tapToStart: 'Tippen zum Starten',
  tapEach: 'Tippen bei jedem Anspannen',
  finished: 'Fertig',

  /* ---- Ergebnis ---- */
  yourResult: 'Dein Ergebnis',
  longestHold: 'Längstes Halten',
  quickPer10: 'Schnellkraft / 10 s',
  change: 'Veränderung',
  startLevel: 'Startstufe {n}',
  resultLow: 'Ein sehr guter Ausgangspunkt. Wir starten bewusst kurz — Sauberkeit vor Dauer.',
  resultMid: 'Solide Grundlage. Das Programm baut jetzt Halte- und Schnellkraft parallel auf.',
  resultHigh: 'Starker Ausgangswert. Das Programm steigt entsprechend höher ein.',
  yourMaxChanged: 'Dein Maximum: {a} s → {b} s',
  retestUp: 'Stärker geworden. Die Haltezeiten wachsen entsprechend mit.',
  retestSame: 'Ungefähr gleich geblieben. Die Haltezeiten bleiben, wie sie sind.',
  retestDown: 'Heute etwas weniger — das schwankt von Tag zu Tag. Die Haltezeiten passen sich an.',
  firstSession: 'Deine erste Einheit',
  apply: 'Übernehmen',
  testAgain: 'Test wiederholen',

  /* ---- Einheit ---- */
  nextUp: 'Als Nächstes',
  nextUpX: 'Als Nächstes: {x}',
  nextSet: 'Als Nächstes: Satz {n} von {of}',
  closing: 'Abschluss',
  repOf: 'Wiederholung {n} von {of}',
  setOf: 'Satz {n} von {of}',
  reps: '{n} Wiederholungen',
  oneRep: '1 Wiederholung',
  pause: 'Pause',
  resume: 'Weiter',
  stop: 'Beenden',

  /* ---- Abschluss ---- */
  finishedEyebrow: 'Geschafft',
  finishedTitle: '6 Minuten erledigt',
  finishedStreak: '{n} Tage in Folge · Stufe {lvl}',
  finishedCount: 'Einheit {n} · Stufe {lvl}',
  howDidItFeel: 'Wie hat sich die Einheit angefühlt?',
  tooEasy: 'Zu leicht',
  justRight: 'Genau richtig',
  tooHard: 'Zu schwer',

  /* ---- Freischaltung ---- */
  unlockEyebrow: 'Neue Übung freigeschaltet',
  unlockNote:
    'Ab jetzt taucht {x} in deinen Einheiten auf. Es sind nicht alle Übungen an einem Tag dran — sie wechseln sich ab, damit jede genug Zeit bekommt.',

  /* ---- Einstellungen ---- */
  reminder: 'Tägliche Erinnerung',
  reminderSub: 'Eine stille Benachrichtigung zur gewählten Zeit',
  reminderTime: 'Uhrzeit',
  haptics: 'Vibration bei Wechsel',
  hapticsSub: 'Kurzes Tippen beim Anspannen und Loslassen, lautlos',
  levelTitle: 'Stufe',
  levelText:
    'Du trainierst auf Stufe {n}. Passt das Tempo nicht, kannst du sie hier direkt ändern.',
  levelDown: '− Stufe',
  levelUp: '+ Stufe',
  backupTitle: 'Datensicherung',
  backupText:
    'Deine Daten liegen nur auf diesem Gerät. Sicher sie, bevor du das Handy wechselst.',
  exportData: 'Sichern',
  importData: 'Einlesen',
  exportDone: 'Sicherung erstellt.',
  importDone: 'Daten eingelesen.',
  importFailed: 'Datei konnte nicht gelesen werden.',
  language: 'Sprache',
  languageAuto: 'Wie das Gerät',
  dataNote:
    'Alle Daten bleiben ausschließlich auf diesem Gerät. Es wird nichts hochgeladen und nichts geteilt.',
  disclaimer:
    'Diese App dient dem allgemeinen Fitnesstraining und ersetzt keine ärztliche oder physiotherapeutische Behandlung. Die Trainingszeiten sind nicht fachlich geprüft. Bei Schmerzen oder anhaltenden Beschwerden lass das ärztlich abklären.',
  resetData: 'Alle Daten löschen',
  resetConfirm: 'Wirklich alle Daten löschen? Test, Stufe und Verlauf gehen verloren.',
  delete: 'Löschen',

  /* ---- Onboarding ---- */
  welcomeTitle: 'Sechs Minuten am Tag',
  welcomeBody:
    'Erst ein kurzer Test, der misst, was du kannst. Danach ein Programm, das genau darauf aufbaut und mit dir mitwächst.',
  welcomePrivacy: 'Alles bleibt auf deinem Gerät',
  welcomePrivacyBody: 'Kein Konto, keine Anmeldung, nichts wird hochgeladen.',
  welcomeStart: 'Los geht’s',
};

const en: typeof de = {
  appName: 'Pelvic Floor',
  level: 'Level {n}',
  back: 'Back',
  continue: 'Continue',
  cancel: 'Cancel',

  'ex.quick': 'Quick Flicks',
  'ex.quick.how': 'squeeze briefly, release at once',
  'ex.quick.short': 'quick squeeze',
  'ex.hold': 'Hold',
  'ex.hold.how': 'hold for {s} seconds',
  'ex.hold.short': 'hold {s} s',
  'ex.longHold': 'Long Hold',
  'ex.longHold.how': 'hold for {s} seconds',
  'ex.longHold.short': 'hold {s} s',
  'ex.elevator': 'Elevator',
  'ex.elevator.how': 'squeeze in 3 steps, hold at the top, release in 3 steps',
  'ex.elevator.short': '3 steps up and down',
  'ex.slowRelease': 'Slow Release',
  'ex.slowRelease.how': 'squeeze, then release slowly over {s} seconds',
  'ex.slowRelease.short': 'release over {s} s',
  'ex.pulse': 'Pulsing',
  'ex.pulse.how': 'pulse at half strength for {s} seconds',
  'ex.pulse.short': 'pulse {s} s',

  'ph.tense': 'Squeeze',
  'ph.release': 'Release',
  'ph.loose': 'Loose',
  'ph.releaseFully': 'Release fully',
  'ph.releaseSlowly': 'release slowly',
  'ph.pulsing': 'Pulsing',
  'ph.step1': 'Step 1',
  'ph.step2': 'Step 2',
  'ph.step3': 'Step 3',
  'ph.holdTop': 'hold at the top',
  'ph.setPause': 'Set break',
  'ph.relax': 'Relax',

  streak: 'Day streak',
  totalSessions: 'Sessions total',
  weekDone: 'Done today · {n} of 7 days',
  weekOpen: 'Last 7 days · {n} sessions',
  todaySession: 'Today’s session · 6:00',
  unlockedCount: '{a} of {b} exercises',
  nextFromLevel: ' · next at level {n}',
  allUnlocked: ' unlocked',
  progressHint:
    '{n} to go until level {lvl}. After each session you say how it felt — that sets the pace.',
  oneSession: 'One session',
  nSessions: '{n} sessions',
  startTraining: 'Start training',
  trainAgain: 'Train again',
  settings: 'Settings',
  redoTest: 'Redo test',

  retestTitle: 'Time for a re-test',
  retestText:
    'You have completed {n} sessions. Your maximum is still {s} s from the last test — you can probably do more by now. A short re-test takes about a minute.',
  retestNow: 'Start re-test',
  retestLater: 'Later',

  testEyebrow: 'Initial test',
  techniqueTitle: 'How to squeeze correctly',
  techniqueLead:
    'Squeeze the muscles you would use to stop the flow of urine — and draw them inwards and upwards.',
  techniqueLoose: 'Stay loose:',
  techniqueLooseText: 'Belly, buttocks and thighs stay relaxed. Only the pelvic floor works.',
  techniqueBreathe: 'Keep breathing:',
  techniqueBreatheText: 'Never hold your breath. Calmly in and out.',
  techniqueNotToilet: 'Do not practise while urinating:',
  techniqueNotToiletText: 'That is only for finding the muscles, not for training.',
  testPlan:
    'You will measure twice: how long you can hold, and how fast you can squeeze. Your programme is built from that.',
  beginTest: 'Begin test',
  part1: 'Part 1 · Holding',
  part2: 'Part 2 · Quick strength',
  attemptOf: 'Attempt {n} of 3',
  holdReady: 'Squeeze when you are ready — and hold as long as you can.',
  holdNow: 'Holding … tap as soon as you cannot hold any longer.',
  holdPause: 'Break — let go.',
  holdAgain: 'Again: hold as long as you can.',
  holdDone: 'Well done. Take a breath.',
  tenseNow: 'Squeeze now',
  released: 'Released',
  toPart2: 'On to part 2',
  seeResult: 'See result',
  quickMsg: 'For 10 seconds: squeeze briefly, release at once — and tap on every repetition.',
  tapToStart: 'Tap to start',
  tapEach: 'Tap on every squeeze',
  finished: 'Done',

  yourResult: 'Your result',
  longestHold: 'Longest hold',
  quickPer10: 'Quick squeezes / 10 s',
  change: 'Change',
  startLevel: 'Starting level {n}',
  resultLow: 'A very good starting point. We deliberately start short — form before duration.',
  resultMid: 'Solid basis. The programme now builds holding and quick strength in parallel.',
  resultHigh: 'Strong starting value. The programme starts higher accordingly.',
  yourMaxChanged: 'Your maximum: {a} s → {b} s',
  retestUp: 'Stronger than before. The hold times grow with it.',
  retestSame: 'About the same. The hold times stay as they are.',
  retestDown: 'A bit less today — that varies from day to day. The hold times adjust.',
  firstSession: 'Your first session',
  apply: 'Apply',
  testAgain: 'Redo test',

  nextUp: 'Up next',
  nextUpX: 'Up next: {x}',
  nextSet: 'Up next: set {n} of {of}',
  closing: 'Cool-down',
  repOf: 'Repetition {n} of {of}',
  setOf: 'Set {n} of {of}',
  reps: '{n} repetitions',
  oneRep: '1 repetition',
  pause: 'Pause',
  resume: 'Resume',
  stop: 'Stop',

  finishedEyebrow: 'Done',
  finishedTitle: '6 minutes complete',
  finishedStreak: '{n} days in a row · level {lvl}',
  finishedCount: 'Session {n} · level {lvl}',
  howDidItFeel: 'How did the session feel?',
  tooEasy: 'Too easy',
  justRight: 'Just right',
  tooHard: 'Too hard',

  unlockEyebrow: 'New exercise unlocked',
  unlockNote:
    '{x} will now appear in your sessions. Not every exercise runs on the same day — they take turns so each one gets enough time.',

  reminder: 'Daily reminder',
  reminderSub: 'A silent notification at the time you choose',
  reminderTime: 'Time',
  haptics: 'Vibrate on change',
  hapticsSub: 'A short tap when squeezing and releasing, silent',
  levelTitle: 'Level',
  levelText: 'You are training at level {n}. If the pace is off, change it here.',
  levelDown: '− Level',
  levelUp: '+ Level',
  backupTitle: 'Backup',
  backupText: 'Your data lives only on this device. Back it up before you change phones.',
  exportData: 'Back up',
  importData: 'Restore',
  exportDone: 'Backup created.',
  importDone: 'Data restored.',
  importFailed: 'Could not read the file.',
  language: 'Language',
  languageAuto: 'Match device',
  dataNote: 'All data stays on this device only. Nothing is uploaded and nothing is shared.',
  disclaimer:
    'This app is for general fitness training and does not replace medical or physiotherapeutic care. The training times have not been clinically reviewed. If you have pain or persistent symptoms, see a doctor.',
  resetData: 'Delete all data',
  resetConfirm: 'Really delete all data? Test, level and history will be lost.',
  delete: 'Delete',

  welcomeTitle: 'Six minutes a day',
  welcomeBody:
    'First a short test that measures what you can do. Then a programme built exactly on that, which grows with you.',
  welcomePrivacy: 'Everything stays on your device',
  welcomePrivacyBody: 'No account, no sign-in, nothing uploaded.',
  welcomeStart: 'Get started',
};

export type Lang = 'de' | 'en';
export const LANGS: Lang[] = ['de', 'en'];
const dicts = { de, en };
export type Key = keyof typeof de;

/** Gerätesprache, sofern unterstützt — sonst Englisch. */
export function deviceLang(): Lang {
  const code = getLocales()[0]?.languageCode;
  return code === 'de' ? 'de' : 'en';
}

export function makeT(lang: Lang) {
  const dict = dicts[lang];
  return (key: Key, vars?: Record<string, string | number>): string => {
    let s: string = dict[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
}

export type T = ReturnType<typeof makeT>;

/** Zahl mit Komma bzw. Punkt, je nach Sprache. */
export const fmt = (v: number, lang: Lang) => {
  const s = (Math.round(v * 10) / 10).toString();
  return lang === 'de' ? s.replace('.', ',') : s;
};
