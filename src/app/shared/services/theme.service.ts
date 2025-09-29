import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest, map, catchError, of } from 'rxjs';
import { ThemesService } from '../../api/services/themes.service';
import { ThemeDto } from '../../api/models/theme-dto';
import { UserThemeDto } from '../../api/models/user-theme-dto';
import { UpdateUserThemeDto } from '../../api/models/update-user-theme-dto';
import { UpdateThemeSyncDto } from '../../api/models/update-theme-sync-dto';
import { DOCUMENT } from '@angular/common';

export interface ThemeState {
  availableThemes: ThemeDto[];
  userThemePreferences: UserThemeDto | null;
  currentTheme: ThemeDto | null;
  isSystemDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ThemeContextValue extends ThemeState {
  // Actions
  setUserThemePreferences: (lightThemeId: string, darkThemeId: string) => Promise<void>;
  updateSystemSync: (syncWithSystem: boolean) => Promise<void>;
  loadThemes: () => Promise<void>;
  loadUserPreferences: (userId: string) => Promise<void>;
  getCurrentTheme: () => ThemeDto | null;
}

/**
 * Global theme management service
 * Handles theme loading, user preferences, and system sync
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeStateSubject = new BehaviorSubject<ThemeState>({
    availableThemes: [],
    userThemePreferences: null,
    currentTheme: null,
    isSystemDarkMode: false,
    isLoading: false,
    error: null
  });

  public readonly themeState$ = this.themeStateSubject.asObservable();
  
  private mediaQuery: MediaQueryList;
  private currentUserId: string | null = null;

  constructor(
    private themesService: ThemesService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Listen for system dark mode changes (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.updateSystemDarkMode();
      this.mediaQuery.addEventListener('change', () => this.updateSystemDarkMode());
    } else {
      // Default for SSR
      this.mediaQuery = null as any;
    }
  }

  /**
   * Initialize theme service with user ID
   */
  async initialize(userId: string): Promise<void> {
    if (this.currentUserId === userId) {
      return; // Already initialized for this user
    }
    
    this.currentUserId = userId;
    this.setLoading(true);
    
    try {
      await Promise.all([
        this.loadThemes(),
        this.loadUserPreferences(userId)
      ]);
    } catch (error) {
      this.setError('Failed to initialize theme service');
      console.error('Theme service initialization error:', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Load all available themes
   */
  async loadThemes(): Promise<void> {
    try {
      const response = await this.themesService.apiThemesGet$Json().toPromise();
      if (response?.success && response.data) {
        this.updateState({ availableThemes: response.data });
        this.recalculateCurrentTheme();
      }
    } catch (error) {
      this.setError('Failed to load themes');
      throw error;
    }
  }

  /**
   * Load user theme preferences
   */
  async loadUserPreferences(userId: string): Promise<void> {
    if (!userId) return;
    
    try {
      const response = await this.themesService.apiThemesUsersUserIdGet$Json({ userId }).toPromise();
      if (response?.success && response.data) {
        this.updateState({ userThemePreferences: response.data });
        this.recalculateCurrentTheme();
      }
    } catch (error) {
      this.setError('Failed to load user preferences');
      throw error;
    }
  }

  /**
   * Update user theme preferences
   */
  async setUserThemePreferences(lightThemeId: string, darkThemeId: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not initialized');
    }

    const updateDto: UpdateUserThemeDto = {
      lightThemeId,
      darkThemeId
    };

    try {
      const response = await this.themesService.apiThemesUsersUserIdPut$Json({
        userId: this.currentUserId,
        body: updateDto
      }).toPromise();

      if (response?.success && response.data) {
        this.updateState({ userThemePreferences: response.data });
        this.recalculateCurrentTheme();
        this.applyCurrentTheme();
      }
    } catch (error) {
      this.setError('Failed to update theme preferences');
      throw error;
    }
  }

  /**
   * Update system sync preference
   */
  async updateSystemSync(syncWithSystem: boolean): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not initialized');
    }

    const updateDto: UpdateThemeSyncDto = {
      syncWithSystem
    };

    try {
      const response = await this.themesService.apiThemesUsersUserIdSyncPut$Json({
        userId: this.currentUserId,
        body: updateDto
      }).toPromise();

      if (response?.success && response.data) {
        this.updateState({ userThemePreferences: response.data });
        this.recalculateCurrentTheme();
        this.applyCurrentTheme();
      }
    } catch (error) {
      this.setError('Failed to update system sync preference');
      throw error;
    }
  }

