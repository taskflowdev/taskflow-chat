/**
 * Theme Types and Enums
 * 
 * Provides type-safe theme configuration for the application.
 * Supports enterprise-level theme management with extensibility.
 */

/**
 * Available theme options
 */
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

/**
 * System theme detection result
 */
export enum SystemTheme {
  LIGHT = 'light',
  DARK = 'dark',
  NO_PREFERENCE = 'no-preference'
}

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
  /** Current active theme */
  current: Theme;
  
  /** Whether to follow system preference */
  followSystem: boolean;
  
  /** System detected theme (if available) */
  systemTheme?: SystemTheme;
}

/**
 * Theme change event data
 */
export interface ThemeChangeEvent {
  /** Previous theme */
  from: Theme;
  
  /** New theme */
  to: Theme;
  
  /** Whether change was triggered by system preference */
  triggeredBySystem: boolean;
  
  /** Timestamp of the change */
  timestamp: number;
}

/**
 * Local storage key for theme persistence
 */
export const THEME_STORAGE_KEY = 'taskflow-theme' as const;

/**
 * Local storage key for system preference setting
 */
export const THEME_SYSTEM_PREFERENCE_KEY = 'taskflow-theme-follow-system' as const;

/**
 * Data attribute name for theme on HTML element
 */
export const THEME_DATA_ATTRIBUTE = 'data-theme' as const;

/**
 * CSS class for theme transitions
 */
export const THEME_TRANSITION_CLASS = 'theme-transitioning' as const;

/**
 * Duration of theme transition in milliseconds
 */
export const THEME_TRANSITION_DURATION = 250 as const;
