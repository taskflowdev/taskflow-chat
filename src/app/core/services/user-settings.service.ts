import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, Subject, throwError, timer, of, forkJoin } from 'rxjs';
import { catchError, debounceTime, map, tap, switchMap, takeUntil } from 'rxjs/operators';
import { SettingsService } from '../../api/services/settings.service';
import { CatalogService } from '../../api/services/catalog.service';
import { ApiConfiguration } from '../../api/api-configuration';
import { EffectiveSettingsResponse } from '../../api/models/effective-settings-response';
import { CatalogResponse } from '../../api/models/catalog-response';
import { UpdateSettingsRequest } from '../../api/models/update-settings-request';
import { ThemeService, ThemeMode, FontSize } from './theme.service';
import { SettingsCacheService } from './settings-cache.service';

/**
 * UserSettingsService - Production-ready settings management
 * 
 * Features:
 * - Instant in-memory updates for immediate UI feedback
 * - Debounced saves (300ms) to batch multiple quick changes
 * - Pending updates buffer to merge changes before saving
 * - sendBeacon backup on page unload to prevent data loss
 * - Works reliably with slow backends
 * - Zero coupling to OpenAPI generated code structure
 */
@Injectable({
  providedIn: 'root'
})
export class UserSettingsService implements OnDestroy {
  private catalogSubject = new BehaviorSubject<CatalogResponse | null>(null);
  public catalog$: Observable<CatalogResponse | null> = this.catalogSubject.asObservable();

  private effectiveSettingsSubject = new BehaviorSubject<EffectiveSettingsResponse | null>(null);
  public effectiveSettings$: Observable<EffectiveSettingsResponse | null> = this.effectiveSettingsSubject.asObservable();

  // Pending updates buffer: stores unsaved changes by "category:key"
  private pendingUpdates = new Map<string, { category: string; key: string; value: any }>();
  
  // Subject for batching updates with debounce
  private updateTrigger$ = new Subject<void>();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  // Background refresh management
  private readonly BACKGROUND_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private backgroundRefreshSubscription?: any;
  private stopBackgroundRefresh$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  
  // Track if we're saving to avoid duplicate saves
  private isSaving = false;