  /**
   * Get current effective theme
   */
  getCurrentTheme(): ThemeDto | null {
    const state = this.themeStateSubject.value;
    return state.currentTheme;
  }

  /**
   * Get theme context value for providers
   */
  getThemeContext(): Observable<ThemeContextValue> {
    return this.themeState$.pipe(
      map(state => ({
        ...state,
        setUserThemePreferences: this.setUserThemePreferences.bind(this),
        updateSystemSync: this.updateSystemSync.bind(this),
        loadThemes: this.loadThemes.bind(this),
        loadUserPreferences: this.loadUserPreferences.bind(this),
        getCurrentTheme: this.getCurrentTheme.bind(this)
      }))
    );
  }

  /**
   * Apply the current theme to the DOM
   */
  applyCurrentTheme(): void {
    const theme = this.getCurrentTheme();
    if (!theme) return;

    const root = this.document.documentElement;
    
    // Apply CSS custom properties
    if (theme.backgroundColor) root.style.setProperty('--theme-bg-primary', theme.backgroundColor);
    if (theme.secondaryBackgroundColor) root.style.setProperty('--theme-bg-secondary', theme.secondaryBackgroundColor);
    if (theme.textColor) root.style.setProperty('--theme-text-primary', theme.textColor);
    if (theme.secondaryTextColor) root.style.setProperty('--theme-text-secondary', theme.secondaryTextColor);
    if (theme.borderColor) root.style.setProperty('--theme-border', theme.borderColor);
    if (theme.highlightColor) root.style.setProperty('--theme-accent', theme.highlightColor);
    if (theme.iconColor) root.style.setProperty('--theme-icon', theme.iconColor);
    if (theme.successColor) root.style.setProperty('--theme-success', theme.successColor);
    if (theme.warningColor) root.style.setProperty('--theme-warning', theme.warningColor);
    if (theme.errorColor) root.style.setProperty('--theme-error', theme.errorColor);

    // Add theme class to body for additional styling
    this.document.body.className = this.document.body.className.replace(/theme-\w+/g, '');
    this.document.body.classList.add(theme.isDarkTheme ? 'theme-dark' : 'theme-light');
    if (theme.id) {
      this.document.body.classList.add(`theme-${theme.id}`);
    }
  }

  /**
   * Check if theming should be applied (excludes login/signup pages)
   */
  shouldApplyTheme(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false; // Don't apply themes during SSR
    }
    
    const currentPath = window.location.pathname;
    return !currentPath.includes('/auth/');
  }

  private updateSystemDarkMode(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // Default to light mode during SSR
      this.updateState({ isSystemDarkMode: false });
      return;
    }
    
    const isSystemDarkMode = this.mediaQuery.matches;
    this.updateState({ isSystemDarkMode });
    this.recalculateCurrentTheme();
    
    // Apply theme if it should be applied to current page
    if (this.shouldApplyTheme()) {
      this.applyCurrentTheme();
    }
  }

  private recalculateCurrentTheme(): void {
    const state = this.themeStateSubject.value;
    const { userThemePreferences, availableThemes, isSystemDarkMode } = state;

    if (!userThemePreferences || !availableThemes.length) {
      this.updateState({ currentTheme: null });
      return;
    }

    let targetThemeId: string | undefined;

    if (userThemePreferences.syncWithSystem) {
      // Use system preference to choose light or dark theme
      targetThemeId = isSystemDarkMode 
        ? userThemePreferences.darkThemeId 
        : userThemePreferences.lightThemeId;
    } else {
      // For now, use light theme when not syncing with system
      // This could be enhanced to remember user's last manual choice
      targetThemeId = userThemePreferences.lightThemeId;
    }

    const currentTheme = availableThemes.find(theme => theme.id === targetThemeId) || null;
    this.updateState({ currentTheme });
  }

  private updateState(partialState: Partial<ThemeState>): void {
    const currentState = this.themeStateSubject.value;
    this.themeStateSubject.next({
      ...currentState,
      ...partialState,
      error: partialState.error || null // Reset error unless explicitly set
    });
  }

  private setLoading(isLoading: boolean): void {
    this.updateState({ isLoading });
  }

  private setError(error: string): void {
    this.updateState({ error, isLoading: false });
  }
}