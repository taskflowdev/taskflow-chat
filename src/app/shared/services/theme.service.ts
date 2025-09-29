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

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly httpClient = inject(HttpClient);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly THEME_PREFERENCES_KEY = 'theme-preferences';

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
    
    // In a real implementation, this would call the API
    // return this.httpClient.get<ThemeApiResponse>('/api/themes')
    
    return of({ themes: this.defaultThemes }).pipe(
      map(response => response.themes),
      tap(themes => {
        this._state.update(state => ({
          ...state,
          availableThemes: themes,
          isLoading: false
        }));
      }),
      catchError(error => {
        this._state.update(state => ({
          ...state,
          isLoading: false,
          error: 'Failed to load themes'
        }));
        return of([]);
      })
    );
  }

  public loadUserPreferences(): Observable<UserThemePreferences> {
    this._state.update(state => ({ ...state, isLoading: true, error: null }));
    
    // In a real implementation, this would call the API
    // return this.httpClient.get<UserThemePreferencesDto>('/api/users/me/theme')
    
    const storedPrefs = this.getStoredPreferences();
    return of(storedPrefs).pipe(
      tap(preferences => {
        this._state.update(state => ({
          ...state,
          userPreferences: preferences,
          isLoading: false
        }));
        this.updateCurrentTheme(preferences);
      }),
      catchError(error => {
        this._state.update(state => ({
          ...state,
          isLoading: false,
          error: 'Failed to load user preferences'
        }));
        return of(this.defaultPreferences);
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

    return this.saveUserPreferences(newPreferences);
  }

  private saveUserPreferences(preferences: UserThemePreferences): Observable<UserThemePreferences> {
    this._state.update(state => ({ ...state, isLoading: true, error: null }));
    
    // In a real implementation, this would call the API
    // return this.httpClient.put<UserThemePreferencesDto>('/api/users/me/theme', preferences)
    
    return of(preferences).pipe(
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
        this._state.update(state => ({
          ...state,
          isLoading: false,
          error: 'Failed to save preferences'
        }));
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
    const root = document.documentElement;
    Object.entries(currentTheme.accentColors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Set data attribute for theme variant
    document.documentElement.setAttribute('data-theme-variant', currentTheme.id);
  }

  private getStoredPreferences(): UserThemePreferences {
    const stored = this.localStorageService.getItem<UserThemePreferences>(this.THEME_PREFERENCES_KEY);
    return stored || this.defaultPreferences;
  }

  private storePreferences(preferences: UserThemePreferences): void {
    this.localStorageService.setItem(this.THEME_PREFERENCES_KEY, preferences);
  }
}