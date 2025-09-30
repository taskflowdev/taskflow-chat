/**
 * Default theme constants for unauthenticated users
 * These themes are applied before login when no API call is available
 */

export interface ThemeToken {
  key: string;
  value: string;
}

export interface DefaultTheme {
  base: { [key: string]: string };
  accent: { [key: string]: string };
}

/**
 * Default Light Theme - Applied to unauthenticated users
 */
export const DEFAULT_LIGHT_THEME: DefaultTheme = {
  base: {
    BackgroundColor: '#ffffff',
    SecondaryBackgroundColor: '#f6f8fa',
    TextColor: '#24292f',
    SecondaryTextColor: '#6c757d',
    BorderColor: '#d0d7de',
    HoverBackgroundColor: '#f3f4f6'
  },
  accent: {
    ButtonPrimary: '#0969da',
    ButtonPrimaryText: '#ffffff',
    ButtonPrimaryHover: '#0860ca',
    ToastSuccess: '#1a7f37',
    ToastWarning: '#bf8700',
    ToastError: '#cf222e',
    ToastInfo: '#0969da',
    IconPrimary: '#0969da',
    IconSecondary: '#6c757d',
    LinkColor: '#0969da',
    LinkHoverColor: '#0860ca'
  }
};

/**
 * Default Dark Theme - Applied to unauthenticated users with dark mode preference
 */
export const DEFAULT_DARK_THEME: DefaultTheme = {
  base: {
    BackgroundColor: '#0d1117',
    SecondaryBackgroundColor: '#161b22',
    TextColor: '#c9d1d9',
    SecondaryTextColor: '#8b949e',
    BorderColor: '#30363d',
    HoverBackgroundColor: '#161b22'
  },
  accent: {
    ButtonPrimary: '#238636',
    ButtonPrimaryText: '#ffffff',
    ButtonPrimaryHover: '#2ea043',
    ToastSuccess: '#3fb950',
    ToastWarning: '#d29922',
    ToastError: '#f85149',
    ToastInfo: '#58a6ff',
    IconPrimary: '#58a6ff',
    IconSecondary: '#8b949e',
    LinkColor: '#58a6ff',
    LinkHoverColor: '#79c0ff'
  }
};

/**
 * Convert theme object to array of tokens
 */
export function themeToTokens(theme: DefaultTheme): ThemeToken[] {
  const tokens: ThemeToken[] = [];
  
  // Add base tokens
  Object.entries(theme.base).forEach(([key, value]) => {
    tokens.push({ key, value });
  });
  
  // Add accent tokens
  Object.entries(theme.accent).forEach(([key, value]) => {
    tokens.push({ key, value });
  });
  
  return tokens;
}

/**
 * Get default theme based on system preference
 */
export function getDefaultTheme(prefersDark: boolean = false): DefaultTheme {
  return prefersDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
}
