export interface AccentColors {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
}

export interface ThemeVariant {
  id: string;
  name: string;
  description: string;
  accentColors: AccentColors;
  previewImageUrl?: string;
}

export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  variants: ThemeVariant[];
  isDefault: boolean;
}

export interface UserThemePreferences {
  lightThemeVariantId: string;
  darkThemeVariantId: string;
  themeMode: ThemeMode;
  syncWithSystem: boolean;
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

export interface ThemeState {
  availableThemes: Theme[];
  userPreferences: UserThemePreferences;
  currentTheme: ThemeVariant;
  systemPrefersDark: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ThemeApiResponse {
  themes: Theme[];
}

export interface UserThemePreferencesDto {
  lightThemeVariantId: string;
  darkThemeVariantId: string;
  themeMode: string;
  syncWithSystem: boolean;
}