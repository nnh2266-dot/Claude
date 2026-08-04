import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import {
  Btn, Card, GhostBtn, H1, H2, Hint, P, Row, Screen, Spacer, Stack, TextBtn, Toggle, font,
} from '../ui';
import { useColors, radius } from '../theme';
import { LANGS, type Lang, type T } from '../i18n';
import type { State } from '../storage';

/** Bestätigung, die auch im Web funktioniert (dort gibt es kein Alert.alert). */
function confirm(title: string, ok: string, cancel: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(title)) onOk();
    return;
  }
  Alert.alert(title, undefined, [
    { text: cancel, style: 'cancel' },
    { text: ok, style: 'destructive', onPress: onOk },
  ]);
}

export function Settings({
  state, t, onChange, onBack, onExport, onImport, onReset,
}: {
  state: State;
  t: T;
  onChange: (patch: Partial<State>) => void;
  onBack: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}) {
  const c = useColors();
  const [busy, setBusy] = useState(false);
  const hours = [6, 7, 8, 9, 12, 18, 20, 21];

  return (
    <Screen scroll>
      <H1>{t('settings')}</H1>
      <Spacer max={24} />

      <Stack>
        <Card>
          <Toggle
            label={t('reminder')}
            sub={t('reminderSub')}
            value={state.reminder}
            onChange={(v) => onChange({ reminder: v })}
          />
          {state.reminder ? (
            <View style={{ paddingTop: 12, gap: 8 }}>
              <Text style={{ fontFamily: font, fontSize: 12, color: c.muted }}>{t('reminderTime')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {hours.map((h) => {
                  const on = state.reminderHour === h;
                  return (
                    <Pressable
                      key={h}
                      onPress={() => onChange({ reminderHour: h, reminderMinute: 0 })}
                      style={{
                        paddingVertical: 8, paddingHorizontal: 14,
                        borderRadius: 10, borderWidth: 1,
                        borderColor: on ? c.accent : c.line,
                        backgroundColor: on ? c.accentDim : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: font, fontSize: 14,
                          color: on ? c.accent : c.muted,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {String(h).padStart(2, '0')}:00
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
          <Toggle
            label={t('haptics')}
            sub={t('hapticsSub')}
            value={state.haptics}
            onChange={(v) => onChange({ haptics: v })}
            last
          />
        </Card>

        <Card>
          <H2>{t('levelTitle')}</H2>
          <P>{t('levelText', { n: state.level })}</P>
          <View style={{ marginTop: 10 }}>
            <Row>
              <GhostBtn
                title={t('levelDown')}
                onPress={() => state.level > 1 && onChange({ level: state.level - 1, points: 0 })}
              />
              <GhostBtn title={t('levelUp')} onPress={() => onChange({ level: state.level + 1, points: 0 })} />
            </Row>
          </View>
        </Card>

        <Card>
          <H2>{t('language')}</H2>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {[null, ...LANGS].map((l) => {
              const on = state.lang === l;
              return (
                <Pressable
                  key={String(l)}
                  onPress={() => onChange({ lang: l as Lang | null })}
                  style={{
                    paddingVertical: 9, paddingHorizontal: 14,
                    borderRadius: 10, borderWidth: 1,
                    borderColor: on ? c.accent : c.line,
                    backgroundColor: on ? c.accentDim : 'transparent',
                  }}
                >
                  <Text style={{ fontFamily: font, fontSize: 14, color: on ? c.accent : c.muted }}>
                    {l === null ? t('languageAuto') : l === 'de' ? 'Deutsch' : 'English'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <H2>{t('backupTitle')}</H2>
          <P>{t('backupText')}</P>
          <View style={{ marginTop: 10 }}>
            <Row>
              <GhostBtn
                title={t('exportData')}
                onPress={async () => { setBusy(true); await onExport(); setBusy(false); }}
              />
              <GhostBtn
                title={t('importData')}
                onPress={async () => { setBusy(true); await onImport(); setBusy(false); }}
              />
            </Row>
          </View>
        </Card>

        <Hint>{t('dataNote')}</Hint>
        <Hint>{t('disclaimer')}</Hint>

        <TextBtn
          title={t('resetData')}
          danger
          onPress={() => confirm(t('resetConfirm'), t('delete'), t('cancel'), onReset)}
        />
      </Stack>

      <Spacer max={24} />
      <Btn title={t('back')} onPress={onBack} disabled={busy} />
    </Screen>
  );
}
