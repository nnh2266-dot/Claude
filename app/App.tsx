import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Home } from './src/screens/Home';
import { Session } from './src/screens/Session';
import { Test } from './src/screens/Test';
import { Settings } from './src/screens/Settings';
import { Done, Unlock, Welcome } from './src/screens/Simple';

import { deviceLang, makeT, type Lang } from './src/i18n';
import { defaults, load, pendingUnlock, recordSession, save, type State } from './src/storage';
import { applyFeedback, levelFromHold, params, unlocked, type Feedback } from './src/training';
import { exportState, importState, setReminder, tapDone } from './src/native';

type View =
  | { name: 'loading' }
  | { name: 'welcome' }
  | { name: 'home' }
  | { name: 'test'; retest: boolean }
  | { name: 'session' }
  | { name: 'done' }
  | { name: 'unlock' }
  | { name: 'settings' };

export default function App() {
  const scheme = useColorScheme();
  const [state, setState] = useState<State>(defaults());
  const [view, setView] = useState<View>({ name: 'loading' });

  useEffect(() => {
    load().then((s) => {
      setState(s);
      setView(s.tested ? { name: 'home' } : { name: 'welcome' });
    });
  }, []);

  const lang: Lang = state.lang ?? deviceLang();
  const t = useMemo(() => makeT(lang), [lang]);

  /** Ändert den Zustand und schreibt ihn sofort weg. */
  const patch = useCallback((p: Partial<State>) => {
    setState((prev) => {
      const next = { ...prev, ...p };
      save(next);
      return next;
    });
  }, []);

  // Erinnerung neu setzen, wenn sich Schalter, Zeit oder Sprache ändern
  useEffect(() => {
    if (view.name === 'loading') return;
    setReminder(
      state.reminder,
      state.reminderHour,
      state.reminderMinute,
      t('appName'),
      t('startTraining'),
    );
  }, [state.reminder, state.reminderHour, state.reminderMinute, lang, view.name, t]);

  const goHome = () => setView({ name: 'home' });

  /* ---- Nach der Einheit ---- */
  const finish = useCallback(() => {
    tapDone(state.haptics);
    const next = recordSession(state);
    setState(next);
    save(next);
    setView({ name: 'done' });
  }, [state]);

  const onFeedback = (kind: Feedback) => {
    const prog = applyFeedback(
      { level: state.level, points: state.points, hardStreak: state.hardStreak },
      kind,
    );
    const next = { ...state, ...prog };
    setState(next);
    save(next);
    setView(pendingUnlock(next) ? { name: 'unlock' } : { name: 'home' });
  };

  const onUnlockSeen = () => {
    const ex = pendingUnlock(state);
    if (ex) patch({ seen: [...state.seen, ex.id] });
    goHome();
  };

  /* ---- Test und Nachtest ---- */
  const onApplyTest = (maxHold: number, flicks: number | null) => {
    if (flicks === null) {
      // Nachtest: nur das Maximum, Stufe und Fortschritt bleiben
      patch({ maxHold, lastRetest: state.total });
    } else {
      const level = levelFromHold(maxHold);
      patch({
        tested: true,
        maxHold,
        flicks,
        level,
        points: 0,
        hardStreak: 0,
        lastRetest: state.total,
        seen: unlocked(level).map((e) => e.id),
      });
    }
    goHome();
  };

  /* ---- Datensicherung ---- */
  const doExport = async () => {
    await exportState(JSON.stringify(state));
  };

  const doImport = async () => {
    const raw = await importState();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<State>;
      if (typeof parsed.level !== 'number' || typeof parsed.maxHold !== 'number') throw new Error('ungültig');
      const next = { ...defaults(), ...parsed };
      setState(next);
      await save(next);
    } catch {
      // ungültige Datei — Zustand bleibt unverändert
    }
  };

  let screen: React.ReactNode = null;
  switch (view.name) {
    case 'loading':
      screen = null;
      break;
    case 'welcome':
      screen = <Welcome t={t} onStart={() => setView({ name: 'test', retest: false })} />;
      break;
    case 'test':
      screen = (
        <Test
          retest={view.retest}
          prevMax={state.maxHold}
          level={state.level}
          flicks={state.flicks}
          sessionNo={state.total}
          haptics={state.haptics}
          t={t}
          lang={lang}
          onCancel={() => setView(state.tested ? { name: 'home' } : { name: 'welcome' })}
          onApply={onApplyTest}
        />
      );
      break;
    case 'session':
      screen = (
        <Session
          level={state.level}
          maxHold={state.maxHold || 5}
          flicks={state.flicks || 10}
          sessionNo={state.total}
          haptics={state.haptics}
          t={t}
          onDone={finish}
          onStop={goHome}
        />
      );
      break;
    case 'done':
      screen = (
        <Done streak={state.streak} total={state.total} level={state.level} t={t} onFeedback={onFeedback} />
      );
      break;
    case 'unlock': {
      const ex = pendingUnlock(state);
      screen = ex ? (
        <Unlock
          ex={ex}
          p={params(state.level, state.maxHold || 5, state.flicks || 10)}
          t={t}
          onOk={onUnlockSeen}
        />
      ) : null;
      break;
    }
    case 'settings':
      screen = (
        <Settings
          state={state}
          t={t}
          onChange={patch}
          onBack={goHome}
          onExport={doExport}
          onImport={doImport}
          onReset={() => {
            const fresh = defaults();
            setState(fresh);
            save(fresh);
            setView({ name: 'welcome' });
          }}
        />
      );
      break;
    default:
      screen = (
        <Home
          state={state}
          t={t}
          lang={lang}
          onStart={() => setView({ name: 'session' })}
          onSettings={() => setView({ name: 'settings' })}
          onRetest={() => setView({ name: 'test', retest: true })}
          onFullTest={() => setView({ name: 'test', retest: false })}
          onRetestLater={() => patch({ lastRetest: state.total })}
        />
      );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      {screen}
    </SafeAreaProvider>
  );
}
