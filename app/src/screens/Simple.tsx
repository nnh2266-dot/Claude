import React from 'react';
import { View } from 'react-native';
import { Btn, Card, Eyebrow, GhostBtn, H1, Hint, P, Screen, Spacer, Stack, styles } from '../ui';
import type { Exercise } from '../training';
import type { T } from '../i18n';
import { shortArg } from './Home';
import type { Params } from '../training';

/* ---------- Willkommen ---------- */

export function Welcome({ t, onStart }: { t: T; onStart: () => void }) {
  return (
    <Screen>
      <Spacer />
      <Stack gap={26}>
        <View style={{ gap: 10 }}>
          <H1 style={{ fontSize: 30, fontWeight: '300' }}>{t('welcomeTitle')}</H1>
          <P>{t('welcomeBody')}</P>
        </View>
        <Card>
          <Eyebrow>{t('welcomePrivacy')}</Eyebrow>
          <P style={{ marginTop: 4 }}>{t('welcomePrivacyBody')}</P>
        </Card>
        <Hint>{t('disclaimer')}</Hint>
      </Stack>
      <Spacer />
      <Btn title={t('welcomeStart')} onPress={onStart} />
    </Screen>
  );
}

/* ---------- Abschluss einer Einheit ---------- */

export function Done({
  streak, total, level, t, onFeedback,
}: {
  streak: number;
  total: number;
  level: number;
  t: T;
  onFeedback: (kind: 'easy' | 'ok' | 'hard') => void;
}) {
  return (
    <Screen>
      <Spacer />
      <View style={[styles.center, { gap: 10 }]}>
        <Eyebrow>{t('finishedEyebrow')}</Eyebrow>
        <H1 style={{ fontSize: 30, fontWeight: '300', textAlign: 'center' }}>{t('finishedTitle')}</H1>
        <P center>
          {streak > 1
            ? t('finishedStreak', { n: streak, lvl: level })
            : t('finishedCount', { n: total, lvl: level })}
        </P>
      </View>
      <Spacer />
      <Stack>
        <P center style={{ fontSize: 14 }}>{t('howDidItFeel')}</P>
        <GhostBtn title={t('tooEasy')} onPress={() => onFeedback('easy')} />
        <GhostBtn title={t('justRight')} onPress={() => onFeedback('ok')} />
        <GhostBtn title={t('tooHard')} onPress={() => onFeedback('hard')} />
      </Stack>
    </Screen>
  );
}

/* ---------- Neue Übung freigeschaltet ---------- */

export function Unlock({
  ex, p, t, onOk,
}: {
  ex: Exercise;
  p: Params;
  t: T;
  onOk: () => void;
}) {
  const name = t(`ex.${ex.key}` as never);
  return (
    <Screen>
      <Spacer />
      <View style={[styles.center, { gap: 10 }]}>
        <Eyebrow>{t('unlockEyebrow')}</Eyebrow>
        <H1 style={{ fontSize: 30, fontWeight: '300', textAlign: 'center' }}>{name}</H1>
        <P center>{t(`ex.${ex.key}.how` as never, { s: shortArg(ex.key, p) })}</P>
      </View>
      <Spacer max={28} />
      <Card>
        <Hint>{t('unlockNote', { x: name })}</Hint>
      </Card>
      <Spacer />
      <Btn title={t('continue')} onPress={onOk} />
    </Screen>
  );
}
