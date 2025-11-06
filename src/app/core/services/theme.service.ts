import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import lightTokens from '../../../theme/light.tokens.json';
import darkTokens from '../../../theme/dark.tokens.json';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeTokens {
  colors: { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeMode>('system');
  public currentTheme$: Observable<ThemeMode> = this.currentThemeSubject.asObservable();
  
  private resolvedThemeSubject = new BehaviorSubject<'light' | 'dark'>('light');
  public resolvedTheme$: Observable<'light' | 'dark'> = this.resolvedThemeSubject.asObservable();
  
  private mediaQuery?: MediaQueryList;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.onSystemThemeChange.bind(this));
    }
  }

  /**
   * Set the theme mode (light, dark, or system)
   */
  setTheme(mode: ThemeMode): void {
    this.currentThemeSubject.next(mode);
    this.applyTheme(mode);
  }

  /**
   * Get the current theme mode
   */
  getCurrentTheme(): ThemeMode {
    return this.currentThemeSubject.value;
  }

  /**
   * Get the resolved theme (always 'light' or 'dark', never 'system')
   */
  getResolvedTheme(): 'light' | 'dark' {
    return this.resolvedThemeSubject.value;
  }

  /**
   * Apply theme tokens to the document root
   */
  private applyTheme(mode: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }

    const resolved = this.resolveTheme(mode);
    this.resolvedThemeSubject.next(resolved);
    
    const tokens = resolved === 'dark' ? darkTokens as ThemeTokens : lightTokens as ThemeTokens;
    const root = document.documentElement;

    // Apply all color tokens as CSS variables
    Object.entries(tokens.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${this.camelToKebab(key)}`, value);
    });

    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', resolved);
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
   * Initialize theme on app startup
   */
  initialize(initialTheme?: ThemeMode): void {
    const theme = initialTheme || 'system';
    this.setTheme(theme);
  }
}
