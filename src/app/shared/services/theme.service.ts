import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of, fromEvent } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';
import { DynamicThemesService } from '../../api/services/dynamic-themes.service';
import { UpdateDynamicUserThemeDto } from '../../api/models';
import { LocalStorageService } from './local-storage.service';
import { 
  Theme, 
  ThemeVariant, 
  UserThemePreference, 
  ThemeMode, 
  EffectiveTheme,
  ThemeMapper 
} from '../models/theme.models';

/**
 * Theme Service - Manages theme loading, application, and persistence
 * 
 * Responsibilities:
 * - Fetch themes and variants from API
 * - Load and save user theme preferences
 * - Apply theme tokens to CSS variables
 * - Handle system theme sync
 * - Cache theme in localStorage for fast load
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_CACHE_KEY = 'taskflow_theme_cache';
  private readonly USER_PREF_CACHE_KEY = 'taskflow_user_theme_pref';
  private readonly EFFECTIVE_THEME_CACHE_KEY = 'taskflow_effective_theme';

  // Reactive state using signals
  public availableThemes = signal<Theme[]>([]);
  public userPreferences = signal<UserThemePreference>({
    lightThemeId: '',
    lightThemeVariantId: '',
    darkThemeId: '',
    darkThemeVariantId: '',
    syncWithSystem: false,
    currentMode: ThemeMode.LIGHT
  });
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  // Current effective theme
  private currentEffectiveTheme$ = new BehaviorSubject<EffectiveTheme | null>(null);
  public effectiveTheme$ = this.currentEffectiveTheme$.asObservable();

  // System theme preference detection (public for template access)
  public systemPrefersDark = signal<boolean>(false);

  constructor(
    private themesService: DynamicThemesService,
    private localStorageService: LocalStorageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initSystemThemeDetection();
      this.loadCachedTheme();
    }
  }

  /**
   * Initialize system theme detection
   */
  private initSystemThemeDetection(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPrefersDark.set(mediaQuery.matches);

    // Listen for system theme changes
    fromEvent<MediaQueryListEvent>(mediaQuery, 'change').subscribe(event => {
      this.systemPrefersDark.set(event.matches);
      
      // If sync with system is enabled, apply the new theme
      if (this.userPreferences().syncWithSystem) {
        this.applyCurrentTheme();
      }
    });
  }

  /**
   * Load cached theme from localStorage for instant application
   */
  private loadCachedTheme(): void {
    const cachedEffectiveTheme = this.localStorageService.getItem<EffectiveTheme>(this.EFFECTIVE_THEME_CACHE_KEY);
    
    if (cachedEffectiveTheme) {
      this.applyThemeTokens(cachedEffectiveTheme.tokens);
      this.currentEffectiveTheme$.next(cachedEffectiveTheme);
    }
  }

  /**
   * Load all available themes from API
   */
  loadThemes(): Observable<Theme[]> {
    this.isLoading.set(true);
    this.error.set(null);

    // Check cache first
    const cachedThemes = this.localStorageService.getItem<Theme[]>(this.THEME_CACHE_KEY);
    if (cachedThemes && cachedThemes.length > 0) {
      this.availableThemes.set(cachedThemes);
      this.isLoading.set(false);
      return of(cachedThemes);
    }

    return this.themesService.apiThemesGet().pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load themes');
        }
        return response.data.map(dto => ThemeMapper.toTheme(dto));
      }),
      tap(themes => {
        this.availableThemes.set(themes);
        this.localStorageService.setItem(this.THEME_CACHE_KEY, themes);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set(error.message || 'Failed to load themes');
        this.isLoading.set(false);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  /**
   * Load user theme preferences from API
   */
  loadUserPreferences(): Observable<UserThemePreference> {
    this.isLoading.set(true);

    return this.themesService.apiThemesUserGet().pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load user preferences');
        }
        return ThemeMapper.toUserThemePreference(response.data);
      }),
      tap(preferences => {
        this.userPreferences.set(preferences);
        this.localStorageService.setItem(this.USER_PREF_CACHE_KEY, preferences);
        this.applyCurrentTheme();
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Failed to load user preferences:', error);
        
        // Try to use cached preferences
        const cachedPref = this.localStorageService.getItem<UserThemePreference>(this.USER_PREF_CACHE_KEY);
        if (cachedPref) {
          this.userPreferences.set(cachedPref);
          this.applyCurrentTheme();
        }
        
        this.isLoading.set(false);
        return of(this.userPreferences());
      })
    );
  }

  /**
   * Get effective theme for current user
   */
  loadEffectiveTheme(): Observable<EffectiveTheme> {
    return this.themesService.apiThemesUserEffectiveGet().pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load effective theme');
        }
        return ThemeMapper.toEffectiveTheme(response.data);
      }),
      tap(effectiveTheme => {
        this.applyThemeTokens(effectiveTheme.tokens);
        this.currentEffectiveTheme$.next(effectiveTheme);
        this.localStorageService.setItem(this.EFFECTIVE_THEME_CACHE_KEY, effectiveTheme);
      }),
      catchError(error => {
        console.error('Failed to load effective theme:', error);
        return of(this.currentEffectiveTheme$.value!);
      })
    );
  }

  /**
   * Update theme mode (light/dark/system)
   */
  updateThemeMode(mode: ThemeMode): Observable<UserThemePreference> {
    const currentPrefs = this.userPreferences();
    const syncWithSystem = mode === ThemeMode.SYSTEM;
    
    const updatedPrefs: UserThemePreference = {
      ...currentPrefs,
      currentMode: mode,
      syncWithSystem
    };

    this.userPreferences.set(updatedPrefs);
    this.localStorageService.setItem(this.USER_PREF_CACHE_KEY, updatedPrefs);
    this.applyCurrentTheme();

    return this.saveUserPreferences(updatedPrefs);
  }

  /**
   * Toggle system sync
   */
  toggleSystemSync(enabled: boolean): Observable<UserThemePreference> {
    const currentPrefs = this.userPreferences();
    const updatedPrefs: UserThemePreference = {
      ...currentPrefs,
      syncWithSystem: enabled,
      currentMode: enabled ? ThemeMode.SYSTEM : (this.systemPrefersDark() ? ThemeMode.DARK : ThemeMode.LIGHT)
    };

    this.userPreferences.set(updatedPrefs);
    this.localStorageService.setItem(this.USER_PREF_CACHE_KEY, updatedPrefs);
    this.applyCurrentTheme();

    return this.saveUserPreferences(updatedPrefs);
  }

  /**
   * Update theme variant for a specific mode
   */
  updateThemeVariant(mode: 'light' | 'dark', variantId: string): Observable<UserThemePreference> {
    const currentPrefs = this.userPreferences();
    const themes = this.availableThemes();
    
    // Find the variant and its theme
    let themeId = '';
    for (const theme of themes) {
      const variant = theme.variants.find(v => v.id === variantId);
      if (variant) {
        themeId = theme.id;
        break;
      }
    }

    const updatedPrefs: UserThemePreference = mode === 'light' 
      ? { ...currentPrefs, lightThemeId: themeId, lightThemeVariantId: variantId }
      : { ...currentPrefs, darkThemeId: themeId, darkThemeVariantId: variantId };

    this.userPreferences.set(updatedPrefs);
    this.localStorageService.setItem(this.USER_PREF_CACHE_KEY, updatedPrefs);
    this.applyCurrentTheme();

    return this.saveUserPreferences(updatedPrefs);
  }

  /**
   * Save user preferences to backend
   */
  private saveUserPreferences(preferences: UserThemePreference): Observable<UserThemePreference> {
    const dto: UpdateDynamicUserThemeDto = {
      lightThemeId: preferences.lightThemeId,
      lightVariantId: preferences.lightThemeVariantId,
      darkThemeId: preferences.darkThemeId,
      darkVariantId: preferences.darkThemeVariantId,
      syncWithSystem: preferences.syncWithSystem
    };

    return this.themesService.apiThemesUserPost({ body: dto }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to save preferences');
        }
        return ThemeMapper.toUserThemePreference(response.data);
      }),
      catchError(error => {
        console.error('Failed to save user preferences:', error);
        // Return current preferences on error (already saved to localStorage)
        return of(preferences);
      })
    );
  }

  /**
   * Apply the current theme based on user preferences
   */
  private applyCurrentTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const preferences = this.userPreferences();
    const themes = this.availableThemes();
    
    if (themes.length === 0) return;

    // Determine which mode to use
    const effectiveMode = this.getEffectiveMode();
    
    // Get the appropriate theme and variant
    const themeId = effectiveMode === 'dark' ? preferences.darkThemeId : preferences.lightThemeId;
    const variantId = effectiveMode === 'dark' ? preferences.darkThemeVariantId : preferences.lightThemeVariantId;

    const theme = themes.find(t => t.id === themeId);
    if (!theme) {
      // Fallback to first theme of the effective mode
      const fallbackTheme = themes.find(t => t.mode === effectiveMode);
      if (fallbackTheme) {
        this.applyTheme(fallbackTheme, fallbackTheme.variants[0]);
      }
      return;
    }

    const variant = theme.variants.find(v => v.id === variantId);
    if (!variant) {
      // Fallback to default variant
      const defaultVariant = theme.variants.find(v => v.isDefault) || theme.variants[0];
      this.applyTheme(theme, defaultVariant);
      return;
    }

    this.applyTheme(theme, variant);
  }

  /**
   * Get the effective theme mode (considering system sync)
   */
  private getEffectiveMode(): 'light' | 'dark' {
    const preferences = this.userPreferences();
    
    if (preferences.syncWithSystem) {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }

    if (preferences.currentMode === ThemeMode.DARK) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Apply a specific theme and variant
   */
  private applyTheme(theme: Theme, variant: ThemeVariant): void {
    // Merge base theme tokens with variant tokens
    const mergedTokens = ThemeMapper.mergeThemeTokens(theme.tokens, variant.tokens);
    
    // Apply tokens to CSS
    this.applyThemeTokens(mergedTokens);

    // Update effective theme
    const effectiveTheme: EffectiveTheme = {
      name: `${theme.name} - ${variant.name}`,
      themeId: theme.id,
      variantId: variant.id,
      variantName: variant.name,
      themeType: theme.mode,
      tokens: mergedTokens
    };

    this.currentEffectiveTheme$.next(effectiveTheme);
    this.localStorageService.setItem(this.EFFECTIVE_THEME_CACHE_KEY, effectiveTheme);
  }

  /**
   * Apply theme tokens to CSS variables
   */
  private applyThemeTokens(tokens: Record<string, string>): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const root = document.documentElement;

    // Apply each token as a CSS variable
    Object.entries(tokens).forEach(([key, value]) => {
      // Convert PascalCase to kebab-case for CSS variables
      const cssVarName = `--${this.toKebabCase(key)}`;
      root.style.setProperty(cssVarName, value);
    });

    // Add theme mode class
    const mode = tokens['ThemeType']?.toLowerCase() || 'light';
    root.classList.remove('light-mode', 'dark-mode');
    root.classList.add(`${mode}-mode`);
    
    // Set data attribute for easier CSS targeting
    root.setAttribute('data-theme-mode', mode);
  }

  /**
   * Convert PascalCase to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
      .toLowerCase();
  }

  /**
   * Get system theme preference
   */
  getSystemPrefersDark(): boolean {
    return this.systemPrefersDark();
  }

  /**
   * Get the current effective mode as a string
   */
  getCurrentModeString(): string {
    const prefs = this.userPreferences();
    if (prefs.syncWithSystem) {
      return this.systemPrefersDark() ? 'Dark' : 'Light';
    }
    return prefs.currentMode === ThemeMode.DARK ? 'Dark' : 'Light';
  }
}
