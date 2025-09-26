import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { ThemesService } from '../../api/services/themes.service';
import { AuthService } from '../../auth/services/auth.service';
import { ThemeDto, UserThemeDto, UpdateUserThemeDto, UpdateThemeSyncDto } from '../../api/models';

export interface ThemeMode {
  mode: 'light' | 'dark' | 'system';
  isDarkTheme: boolean;
  effectiveTheme: ThemeDto | null;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private availableThemes$ = new BehaviorSubject<ThemeDto[]>([]);
  private userThemePreferences$ = new BehaviorSubject<UserThemeDto | null>(null);
  private systemPrefersDark$ = new BehaviorSubject<boolean>(false);

  // Public observables
  public availableThemes = this.availableThemes$.asObservable();
  public userThemePreferences = this.userThemePreferences$.asObservable();
  public systemPrefersDark = this.systemPrefersDark$.asObservable();

  // Computed theme mode
  public currentThemeMode$: Observable<ThemeMode> = combineLatest([
    this.userThemePreferences$,
    this.systemPrefersDark$,
    this.availableThemes$
  ]).pipe(
    map(([preferences, systemDark, themes]) => {
      if (!preferences) {
        return { mode: 'system', isDarkTheme: systemDark, effectiveTheme: null };
      }

      if (preferences.syncWithSystem) {
        const effectiveTheme = systemDark 
          ? themes.find(t => t.id === preferences.darkThemeId) || null
          : themes.find(t => t.id === preferences.lightThemeId) || null;
        
        const themeMode = {
          mode: 'system' as const,
          isDarkTheme: systemDark,
          effectiveTheme
        };
        
        // Auto-apply the effective theme
        if (effectiveTheme) {
          this.applyTheme(effectiveTheme);
        }
        
        return themeMode;
      }

      // For manual mode, we need to determine current mode based on active theme
      const lightTheme = themes.find(t => t.id === preferences.lightThemeId);
      const darkTheme = themes.find(t => t.id === preferences.darkThemeId);
      
      // For now, default to light mode when not syncing with system
      const themeMode = {
        mode: 'light' as const,
        isDarkTheme: false,
        effectiveTheme: lightTheme || null
      };
      
      // Auto-apply the effective theme
      if (lightTheme) {
        this.applyTheme(lightTheme);
      }
      
      return themeMode;
    })
  );

  constructor(
    private themesService: ThemesService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeThemeService();
  }