  constructor(
    private settingsService: SettingsService,
    private catalogService: CatalogService,
    private themeService: ThemeService,
    private settingsCacheService: SettingsCacheService,
    private apiConfiguration: ApiConfiguration,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize debounced save queue
    this.initializeSaveQueue();
    
    // Setup beforeunload handler for backup save
    this.setupBeforeUnloadHandler();
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
   * Update a single setting (instant in-memory + queued save)
   * 
   * This method:
   * 1. Updates in-memory cache immediately for instant UI feedback
   * 2. Applies side effects (e.g., theme changes) immediately
   * 3. Queues the update for debounced save to backend
   */
  updateSetting(category: string, key: string, value: any): void {
    // Update in-memory cache immediately
    this.updateInMemoryCache(category, key, value);

    // Apply setting effect immediately (e.g., theme change)
    this.applySettingEffect(category, key, value);

    // Add to pending updates buffer
    const pendingKey = `${category}:${key}`;
    this.pendingUpdates.set(pendingKey, { category, key, value });

    // Trigger debounced save
    this.updateTrigger$.next();
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
   * 
   * Listens to updateTrigger$ with debounceTime to batch multiple quick changes
   * into a single API call. When triggered, merges pending updates by category
   * and saves them all at once.
   */
  private initializeSaveQueue(): void {
    this.updateTrigger$.pipe(
      debounceTime(300), // 300ms debounce
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.flushPendingUpdates();
    });
  }

  /**
   * Flush pending updates to backend
   * 
   * Merges all pending updates by category, then calls apiSettingsMePut$Json()
   * for each category with all pending changes. After all saves complete,
   * refreshes settings from backend via apiSettingsMeGet$Json().
   * 
   * Uses forkJoin for parallel execution with proper error handling.
   */
  private flushPendingUpdates(): void {
    if (this.pendingUpdates.size === 0 || this.isSaving) {
      return; // Nothing to save or already saving
    }

    // Take snapshot of pending updates and clear buffer
    const updates = Array.from(this.pendingUpdates.values());
    this.pendingUpdates.clear();
    
    // Mark as saving
    this.isSaving = true;

    // Group updates by category
    const updatesByCategory = this.groupUpdatesByCategory(updates);

    // Create save observables for each category
    const saveObservables: Observable<any>[] = [];
    
    for (const [category, payload] of updatesByCategory.entries()) {
      const request: UpdateSettingsRequest = {
        category: category,
        payload: payload
      };

      const saveObs = this.settingsService.apiSettingsMePut$Json({ body: request }).pipe(
        catchError(err => {
          console.error(`Failed to save settings for category ${category}:`, err);
          // Return null to continue with other saves
          return of(null);
        })
      );
      
      saveObservables.push(saveObs);
    }

    // Execute all saves in parallel, then refresh from backend
    if (saveObservables.length > 0) {
      forkJoin(saveObservables).pipe(
        switchMap(() => {
          // After all saves complete, refresh from backend
          return this.settingsService.apiSettingsMeGet$Json();
        }),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          const settings = response.data || null;
          if (settings) {
            // Update cache with fresh settings from backend
            this.settingsCacheService.setCachedSettings(settings);
            this.effectiveSettingsSubject.next(settings);
            
            // Re-apply theme if appearance settings were updated
            const currentSettings = this.effectiveSettingsSubject.value;
            if (currentSettings && currentSettings.settings?.['appearance']) {
              this.applyThemeFromSettings(currentSettings);
            }
          }
          this.isSaving = false;
        },
        error: (err) => {
          console.error('Failed to refresh after save:', err);
          this.isSaving = false;
        }
      });
    } else {
      this.isSaving = false;
    }
  }

  /**
   * Group updates by category, merging all key-value pairs per category
   */
  private groupUpdatesByCategory(updates: Array<{ category: string; key: string; value: any }>): Map<string, { [key: string]: any }> {
    const grouped = new Map<string, { [key: string]: any }>();
    
    for (const update of updates) {
      if (!grouped.has(update.category)) {
        grouped.set(update.category, {});
      }
      grouped.get(update.category)![update.key] = update.value;
    }
    
    return grouped;
  }

  /**
   * Setup beforeunload handler to save pending changes via sendBeacon
   * 
   * This ensures that pending updates are not lost when:
   * - User closes the tab
   * - User refreshes the page
   * - User navigates away
   * 
   * Uses navigator.sendBeacon for reliable async transmission
   */
  private setupBeforeUnloadHandler(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Only run in browser
    }

    window.addEventListener('beforeunload', () => {
      this.sendPendingUpdatesViaBeacon();
    });
  }

  /**
   * Send pending updates via sendBeacon as backup
   * 
   * Uses sendBeacon to send pending updates even when page is unloading.
   * This is a fallback mechanism - normal debounced saves are preferred.
   * 
   * Uses ApiConfiguration.rootUrl for proper URL construction.
   */
  private sendPendingUpdatesViaBeacon(): void {
    if (this.pendingUpdates.size === 0) {
      return; // Nothing to save
    }

    // Get updates and group by category
    const updates = Array.from(this.pendingUpdates.values());
    const updatesByCategory = this.groupUpdatesByCategory(updates);

    // Get API base URL from configuration
    const apiUrl = this.apiConfiguration.rootUrl;
    
    for (const [category, payload] of updatesByCategory.entries()) {
      const request: UpdateSettingsRequest = {
        category: category,
        payload: payload
      };

      const url = `${apiUrl}/api/Settings/me`;
      const blob = new Blob([JSON.stringify(request)], { type: 'application/json' });
      
      try {
        navigator.sendBeacon(url, blob);
      } catch (err) {
        console.error('sendBeacon failed:', err);
      }
    }

    // Clear pending updates after beacon attempt
    this.pendingUpdates.clear();
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
    if (category === 'appearance' && key === 'appearance.theme') {
      this.themeService.setTheme(value);
    }

    // Apply font size changes
    if (category === 'appearance' && key === 'appearance.fontSize') {
      this.themeService.setFontSize(value);
    }
  }

  /**
   * Apply theme and typography from loaded settings
   * This is the single source of truth for applying user preferences
   */
  private applyThemeFromSettings(settings: EffectiveSettingsResponse | null): void {
    if (!settings || !settings.settings) {
      // No settings loaded, initialize with defaults
      this.initializeDefaultTheme();
      return;
    }

    const appearanceSettings = settings.settings['appearance'];

    // Extract theme and fontSize from settings, with fallbacks
    // Keys are stored under the 'appearance' category (e.g. settings.appearance.theme)
    const theme = (appearanceSettings?.['appearance.theme'] || 'system') as ThemeMode;
    const fontSize = (appearanceSettings?.['appearance.fontSize'] || 'medium') as FontSize;

    // Initialize theme service with user preferences
    // This ensures theme is applied only once with correct values
    this.themeService.initialize(theme, fontSize);
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
    // Flush any remaining pending updates before destroying
    this.flushPendingUpdates();
    
    this.stopBackgroundRefresh();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
