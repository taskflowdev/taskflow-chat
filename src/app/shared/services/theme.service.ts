import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of, catchError, tap, map, fromEvent } from 'rxjs';
import { DynamicThemesService } from '../../api/services/dynamic-themes.service';
import { 
  DynamicThemeDto, 
  DynamicUserThemeDto, 
  UpdateDynamicUserThemeDto,
  EffectiveThemeDto 
} from '../../api/models';
import { LocalStorageService } from '../../auth/services/local-storage.service';

export interface ThemeState {
  availableThemes: DynamicThemeDto[];
  userPreference: DynamicUserThemeDto | null;
  effectiveTheme: EffectiveThemeDto | null;
  syncWithSystem: boolean;
  isDark: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'taskflow_chat_theme';
  private readonly LAST_THEME_KEY = 'taskflow_chat_last_theme';

  private themeStateSubject = new BehaviorSubject<ThemeState>({
    availableThemes: [],
    userPreference: null,
    effectiveTheme: null,
    syncWithSystem: false,
    isDark: false,
    isLoading: true
  });

  public themeState$ = this.themeStateSubject.asObservable();

  constructor(
    private themesService: DynamicThemesService,
    private localStorageService: LocalStorageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      this.watchSystemThemeChanges();
    }
  }

  /**
   * Initialize theme on app startup
   */
  private initializeTheme(): void {
    // Try to load cached theme from localStorage first for instant display
    const cachedTheme = this.loadCachedTheme();
    if (cachedTheme) {
      this.applyTheme(cachedTheme);
    }

    // Then fetch available themes
    this.loadAvailableThemes().subscribe();
  }

  /**
   * Load available themes from API
   */
  loadAvailableThemes(): Observable<DynamicThemeDto[]> {
    return this.themesService.apiThemesGet().pipe(
      map(response => response.data || []),
      tap(themes => {
        this.updateState({ availableThemes: themes });
      }),
      catchError(error => {
        console.error('Error loading themes:', error);
        return of([]);
      })
    );
  }

  /**
   * Load user theme preference from API (called after login)
   */
  loadUserPreference(): Observable<DynamicUserThemeDto | null> {
    return this.themesService.apiThemesUserGet().pipe(
      map(response => response.data || null),
      tap(userPref => {
        if (userPref) {
          this.updateState({ 
            userPreference: userPref,
            syncWithSystem: userPref.syncWithSystem || false
          });
          
          // Apply the user's effective theme
          this.loadEffectiveTheme().subscribe();
        }
      }),
      catchError(error => {
        console.error('Error loading user theme preference:', error);
        return of(null);
      })
    );
  }

  /**
   * Load effective theme (merged base + accent) from API
   */
  loadEffectiveTheme(): Observable<EffectiveThemeDto | null> {
    return this.themesService.apiThemesUserEffectiveGet().pipe(
      map(response => response.data || null),
      tap(effectiveTheme => {
        if (effectiveTheme) {
          this.updateState({ effectiveTheme, isLoading: false });
          this.applyTheme(effectiveTheme);
          this.cacheTheme(effectiveTheme);
        }
      }),
      catchError(error => {
        console.error('Error loading effective theme:', error);
        this.updateState({ isLoading: false });
        return of(null);
      })
    );
  }

  /**
   * Save user theme preference to backend
   */
  saveUserPreference(preference: UpdateDynamicUserThemeDto): Observable<boolean> {
    return this.themesService.apiThemesUserPost({ body: preference }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateState({ userPreference: response.data });
          // Reload effective theme after saving
          this.loadEffectiveTheme().subscribe();
        }
      }),
      map(response => response.success || false),
      catchError(error => {
        console.error('Error saving theme preference:', error);
        return of(false);
      })
    );
  }

  /**
   * Set theme preference and save
   */
  setTheme(themeId: string, variantId: string, isDark: boolean): void {
    const currentState = this.themeStateSubject.value;
    const preference: UpdateDynamicUserThemeDto = {
      lightThemeId: isDark ? currentState.userPreference?.lightThemeId : themeId,
      lightVariantId: isDark ? currentState.userPreference?.lightVariantId : variantId,
      darkThemeId: isDark ? themeId : currentState.userPreference?.darkThemeId,
      darkVariantId: isDark ? variantId : currentState.userPreference?.darkVariantId,
      syncWithSystem: currentState.syncWithSystem
    };

    this.saveUserPreference(preference).subscribe();
  }

  /**
   * Toggle between light and dark mode
   */
  toggleDarkMode(): void {
    const currentState = this.themeStateSubject.value;
    const newDarkState = !currentState.isDark;
    
    this.updateState({ isDark: newDarkState });
    
    // If we have user preferences, apply the appropriate theme
    if (currentState.userPreference) {
      this.loadEffectiveTheme().subscribe();
    }
  }

  /**
   * Enable/disable sync with system theme
   */
  setSyncWithSystem(enabled: boolean): void {
    const currentState = this.themeStateSubject.value;
    
    this.updateState({ syncWithSystem: enabled });
    
    const preference: UpdateDynamicUserThemeDto = {
      lightThemeId: currentState.userPreference?.lightThemeId,
      lightVariantId: currentState.userPreference?.lightVariantId,
      darkThemeId: currentState.userPreference?.darkThemeId,
      darkVariantId: currentState.userPreference?.darkVariantId,
      syncWithSystem: enabled
    };

    this.saveUserPreference(preference).subscribe(() => {
      if (enabled) {
        this.applySystemTheme();
      }
    });
  }

  /**
   * Apply theme tokens as CSS variables
   */
  private applyTheme(theme: EffectiveThemeDto): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const root = document.documentElement;
    
    // Apply all tokens as CSS variables
    if (theme.tokens) {
      Object.entries(theme.tokens).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
    }

    // Update isDark state based on theme type
    const isDark = theme.themeType?.toLowerCase() === 'dark';
    this.updateState({ isDark });

    // Add smooth transition
    root.style.transition = 'all 0.25s ease-in-out';
    setTimeout(() => {
      root.style.transition = '';
    }, 250);
  }

  /**
   * Cache theme in localStorage for instant load
   */
  private cacheTheme(theme: EffectiveThemeDto): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    try {
      this.localStorageService.setItem(this.LAST_THEME_KEY, JSON.stringify(theme));
    } catch (error) {
      console.error('Error caching theme:', error);
    }
  }

  /**
   * Load cached theme from localStorage
   */
  private loadCachedTheme(): EffectiveThemeDto | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const cached = this.localStorageService.getItem(this.LAST_THEME_KEY);
      if (cached) {
        return JSON.parse(cached) as EffectiveThemeDto;
      }
    } catch (error) {
      console.error('Error loading cached theme:', error);
    }
    return null;
  }

  /**
   * Watch for system theme changes
   */
  private watchSystemThemeChanges(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    fromEvent<MediaQueryListEvent>(darkModeQuery, 'change').subscribe(event => {
      const currentState = this.themeStateSubject.value;
      if (currentState.syncWithSystem) {
        this.applySystemTheme();
      }
    });
  }

  /**
   * Apply theme based on system preference
   */
  private applySystemTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.updateState({ isDark: prefersDark });
    this.loadEffectiveTheme().subscribe();
  }

  /**
   * Get system dark mode preference
   */
  getSystemDarkMode(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Update theme state
   */
  private updateState(partial: Partial<ThemeState>): void {
    const current = this.themeStateSubject.value;
    this.themeStateSubject.next({ ...current, ...partial });
  }

  /**
   * Get current theme state
   */
  getCurrentState(): ThemeState {
    return this.themeStateSubject.value;
  }
}
