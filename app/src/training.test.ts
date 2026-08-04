/**
 * Prüft die Trainingslogik über alle Testergebnisse, Stufen und Rotationstage.
 * Ausführen mit: npm test
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SESSION_SECONDS,
  buildTimeline,
  levelFromHold,
  params,
  unlocked,
  applyFeedback,
  ALL_EX,
  EX,
  pickExercises,
  type PhaseKind,
} from './training.ts';

const PROFILES: [number, number][] = [
  [2, 8], [3, 8], [5, 10], [8, 14], [9, 12], [12, 18], [20, 22], [35, 25], [60, 40],
];
const REST = new Set<PhaseKind>(['release', 'pause', 'relax', 'intro']);

/** Alle Kombinationen, die eine echte Nutzerin durchlaufen kann. */
function everySession(fn: (s: ReturnType<typeof buildTimeline>, ctx: string) => void) {
  for (const [maxHold, flicks] of PROFILES) {
    const start = levelFromHold(maxHold);
    for (let level = start; level <= start + 9; level++) {
      for (let sess = 0; sess < 6; sess++) {
        fn(
          buildTimeline(level, maxHold, flicks, sess),
          `Max ${maxHold}s, Stufe ${level}, Einheit ${sess}`,
        );
      }
    }
  }
}

test('jede Einheit dauert exakt 6:00', () => {
  everySession((s, ctx) => assert.equal(s.total, SESSION_SECONDS, ctx));
});

test('die Phasen schließen lückenlos aneinander an', () => {
  everySession((s, ctx) => {
    let t = 0;
    for (const ph of s.phases) {
      assert.equal(ph.start, t, `${ctx}: Startzeit von ${ph.label}`);
      assert.ok(ph.dur > 0, `${ctx}: ${ph.label} dauert ${ph.dur}s`);
      t += ph.dur;
    }
  });
});

test('nie folgen zwei Ruhephasen aufeinander', () => {
  everySession((s, ctx) => {
    for (let i = 0; i < s.phases.length - 1; i++) {
      const a = s.phases[i], b = s.phases[i + 1];
      assert.ok(
        !(REST.has(a.kind) && REST.has(b.kind)),
        `${ctx}: ${a.label} (${a.dur}s) direkt gefolgt von ${b.label} (${b.dur}s)`,
      );
    }
  });
});

test('mitten in der Einheit wird nie länger als 20 s gewartet', () => {
  everySession((s, ctx) => {
    let run = 0;
    for (const ph of s.phases) {
      if (ph.kind === 'relax') break; // Abschluss zählt nicht als Warten
      run = REST.has(ph.kind) ? run + ph.dur : 0;
      assert.ok(run <= 20, `${ctx}: ${run}s am Stück ohne Anspannen`);
    }
  });
});

test('keine Haltezeit liegt über dem gemessenen Maximum', () => {
  for (const [maxHold, flicks] of PROFILES) {
    const start = levelFromHold(maxHold);
    for (let level = start; level <= start + 9; level++) {
      for (let sess = 0; sess < 6; sess++) {
        const s = buildTimeline(level, maxHold, flicks, sess);
        // Längste Strecke bei voller Anspannung am Stück (Aufwärmen ausgenommen)
        let run = 0;
        for (const ph of s.phases) {
          const full = ph.kind === 'tense' && ph.scale === 1 && ph.exercise !== EX.schnell.id;
          run = full ? run + ph.dur : 0;
          assert.ok(
            run <= maxHold,
            `Max ${maxHold}s, Stufe ${level}: ${run}s volle Anspannung am Stück`,
          );
        }
      }
    }
  }
});

test('jede Übung wird genau einmal angekündigt', () => {
  everySession((s, ctx) => {
    const intros = s.phases.filter((ph) => ph.kind === 'intro');
    assert.equal(intros.length, s.list.length, `${ctx}: Ankündigungen`);
    assert.deepEqual(
      intros.map((ph) => ph.exercise),
      s.list.map((e) => e.id),
      `${ctx}: Reihenfolge der Ankündigungen`,
    );
  });
});

test('jede Übung läuft am Stück, ohne Sprünge', () => {
  everySession((s, ctx) => {
    const folge = s.phases.map((ph) => ph.exercise).filter((e, i, a) => e !== a[i - 1]);
    assert.equal(new Set(folge).size, folge.length, `${ctx}: ${folge.join(' → ')}`);
  });
});

test('Wiederholungen werden je Übung gezählt, nicht je Teilschritt', () => {
  // Der Aufzug hat sechs Teilschritte pro Wiederholung — die dürfen nicht einzeln zählen.
  const s = buildTimeline(3, 9, 12, 1);
  const aufzug = s.plan.find((x) => x.ex.id === 'aufzug');
  assert.ok(aufzug, 'Aufzug sollte auf Stufe 3 vorkommen');
  const reps = s.phases.filter((ph) => ph.exercise === 'aufzug' && ph.rep > 0);
  assert.equal(Math.max(...reps.map((ph) => ph.rep)), aufzug!.n);
});

test('Übungen schalten sich stufenweise frei', () => {
  assert.deepEqual(unlocked(1).map((e) => e.id), ['schnell', 'halten', 'lang']);
  assert.equal(unlocked(3).length, 4);
  assert.equal(unlocked(5).length, 5);
  assert.equal(unlocked(7).length, ALL_EX.length);
});

test('die Übungen wechseln von Tag zu Tag', () => {
  const tage = [0, 1, 2].map((n) =>
    pickExercises(7, n).map((e) => e.id).join('+'),
  );
  assert.equal(new Set(tage).size, 3, `Rotation: ${tage.join(' | ')}`);
});

test('Haltezeiten wachsen mit der Stufe, bleiben aber unter dem Maximum', () => {
  const maxHold = 20;
  let vorher = 0;
  for (let level = 1; level <= 12; level++) {
    const p = params(level, maxHold, 12);
    assert.ok(p.longHold >= vorher, `Stufe ${level}: ${p.longHold}s < vorher ${vorher}s`);
    assert.ok(p.longHold <= maxHold, `Stufe ${level}: ${p.longHold}s über Maximum`);
    assert.ok(p.hold <= p.longHold, `Stufe ${level}: Halten länger als Langes Halten`);
    vorher = p.longHold;
  }
});

test('ein höheres Maximum im Nachtest verlängert die Haltezeiten', () => {
  const vorher = params(4, 9, 12);
  const nachher = params(4, 14, 12);
  assert.ok(nachher.longHold > vorher.longHold);
  assert.ok(nachher.hold > vorher.hold);
});

test('die Rückmeldung steuert die Stufe', () => {
  // zweimal „zu leicht" hebt die Stufe
  let s = { level: 3, points: 0, hardStreak: 0 };
  s = applyFeedback(s, 'easy');
  assert.equal(s.level, 3);
  s = applyFeedback(s, 'easy');
  assert.equal(s.level, 4);
  assert.equal(s.points, 0);

  // dreimal „zu schwer" senkt sie
  s = { level: 4, points: 0, hardStreak: 0 };
  for (let i = 0; i < 3; i++) s = applyFeedback(s, 'hard');
  assert.equal(s.level, 3);

  // unter Stufe 1 geht es nicht
  s = { level: 1, points: 0, hardStreak: 0 };
  for (let i = 0; i < 6; i++) s = applyFeedback(s, 'hard');
  assert.equal(s.level, 1);
});
