import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useKeepAwake } from '../useKeepAwake';
import { Dial } from '../Dial';
import { Eyebrow, GhostBtn, Row, Screen, Spacer, font } from '../ui';
import { useColors } from '../theme';
import { WORK, buildTimeline, type Phase, type Session as Built } from '../training';
import { tapRelease, tapTense } from '../native';
import type { T } from '../i18n';
import { shortArg } from './Home';

/** Was nach dieser Pause kommt — die nächste Übung oder der nächste Satz. */
function nextUp(s: Built, i: number, t: T): string {
  const cur = s.phases[i];
  for (let j = i + 1; j < s.phases.length; j++) {
    const ph = s.phases[j];
    if (ph.kind === 'intro') return t('nextUpX', { x: t(`ex.${ph.label}` as never) });
    if (ph.kind === 'relax') return t('nextUpX', { x: t('closing') });
    if (WORK.has(ph.kind)) {
      const ex = s.list.find((e) => e.id === ph.exercise);
      return ph.of > 1 && ph.set !== cur.set
        ? t('nextSet', { n: ph.set, of: ph.of })
        : t('nextUpX', { x: ex ? t(`ex.${ex.key}` as never) : '' });
    }
  }
  return '';
}

export function Session({
  level, maxHold, flicks, sessionNo, haptics, t, onDone, onStop,
}: {
  level: number;
  maxHold: number;
  flicks: number;
  sessionNo: number;
  haptics: boolean;
  t: T;
  onDone: () => void;
  onStop: () => void;
}) {
  const c = useColors();
  useKeepAwake();

  const built = useRef<Built>(buildTimeline(level, maxHold, flicks, sessionNo)).current;
  const t0 = useRef(0);
  const pausedAt = useRef(0);
  const pausedTotal = useRef(0);
  const lastCue = useRef(-1);

  const [paused, setPaused] = useState(false);
  const [idx, setIdx] = useState(0);
  const [inPhase, setInPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    t0.current = Date.now();
    let raf: number;
    let last = 0;
    const loop = () => {
      const now = pausedAt.current || Date.now();
      const e = (now - t0.current - pausedTotal.current) / 1000;
      if (e >= built.total) {
        setElapsed(built.total);
        onDone();
        return;
      }
      // Etwa 15 Bilder je Sekunde reichen für Ring und Zähler
      if (Date.now() - last > 66) {
        last = Date.now();
        let i = 0;
        while (i < built.phases.length - 1 && e >= built.phases[i].start + built.phases[i].dur) i++;
        setIdx(i);
        setInPhase(Math.max(0, e - built.phases[i].start));
        setElapsed(e);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [built, onDone]);

  const ph: Phase = built.phases[idx];
  const working = WORK.has(ph.kind);

  // Haptisches Signal genau einmal je Phasenwechsel
  useEffect(() => {
    if (lastCue.current === idx) return;
    lastCue.current = idx;
    if (working) tapTense(haptics);
    else if (ph.kind === 'release') tapRelease(haptics);
  }, [idx, working, ph.kind, haptics]);

  const togglePause = () => {
    if (pausedAt.current) {
      pausedTotal.current += Date.now() - pausedAt.current;
      pausedAt.current = 0;
      setPaused(false);
    } else {
      pausedAt.current = Date.now();
      setPaused(true);
    }
  };

  const left = Math.max(0, ph.dur - inPhase);
  const totalLeft = Math.max(0, built.total - elapsed);
  const mm = Math.floor(totalLeft / 60);
  const ss = String(Math.floor(totalLeft % 60)).padStart(2, '0');

  const ex = built.list.find((e) => e.id === ph.exercise);
  const exName = ex ? t(`ex.${ex.key}` as never) : t('closing');
  const label = ph.kind === 'intro' ? exName : t(`ph.${ph.label}` as never);

  const note =
    ph.kind === 'intro'
      ? `${t(`ex.${ph.label}.how` as never, { s: shortArg(ph.label, built.p) })}\n${
          ph.note?.reps === 1 ? t('oneRep') : t('reps', { n: ph.note?.reps ?? 0 })
        }`
      : ph.kind === 'pause'
        ? nextUp(built, idx, t)
        : '';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Eyebrow>{ph.kind === 'intro' ? t('nextUp') : exName}</Eyebrow>
        <Text style={{ fontFamily: font, fontSize: 12, color: c.muted, fontVariant: ['tabular-nums'], letterSpacing: 1 }}>
          {mm}:{ss}
        </Text>
      </View>

      <Spacer max={10} />
      <View style={{ height: 3, backgroundColor: c.line, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ height: 3, width: `${(elapsed / built.total) * 100}%`, backgroundColor: c.muted }} />
      </View>
      <Spacer max={24} />

      <Dial
        progress={inPhase / ph.dur}
        scale={ph.scale}
        working={working}
        pulsing={ph.kind === 'pulse'}
        transitionMs={(ph.kind === 'slow' ? ph.dur : Math.min(ph.dur * 0.45, 1.1)) * 1000}
        center={String(Math.max(0, Math.ceil(left - 0.001)))}
      />

      <Spacer max={26} />
      <Text
        style={{
          fontFamily: font,
          textAlign: 'center',
          fontSize: ph.kind === 'intro' ? 24 : 19,
          fontWeight: ph.kind === 'intro' ? '400' : '500',
          color: working ? c.accent : c.text,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: font,
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 22,
          color: c.muted,
          marginTop: 6,
          minHeight: 44,
        }}
      >
        {note}
      </Text>

      <Spacer max={10} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: font, fontSize: 13, color: c.muted, fontVariant: ['tabular-nums'] }}>
          {ph.of > 1 ? t('setOf', { n: ph.set, of: ph.of }) : ''}
        </Text>
        <Text style={{ fontFamily: font, fontSize: 13, color: c.muted, fontVariant: ['tabular-nums'] }}>
          {ph.rep ? t('repOf', { n: ph.rep, of: ph.reps }) : ''}
        </Text>
      </View>

      <Spacer />
      <Row>
        <GhostBtn title={paused ? t('resume') : t('pause')} onPress={togglePause} />
        <GhostBtn title={t('stop')} onPress={onStop} />
      </Row>
    </Screen>
  );
}
