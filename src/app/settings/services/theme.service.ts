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
        
        return {
          mode: 'system' as const,
          isDarkTheme: systemDark,
          effectiveTheme
        };
      }

      // For manual mode, we need to determine current mode based on active theme
      const lightTheme = themes.find(t => t.id === preferences.lightThemeId);
      const darkTheme = themes.find(t => t.id === preferences.darkThemeId);
      
      // For now, default to light mode when not syncing with system
      // This could be enhanced with additional user preference for manual mode
      return {
        mode: 'light' as const,
        isDarkTheme: false,
        effectiveTheme: lightTheme || null
      };
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

    // Load themes when user is authenticated
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
    this.themesService.apiThemesGet$Json().subscribe({
      next: (response) => {
        if (response.data) {
          this.availableThemes$.next(response.data);
        }
      },
      error: (error) => {
        console.error('Failed to load available themes:', error);
      }
    });
  }

  /**
   * Load user theme preferences from the API
   */
  private loadUserThemePreferences(userId: string): void {
    this.themesService.apiThemesUsersUserIdGet$Json({ userId }).subscribe({
      next: (response) => {
        if (response.data) {
          this.userThemePreferences$.next(response.data);
        }
      },
      error: (error) => {
        console.error('Failed to load user theme preferences:', error);
      }
    });
  }

  /**
   * Update user theme preferences
   */
  public updateThemePreferences(lightThemeId: string, darkThemeId: string): Observable<UserThemeDto | null> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
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
          observer.error(error);
        }
      });
    });
  }

  /**
   * Toggle system sync preference
   */
  public toggleSystemSync(syncWithSystem: boolean): Observable<UserThemeDto | null> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
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
          observer.error(error);
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