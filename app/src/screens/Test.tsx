import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Dial } from '../Dial';
import {
  Btn, Card, Eyebrow, H1, H2, Hint, P, PlanList, Screen, Spacer, Stack, Stat, Strong, TextBtn, font,
} from '../ui';
import { useColors, radius } from '../theme';
import { buildTimeline, levelFromHold } from '../training';
import { tapRelease, tapTense } from '../native';
import { fmt, type Lang, type T } from '../i18n';
import { shortArg } from './Home';

type Step = 'intro' | 'hold' | 'quick' | 'result';

export function Test({
  retest, prevMax, level, flicks, sessionNo, haptics, t, lang, onCancel, onApply,
}: {
  /** Nachtest misst nur das Maximum und überspringt Einweisung und Schnellkraft. */
  retest: boolean;
  prevMax: number;
  level: number;
  flicks: number;
  sessionNo: number;
  haptics: boolean;
  t: T;
  lang: Lang;
  onCancel: () => void;
  onApply: (maxHold: number, flicks: number | null) => void;
}) {
  const c = useColors();
  const [step, setStep] = useState<Step>(retest ? 'hold' : 'intro');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [holding, setHolding] = useState(false);
  const [shown, setShown] = useState('0,0');
  const [cooldown, setCooldown] = useState(0);
  const [quick, setQuick] = useState(0);
  const [quickProgress, setQuickProgress] = useState(0);
  const started = useRef(0);

  /* ---- Maximaltest ---- */
  useEffect(() => {
    if (!holding) return;
    let raf: number;
    const loop = () => {
      const el = (Date.now() - started.current) / 1000;
      setShown(fmt(el, lang));
      if (el >= 90) { stopHold(); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [holding, lang]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  function startHold() {
    started.current = Date.now();
    setHolding(true);
    tapTense(haptics);
  }

  function stopHold() {
    const el = Math.min(90, (Date.now() - started.current) / 1000);
    const value = Math.round(el * 10) / 10;
    const next = [...attempts, value];
    setAttempts(next);
    setHolding(false);
    tapRelease(haptics);
    if (next.length < 3) setCooldown(20);
    setShown(fmt(value, lang));
  }

  /* ---- Schnellkrafttest ---- */
  useEffect(() => {
    if (step !== 'quick' || quick === 0) return;
    const begin = Date.now();
    let raf: number;
    const loop = () => {
      const el = (Date.now() - begin) / 1000;
      setQuickProgress(Math.min(1, el / 10));
      if (el >= 10) { setStep('result'); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // absichtlich nur beim ersten Tipp starten
  }, [step, quick > 0]);

  const maxHold = attempts.length ? Math.max(...attempts) : 0;

  /* ---- Einweisung ---- */
  if (step === 'intro') {
    return (
      <Screen scroll>
        <Eyebrow>{t('testEyebrow')}</Eyebrow>
        <Spacer max={20} />
        <Stack gap={26}>
          <View style={{ gap: 8 }}>
            <H2>{t('techniqueTitle')}</H2>
            <P>{t('techniqueLead')}</P>
          </View>
          <Card>
            <Hint>
              <Strong>{t('techniqueLoose')}</Strong> {t('techniqueLooseText')}
              {'\n\n'}
              <Strong>{t('techniqueBreathe')}</Strong> {t('techniqueBreatheText')}
              {'\n\n'}
              <Strong>{t('techniqueNotToilet')}</Strong> {t('techniqueNotToiletText')}
            </Hint>
          </Card>
          <P>{t('testPlan')}</P>
        </Stack>
        <Spacer max={28} />
        <Stack gap={4}>
          <Btn title={t('beginTest')} onPress={() => setStep('hold')} />
          <TextBtn title={t('cancel')} onPress={onCancel} />
        </Stack>
      </Screen>
    );
  }

  /* ---- Teil 1 ---- */
  if (step === 'hold') {
    const full = attempts.length >= 3;
    const msg = holding ? t('holdNow')
      : cooldown > 0 ? t('holdPause')
      : full ? t('holdDone')
      : attempts.length ? t('holdAgain')
      : t('holdReady');
    return (
      <Screen>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Eyebrow>{t('part1')}</Eyebrow>
          <Eyebrow>{t('attemptOf', { n: Math.min(3, attempts.length + 1) })}</Eyebrow>
        </View>
        <Spacer max={16} />
        <Dial
          progress={0}
          scale={holding ? 1 : 0.58}
          working={holding}
          transitionMs={600}
          center={full ? '✓' : cooldown > 0 ? String(cooldown) : shown}
        />
        <Spacer max={20} />
        <P center>{msg}</P>
        <Spacer />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                flex: 1, alignItems: 'center', paddingVertical: 12,
                borderWidth: 1, borderRadius: 10,
                borderColor: attempts[i] != null ? c.accent : c.line,
              }}
            >
              <Text
                style={{
                  fontFamily: font, fontSize: 17, fontVariant: ['tabular-nums'],
                  color: attempts[i] != null ? c.text : c.muted,
                }}
              >
                {attempts[i] != null ? `${fmt(attempts[i], lang)} s` : '–'}
              </Text>
            </View>
          ))}
        </View>
        <Btn
          title={full ? (retest ? t('seeResult') : t('toPart2')) : holding ? t('released') : t('tenseNow')}
          disabled={cooldown > 0}
          onPress={() => {
            if (full) { setStep(retest ? 'result' : 'quick'); return; }
            holding ? stopHold() : startHold();
          }}
        />
        <Spacer max={8} />
        <TextBtn title={t('cancel')} onPress={onCancel} />
      </Screen>
    );
  }

  /* ---- Teil 2 ---- */
  if (step === 'quick') {
    return (
      <Screen>
        <Eyebrow>{t('part2')}</Eyebrow>
        <Spacer max={16} />
        <Dial progress={quickProgress} scale={0.58} working={false} transitionMs={200} center={String(quick)} />
        <Spacer max={20} />
        <P center>{t('quickMsg')}</P>
        <Spacer />
        <Pressable
          onPress={() => { setQuick((v) => v + 1); tapTense(haptics); }}
          style={({ pressed }) => ({
            paddingVertical: 44, borderRadius: radius, borderWidth: 1,
            borderColor: pressed ? c.accent : c.line, backgroundColor: c.surface,
          })}
        >
          <Text style={{ fontFamily: font, fontSize: 17, color: c.text, textAlign: 'center' }}>
            {quick === 0 ? t('tapToStart') : t('tapEach')}
          </Text>
        </Pressable>
      </Screen>
    );
  }

  /* ---- Ergebnis ---- */
  const newLevel = retest ? level : levelFromHold(maxHold);
  const effFlicks = retest ? flicks : Math.max(1, quick);
  const preview = buildTimeline(newLevel, maxHold || 5, effFlicks, sessionNo);
  const rows: [string, string][] = [
    [t('ex.quick'), `${preview.p.flickReps} × ${t('ex.quick.short')}`],
    ...preview.plan.map(({ ex, n }): [string, string] => [
      t(`ex.${ex.key}` as never),
      `${n} × ${t(`ex.${ex.key}.short` as never, { s: shortArg(ex.key, preview.p) })}`,
    ]),
  ];
  const diff = maxHold - prevMax;

  return (
    <Screen scroll>
      <Eyebrow>{t('yourResult')}</Eyebrow>
      <Spacer max={20} />
      <Stack>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Stat value={`${fmt(maxHold, lang)} s`} label={t('longestHold')} />
          </View>
          <View style={{ flex: 1 }}>
            <Stat
              value={retest ? `${diff >= 0 ? '+' : ''}${fmt(diff, lang)} s` : String(effFlicks)}
              label={retest ? t('change') : t('quickPer10')}
            />
          </View>
        </View>

        <Card>
          <H2>
            {retest
              ? t('yourMaxChanged', { a: fmt(prevMax, lang), b: fmt(maxHold, lang) })
              : t('startLevel', { n: newLevel })}
          </H2>
          <P>
            {retest
              ? diff > 0.5 ? t('retestUp') : diff < -0.5 ? t('retestDown') : t('retestSame')
              : newLevel <= 2 ? t('resultLow') : newLevel <= 4 ? t('resultMid') : t('resultHigh')}
          </P>
        </Card>

        <Card>
          <H2>{t('firstSession')}</H2>
          <PlanList rows={rows} />
        </Card>
      </Stack>

      <Spacer max={28} />
      <Stack gap={4}>
        <Btn title={t('apply')} onPress={() => onApply(maxHold, retest ? null : effFlicks)} />
        <TextBtn
          title={t('testAgain')}
          onPress={() => {
            setAttempts([]); setQuick(0); setQuickProgress(0); setShown('0,0');
            setStep(retest ? 'hold' : 'intro');
          }}
        />
      </Stack>
    </Screen>
  );
}
