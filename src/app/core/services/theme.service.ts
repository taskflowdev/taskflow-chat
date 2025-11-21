import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import lightTheme from '../../../theme/theme.light.json';
import darkTheme from '../../../theme/theme.dark.json';
import { camelToKebab } from '../utils/settings.utils';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';

interface TypographyTokens {
  fontSizeBase: string;
  fontSizeH1: string;
  fontSizeH2: string;
  fontSizeH3: string;
  fontSizeH4: string;
  fontSizeH5: string;
  fontSizeH6: string;
  fontSizeLarge: string;
  fontSizeNormal: string;
  fontSizeSmall: string;
  fontSizeXSmall: string;
  lineHeightBase: string;
  lineHeightHeading: string;
  lineHeightCompact: string;
}

interface ThemeTokens {
  colors: { [key: string]: string };
  typography: {
    small: TypographyTokens;
    medium: TypographyTokens;
    large: TypographyTokens;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeMode>('system');
  public currentTheme$: Observable<ThemeMode> = this.currentThemeSubject.asObservable();

  private resolvedThemeSubject = new BehaviorSubject<'light' | 'dark'>('light');
  public resolvedTheme$: Observable<'light' | 'dark'> = this.resolvedThemeSubject.asObservable();

  private currentFontSizeSubject = new BehaviorSubject<FontSize>('medium');
  public currentFontSize$: Observable<FontSize> = this.currentFontSizeSubject.asObservable();

  private mediaQuery?: MediaQueryList;
  private isBrowser: boolean;
  private styleElement?: HTMLStyleElement;

  // Track if theme has been explicitly initialized (prevents premature application)
  private isInitialized = false;

  // Store bound event handler reference for proper cleanup
  private systemThemeChangeHandler?: (e: MediaQueryListEvent) => void;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Create and store bound handler for proper cleanup
      this.systemThemeChangeHandler = this.onSystemThemeChange.bind(this);
      this.mediaQuery.addEventListener('change', this.systemThemeChangeHandler);

      // Create style element for theme variables
      this.createStyleElement();
    }
  }

  /**
   * Create a dedicated style element for theme variables
   * This prevents inline styles in HTML element
   */
  private createStyleElement(): void {
    if (!this.isBrowser) {
      return;
    }

    // Check if style element already exists
    let styleEl = document.getElementById('taskflow-theme-variables') as HTMLStyleElement;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'taskflow-theme-variables';
      styleEl.type = 'text/css';
      document.head.appendChild(styleEl);
    }

    this.styleElement = styleEl;
  }

  /**
   * Set the theme mode (light, dark, or system)
   * Applies immediately without flicker
   */
  setTheme(mode: ThemeMode): void {
    this.currentThemeSubject.next(mode);

    // Only apply if initialized (prevents applying before settings load)
    if (this.isInitialized) {
      this.applyTheme(mode);
    }
  }

  /**
   * Set the font size (small, medium, or large)
   * Applies immediately without re-render
   */
  setFontSize(size: FontSize): void {
    this.currentFontSizeSubject.next(size);

    // Only apply if initialized (prevents applying before settings load)
    if (this.isInitialized) {
      this.applyTypography(size);
    }
  }

  /**
   * Get the current theme mode
   */
  getCurrentTheme(): ThemeMode {
    return this.currentThemeSubject.value;
  }

  /**
   * Get the current font size
   */
  getCurrentFontSize(): FontSize {
    return this.currentFontSizeSubject.value;
  }

  /**
   * Get the resolved theme (always 'light' or 'dark', never 'system')
   */
  getResolvedTheme(): 'light' | 'dark' {
    return this.resolvedThemeSubject.value;
  }

  /**
   * Apply theme tokens to the document root via dedicated stylesheet
   * Optimized for zero flicker with taskflow- prefix to avoid conflicts
   */
  private applyTheme(mode: ThemeMode): void {
    if (!this.isBrowser || !this.styleElement) {
      return;
    }

    const resolved = this.resolveTheme(mode);
    this.resolvedThemeSubject.next(resolved);

    // Apply all tokens (colors + typography) together
    this.applyAllTokens(resolved, this.currentFontSizeSubject.value);

    // Set data attribute for CSS selectors
    requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-theme', resolved);
    });
  }

  /**
   * Apply typography tokens based on font size preference via dedicated stylesheet
   * Optimized for zero flicker with taskflow- prefix
   */
  private applyTypography(size: FontSize): void {
    if (!this.isBrowser || !this.styleElement) return;

    const resolved = this.getResolvedTheme();

    // Apply all tokens (colors + typography) together
    this.applyAllTokens(resolved, size);

    // Set data attribute for CSS selectors
    requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-font-size', size);
    });
  }

  /**
   * Apply all theme tokens (colors + typography) in a single update
   * This prevents tokens from being overwritten when switching themes or font sizes
   */
  private applyAllTokens(theme: 'light' | 'dark', fontSize: FontSize): void {
    if (!this.isBrowser || !this.styleElement) return;

    const tokens = theme === 'dark' ? darkTheme as ThemeTokens : lightTheme as ThemeTokens;
    const typography = tokens.typography[fontSize];

    // Defensive check: ensure typography exists for the given fontSize
    if (!typography) {
      console.warn(`Typography tokens not found for fontSize: ${fontSize}`);
      return;
    }

    // Build CSS string for all variables with taskflow- prefix
    const cssVariables: string[] = [];

    // Add color tokens
    Object.entries(tokens.colors).forEach(([key, value]) => {
      cssVariables.push(`  --taskflow-color-${camelToKebab(key)}: ${value};`);
    });

    // Add typography tokens
    Object.entries(typography).forEach(([key, value]) => {
      cssVariables.push(`  --taskflow-font-${camelToKebab(key)}: ${value};`);
    });

    // Only apply if we have tokens to apply
    if (cssVariables.length === 0) {
      console.warn('No CSS variables to apply');
      return;
    }

    // Apply to stylesheet via requestAnimationFrame for batching
    requestAnimationFrame(() => {
      if (this.styleElement) {
        this.styleElement.textContent = `:root {\n${cssVariables.join('\n')}\n}`;
      }
    });
  }

  /**
   * Resolve 'system' to actual theme based on OS preference
   */
  private resolveTheme(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'system') {
      if (this.isBrowser && this.mediaQuery) {
        return this.mediaQuery.matches ? 'dark' : 'light';
      }
      return 'light'; // Default fallback
    }
    return mode;
  }

  /**
   * Handle system theme changes
   * Reacts instantly to OS appearance changes
   * Only applies when user has explicitly selected 'system' theme
   */
  private onSystemThemeChange(_e: MediaQueryListEvent): void {
    if (this.currentThemeSubject.value === 'system') {
      this.applyTheme('system');
    }
  }

  /**
   * Initialize theme and typography on app startup
   * Called after user settings are loaded to apply user preferences
   * Falls back to defaults if no user preferences are available
   */
  initialize(initialTheme?: ThemeMode, initialFontSize?: FontSize): void {
    const theme = initialTheme || 'system';
    const fontSize = initialFontSize || 'medium';

    // Update subjects without applying (in case called before settings load)
    this.currentThemeSubject.next(theme);
    this.currentFontSizeSubject.next(fontSize);

    // Mark as initialized and apply tokens
    this.isInitialized = true;

    // Apply both theme and font size together
    const resolved = this.resolveTheme(theme);
    this.resolvedThemeSubject.next(resolved);
    this.applyAllTokens(resolved, fontSize);

    // Set data attributes
    if (this.isBrowser) {
      requestAnimationFrame(() => {
        document.documentElement.setAttribute('data-theme', resolved);
        document.documentElement.setAttribute('data-font-size', fontSize);
      });
    }
  }

  /**
   * Check if theme service has been initialized
   */
  isThemeInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup method (called on service destroy if needed)
   */
  ngOnDestroy(): void {
    if (this.isBrowser && this.mediaQuery && this.systemThemeChangeHandler) {
      this.mediaQuery.removeEventListener('change', this.systemThemeChangeHandler);
    }
  }
}
