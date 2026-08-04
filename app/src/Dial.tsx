import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from './theme';
import { font } from './ui';

const R = 124;
const CIRC = 2 * Math.PI * R;

/**
 * Der Trainingskreis: ein Ring, der die laufende Phase herunterzählt, und eine
 * Fläche, die beim Anspannen wächst. Beim Pulsieren schwingt ein Halo darum.
 */
export function Dial({
  progress,
  scale,
  working,
  pulsing,
  transitionMs,
  center,
}: {
  /** 0 … 1 innerhalb der aktuellen Phase */
  progress: number;
  /** Zielgröße der Fläche, 0.58 = locker, 1 = voll angespannt */
  scale: number;
  working: boolean;
  pulsing?: boolean;
  /** Wie lange die Fläche für den Größenwechsel braucht */
  transitionMs: number;
  center: string;
}) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.76, 300);

  const anim = useRef(new Animated.Value(scale)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.timing(anim, {
      toValue: scale,
      duration: transitionMs,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [scale, transitionMs, anim]);

  useEffect(() => {
    if (!pulsing) {
      halo.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(halo, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulsing, halo]);

  const inner = size * 0.7;

  return (
    <View style={{ width: size, height: size, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 260 260"
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle cx={130} cy={130} r={R} fill="none" stroke={c.line} strokeWidth={2} />
        <Circle
          cx={130}
          cy={130}
          r={R}
          fill="none"
          stroke={working ? c.accent : c.muted}
          strokeWidth={2}
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * Math.min(1, Math.max(0, progress))}
        />
      </Svg>

      {pulsing ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: c.accentDim,
            opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
            transform: [
              { scale: Animated.multiply(anim, halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] })) },
            ],
          }}
        />
      ) : null}

      <Animated.View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: working ? c.accentDim : c.surface,
          borderWidth: 1,
          borderColor: working ? c.accent : c.line,
          transform: [{ scale: anim }],
        }}
      />

      <Text
        style={{
          position: 'absolute',
          fontFamily: font,
          fontSize: 54,
          fontWeight: '200',
          color: c.text,
          fontVariant: ['tabular-nums'],
          letterSpacing: -2,
        }}
      >
        {center}
      </Text>
    </View>
  );
}