  private initializeThemeService(): void {
    // Only initialize browser-specific features when running in browser
    if (isPlatformBrowser(this.platformId)) {
      this.initializeBrowserFeatures();
    }

    // Load themes immediately for demo purposes
    this.loadAvailableThemes();
    
    // For demo, load mock user preferences
    this.loadUserThemePreferences('demo-user');

    // Load themes when user is authenticated (for production)
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadAvailableThemes();
        this.loadUserThemePreferences(user.id);
      }
    });
  }

  private initializeBrowserFeatures(): void {
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark$.next(mediaQuery.matches);
      
      mediaQuery.addEventListener('change', (e) => {
        this.systemPrefersDark$.next(e.matches);
      });
    }
  }

  /**
   * Load all available themes from the API
   */
  private loadAvailableThemes(): void {
    // For demo/testing purposes, provide mock themes when API is not available
    const mockThemes: ThemeDto[] = [
      {
        id: 'light-default',
        name: 'Light Default',
        isDarkTheme: false,
        isBuiltIn: true,
        backgroundColor: '#ffffff',
        secondaryBackgroundColor: '#f8fafc',
        textColor: '#0f172a',
        secondaryTextColor: '#64748b',
        highlightColor: '#22c55e',
        borderColor: '#e2e8f0',
        iconColor: '#64748b',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444'
      },
      {
        id: 'light-blue',
        name: 'Light Blue',
        isDarkTheme: false,
        isBuiltIn: true,
        backgroundColor: '#ffffff',
        secondaryBackgroundColor: '#f0f9ff',
        textColor: '#0f172a',
        secondaryTextColor: '#64748b',
        highlightColor: '#3b82f6',
        borderColor: '#e0e7ff',
        iconColor: '#64748b',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444'
      },
      {
        id: 'dark-default',
        name: 'Dark Default',
        isDarkTheme: true,
        isBuiltIn: true,
        backgroundColor: '#0f172a',
        secondaryBackgroundColor: '#1e293b',
        textColor: '#f1f5f9',
        secondaryTextColor: '#94a3b8',
        highlightColor: '#22c55e',
        borderColor: '#334155',
        iconColor: '#94a3b8',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444'
      },
      {
        id: 'dark-purple',
        name: 'Dark Purple',
        isDarkTheme: true,
        isBuiltIn: true,
        backgroundColor: '#1e1b4b',
        secondaryBackgroundColor: '#312e81',
        textColor: '#f1f5f9',
        secondaryTextColor: '#a5b4fc',
        highlightColor: '#8b5cf6',
        borderColor: '#4c1d95',
        iconColor: '#a5b4fc',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444'
      }
    ];

    this.themesService.apiThemesGet$Json().subscribe({
      next: (response) => {
        if (response.data) {
          this.availableThemes$.next(response.data);
        } else {
          // Use mock data if no response data
          this.availableThemes$.next(mockThemes);
        }
      },
      error: (error) => {
        console.warn('Failed to load themes from API, using mock data:', error);
        this.availableThemes$.next(mockThemes);
      }
    });
  }

  /**
   * Load user theme preferences from the API
   */
  private loadUserThemePreferences(userId: string): void {
    // For demo/testing purposes, provide mock user preferences
    const mockUserPreferences: UserThemeDto = {
      lightThemeId: 'light-default',
      darkThemeId: 'dark-default',
      syncWithSystem: false,
      lightTheme: {
        id: 'light-default',
        name: 'Light Default',
        isDarkTheme: false,
        isBuiltIn: true,
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        highlightColor: '#22c55e'
      },
      darkTheme: {
        id: 'dark-default',
        name: 'Dark Default',
        isDarkTheme: true,
        isBuiltIn: true,
        backgroundColor: '#0f172a',
        textColor: '#f1f5f9',
        highlightColor: '#22c55e'
      }
    };

    this.themesService.apiThemesUsersUserIdGet$Json({ userId }).subscribe({
      next: (response) => {
        if (response.data) {
          this.userThemePreferences$.next(response.data);
        } else {
          // Use mock data if no response data
          this.userThemePreferences$.next(mockUserPreferences);
        }
      },
      error: (error) => {
        console.warn('Failed to load user preferences from API, using mock data:', error);
        this.userThemePreferences$.next(mockUserPreferences);
      }
    });
  }

  /**
   * Update user theme preferences
   */
  public updateThemePreferences(lightThemeId: string, darkThemeId: string): Observable<UserThemeDto | null> {
    // For demo purposes, handle mock update
    const mockUserPreferences: UserThemeDto = {
      lightThemeId,
      darkThemeId,
      syncWithSystem: this.userThemePreferences$.value?.syncWithSystem || false,
      lightTheme: this.availableThemes$.value.find(t => t.id === lightThemeId),
      darkTheme: this.availableThemes$.value.find(t => t.id === darkThemeId)
    };

    const user = this.authService.getCurrentUser();
    if (!user) {
      // Demo mode - update local state without API call
      this.userThemePreferences$.next(mockUserPreferences);
      return new Observable(observer => {
        observer.next(mockUserPreferences);
        observer.complete();
      });
    }

    const updateDto: UpdateUserThemeDto = {
      lightThemeId,
      darkThemeId
    };

    return new Observable(observer => {
      this.themesService.apiThemesUsersUserIdPut$Json({ 
        userId: user.id, 
        body: updateDto 
      }).subscribe({
        next: (response) => {
          if (response.data) {
            this.userThemePreferences$.next(response.data);
            observer.next(response.data);
          } else {
            observer.next(null);
          }
          observer.complete();
        },
        error: (error) => {
          console.error('Failed to update theme preferences:', error);
          // Fallback to demo mode
          this.userThemePreferences$.next(mockUserPreferences);
          observer.next(mockUserPreferences);
          observer.complete();
        }
      });
    });
  }

  /**
   * Toggle system sync preference
   */
  public toggleSystemSync(syncWithSystem: boolean): Observable<UserThemeDto | null> {
    // For demo purposes, handle mock update
    const currentPrefs = this.userThemePreferences$.value;
    const mockUserPreferences: UserThemeDto = {
      lightThemeId: currentPrefs?.lightThemeId || 'light-default',
      darkThemeId: currentPrefs?.darkThemeId || 'dark-default',
      syncWithSystem,
      lightTheme: currentPrefs?.lightTheme,
      darkTheme: currentPrefs?.darkTheme
    };

    const user = this.authService.getCurrentUser();
    if (!user) {
      // Demo mode - update local state without API call
      this.userThemePreferences$.next(mockUserPreferences);
      return new Observable(observer => {
        observer.next(mockUserPreferences);
        observer.complete();
      });
    }

    const updateDto: UpdateThemeSyncDto = {
      syncWithSystem
    };

    return new Observable(observer => {
      this.themesService.apiThemesUsersUserIdSyncPut$Json({
        userId: user.id,
        body: updateDto
      }).subscribe({
        next: (response) => {
          if (response.data) {
            this.userThemePreferences$.next(response.data);
            observer.next(response.data);
          } else {
            observer.next(null);
          }
          observer.complete();
        },
        error: (error) => {
          console.error('Failed to update system sync preference:', error);
          // Fallback to demo mode
          this.userThemePreferences$.next(mockUserPreferences);
          observer.next(mockUserPreferences);
          observer.complete();
        }
      });
    });
  }

  /**
   * Get light themes only
   */
  public getLightThemes(): Observable<ThemeDto[]> {
    return this.availableThemes$.pipe(
      map(themes => themes.filter(theme => !theme.isDarkTheme))
    );
  }

  /**
   * Get dark themes only
   */
  public getDarkThemes(): Observable<ThemeDto[]> {
    return this.availableThemes$.pipe(
      map(themes => themes.filter(theme => theme.isDarkTheme))
    );
  }

  /**
   * Apply theme CSS custom properties to the document
   */
  public applyTheme(theme: ThemeDto): void {
    const root = document.documentElement;
    
    if (theme.backgroundColor) root.style.setProperty('--theme-bg-primary', theme.backgroundColor);
    if (theme.secondaryBackgroundColor) root.style.setProperty('--theme-bg-secondary', theme.secondaryBackgroundColor);
    if (theme.textColor) root.style.setProperty('--theme-text-primary', theme.textColor);
    if (theme.secondaryTextColor) root.style.setProperty('--theme-text-secondary', theme.secondaryTextColor);
    if (theme.highlightColor) root.style.setProperty('--theme-highlight', theme.highlightColor);
    if (theme.borderColor) root.style.setProperty('--theme-border', theme.borderColor);
    if (theme.iconColor) root.style.setProperty('--theme-icon', theme.iconColor);
    if (theme.successColor) root.style.setProperty('--theme-success', theme.successColor);
    if (theme.warningColor) root.style.setProperty('--theme-warning', theme.warningColor);
    if (theme.errorColor) root.style.setProperty('--theme-error', theme.errorColor);
  }
}