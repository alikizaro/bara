export const colors = {
  background: '#100924',
  backgroundElevated: '#1A1038',
  surface: '#24154B',
  surfaceSoft: '#2E1C5C',
  surfaceBright: '#3A2371',
  primary: '#7C5CFF',
  primaryLight: '#A998FF',
  secondary: '#19D3C5',
  warning: '#FFB84D',
  danger: '#FF668A',
  success: '#4DE2A8',
  text: '#FFFFFF',
  textMuted: '#C3B7DD',
  textDim: '#8F83A9',
  border: '#4B357E',
  overlay: 'rgba(9, 5, 22, 0.72)',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 42,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

export const avatarPalette = [
  '#7C5CFF',
  '#19D3C5',
  '#FF8D66',
  '#FF668A',
  '#4B8CFF',
  '#C766FF',
] as const;
