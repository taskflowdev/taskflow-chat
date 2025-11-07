import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import lightTheme from '../../../theme/theme.light.json';
import darkTheme from '../../../theme/theme.dark.json';

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

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      // Use addEventListener for modern browsers
      this.mediaQuery.addEventListener('change', this.onSystemThemeChange.bind(this));
    }
  }

  /**
   * Set the theme mode (light, dark, or system)
   * Applies immediately without flicker
   */
  setTheme(mode: ThemeMode): void {
    this.currentThemeSubject.next(mode);
    this.applyTheme(mode);
  }

  /**
   * Set the font size (small, medium, or large)
   * Applies immediately without re-render
   */
  setFontSize(size: FontSize): void {
    this.currentFontSizeSubject.next(size);
    this.applyTypography(size);
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
   * Apply theme tokens to the document root
   * Optimized for zero flicker
   */
  private applyTheme(mode: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }

    const resolved = this.resolveTheme(mode);
    this.resolvedThemeSubject.next(resolved);
    
    const tokens = resolved === 'dark' ? darkTheme as ThemeTokens : lightTheme as ThemeTokens;
    const root = document.documentElement;

    // Apply all color tokens as CSS variables
    // Using requestAnimationFrame to batch DOM updates
    requestAnimationFrame(() => {
      Object.entries(tokens.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${this.camelToKebab(key)}`, value);
      });

      // Set data attribute for CSS selectors
      root.setAttribute('data-theme', resolved);
    });
  }

  /**
   * Apply typography tokens based on font size preference
   * Optimized for zero flicker
   */
  private applyTypography(size: FontSize): void {
    if (!this.isBrowser) {
      return;
    }

    const resolved = this.getResolvedTheme();
    const tokens = resolved === 'dark' ? darkTheme as ThemeTokens : lightTheme as ThemeTokens;
    const typography = tokens.typography[size];
    const root = document.documentElement;

    // Apply typography tokens as CSS variables
    // Using requestAnimationFrame to batch DOM updates
    requestAnimationFrame(() => {
      Object.entries(typography).forEach(([key, value]) => {
        root.style.setProperty(`--font-${this.camelToKebab(key)}`, value);
      });

      // Set data attribute for CSS selectors
      root.setAttribute('data-font-size', size);
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
   */
  private onSystemThemeChange(e: MediaQueryListEvent): void {
    if (this.currentThemeSubject.value === 'system') {
      this.applyTheme('system');
    }
  }

  /**
   * Convert camelCase to kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Initialize theme and typography on app startup
   * Called from main layout or app component
   */
  initialize(initialTheme?: ThemeMode, initialFontSize?: FontSize): void {
    const theme = initialTheme || 'system';
    const fontSize = initialFontSize || 'medium';
    
    // Apply both theme and typography in one batch
    this.setTheme(theme);
    this.setFontSize(fontSize);
  }

  /**
   * Cleanup method (called on service destroy if needed)
   */
  ngOnDestroy(): void {
    if (this.isBrowser && this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.onSystemThemeChange.bind(this));
    }
  }
}
