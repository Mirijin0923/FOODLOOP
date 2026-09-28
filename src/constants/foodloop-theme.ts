// FoodLoop design tokens, converted from the Stitch DESIGN.md export.
// This is separate from your existing src/constants/theme.ts (which your
// starter template's ThemedView/ThemedText components depend on) so nothing
// else in the app breaks. Import from here for anything FoodLoop-branded.

export const colors = {
  surface: '#121414',
  surfaceDim: '#121414',
  surfaceBright: '#383939',
  surfaceContainerLowest: '#0d0e0f',
  surfaceContainerLow: '#1a1c1c',
  surfaceContainer: '#1e2020',
  surfaceContainerHigh: '#292a2a',
  surfaceContainerHighest: '#343535',
  onSurface: '#e3e2e2',
  onSurfaceVariant: '#e8bcbb',

  primary: '#ffb3b2',
  primaryContainer: '#ff525d',
  onPrimary: '#680013',
  onPrimaryContainer: '#5b000f',

  secondary: '#c8c6c5',
  onSecondary: '#303030',
  secondaryContainer: '#474746',

  tertiary: '#69d8cf',
  onTertiary: '#003734',
  tertiaryContainer: '#25a199',

  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',

  outline: '#ae8786',
  outlineVariant: '#5e3f3e',

  background: '#121414',
  onBackground: '#e3e2e2',
  white: '#ffffff',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  screenGutter: 16,
  cardGap: 12,
  navHeight: 68,
};

export const radius = {
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 999,
};

// Load Manrope via @expo-google-fonts/manrope + useFonts in your root layout
// before using these. Falls back to system font if not loaded.
export const typography = {
  displayLg: { fontFamily: 'Manrope_800ExtraBold', fontSize: 36, lineHeight: 44, letterSpacing: -1.1 },
  displayLgMobile: { fontFamily: 'Manrope_800ExtraBold', fontSize: 28, lineHeight: 34, letterSpacing: -0.7 },
  headlineLg: { fontFamily: 'Manrope_700Bold', fontSize: 24, lineHeight: 32, letterSpacing: -0.5 },
  headlineMd: { fontFamily: 'Manrope_700Bold', fontSize: 20, lineHeight: 28, letterSpacing: -0.3 },
  headlineSm: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, lineHeight: 24, letterSpacing: -0.16 },
  bodyLg: { fontFamily: 'Manrope_400Regular', fontSize: 16, lineHeight: 24, letterSpacing: -0.08 },
  bodyMd: { fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  bodySm: { fontFamily: 'Manrope_400Regular', fontSize: 12, lineHeight: 16, letterSpacing: 0.06 },
  labelLg: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, lineHeight: 20, letterSpacing: 0.14 },
  labelMd: { fontFamily: 'Manrope_700Bold', fontSize: 12, lineHeight: 16, letterSpacing: 0.24 },
  labelSm: { fontFamily: 'Manrope_800ExtraBold', fontSize: 10, lineHeight: 12, letterSpacing: 0.6 },
};
