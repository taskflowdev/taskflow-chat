import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Observable, of, from, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError, tap, switchMap, share, take } from 'rxjs/operators';
import { ThemesService } from '../../api/services/themes.service';
import { AuthService } from '../../api/services/auth.service';
import { LocalStorageService } from './local-storage.service';
import { 
  ThemeDto, 
  ThemeAccentDto, 
  CompleteThemeDto,
  UserThemeDto,
  UpdateUserThemeDto,
  UserDto
} from '../../api/models';

export interface ThemeState {
  availableThemes: ThemeDto[];
  userThemePreferences: UserThemeDto | null;
  currentEffectiveTheme: CompleteThemeDto | null;
  systemPrefersDark: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface ThemeSelectionUpdate {
  lightThemeId?: string;
  lightAccentId?: string;
  darkThemeId?: string;
  darkAccentId?: string;
  syncWithSystem?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeManagementService {
  private readonly themesService = inject(ThemesService);
  private readonly authService = inject(AuthService);
  private readonly localStorageService = inject(LocalStorageService);
  
  private readonly FALLBACK_STORAGE_KEY = 'theme-fallback-preferences';
  
  // Default fallback theme configuration
  private readonly fallbackLightTheme: CompleteThemeDto = {
    themeId: 'light-fallback',
    accentId: 'light-default-fallback',
    name: 'Light - Default',
    isDarkTheme: false,
    backgroundColor: '#ffffff',
    secondaryBackgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    textColor: '#212529',
    secondaryTextColor: '#6c757d',
    primaryAccentColor: '#007bff',
    secondaryAccentColor: '#0056b3',
    badgeColor: '#007bff',
    errorColor: '#dc3545',
    successColor: '#198754',
    warningColor: '#ffc107',
    iconColor: '#6c757d'
  };

  // Current user ID observable
  private readonly currentUserId$ = new BehaviorSubject<string | null>(null);
  
  // Reactive state
  private readonly _state = signal<ThemeState>({
    availableThemes: [],
    userThemePreferences: null,
    currentEffectiveTheme: null,
    systemPrefersDark: this.getSystemPreference(),
    isLoading: false,
    error: null,
    isInitialized: false
  });

  // Public computed properties
  public readonly state = this._state.asReadonly();
  public readonly availableThemes = computed(() => this._state().availableThemes);
  public readonly userThemePreferences = computed(() => this._state().userThemePreferences);
  public readonly currentEffectiveTheme = computed(() => this._state().currentEffectiveTheme);
  public readonly isLoading = computed(() => this._state().isLoading);
  public readonly error = computed(() => this._state().error);
  public readonly systemPrefersDark = computed(() => this._state().systemPrefersDark);
  public readonly isInitialized = computed(() => this._state().isInitialized);

  // Computed derived properties
  public readonly lightThemes = computed(() => 
    this.availableThemes().filter(theme => !theme.isDarkTheme)
  );
  
  public readonly darkThemes = computed(() => 
    this.availableThemes().filter(theme => theme.isDarkTheme)
  );

  public readonly currentLightTheme = computed(() => {
    const prefs = this.userThemePreferences();
    if (!prefs?.lightThemeId) return null;
    return this.lightThemes().find(t => t.id === prefs.lightThemeId) || null;
  });

  public readonly currentDarkTheme = computed(() => {
    const prefs = this.userThemePreferences();
    if (!prefs?.darkThemeId) return null;
    return this.darkThemes().find(t => t.id === prefs.darkThemeId) || null;
  });

  public readonly currentLightAccent = computed(() => {
    const theme = this.currentLightTheme();
    const prefs = this.userThemePreferences();
    if (!theme || !prefs?.lightAccentId) return null;
    return theme.accentVariants?.find((a: any) => a.id === prefs.lightAccentId) || null;
  });

  public readonly currentDarkAccent = computed(() => {
    const theme = this.currentDarkTheme();
    const prefs = this.userThemePreferences();
    if (!theme || !prefs?.darkAccentId) return null;
    return theme.accentVariants?.find((a: any) => a.id === prefs.darkAccentId) || null;
  });

  constructor() {
    // Set up system theme listener
    this.setupSystemThemeListener();
    
    // Apply theme whenever effective theme changes
    effect(() => {
      this.applyThemeToDOM();
    });

    // Initialize authentication and theme loading
    this.initializeService();
  }

  private getSystemPreference(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private setupSystemThemeListener(): void {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      this._state.update(state => ({
        ...state,
        systemPrefersDark: e.matches
      }));
      
      // Reload effective theme if system sync is enabled
      const prefs = this.userThemePreferences();
      if (prefs?.syncWithSystem) {
        this.loadEffectiveTheme().subscribe();
      }
    };
    
    mediaQuery.addEventListener('change', handler);
  }

  private initializeService(): void {
    // Load current user first, then initialize themes
    this.authService.apiAuthMeGet().pipe(
      tap((response: any) => {
        const userId = response?.data?.id;
        if (userId) {
          this.currentUserId$.next(userId);
        }
      }),
      switchMap(() => this.lazyInitialize()),
      take(1)
    ).subscribe({
      error: (error: any) => {
        console.warn('Failed to load user, using fallback theme', error);
        this.setFallbackTheme();
      }
    });
  }

  /**
   * Lazy initialization - loads themes and user preferences
   * Falls back to safe defaults if API calls fail
   */
  public lazyInitialize(): Observable<boolean> {
    this._state.update(state => ({ ...state, isLoading: true, error: null }));

    return combineLatest([
      this.loadAvailableThemes(),
      this.loadUserThemePreferences()
    ]).pipe(
      switchMap(() => this.loadEffectiveTheme()),
      map(() => {
        this._state.update(state => ({ 
          ...state, 
          isLoading: false, 
          isInitialized: true 
        }));
        return true;
      }),
      catchError(error => {
        console.error('Theme initialization failed, using fallback', error);
        this.setFallbackTheme();
        this._state.update(state => ({ 
          ...state, 
          isLoading: false, 
          isInitialized: true,
          error: 'Failed to load themes, using defaults' 
        }));
        return of(false);
      }),
      share()
    );
  }

  /**
   * Load all available themes from API
   */
  public loadAvailableThemes(): Observable<ThemeDto[]> {
    return this.themesService.apiThemesGet$Json().pipe(
      map(response => response.data || []),
      tap(themes => {
        this._state.update(state => ({
          ...state,
          availableThemes: themes
        }));
      }),
      catchError(error => {
        console.error('Failed to load available themes', error);
        this._state.update(state => ({
          ...state,
          error: 'Failed to load available themes'
        }));
        return of([]);
      })
    );
  }

  /**
   * Load user theme preferences from API
   */
  public loadUserThemePreferences(): Observable<UserThemeDto | null> {
    const userId = this.currentUserId$.value;
    if (!userId) {
      return of(null);
    }

    return this.themesService.apiThemesUsersUserIdGet$Json({ userId }).pipe(
      map(response => response.data || null),
      tap(preferences => {
        this._state.update(state => ({
          ...state,
          userThemePreferences: preferences
        }));
      }),
      catchError(error => {
        console.error('Failed to load user theme preferences', error);
        this._state.update(state => ({
          ...state,
          error: 'Failed to load user preferences'
        }));
        return of(null);
      })
    );
  }

  /**
   * Load the effective theme (base + accent combined) from API
   */
  public loadEffectiveTheme(): Observable<CompleteThemeDto | null> {
    const userId = this.currentUserId$.value;
    if (!userId) {
      this.setFallbackTheme();
      return of(this.fallbackLightTheme);
    }

    const isDarkMode = this.shouldUseDarkMode();
    
    return this.themesService.apiThemesUsersUserIdEffectiveGet$Json({ 
      userId, 
      isDarkMode 
    }).pipe(
      map(response => response.data || null),
      tap(effectiveTheme => {
        this._state.update(state => ({
          ...state,
          currentEffectiveTheme: effectiveTheme
        }));
      }),
      catchError(error => {
        console.error('Failed to load effective theme', error);
        this.setFallbackTheme();
        return of(this.fallbackLightTheme);
      })
    );
  }

  /**
   * Update user theme preferences with optimistic UI updates
   */
  public updateThemePreferences(update: ThemeSelectionUpdate): Observable<UserThemeDto> {
    const userId = this.currentUserId$.value;
    if (!userId) {
      return of({} as UserThemeDto);
    }

    // Get current preferences
    const currentPrefs = this.userThemePreferences();
    
    // Create update DTO
    const updateDto: UpdateUserThemeDto = {
      lightThemeId: update.lightThemeId || currentPrefs?.lightThemeId || '',
      lightAccentId: update.lightAccentId || currentPrefs?.lightAccentId || '',
      darkThemeId: update.darkThemeId || currentPrefs?.darkThemeId || '',
      darkAccentId: update.darkAccentId || currentPrefs?.darkAccentId || ''
    };

    // Optimistic update - apply immediately
    this.applyOptimisticThemeUpdate(updateDto);

    // Persist to API
    return this.themesService.apiThemesUsersUserIdPut$Json({ 
      userId, 
      body: updateDto 
    }).pipe(
      map(response => response.data || {} as UserThemeDto),
      tap(updatedPreferences => {
        // Update state with API response
        this._state.update(state => ({
          ...state,
          userThemePreferences: updatedPreferences
        }));
        
        // Reload effective theme
        this.loadEffectiveTheme().subscribe();
      }),
      catchError(error => {
        console.error('Failed to save theme preferences', error);
        // Revert optimistic update
        this.loadUserThemePreferences().subscribe();
        this._state.update(state => ({
          ...state,
          error: 'Failed to save theme preferences'
        }));
        return of({} as UserThemeDto);
      })
    );
  }

  /**
   * Update light theme selection
   */
  public updateLightTheme(themeId: string, accentId?: string): Observable<UserThemeDto> {
    // Find default accent if not provided
    if (!accentId) {
      const theme = this.lightThemes().find(t => t.id === themeId);
      accentId = theme?.accentVariants?.find((a: any) => a.isDefault)?.id || 
                theme?.accentVariants?.[0]?.id || '';
    }

    return this.updateThemePreferences({
      lightThemeId: themeId,
      lightAccentId: accentId
    });
  }

  /**
   * Update dark theme selection
   */
  public updateDarkTheme(themeId: string, accentId?: string): Observable<UserThemeDto> {
    // Find default accent if not provided
    if (!accentId) {
      const theme = this.darkThemes().find(t => t.id === themeId);
      accentId = theme?.accentVariants?.find((a: any) => a.isDefault)?.id || 
                theme?.accentVariants?.[0]?.id || '';
    }

    return this.updateThemePreferences({
      darkThemeId: themeId,
      darkAccentId: accentId
    });
  }

  /**
   * Update accent for specific theme mode
   */
  public updateAccent(mode: 'light' | 'dark', accentId: string): Observable<UserThemeDto> {
    return this.updateThemePreferences({
      [mode === 'light' ? 'lightAccentId' : 'darkAccentId']: accentId
    });
  }

  /**
   * Toggle system sync
   */
  public toggleSystemSync(enabled: boolean): Observable<UserThemeDto> {
    return this.updateThemePreferences({ syncWithSystem: enabled });
  }

  private shouldUseDarkMode(): boolean {
    const prefs = this.userThemePreferences();
    if (prefs?.syncWithSystem) {
      return this.systemPrefersDark();
    }
    // If no explicit preference, check if current effective theme is dark
    return this.currentEffectiveTheme()?.isDarkTheme || false;
  }

  private applyOptimisticThemeUpdate(updateDto: UpdateUserThemeDto): void {
    const currentPrefs = this.userThemePreferences();
    
    // Create optimistic user preferences
    const optimisticPrefs: UserThemeDto = {
      ...currentPrefs,
      lightThemeId: updateDto.lightThemeId,
      lightAccentId: updateDto.lightAccentId,
      darkThemeId: updateDto.darkThemeId,
      darkAccentId: updateDto.darkAccentId
    };

    this._state.update(state => ({
      ...state,
      userThemePreferences: optimisticPrefs
    }));

    // Apply optimistic effective theme
    this.createOptimisticEffectiveTheme(optimisticPrefs);
  }

  private createOptimisticEffectiveTheme(prefs: UserThemeDto): void {
    const isDark = this.shouldUseDarkMode();
    const themeId = isDark ? prefs.darkThemeId : prefs.lightThemeId;
    const accentId = isDark ? prefs.darkAccentId : prefs.lightAccentId;

    const theme = this.availableThemes().find(t => t.id === themeId);
    const accent = theme?.accentVariants?.find((a: any) => a.id === accentId);

    if (theme && accent) {
      const effectiveTheme: CompleteThemeDto = {
        themeId: theme.id,
        accentId: accent.id,
        name: `${theme.name} - ${accent.name}`,
        isDarkTheme: theme.isDarkTheme,
        backgroundColor: theme.backgroundColor,
        secondaryBackgroundColor: theme.secondaryBackgroundColor,
        borderColor: theme.borderColor,
        textColor: theme.textColor,
        secondaryTextColor: theme.secondaryTextColor,
        primaryAccentColor: accent.primaryAccentColor,
        secondaryAccentColor: accent.secondaryAccentColor,
        badgeColor: accent.badgeColor,
        errorColor: accent.errorColor,
        successColor: accent.successColor,
        warningColor: accent.warningColor,
        iconColor: accent.iconColor
      };

      this._state.update(state => ({
        ...state,
        currentEffectiveTheme: effectiveTheme
      }));
    }
  }

  private setFallbackTheme(): void {
    this._state.update(state => ({
      ...state,
      currentEffectiveTheme: this.fallbackLightTheme
    }));
  }

  private applyThemeToDOM(): void {
    if (typeof document === 'undefined') return;
    
    const theme = this.currentEffectiveTheme();
    if (!theme) return;

    const root = document.documentElement;
    
    // Apply theme mode class
    root.classList.remove('light-theme', 'dark-theme');
    root.classList.add(theme.isDarkTheme ? 'dark-theme' : 'light-theme');
    
    // Apply all theme variables as CSS custom properties
    const themeProperties = {
      '--theme-background-color': theme.backgroundColor,
      '--theme-secondary-background-color': theme.secondaryBackgroundColor,
      '--theme-border-color': theme.borderColor,
      '--theme-text-color': theme.textColor,
      '--theme-secondary-text-color': theme.secondaryTextColor,
      '--theme-primary-accent-color': theme.primaryAccentColor,
      '--theme-secondary-accent-color': theme.secondaryAccentColor,
      '--theme-badge-color': theme.badgeColor,
      '--theme-error-color': theme.errorColor,
      '--theme-success-color': theme.successColor,
      '--theme-warning-color': theme.warningColor,
      '--theme-icon-color': theme.iconColor
    };

    Object.entries(themeProperties).forEach(([property, value]) => {
      if (value) {
        root.style.setProperty(property, value);
      }
    });

    // Set data attributes for additional targeting
    root.setAttribute('data-theme-id', theme.themeId || '');
    root.setAttribute('data-accent-id', theme.accentId || '');
    root.setAttribute('data-theme-mode', theme.isDarkTheme ? 'dark' : 'light');
  }
}