import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeArea } from './useSafeArea';
import { radius, useColors, type Colors } from './theme';

/* ---------- Grundgerüst ---------- */

export function Screen({
  children,
  scroll,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const c = useColors();
  const inset = useSafeArea();
  const pad = {
    paddingTop: Math.max(28, inset.top),
    paddingBottom: Math.max(28, inset.bottom),
    paddingHorizontal: 22,
  };
  if (scroll) {
    return (
      <ScrollView
        style={{ backgroundColor: c.bg }}
        contentContainerStyle={[{ maxWidth: 460, width: '100%', alignSelf: 'center' }, pad]}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[{ flex: 1, maxWidth: 460, width: '100%', alignSelf: 'center' }, pad]}>
        {children}
      </View>
    </View>
  );
}

export const Spacer = ({ max }: { max?: number }) => (
  <View style={{ flex: max ? 0 : 1, minHeight: max ?? 20, height: max }} />
);

export const Row = ({ children, gap = 10 }: { children: React.ReactNode; gap?: number }) => (
  <View style={{ flexDirection: 'row', gap }}>
    {React.Children.map(children, (ch) => (
      <View style={{ flex: 1 }}>{ch}</View>
    ))}
  </View>
);

export const Stack = ({ children, gap = 14 }: { children: React.ReactNode; gap?: number }) => (
  <View style={{ gap }}>{children}</View>
);

/* ---------- Typografie ---------- */

const font = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

export function H1({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return (
    <Text style={[{ fontFamily: font, fontSize: 22, fontWeight: '400', color: c.text, letterSpacing: -0.4 }, style]}>
      {children}
    </Text>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <Text style={{ fontFamily: font, fontSize: 17, fontWeight: '500', color: c.text, letterSpacing: -0.2 }}>
      {children}
    </Text>
  );
}

export function P({
  children,
  style,
  center,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  center?: boolean;
}) {
  const c = useColors();
  return (
    <Text
      style={[
        { fontFamily: font, fontSize: 15, lineHeight: 23, color: c.muted },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <Text
      style={{
        fontFamily: font,
        fontSize: 11.5,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        color: c.muted,
        fontWeight: '500',
      }}
    >
      {children}
    </Text>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <Text style={{ fontFamily: font, fontSize: 13, lineHeight: 21, color: c.muted }}>{children}</Text>
  );
}

export const Strong = ({ children }: { children: React.ReactNode }) => {
  const c = useColors();
  return <Text style={{ color: c.text, fontWeight: '500' }}>{children}</Text>;
};

/* ---------- Bedienelemente ---------- */

function press(base: ViewStyle, pressed: boolean): StyleProp<ViewStyle> {
  return [base, pressed && { opacity: 0.75 }];
}

export function Btn({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) =>
        press(
          {
            backgroundColor: c.accent,
            borderRadius: radius,
            paddingVertical: 17,
            paddingHorizontal: 20,
            opacity: disabled ? 0.45 : 1,
          },
          pressed,
        )
      }
    >
      <Text
        style={{ fontFamily: font, color: c.onAccent, fontWeight: '600', fontSize: 16, textAlign: 'center' }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function GhostBtn({
  title,
  onPress,
  accent,
  danger,
}: {
  title: string;
  onPress: () => void;
  accent?: boolean;
  danger?: boolean;
}) {
  const c = useColors();
  const tint = danger ? c.danger : accent ? c.accent : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) =>
        press(
          {
            borderWidth: 1,
            borderColor: accent ? c.accent : c.line,
            borderRadius: radius,
            paddingVertical: 15,
            paddingHorizontal: 16,
          },
          pressed,
        )
      }
    >
      <Text style={{ fontFamily: font, color: tint, fontSize: 15, textAlign: 'center' }}>{title}</Text>
    </Pressable>
  );
}

export function TextBtn({
  title,
  onPress,
  danger,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingVertical: 12 }}>
      <Text
        style={{ fontFamily: font, color: danger ? c.danger : c.muted, fontSize: 14, textAlign: 'center' }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/* ---------- Flächen ---------- */

export function Card({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderColor: c.line,
        borderWidth: 1,
        borderRadius: radius,
        padding: 18,
        gap: 8,
      }}
    >
      {children}
    </View>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderColor: c.line,
        borderWidth: 1,
        borderRadius: radius,
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <Text
        style={{
          fontFamily: font,
          fontSize: 28,
          fontWeight: '300',
          color: c.text,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      <Text style={{ fontFamily: font, fontSize: 12, color: c.muted }}>{label}</Text>
    </View>
  );
}

export function PlanList({ rows }: { rows: [string, string][] }) {
  const c = useColors();
  return (
    <View>
      {rows.map(([a, b], i) => (
        <View
          key={a + i}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 14,
            paddingVertical: 9,
            borderBottomWidth: i < rows.length - 1 ? 1 : 0,
            borderBottomColor: c.line,
          }}
        >
          <Text style={{ fontFamily: font, fontSize: 14.5, color: c.text }}>{a}</Text>
          <Text
            style={{
              fontFamily: font,
              fontSize: 14.5,
              color: c.muted,
              textAlign: 'right',
              flexShrink: 1,
              fontVariant: ['tabular-nums'],
            }}
          >
            {b}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function Dots({ on }: { on: boolean[] }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 7 }}>
      {on.map((v, i) => (
        <View
          key={i}
          style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: v ? c.accent : c.line }}
        />
      ))}
    </View>
  );
}

export function Toggle({
  label,
  sub,
  value,
  onChange,
  last,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.line,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font, fontSize: 15, color: c.text }}>{label}</Text>
        {sub ? <Text style={{ fontFamily: font, fontSize: 12, color: c.muted }}>{sub}</Text> : null}
      </View>
      <View
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          backgroundColor: value ? c.accentDim : c.line,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            marginLeft: value ? 21 : 3,
            backgroundColor: value ? c.accent : c.muted,
          }}
        />
      </View>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  center: { alignItems: 'center' },
});

export { font, type Colors };
