import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Sicherer Rand des Geräts — Notch oben, Gestenleiste unten. */
export function useSafeArea() {
  return useSafeAreaInsets();
}
