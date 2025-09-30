import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from './local-storage.service';
import { ThemesService as ApiThemesService } from '../../api/services/themes.service';
import { CompleteThemeDto } from '../../api/models/complete-theme-dto';
import { UserThemeDto } from '../../api/models/user-theme-dto';
import { UpdateUserThemeDto } from '../../api/models/update-user-theme-dto';
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

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly httpClient = inject(HttpClient);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly apiThemesService = inject(ApiThemesService);
  private readonly THEME_PREFERENCES_KEY = 'theme-preferences';
  private readonly CURRENT_USER_ID_KEY = 'current-user-id';

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

  private initializeTheme(): void {
    // In a real app, this would load from storage or API
    this.loadUserPreferences().subscribe();
  }

  public loadThemes(): Observable<Theme[]> {
    this._state.update(state => ({ ...state, isLoading: true, error: null }));
    
    // Try to load from API first, fallback to default themes
    return this.apiThemesService.apiThemesGet$Json().pipe(
      map(response => {
        if (response.success && response.data) {
          // Convert API themes to our Theme model
          return this.convertApiThemesToThemes(response.data);
        }
        return this.defaultThemes;
      }),
      tap(themes => {
        this._state.update(state => ({
          ...state,
          availableThemes: themes,
          isLoading: false
        }));
      }),
      catchError(error => {
        console.warn('Failed to load themes from API, using defaults:', error);
        this._state.update(state => ({
          ...state,
          availableThemes: this.defaultThemes,
          isLoading: false,
          error: null // Don't show error for fallback
        }));
        return of(this.defaultThemes);
      })
    );
  }

  public loadUserPreferences(userId?: string): Observable<UserThemePreferences> {
    this._state.update(state => ({ ...state, isLoading: true, error: null }));
    
    const currentUserId = userId || this.localStorageService.getItem<string>(this.CURRENT_USER_ID_KEY);
    
    if (currentUserId) {
      // Try to load from API
      return this.apiThemesService.apiThemesUsersUserIdGet$Json({ userId: currentUserId }).pipe(
        map(response => {
          if (response.success && response.data) {
            return this.convertApiUserThemeToPreferences(response.data);
          }
          return this.getStoredPreferences();
        }),
        tap(preferences => {
          this._state.update(state => ({
            ...state,
            userPreferences: preferences,
            isLoading: false
          }));
          this.updateCurrentTheme(preferences);
        }),
        catchError(error => {
          console.warn('Failed to load user preferences from API, using local storage:', error);
          const storedPrefs = this.getStoredPreferences();
          this._state.update(state => ({
            ...state,
            userPreferences: storedPrefs,
            isLoading: false,
            error: null
          }));
          this.updateCurrentTheme(storedPrefs);
          return of(storedPrefs);
        })
      );
    } else {
      // No user ID, use local storage only
      const storedPrefs = this.getStoredPreferences();
      return of(storedPrefs).pipe(
        tap(preferences => {
          this._state.update(state => ({
            ...state,
            userPreferences: preferences,
            isLoading: false
          }));
          this.updateCurrentTheme(preferences);
        })
      );
    }
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

    return this.saveUserPreferences(newPreferences);
  }

  private saveUserPreferences(preferences: UserThemePreferences): Observable<UserThemePreferences> {
    this._state.update(state => ({ ...state, isLoading: true, error: null }));
    
    const currentUserId = this.localStorageService.getItem<string>(this.CURRENT_USER_ID_KEY);
    
    if (currentUserId) {
      // Try to save to API
      const updateDto: UpdateUserThemeDto = {
        lightThemeId: 'light',
        lightAccentId: preferences.lightThemeVariantId,
        darkThemeId: 'dark',
        darkAccentId: preferences.darkThemeVariantId
      };

      return this.apiThemesService.apiThemesUsersUserIdPut$Json({ 
        userId: currentUserId, 
        body: updateDto 
      }).pipe(
        map(response => {
          if (response.success && response.data) {
            return this.convertApiUserThemeToPreferences(response.data);
          }
          return preferences;
        }),
        tap(prefs => {
          this.storePreferences(prefs);
          this._state.update(state => ({
            ...state,
            userPreferences: prefs,
            isLoading: false
          }));
          this.updateCurrentTheme(prefs);
        }),
        catchError(error => {
          console.warn('Failed to save preferences to API, saving locally only:', error);
          // Save locally even if API fails
          this.storePreferences(preferences);
          this._state.update(state => ({
            ...state,
            userPreferences: preferences,
            isLoading: false,
            error: null
          }));
          this.updateCurrentTheme(preferences);
          return of(preferences);
        })
      );
    } else {
      // No user ID, save locally only
      return of(preferences).pipe(
        tap(prefs => {
          this.storePreferences(prefs);
          this._state.update(state => ({
            ...state,
            userPreferences: prefs,
            isLoading: false
          }));
          this.updateCurrentTheme(prefs);
        })
      );
    }
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
    const root = document.documentElement;
    Object.entries(currentTheme.accentColors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Set universal theme variables for consistent application
    root.style.setProperty('--theme-primary', currentTheme.accentColors.primary);
    root.style.setProperty('--theme-secondary', currentTheme.accentColors.secondary);
    root.style.setProperty('--theme-success', currentTheme.accentColors.success);
    root.style.setProperty('--theme-danger', currentTheme.accentColors.danger);
    root.style.setProperty('--theme-warning', currentTheme.accentColors.warning);
    root.style.setProperty('--theme-info', currentTheme.accentColors.info);
    
    // Set data attribute for theme variant
    document.documentElement.setAttribute('data-theme-variant', currentTheme.id);
    document.documentElement.setAttribute('data-theme-mode', effectiveMode);
    
    // Dispatch custom event for components that need to react to theme changes
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { 
        theme: currentTheme, 
        mode: effectiveMode 
      } 
    }));
  }

  private getStoredPreferences(): UserThemePreferences {
    const stored = this.localStorageService.getItem<UserThemePreferences>(this.THEME_PREFERENCES_KEY);
    return stored || this.defaultPreferences;
  }

  private storePreferences(preferences: UserThemePreferences): void {
    this.localStorageService.setItem(this.THEME_PREFERENCES_KEY, preferences);
  }

  // Set the current user ID for API calls
  public setCurrentUserId(userId: string | null): void {
    if (userId) {
      this.localStorageService.setItem(this.CURRENT_USER_ID_KEY, userId);
    } else {
      this.localStorageService.removeItem(this.CURRENT_USER_ID_KEY);
    }
  }

  // Clear all theme-related data (called on logout)
  public clearThemeData(): void {
    this.localStorageService.removeItem(this.THEME_PREFERENCES_KEY);
    this.localStorageService.removeItem(this.CURRENT_USER_ID_KEY);
    // Reset to default preferences
    this._state.update(state => ({
      ...state,
      userPreferences: this.defaultPreferences
    }));
    this.updateCurrentTheme(this.defaultPreferences);
  }

  // Helper method to convert API themes to our Theme model
  private convertApiThemesToThemes(apiThemes: any[]): Theme[] {
    // This would convert the API response to our Theme model
    // For now, return default themes as the API structure may vary
    return this.defaultThemes;
  }

  // Helper method to convert API user theme to our UserThemePreferences model
  private convertApiUserThemeToPreferences(apiUserTheme: UserThemeDto): UserThemePreferences {
    return {
      lightThemeVariantId: apiUserTheme.lightAccentId || this.defaultPreferences.lightThemeVariantId,
      darkThemeVariantId: apiUserTheme.darkAccentId || this.defaultPreferences.darkThemeVariantId,
      themeMode: apiUserTheme.syncWithSystem ? ThemeMode.SYSTEM : ThemeMode.LIGHT,
      syncWithSystem: apiUserTheme.syncWithSystem ?? this.defaultPreferences.syncWithSystem
    };
  }

  // Helper method to parse theme mode from API
  private parseThemeMode(mode?: string): ThemeMode {
    switch (mode?.toLowerCase()) {
      case 'light':
        return ThemeMode.LIGHT;
      case 'dark':
        return ThemeMode.DARK;
      case 'system':
        return ThemeMode.SYSTEM;
      default:
        return ThemeMode.SYSTEM;
    }
  }
}