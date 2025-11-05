/**
 * Theme Service
 * 
 * Enterprise-grade theme management service.
 * 
 * Features:
 * - System preference detection (prefers-color-scheme)
 * - localStorage persistence
 * - Smooth theme transitions with reduced-motion support
 * - Observable theme state for reactive components
 * - Automatic initialization on app startup
 * - Future-ready for brand themes and multi-tenant support
 * 
 * Usage:
 * ```typescript
 * constructor(private themeService: ThemeService) {
 *   this.themeService.currentTheme$.subscribe(theme => {
 *     console.log('Current theme:', theme);
 *   });
 * }
 * 
 * toggleTheme() {
 *   this.themeService.toggleTheme();
 * }
 * ```
 */

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import {
  Theme,
  SystemTheme,
  ThemeConfig,
  ThemeChangeEvent,
  THEME_STORAGE_KEY,
  THEME_SYSTEM_PREFERENCE_KEY,
  THEME_DATA_ATTRIBUTE,
  THEME_TRANSITION_CLASS,
  THEME_TRANSITION_DURATION
} from './theme.types';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isBrowser: boolean;
  private mediaQuery: MediaQueryList | null = null;
  
  // BehaviorSubjects for reactive state management
  private currentThemeSubject: BehaviorSubject<Theme>;
  private systemThemeSubject: BehaviorSubject<SystemTheme>;
  private followSystemSubject: BehaviorSubject<boolean>;
  
  // Public observables
  public readonly currentTheme$: Observable<Theme>;
  public readonly systemTheme$: Observable<SystemTheme>;
  public readonly followSystem$: Observable<boolean>;
  public readonly themeConfig$: Observable<ThemeConfig>;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Initialize with defaults
    const initialTheme = this.isBrowser ? this.initializeTheme() : Theme.DARK;
    const initialSystemTheme = this.isBrowser ? this.detectSystemTheme() : SystemTheme.NO_PREFERENCE;
    const initialFollowSystem = this.isBrowser ? this.loadFollowSystemPreference() : false;
    
    this.currentThemeSubject = new BehaviorSubject<Theme>(initialTheme);
    this.systemThemeSubject = new BehaviorSubject<SystemTheme>(initialSystemTheme);
    this.followSystemSubject = new BehaviorSubject<boolean>(initialFollowSystem);
    
    // Create public observables
    this.currentTheme$ = this.currentThemeSubject.asObservable().pipe(distinctUntilChanged());
    this.systemTheme$ = this.systemThemeSubject.asObservable().pipe(distinctUntilChanged());
    this.followSystem$ = this.followSystemSubject.asObservable().pipe(distinctUntilChanged());
    
    // Combine into config observable
    this.themeConfig$ = this.currentTheme$.pipe(
      map(current => ({
        current,
        followSystem: this.followSystemSubject.value,
        systemTheme: this.systemThemeSubject.value
      }))
    );
    
    // Listen for system theme changes
    if (this.isBrowser) {
      this.listenToSystemThemeChanges();
    }
  }

  /**
   * Initialize theme on service creation
   * Order of preference:
   * 1. User's saved preference (localStorage)
   * 2. System preference (if user wants to follow system)
   * 3. Default to dark theme
   */
  private initializeTheme(): Theme {
    const savedTheme = this.loadThemeFromStorage();
    const followSystem = this.loadFollowSystemPreference();
    const systemTheme = this.detectSystemTheme();
    
    if (followSystem && systemTheme !== SystemTheme.NO_PREFERENCE) {
      const theme = systemTheme === SystemTheme.DARK ? Theme.DARK : Theme.LIGHT;
      this.applyTheme(theme, false); // No transition on initial load
      return theme;
    }
    
    if (savedTheme) {
      this.applyTheme(savedTheme, false);
      return savedTheme;
    }
    
    // Default to dark theme
    this.applyTheme(Theme.DARK, false);
    return Theme.DARK;
  }

  /**
   * Detect system theme preference
   */
  private detectSystemTheme(): SystemTheme {
    if (!this.isBrowser || !window.matchMedia) {
      return SystemTheme.NO_PREFERENCE;
    }
    
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightModeQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    if (darkModeQuery.matches) {
      return SystemTheme.DARK;
    } else if (lightModeQuery.matches) {
      return SystemTheme.LIGHT;
    }
    
    return SystemTheme.NO_PREFERENCE;
  }

  /**
   * Listen to system theme changes
   */
  private listenToSystemThemeChanges(): void {
    if (!this.isBrowser || !window.matchMedia) {
      return;
    }
    
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Modern browsers
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', (e) => this.handleSystemThemeChange(e));
    } else {
      // Legacy browsers
      this.mediaQuery.addListener((e) => this.handleSystemThemeChange(e));
    }
  }

  /**
   * Handle system theme change
   */
  private handleSystemThemeChange(event: MediaQueryListEvent): void {
    const newSystemTheme = event.matches ? SystemTheme.DARK : SystemTheme.LIGHT;
    this.systemThemeSubject.next(newSystemTheme);
    
    // Only apply if user wants to follow system
    if (this.followSystemSubject.value) {
      const newTheme = newSystemTheme === SystemTheme.DARK ? Theme.DARK : Theme.LIGHT;
      this.setTheme(newTheme, true, true);
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Get system theme
   */
  getSystemTheme(): SystemTheme {
    return this.systemThemeSubject.value;
  }

  /**
   * Check if following system preference
   */
  isFollowingSystem(): boolean {
    return this.followSystemSubject.value;
  }

  /**
   * Set theme
   * @param theme Theme to apply
   * @param withTransition Whether to animate the transition
   * @param triggeredBySystem Whether this change was triggered by system
   */
  setTheme(theme: Theme, withTransition: boolean = true, triggeredBySystem: boolean = false): void {
    const currentTheme = this.currentThemeSubject.value;
    
    if (currentTheme === theme) {
      return; // No change needed
    }
    
    this.applyTheme(theme, withTransition);
    this.currentThemeSubject.next(theme);
    this.saveThemeToStorage(theme);
    
    // Emit theme change event
    const changeEvent: ThemeChangeEvent = {
      from: currentTheme,
      to: theme,
      triggeredBySystem,
      timestamp: Date.now()
    };
    
    console.log('[ThemeService] Theme changed:', changeEvent);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const currentTheme = this.currentThemeSubject.value;
    const newTheme = currentTheme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
    
    // When user manually toggles, disable follow system
    if (this.followSystemSubject.value) {
      this.setFollowSystem(false);
    }
    
    this.setTheme(newTheme, true, false);
  }

  /**
   * Set whether to follow system preference
   */
  setFollowSystem(follow: boolean): void {
    this.followSystemSubject.next(follow);
    this.saveFollowSystemPreference(follow);
    
    if (follow) {
      const systemTheme = this.detectSystemTheme();
      if (systemTheme !== SystemTheme.NO_PREFERENCE) {
        const theme = systemTheme === SystemTheme.DARK ? Theme.DARK : Theme.LIGHT;
        this.setTheme(theme, true, true);
      }
    }
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(theme: Theme, withTransition: boolean): void {
    if (!this.isBrowser) {
      return;
    }
    
    const root = document.documentElement;
    
    if (withTransition && !this.prefersReducedMotion()) {
      // Add transition class
      root.classList.add(THEME_TRANSITION_CLASS);
      
      // Remove transition class after animation completes
      setTimeout(() => {
        root.classList.remove(THEME_TRANSITION_CLASS);
      }, THEME_TRANSITION_DURATION);
    }
    
    // Set theme attribute
    root.setAttribute(THEME_DATA_ATTRIBUTE, theme);
  }

  /**
   * Check if user prefers reduced motion
   */
  private prefersReducedMotion(): boolean {
    if (!this.isBrowser || !window.matchMedia) {
      return false;
    }
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Load theme from localStorage
   */
  private loadThemeFromStorage(): Theme | null {
    if (!this.isBrowser) {
      return null;
    }
    
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === Theme.LIGHT || saved === Theme.DARK) {
        return saved as Theme;
      }
    } catch (error) {
      console.error('[ThemeService] Error loading theme from storage:', error);
    }
    
    return null;
  }

  /**
   * Save theme to localStorage
   */
  private saveThemeToStorage(theme: Theme): void {
    if (!this.isBrowser) {
      return;
    }
    
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('[ThemeService] Error saving theme to storage:', error);
    }
  }

  /**
   * Load follow system preference from localStorage
   */
  private loadFollowSystemPreference(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    
    try {
      const saved = localStorage.getItem(THEME_SYSTEM_PREFERENCE_KEY);
      return saved === 'true';
    } catch (error) {
      console.error('[ThemeService] Error loading follow system preference:', error);
    }
    
    return false;
  }

  /**
   * Save follow system preference to localStorage
   */
  private saveFollowSystemPreference(follow: boolean): void {
    if (!this.isBrowser) {
      return;
    }
    
    try {
      localStorage.setItem(THEME_SYSTEM_PREFERENCE_KEY, String(follow));
    } catch (error) {
      console.error('[ThemeService] Error saving follow system preference:', error);
    }
  }

  /**
   * Clean up resources
   */
  ngOnDestroy(): void {
    if (this.mediaQuery) {
      if (this.mediaQuery.removeEventListener) {
        this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
      } else if ('removeListener' in this.mediaQuery) {
        // Legacy browser support - use addListener/removeListener instead of addEventListener
        (this.mediaQuery as any).removeListener(this.handleSystemThemeChange);
      }
    }
  }
}
