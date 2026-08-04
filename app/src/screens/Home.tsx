import React from 'react';
import { View } from 'react-native';
import {
  Btn, Card, Dots, Eyebrow, GhostBtn, H1, H2, Hint, P, PlanList, Row, Screen, Spacer, Stack, Stat,
  TextBtn, styles,
} from '../ui';
import { useColors } from '../theme';
import { ALL_EX, RETEST_EVERY, buildTimeline, unlocked } from '../training';
import { dayOffset, retestDue, type State } from '../storage';
import { fmt, type Lang, type T } from '../i18n';

export function Home({
  state, t, lang, onStart, onSettings, onRetest, onFullTest, onRetestLater,
}: {
  state: State;
  t: T;
  lang: Lang;
  onStart: () => void;
  onSettings: () => void;
  onRetest: () => void;
  onFullTest: () => void;
  onRetestLater: () => void;
}) {
  const c = useColors();
  const week = Array.from({ length: 7 }, (_, i) => state.days.includes(dayOffset(6 - i)));
  const doneToday = week[6];
  const count = week.filter(Boolean).length;

  const session = buildTimeline(state.level, state.maxHold || 5, state.flicks || 10, state.total);
  const rows: [string, string][] = [
    [t('ex.quick'), `${session.p.flickReps} × ${t('ex.quick.short')}`],
    ...session.plan.map(({ ex, n }): [string, string] => [
      t(`ex.${ex.key}` as never),
      `${n} × ${t(`ex.${ex.key}.short` as never, { s: shortArg(ex.key, session.p) })}`,
    ]),
  ];

  const frei = unlocked(state.level).length;
  const nextEx = ALL_EX.find((e) => e.from > state.level);
  const need = Math.max(1, Math.ceil(4 - state.points));
  const due = retestDue(state, RETEST_EVERY);

  return (
    <Screen scroll>
      <View style={styles.head}>
        <H1>{t('appName')}</H1>
        <Eyebrow>{t('level', { n: state.level })}</Eyebrow>
      </View>
      <Spacer max={24} />

      <Stack>
        <Row>
          <Stat value={String(state.streak)} label={t('streak')} />
          <Stat value={String(state.total)} label={t('totalSessions')} />
        </Row>

        <Card>
          <Dots on={week} />
          <P style={{ fontSize: 13, marginTop: 4 }}>
            {doneToday ? t('weekDone', { n: count }) : t('weekOpen', { n: count })}
          </P>
        </Card>

        <Card>
          <H2>{t('todaySession')}</H2>
          <PlanList rows={rows} />
          <P style={{ fontSize: 12, marginTop: 4 }}>
            {t('unlockedCount', { a: frei, b: ALL_EX.length })}
            {nextEx ? t('nextFromLevel', { n: nextEx.from }) : t('allUnlocked')}
          </P>
        </Card>

        {due ? (
          <Card>
            <H2>{t('retestTitle')}</H2>
            <P>{t('retestText', { n: state.total, s: fmt(state.maxHold, lang) })}</P>
            <View style={{ marginTop: 8 }}>
              <Row>
                <GhostBtn title={t('retestLater')} onPress={onRetestLater} />
                <GhostBtn title={t('retestNow')} onPress={onRetest} accent />
              </Row>
            </View>
          </Card>
        ) : null}

        <Hint>
          {t('progressHint', {
            n: need === 1 ? t('oneSession') : t('nSessions', { n: need }),
            lvl: state.level + 1,
          })}
        </Hint>
      </Stack>

      <Spacer max={28} />
      <Stack gap={4}>
        <Btn title={doneToday ? t('trainAgain') : t('startTraining')} onPress={onStart} />
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <TextBtn title={t('settings')} onPress={onSettings} />
          </View>
          <View style={{ flex: 1 }}>
            <TextBtn title={t('redoTest')} onPress={onFullTest} />
          </View>
        </View>
      </Stack>
      <View style={{ height: 8, backgroundColor: c.bg }} />
    </Screen>
  );
}

/** Welche Zahl in der Kurzform der Übung steht. */
export function shortArg(key: string, p: ReturnType<typeof buildTimeline>['p']): number {
  switch (key) {
    case 'hold': return p.hold;
    case 'longHold': return p.longHold;
    case 'slowRelease': return p.slowRelease;
    case 'pulse': return p.pulse;
    default: return 0;
  }
}
