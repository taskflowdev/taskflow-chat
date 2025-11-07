import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, tap } from 'rxjs/operators';
import { SettingsService } from '../../api/services/settings.service';
import { CatalogService } from '../../api/services/catalog.service';
import { EffectiveSettingsResponse } from '../../api/models/effective-settings-response';
import { CatalogResponse } from '../../api/models/catalog-response';
import { UpdateSettingsRequest } from '../../api/models/update-settings-request';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private catalogSubject = new BehaviorSubject<CatalogResponse | null>(null);
  public catalog$: Observable<CatalogResponse | null> = this.catalogSubject.asObservable();

  private effectiveSettingsSubject = new BehaviorSubject<EffectiveSettingsResponse | null>(null);
  public effectiveSettings$: Observable<EffectiveSettingsResponse | null> = this.effectiveSettingsSubject.asObservable();

  private saveQueue = new Subject<{ category: string; key: string; value: any }>();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor(
    private settingsService: SettingsService,
    private catalogService: CatalogService,
    private themeService: ThemeService
  ) {
    // Initialize save queue subscription
    // This is intentional for a singleton service and will live for app lifetime
    this.initializeSaveQueue();
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
   * Load effective user settings from backend
   */
  loadUserSettings(): Observable<EffectiveSettingsResponse | null> {
    this.loadingSubject.next(true);
    return this.settingsService.apiSettingsMeGet$Json().pipe(
      map(response => response.data || null),
      tap(settings => {
        this.effectiveSettingsSubject.next(settings);
        this.applyThemeFromSettings(settings);
        this.loadingSubject.next(false);
      }),
      catchError(err => {
        console.error('Failed to load user settings:', err);
        this.loadingSubject.next(false);
        return throwError(() => err);
      })
    );
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
      )
    ).subscribe(({ category, key, value }) => {
      this.saveSetting(category, key, value);
    });
  }

  /**
   * Save setting to backend
   */
  private saveSetting(category: string, key: string, value: any): void {
    const request: UpdateSettingsRequest = {
      category: category,
      payload: { [key]: value }
    };

    this.settingsService.apiSettingsMePut$Json({ body: request }).subscribe({
      next: (response) => {
        if (response.success) {
          // Setting saved successfully - cache is already updated
          // Effect already applied in updateSetting, no need to apply again
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
    if (category === 'appearance' && key === 'theme') {
      this.themeService.setTheme(value);
    }
    
    // Apply font size changes
    if (category === 'appearance' && key === 'fontSize') {
      this.themeService.setFontSize(value);
    }
  }

  /**
   * Apply theme and typography from loaded settings
   */
  private applyThemeFromSettings(settings: EffectiveSettingsResponse | null): void {
    if (!settings || !settings.settings) {
      return;
    }

    const appearanceSettings = settings.settings['appearance'];
    if (appearanceSettings) {
      // Apply theme
      if (appearanceSettings['theme']) {
        this.themeService.setTheme(appearanceSettings['theme']);
      }
      
      // Apply font size
      if (appearanceSettings['fontSize']) {
        this.themeService.setFontSize(appearanceSettings['fontSize']);
      }
    }
  }
}
