import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, throwError, timer, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, takeUntil } from 'rxjs/operators';
import { SettingsService } from '../../api/services/settings.service';
import { CatalogService } from '../../api/services/catalog.service';
import { EffectiveSettingsResponse } from '../../api/models/effective-settings-response';
import { CatalogResponse } from '../../api/models/catalog-response';
import { UpdateSettingsRequest } from '../../api/models/update-settings-request';
import { ThemeService, ThemeMode, FontSize } from './theme.service';
import { SettingsCacheService } from './settings-cache.service';

/**
 * Settings keys for language preference
 * Used by I18nService integration
 */
export const APPEARANCE_SETTING_CATEGORY = 'appearance';
export const THEME_SETTING_KEY = 'appearance.theme';
export const FONTSIZE_SETTING_KEY = 'appearance.fontSize';
export const LANGUAGE_SETTING_CATEGORY = 'language';
export const LANGUAGE_SETTING_KEY = 'language.interface';

/**
 * Interface for I18nService to avoid circular dependency
 * Defines the minimal contract needed by UserSettingsService
 */
interface I18nServiceInterface {
  /**
   * Change the current language
   * Returns a Promise that resolves when the language change is complete
   */
  setLanguage(lang: string): Promise<void>;
  
  /**
   * Observable indicating if translations are currently loading
   * Used to show loading states in the UI during language changes
   */
  loading$: Observable<boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService implements OnDestroy {
  private catalogSubject = new BehaviorSubject<CatalogResponse | null>(null);
  public catalog$: Observable<CatalogResponse | null> = this.catalogSubject.asObservable();

  private effectiveSettingsSubject = new BehaviorSubject<EffectiveSettingsResponse | null>(null);
  public effectiveSettings$: Observable<EffectiveSettingsResponse | null> = this.effectiveSettingsSubject.asObservable();

  private saveQueue = new Subject<{ category: string; key: string; value: any }>();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  // Background refresh management
  private readonly BACKGROUND_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private backgroundRefreshSubscription?: any;
  private stopBackgroundRefresh$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  // Cached I18nService reference to avoid circular dependency
  private _i18nService: I18nServiceInterface | null = null;

  constructor(
    private settingsService: SettingsService,
    private catalogService: CatalogService,
    private themeService: ThemeService,
    private settingsCacheService: SettingsCacheService
  ) {
    // Initialize save queue subscription
    // This is intentional for a singleton service and will live for app lifetime
    this.initializeSaveQueue();
  }

  /**
   * Get I18nService reference
   * The reference is set by StartupService during initialization
   * This breaks the circular dependency cleanly
   */
  private getI18nService(): I18nServiceInterface | null {
    return this._i18nService;
  }

  /**
   * Set the I18nService reference (called from StartupService during initialization)
   * This breaks the circular dependency by allowing external registration
   */
  setI18nService(service: I18nServiceInterface): void {
    this._i18nService = service;
  }

  /**
   * Load catalog schema from backend
   */
  loadCatalog(): Observable<CatalogResponse | null> {
    return this.catalogService.apiSettingsCatalogGet$Json().pipe(
      map(response => response.data || null),
      tap(catalog => this.catalogSubject.next(catalog)),
      catchError(err => {
        console.error('Failed to load settings catalog:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Load effective user settings with caching support
   *
   * Strategy:
   * 1. Try to load from cache first (fast)
   * 2. If cache exists and is fresh, use it and start background refresh
   * 3. If no cache or stale, fetch from API
   * 4. Always cache fresh data
   */
  loadUserSettings(): Observable<EffectiveSettingsResponse | null> {
    // Try to load from cache first
    const cachedSettings = this.settingsCacheService.getCachedSettings();

    if (cachedSettings) {
      // We have cached settings, use them immediately
      console.log('Loading settings from cache');
      this.effectiveSettingsSubject.next(cachedSettings);
      this.applyThemeFromSettings(cachedSettings);

      // Start background refresh to get fresh data
      this.startBackgroundRefresh();

      return of(cachedSettings);
    }

    // No cache, fetch from API
    console.log('Loading settings from API');
    // this.loadingSubject.next(true);
    return this.fetchSettingsFromAPI();
  }

  /**
   * Fetch settings from API and cache them
   */
  private fetchSettingsFromAPI(): Observable<EffectiveSettingsResponse | null> {
    return this.settingsService.apiSettingsMeGet$Json().pipe(
      map(response => response.data || null),
      tap(settings => {
        if (settings) {
          // Cache the fresh settings
          this.settingsCacheService.setCachedSettings(settings);

          // Update in-memory state
          this.effectiveSettingsSubject.next(settings);
          this.applyThemeFromSettings(settings);

          // Start background refresh for future updates
          this.startBackgroundRefresh();
        }
        // this.loadingSubject.next(false);
      }),
      catchError(err => {
        console.error('Failed to load user settings:', err);
        // this.loadingSubject.next(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * Start background refresh of settings
   * Periodically fetches fresh settings from API without blocking UI
   */
  private startBackgroundRefresh(): void {
    // Stop any existing background refresh
    this.stopBackgroundRefresh();

    // Start new background refresh
    this.backgroundRefreshSubscription = timer(this.BACKGROUND_REFRESH_INTERVAL, this.BACKGROUND_REFRESH_INTERVAL).pipe(
      switchMap(() => {
        console.log('Background refresh: Fetching fresh settings');
        return this.settingsService.apiSettingsMeGet$Json().pipe(
          map(response => response.data || null),
          tap(settings => {
            if (settings) {
              // Check if settings actually changed
              const currentSettings = this.effectiveSettingsSubject.value;
              if (JSON.stringify(currentSettings) !== JSON.stringify(settings)) {
                console.log('Background refresh: Settings changed, updating');

                // Cache the fresh settings
                this.settingsCacheService.setCachedSettings(settings);

                // Update in-memory state
                this.effectiveSettingsSubject.next(settings);

                // Re-apply theme if appearance settings changed
                const currentAppearance = currentSettings?.settings?.['appearance'];
                const newAppearance = settings.settings?.['appearance'];

                if (JSON.stringify(currentAppearance) !== JSON.stringify(newAppearance)) {
                  console.log('Background refresh: Appearance settings changed, re-applying theme');
                  this.applyThemeFromSettings(settings);
                }
              } else {
                console.log('Background refresh: No changes detected');
              }
            }
          }),
          catchError(err => {
            console.error('Background refresh failed:', err);
            return of(null); // Continue background refresh even if one fails
          })
        );
      }),
      takeUntil(this.stopBackgroundRefresh$)
    ).subscribe();
  }

  /**
   * Stop background refresh
   */
  private stopBackgroundRefresh(): void {
    if (this.backgroundRefreshSubscription) {
      this.backgroundRefreshSubscription.unsubscribe();
      this.backgroundRefreshSubscription = undefined;
    }
  }

  /**
   * Force refresh settings from API
   * Can be called manually to refresh immediately
   */
  refreshSettings(): Observable<EffectiveSettingsResponse | null> {
    console.log('Force refreshing settings');
    // this.loadingSubject.next(true);
    return this.fetchSettingsFromAPI();
  }

  /**
   * Get value for a specific setting key
   */
  getSettingValue(category: string, key: string): any {
    const settings = this.effectiveSettingsSubject.value;
    if (!settings || !settings.settings) {
      return undefined;
    }
    const categorySettings = settings.settings[category];
    return categorySettings ? categorySettings[key] : undefined;
  }

  /**
   * Update a single setting (queues for auto-save with debounce)
   */
  updateSetting(category: string, key: string, value: any): void {
    // Update in-memory cache immediately
    this.updateInMemoryCache(category, key, value);

    // Apply setting effect immediately (e.g., theme change)
    this.applySettingEffect(category, key, value);

    // Queue for save (will be debounced)
    this.saveQueue.next({ category, key, value });
  }

  /**
   * Get default value from catalog
   */
  getDefaultValue(category: string, key: string): any {
    const catalog = this.catalogSubject.value;
    if (!catalog || !catalog.categories) {
      return undefined;
    }

    const categoryData = catalog.categories.find(c => c.key === category);
    if (!categoryData || !categoryData.keys) {
      return undefined;
    }

    const keyData = categoryData.keys.find(k => k.key === key);
    return keyData ? keyData.default : undefined;
  }

  /**
   * Check if current value differs from default
   */
  isModifiedFromDefault(category: string, key: string): boolean {
    const currentValue = this.getSettingValue(category, key);
    const defaultValue = this.getDefaultValue(category, key);
    return currentValue !== defaultValue;
  }

  /**
   * Reset setting to default value
   */
  resetToDefault(category: string, key: string): void {
    const defaultValue = this.getDefaultValue(category, key);
    if (defaultValue !== undefined) {
      this.updateSetting(category, key, defaultValue);
    }
  }

  /**
   * Initialize save queue with debounce
   */
  private initializeSaveQueue(): void {
    this.saveQueue.pipe(
      debounceTime(350),
      distinctUntilChanged((prev, curr) =>
        prev.category === curr.category &&
        prev.key === curr.key &&
        prev.value === curr.value
      ),
      takeUntil(this.destroy$)
    ).subscribe(({ category, key, value }) => {
      this.saveSetting(category, key, value);
    });
  }

  /**
   * Save setting to backend and update cache
   */
  private saveSetting(category: string, key: string, value: any): void {
    const request: UpdateSettingsRequest = {
      category: category,
      payload: { [key]: value }
    };

    this.settingsService.apiSettingsMePut$Json({ body: request }).subscribe({
      next: (response) => {
        if (response.success) {
          // Setting saved successfully - update cache with current state
          const currentSettings = this.effectiveSettingsSubject.value;
          if (currentSettings) {
            this.settingsCacheService.setCachedSettings(currentSettings);
          }

          // Trigger background refresh to get any server-side computed values
          this.refreshSettings().subscribe({
            error: (err) => console.error('Failed to refresh after save:', err)
          });
        }
      },
      error: (err) => {
        console.error('Failed to save setting:', err);
        // Could revert in-memory cache here if needed
      }
    });
  }

  /**
   * Update in-memory cache immediately
   */
  private updateInMemoryCache(category: string, key: string, value: any): void {
    const current = this.effectiveSettingsSubject.value;
    if (!current) {
      return;
    }

    const updated: EffectiveSettingsResponse = {
      ...current,
      settings: {
        ...current.settings,
        [category]: {
          ...(current.settings?.[category] || {}),
          [key]: value
        }
      }
    };

    this.effectiveSettingsSubject.next(updated);
  }

  /**
   * Apply side effects when settings change
   */
  private applySettingEffect(category: string, key: string, value: any): void {
    // Apply theme changes
    if (category === APPEARANCE_SETTING_CATEGORY && key === THEME_SETTING_KEY) {
      this.themeService.setTheme(value);
    }

    // Apply font size changes
    if (category === APPEARANCE_SETTING_CATEGORY && key === FONTSIZE_SETTING_KEY) {
      this.themeService.setFontSize(value);
    }

    // Apply language changes (async with loading state)
    if (category === LANGUAGE_SETTING_CATEGORY && key === LANGUAGE_SETTING_KEY) {
      const i18n = this.getI18nService();
      if (i18n) {
        // The language change will trigger loading state in I18nService
        // which will be reflected in the UI through AppComponent
        i18n.setLanguage(value).catch(e => {
          console.error('Failed to apply language change:', e);
        });
      }
    }
  }

  /**
   * Apply theme, typography, and language from loaded settings
   * This is the single source of truth for applying user preferences
   */
  private applyThemeFromSettings(settings: EffectiveSettingsResponse | null): void {
    if (!settings || !settings.settings) {
      // No settings loaded, initialize with defaults
      this.initializeDefaultTheme();
      return;
    }

    const appearanceSettings = settings.settings[APPEARANCE_SETTING_CATEGORY];
    const languageSettings = settings.settings[LANGUAGE_SETTING_CATEGORY];

    // Extract theme and fontSize from settings, with fallbacks
    // Keys are stored under the 'appearance' category (e.g. settings.appearance.theme)
    const theme = (appearanceSettings?.[THEME_SETTING_KEY] || 'system') as ThemeMode;
    const fontSize = (appearanceSettings?.[FONTSIZE_SETTING_KEY] || 'medium') as FontSize;

    // Initialize theme service with user preferences
    // This ensures theme is applied only once with correct values
    this.themeService.initialize(theme, fontSize);

    // Apply language setting if available
    const language = languageSettings?.[LANGUAGE_SETTING_KEY];
    if (language) {
      const i18n = this.getI18nService();
      if (i18n) {
        // Use async language loading, but don't block theme initialization
        i18n.setLanguage(language).catch(e => {
          console.error('Failed to apply language from settings:', e);
        });
      }
    }
  }

  /**
   * Initialize theme with default values
   * Used when no user settings are available or when settings fail to load
   */
  initializeDefaultTheme(): void {
    this.themeService.initialize('system', 'medium');
  }

  /**
   * Cleanup method (called on service destroy)
   */
  ngOnDestroy(): void {
    this.stopBackgroundRefresh();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
