import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from './local-storage.service';
import { 
  Theme, 
  ThemeVariant, 
  UserThemePreferences, 
  ThemeMode, 
  ThemeState,
  ThemeApiResponse,
  UserThemePreferencesDto,
  AccentColors 
} from '../models/theme.models';
import { ThemesService } from '../../api/services/themes.service';
import { AuthService } from '../../api/services/auth.service';
import { UserThemeDto } from '../../api/models/user-theme-dto';
import { UpdateUserThemeDto } from '../../api/models/update-user-theme-dto';
import { UpdateThemeSyncDto } from '../../api/models/update-theme-sync-dto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly httpClient = inject(HttpClient);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly themesApiService = inject(ThemesService);
  private readonly authService = inject(AuthService);
  private readonly THEME_PREFERENCES_KEY = 'theme-preferences';
  private currentUserId: string | null = null;

  // Default theme data - would normally come from API
  private readonly defaultThemes: Theme[] = [
    {
      id: 'light',
      name: 'Light Theme',
      mode: 'light',
      isDefault: true,
      variants: [
        {
          id: 'light-default',
          name: 'Default',
          description: 'Clean and minimalist light theme',
          accentColors: {
            primary: '#007bff',
            secondary: '#6c757d',
            success: '#198754',
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#0dcaf0',
            light: '#f8f9fa',
            dark: '#212529'
          }
        },
        {
          id: 'light-blue',
          name: 'Ocean Blue',
          description: 'Calming blue accent theme',
          accentColors: {
            primary: '#0056b3',
            secondary: '#6c757d',
            success: '#198754',
            danger: '#dc3545',
            warning: '#fd7e14',
            info: '#0dcaf0',
            light: '#f8f9fa',
            dark: '#212529'
          }
        },
        {
          id: 'light-green',
          name: 'Forest Green',
          description: 'Nature-inspired green theme',
          accentColors: {
            primary: '#28a745',
            secondary: '#6c757d',
            success: '#198754',
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8',
            light: '#f8f9fa',
            dark: '#212529'
          }
        }
      ]
    },
    {
      id: 'dark',
      name: 'Dark Theme',
      mode: 'dark',
      isDefault: true,
      variants: [
        {
          id: 'dark-default',
          name: 'Default',
          description: 'Sleek dark theme for low-light environments',
          accentColors: {
            primary: '#375a7f',
            secondary: '#6c757d',
            success: '#00bc8c',
            danger: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db',
            light: '#495057',
            dark: '#212529'
          }
        },
        {
          id: 'dark-purple',
          name: 'Deep Purple',
          description: 'Rich purple accent dark theme',
          accentColors: {
            primary: '#6f42c1',
            secondary: '#6c757d',
            success: '#00bc8c',
            danger: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db',
            light: '#495057',
            dark: '#212529'
          }
        },
        {
          id: 'dark-orange',
          name: 'Sunset Orange',
          description: 'Warm orange accent dark theme',
          accentColors: {
            primary: '#fd7e14',
            secondary: '#6c757d',
            success: '#00bc8c',
            danger: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db',
            light: '#495057',
            dark: '#212529'
          }
        }
      ]
    }
  ];

  private readonly defaultPreferences: UserThemePreferences = {
    lightThemeVariantId: 'light-default',
    darkThemeVariantId: 'dark-default',
    themeMode: ThemeMode.SYSTEM,
    syncWithSystem: true
  };

  // Reactive state signals
  private readonly _state = signal<ThemeState>({
    availableThemes: this.defaultThemes,
    userPreferences: this.defaultPreferences,
    currentTheme: this.defaultThemes[0].variants[0],
    systemPrefersDark: this.getSystemPreference(),
    isLoading: false,
    error: null
  });

  // Computed properties
  public readonly state = this._state.asReadonly();
  public readonly availableThemes = computed(() => this._state().availableThemes);
  public readonly userPreferences = computed(() => this._state().userPreferences);
  public readonly currentTheme = computed(() => this._state().currentTheme);
  public readonly isLoading = computed(() => this._state().isLoading);
  public readonly error = computed(() => this._state().error);
  public readonly systemPrefersDark = computed(() => this._state().systemPrefersDark);

  // Computed theme mode
  public readonly effectiveThemeMode = computed(() => {
    const prefs = this.userPreferences();
    if (prefs.syncWithSystem) {
      return this.systemPrefersDark() ? ThemeMode.DARK : ThemeMode.LIGHT;
    }
    return prefs.themeMode;
  });

  constructor() {
    // Listen for system theme changes
    this.setupSystemThemeListener();
    
    // Apply theme effect
    effect(() => {
      this.applyTheme();
    });

    // Initialize theme
    this.initializeTheme();
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
    };
    
    mediaQuery.addEventListener('change', handler);
  }

  private async initializeTheme(): Promise<void> {
    try {
      // Get current user to set userId
      const userResponse = await this.authService.apiAuthMeGet().toPromise();
      if (userResponse?.data?.id) {
        this.currentUserId = userResponse.data.id;
        // Load user preferences from API
        this.loadUserPreferences().subscribe();
      } else {
        // Fallback to local storage if not authenticated
        this.loadLocalPreferences();
      }
    } catch (error) {
      console.warn('Could not load user data, using local preferences:', error);
      this.loadLocalPreferences();
    }
  }

  private loadLocalPreferences(): void {
    const storedPrefs = this.getStoredPreferences();
    this._state.update(state => ({
      ...state,
      userPreferences: storedPrefs
    }));
    this.updateCurrentTheme(storedPrefs);
  }

  public loadThemes(): Observable<Theme[]> {
    this._state.update(state => ({ ...state, isLoading: true, error: null }));
    
    return this.themesApiService.apiThemesGet$Json().pipe(
      map(response => {
        // Transform API response to our internal format
        const themes: Theme[] = response.data?.map(apiTheme => ({
          id: apiTheme.id || '',
          name: apiTheme.name || '',
          mode: apiTheme.isDarkTheme ? 'dark' : 'light',
          isDefault: apiTheme.isBuiltIn || false,
          variants: apiTheme.accentVariants?.map((accent) => ({
            id: accent.id || '',
            name: accent.name || '',
            description: accent.isDefault ? 'Default accent' : `${accent.name} accent`,
            accentColors: {
              primary: accent.primaryAccentColor || '#007bff',
              secondary: accent.secondaryAccentColor || '#6c757d',
              success: accent.successColor || '#198754',
              danger: accent.errorColor || '#dc3545',
              warning: accent.warningColor || '#ffc107',
              info: accent.iconColor || '#0dcaf0',
              light: '#f8f9fa',
              dark: '#212529'
            }
          })) || []
        })) || this.defaultThemes;
        
        this._state.update(state => ({
          ...state,
          availableThemes: themes,
          isLoading: false
        }));
        
        return themes;
      }),
      catchError(error => {
        console.warn('Failed to load themes from API, using defaults:', error);
        this._state.update(state => ({
          ...state,
          availableThemes: this.defaultThemes,
          isLoading: false,
          error: 'Failed to load themes'
        }));
        return of(this.defaultThemes);
      })
    );
  }

  public loadUserPreferences(): Observable<UserThemePreferences> {
    this._state.update(state => ({ ...state, isLoading: true, error: null }));
    
    if (!this.currentUserId) {
      // Fallback to local storage if no user ID
      const storedPrefs = this.getStoredPreferences();
      this._state.update(state => ({
        ...state,
        userPreferences: storedPrefs,
        isLoading: false
      }));
      this.updateCurrentTheme(storedPrefs);
      return of(storedPrefs);
    }

    return this.themesApiService.apiThemesUsersUserIdGet$Json({ userId: this.currentUserId }).pipe(
      map(response => {
        const apiData = response.data;
        const preferences: UserThemePreferences = {
          lightThemeVariantId: apiData?.lightAccentId || 'light-default',
          darkThemeVariantId: apiData?.darkAccentId || 'dark-default',
          themeMode: apiData?.syncWithSystem ? ThemeMode.SYSTEM : 
                    (this.systemPrefersDark() ? ThemeMode.DARK : ThemeMode.LIGHT),
          syncWithSystem: apiData?.syncWithSystem || false
        };
        
        this._state.update(state => ({
          ...state,
          userPreferences: preferences,
          isLoading: false
        }));
        this.updateCurrentTheme(preferences);
        this.storePreferences(preferences); // Cache locally
        
        return preferences;
      }),
      catchError(error => {
        console.warn('Failed to load user preferences from API, using local storage:', error);
        const storedPrefs = this.getStoredPreferences();
        this._state.update(state => ({
          ...state,
          userPreferences: storedPrefs,
          isLoading: false,
          error: 'Failed to load user preferences'
        }));
        this.updateCurrentTheme(storedPrefs);
        return of(storedPrefs);
      })
    );
  }

  public updateThemeMode(mode: ThemeMode): Observable<UserThemePreferences> {
    const newPreferences: UserThemePreferences = {
      ...this.userPreferences(),
      themeMode: mode,
      syncWithSystem: mode === ThemeMode.SYSTEM
    };

    return this.saveUserPreferences(newPreferences);
  }

  public updateThemeVariant(mode: 'light' | 'dark', variantId: string): Observable<UserThemePreferences> {
    const currentPrefs = this.userPreferences();
    const newPreferences: UserThemePreferences = {
      ...currentPrefs,
      [mode === 'light' ? 'lightThemeVariantId' : 'darkThemeVariantId']: variantId
    };

    return this.saveUserPreferences(newPreferences);
  }

  public toggleSystemSync(enabled: boolean): Observable<UserThemePreferences> {
    const newPreferences: UserThemePreferences = {
      ...this.userPreferences(),
      syncWithSystem: enabled,
      themeMode: enabled ? ThemeMode.SYSTEM : (this.systemPrefersDark() ? ThemeMode.DARK : ThemeMode.LIGHT)
    };

    // Store locally first
    this.storePreferences(newPreferences);

    // Update API if user is authenticated
    if (this.currentUserId && enabled !== this.userPreferences().syncWithSystem) {
      const syncDto: UpdateThemeSyncDto = {
        syncWithSystem: enabled
      };

      return this.themesApiService.apiThemesUsersUserIdSyncPut$Json({
        userId: this.currentUserId,
        body: syncDto
      }).pipe(
        tap(() => {
          this._state.update(state => ({
            ...state,
            userPreferences: newPreferences,
            isLoading: false
          }));
          this.updateCurrentTheme(newPreferences);
        }),
        map(() => newPreferences),
        catchError(error => {
          console.warn('Failed to sync system preference to API:', error);
          // Still apply locally even if API fails
          this._state.update(state => ({
            ...state,
            userPreferences: newPreferences,
            error: 'Failed to sync system preference'
          }));
          this.updateCurrentTheme(newPreferences);
          return of(newPreferences);
        })
      );
    }

    // No API call needed, just return the updated preferences
    this._state.update(state => ({
      ...state,
      userPreferences: newPreferences
    }));
    this.updateCurrentTheme(newPreferences);
    return of(newPreferences);
  }

  private saveUserPreferences(preferences: UserThemePreferences): Observable<UserThemePreferences> {
    this._state.update(state => ({ ...state, isLoading: true, error: null }));
    
    // Always store locally first as a fallback
    this.storePreferences(preferences);
    
    if (!this.currentUserId) {
      // If no user ID, just use local storage
      this._state.update(state => ({
        ...state,
        userPreferences: preferences,
        isLoading: false
      }));
      this.updateCurrentTheme(preferences);
      return of(preferences);
    }

    const updateDto: UpdateUserThemeDto = {
      lightThemeId: 'light', // Default light theme ID
      lightAccentId: preferences.lightThemeVariantId,
      darkThemeId: 'dark', // Default dark theme ID
      darkAccentId: preferences.darkThemeVariantId
    };

    return this.themesApiService.apiThemesUsersUserIdPut$Json({ 
      userId: this.currentUserId, 
      body: updateDto 
    }).pipe(
      tap(() => {
        this._state.update(state => ({
          ...state,
          userPreferences: preferences,
          isLoading: false
        }));
        this.updateCurrentTheme(preferences);
      }),
      map(() => preferences),
      catchError(error => {
        console.warn('Failed to save preferences to API, kept local changes:', error);
        this._state.update(state => ({
          ...state,
          isLoading: false,
          error: 'Failed to save preferences'
        }));
        // Still apply locally even if API fails
        this.updateCurrentTheme(preferences);
        return of(preferences);
      })
    );
  }

  private updateCurrentTheme(preferences: UserThemePreferences): void {
    const effectiveMode = preferences.syncWithSystem 
      ? (this.systemPrefersDark() ? 'dark' : 'light')
      : preferences.themeMode;

    const themeId = effectiveMode === 'dark' ? preferences.darkThemeVariantId : preferences.lightThemeVariantId;
    const theme = this.findThemeVariant(themeId);
    
    if (theme) {
      this._state.update(state => ({
        ...state,
        currentTheme: theme
      }));
    }
  }

  private findThemeVariant(variantId: string): ThemeVariant | null {
    for (const theme of this.availableThemes()) {
      const variant = theme.variants.find(v => v.id === variantId);
      if (variant) return variant;
    }
    return null;
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') return;
    
    const currentTheme = this.currentTheme();
    const effectiveMode = this.effectiveThemeMode();
    
    // Apply theme mode class
    document.documentElement.classList.remove('light-mode', 'dark-mode');
    document.documentElement.classList.add(`${effectiveMode}-mode`);
    
    // Apply CSS custom properties for accent colors
    // These should ONLY affect icons, error messages, and badges
    const root = document.documentElement;
    Object.entries(currentTheme.accentColors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Set data attribute for theme variant
    document.documentElement.setAttribute('data-theme-variant', currentTheme.id);
    
    // Set specific accent properties that should be restricted
    // These will be used only for icons, error messages, and badges
    root.style.setProperty('--accent-primary', currentTheme.accentColors.primary);
    root.style.setProperty('--accent-danger', currentTheme.accentColors.danger);
    root.style.setProperty('--accent-success', currentTheme.accentColors.success);
    root.style.setProperty('--accent-warning', currentTheme.accentColors.warning);
    root.style.setProperty('--accent-info', currentTheme.accentColors.info);
  }

  private getStoredPreferences(): UserThemePreferences {
    const stored = this.localStorageService.getItem<UserThemePreferences>(this.THEME_PREFERENCES_KEY);
    return stored || this.defaultPreferences;
  }

  private storePreferences(preferences: UserThemePreferences): void {
    this.localStorageService.setItem(this.THEME_PREFERENCES_KEY, preferences);
  }
}