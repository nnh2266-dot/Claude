import { useColorScheme } from 'react-native';

const dark = {
  bg: '#0d0d0f',
  surface: '#16161a',
  line: '#26262c',
  text: '#ecece9',
  muted: '#8b8b95',
  accent: '#9bd7b5',
  accentDim: '#2a3b34',
  onAccent: '#0d0d0f',
  danger: '#c98b8b',
};

const light: typeof dark = {
  bg: '#faf9f7',
  surface: '#ffffff',
  line: '#e6e4df',
  text: '#17171a',
  muted: '#75757e',
  accent: '#3f8e68',
  accentDim: '#dcefe4',
  onAccent: '#ffffff',
  danger: '#a85555',
};

export type Colors = typeof dark;

export const radius = 14;

export function useColors(): Colors {
  return useColorScheme() === 'light' ? light : dark;
}
