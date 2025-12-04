import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of, Subject, catchError, tap, map, takeUntil, timer, switchMap } from 'rxjs';
import { I18NService as ApiI18NService } from '../../api/services/i-18-n.service';
import { TranslationPayloadDto } from '../../api/models/translation-payload-dto';
import { TranslationPayloadMeta } from '../../api/models/translation-payload-meta';
import { LanguageDto } from '../../api/models/language-dto';
import { TranslationCacheService } from '../services/translation-cache.service';

/**
 * Storage key for caching translations locally (DEPRECATED - use TranslationCacheService)
 */
const TRANSLATIONS_CACHE_KEY = 'i18n_translations';
const TRANSLATIONS_META_KEY = 'i18n_meta';

/**
 * RTL language codes
 */
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi'];

/**
 * Default language fallback
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * Settings key for language preference
 * This follows the pattern used by theme settings: 'language.interface'
 */
export const LANGUAGE_SETTING_CATEGORY = 'language';
export const LANGUAGE_SETTING_KEY = 'language.interface';

/**
 * I18nService - Enterprise-grade internationalization service for Angular
 *
 * Features:
 * - Fetches translations from API endpoint with version-based cache busting
 * - Integrates with UserSettingsService for persisting language preference
 * - Encrypted caching with TTL support via TranslationCacheService
 * - Caches translations in memory and encrypted localStorage
 * - Reactive language switching using BehaviorSubject
 * - Supports nested key lookup with dot notation
 * - Supports placeholder interpolation ({{key}}, {key})
 * - Smooth UX with loading states during language changes
 * - SSR compatible
 *
 * Usage:
 * ```typescript
 * // In component
 * constructor(private i18n: I18nService) {}
 *
 * // Get translation
 * const text = this.i18n.t('navbar.settings');
 *
 * // With interpolation
 * const text = this.i18n.t('sidebar.last-message.types.text', { sender: 'John', message: 'Hello' });
 *
 * // Change language via UserSettingsService (recommended)
 * this.userSettingsService.updateSetting('language-region', 'language-region.interfaceLanguage', 'ar');
 *
 * // Subscribe to loading state during language change
 * this.i18n.loading$.subscribe(loading => console.log('Loading:', loading));
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class I18nService implements OnDestroy {
  // Current language code
  private currentLanguageSubject = new BehaviorSubject<string>(DEFAULT_LANGUAGE);
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  // Translation data (nested object)
  private translationsSubject = new BehaviorSubject<Record<string, any>>({});
  public translations$ = this.translationsSubject.asObservable();

  // Translation metadata
  private metaSubject = new BehaviorSubject<TranslationPayloadMeta | null>(null);
  public meta$ = this.metaSubject.asObservable();

  // Available languages
  private languagesSubject = new BehaviorSubject<LanguageDto[]>([]);
  public languages$ = this.languagesSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Initialized state
  private initializedSubject = new BehaviorSubject<boolean>(false);
  public initialized$ = this.initializedSubject.asObservable();

  // Language change event for triggering UI updates
  private languageChangedSubject = new Subject<string>();
  public languageChanged$ = this.languageChangedSubject.asObservable();

  // Cleanup
  private destroy$ = new Subject<void>();

  // Background refresh configuration
  private readonly BACKGROUND_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Translation version for cache busting (can be updated from config)
  private translationVersion: string = '1.0';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiI18NService: ApiI18NService,
    private translationCacheService: TranslationCacheService
  ) { }

  /**
   * Initialize the i18n service with default language
   * Called by StartupService during app initialization
   *
   * @param lang Language to load (from user settings or default 'en')
   * @returns Promise that resolves when initialization is complete
   */
  initialize(lang: string = DEFAULT_LANGUAGE): Promise<void> {
    return new Promise((resolve) => {
      // Skip on server
      if (!isPlatformBrowser(this.platformId)) {
        this.initializedSubject.next(true);
        resolve();
        return;
      }

      // Load translations for the specified language
      this.loadTranslations(lang, true).subscribe({
        next: () => {
          this.initializedSubject.next(true);
          this.startBackgroundRefresh();
          resolve();
        },
        error: (err) => {
          console.error('I18n: Failed to load translations:', err);
          // Try to use cached translations
          const cached = this.loadFromNewCache(lang);
          if (cached) {
            console.log('I18n: Using cached translations as fallback');
          }
          this.initializedSubject.next(true);
          resolve();
        }
      });

      // Also load available languages metadata
      this.loadMetadata();
    });
  }

  /**
   * Get the current language code
   */
  getLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  /**
   * Set the current language
   * Called by UserSettingsService when language setting changes
   * Returns a Promise that resolves when language change is complete
   *
   * @param lang Language code (e.g., 'en', 'ar')
   * @returns Promise that resolves when translations are loaded
   */
  setLanguage(lang: string): Promise<void> {
    if (!lang || lang === this.currentLanguageSubject.value) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.loadingSubject.next(true);
      this.loadTranslations(lang, false).subscribe({
        next: () => {
          this.currentLanguageSubject.next(lang);
          this.languageChangedSubject.next(lang);
          this.loadingSubject.next(false);
          console.log(`I18n: Language changed to ${lang}`);
          resolve();
        },
        error: (err) => {
          console.error(`I18n: Failed to load translations for ${lang}:`, err);
          this.loadingSubject.next(false);
          reject(err);
        }
      });
    });
  }

  /**
   * Get translation by key with optional interpolation
   * Supports nested keys using dot notation
   *
   * @param key Translation key (e.g., 'navbar.settings')
   * @param params Interpolation parameters
   * @returns Translated string or the key if not found
   */
  t(key: string, params?: Record<string, any>): string {
    const translations = this.translationsSubject.value;
    const value = this.getNestedValue(translations, key);

    if (typeof value !== 'string') {
      // Return key as fallback when translation not found
      return key;
    }

    // Apply interpolation if params provided
    if (params) {
      return this.interpolate(value, params);
    }

    return value;
  }

  /**
   * Get translation as Observable for async pipe usage
   *
   * @param key Translation key
   * @param params Interpolation parameters
   */
  t$(key: string, params?: Record<string, any>): Observable<string> {
    return this.translations$.pipe(
      map(() => this.t(key, params))
    );
  }

  /**
   * Get current language metadata
   */
  getMeta(): TranslationPayloadMeta | null {
    return this.metaSubject.value;
  }

  /**
   * Get text direction for current language
   */
  getDirection(): 'ltr' | 'rtl' {
    const lang = this.currentLanguageSubject.value;
    return RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
  }

  /**
   * Get text direction for a specific language
   */
  getDirectionForLanguage(lang: string): 'ltr' | 'rtl' {
    return RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
  }

  /**
   * Check if current language is RTL
   */
  isRTL(): boolean {
    return this.getDirection() === 'rtl';
  }

  /**
   * Get available languages
   */
  getLanguages(): LanguageDto[] {
    return this.languagesSubject.value;
  }

  /**
   * Get the native name for a language code
   */
  getLanguageName(code: string): string {
    const languages = this.languagesSubject.value;
    const lang = languages.find(l => l.code === code);
    return lang?.nativeName || lang?.name || code;
  }

  // ===== Private Methods =====

  /**
   * Load translations from API with smart caching
   * 
   * Strategy:
   * 1. Check encrypted cache first
   * 2. If valid cache exists (not expired, version matches), use it
   * 3. Otherwise, fetch from API with version parameter for HTTP cache busting
   * 4. Cache the fresh translations with encryption
   *
   * @param lang Language code
   * @param useCache Whether to try loading from cache first
   */
  private loadTranslations(lang: string, useCache: boolean = true): Observable<TranslationPayloadDto | null> {
    // Try to load from encrypted cache first
    if (useCache && isPlatformBrowser(this.platformId)) {
      const cachedPayload = this.translationCacheService.getCachedTranslations(
        lang,
        this.translationVersion,
        this.CACHE_TTL_MS
      );

      if (cachedPayload) {
        console.log(`I18n: Using cached translations for ${lang}`);
        // Apply cached data immediately
        this.translationsSubject.next(cachedPayload.data || {});
        this.metaSubject.next(cachedPayload.meta || null);
        this.currentLanguageSubject.next(lang);
        return of(cachedPayload);
      }
    }

    // Fetch from API with version parameter for cache busting
    console.log(`I18n: Fetching translations from API for ${lang}`);
    return this.apiI18NService.apiI18NLangGet$Json({
      lang,
      version: this.translationVersion
    }).pipe(
      map(response => response.data || null),
      tap(payload => {
        if (payload) {
          this.translationsSubject.next(payload.data || {});
          this.metaSubject.next(payload.meta || null);
          this.currentLanguageSubject.next(lang);

          // Cache translations with encryption
          this.translationCacheService.setCachedTranslations(
            lang,
            payload,
            this.translationVersion
          );
        }
      }),
      catchError(err => {
        console.error('I18n: API error:', err);
        // Try to use cached translations as fallback
        const cached = this.loadFromNewCache(lang);
        if (cached) {
          console.log('I18n: Using cached translations as fallback after API error');
          return of(null);
        }
        throw err;
      })
    );
  }

  /**
   * Load i18n metadata (available languages)
   */
  private loadMetadata(): void {
    this.apiI18NService.apiI18NMetadataGet$Json().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.data?.languages) {
          // Filter to only active languages
          const activeLanguages = response.data.languages.filter(l => l.isActive);
          this.languagesSubject.next(activeLanguages);
        }
      },
      error: (err) => {
        console.error('I18n: Failed to load metadata:', err);
      }
    });
  }

  /**
   * Get nested value from object using dot notation
   *
   * @param obj Source object
   * @param path Dot-notation path (e.g., 'navbar.settings')
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Interpolate placeholders in translation string
   * Supports both {{key}} and {key} formats
   *
   * For {key} format with kebab-case (e.g., {date-time}),
   * the parameter can be passed as either 'date-time' or 'dateTime'
   *
   * @param template Translation template
   * @param params Parameters to interpolate
   */
  private interpolate(template: string, params: Record<string, any>): string {
    let result = template;

    // Handle {{key}} format (double braces) - for simple keys
    result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
    });

    // Handle {key} format (single braces) - supports kebab-case
    // e.g., {date-time} can match param 'date-time' or 'dateTime'
    result = result.replace(/\{([\w-]+)\}/g, (match, key) => {
      // Try exact key first
      if (params[key] !== undefined) {
        return String(params[key]);
      }

      // Try camelCase version for kebab-case keys
      if (key.includes('-')) {
        const camelKey = key.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
        if (params[camelKey] !== undefined) {
          return String(params[camelKey]);
        }
      }

      // Return original placeholder if no match
      return match;
    });

    return result;
  }

  /**
   * Load translations from encrypted cache (new cache service)
   * Used as fallback when API fails
   */
  private loadFromNewCache(lang: string): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    try {
      const cachedPayload = this.translationCacheService.getCachedTranslations(
        lang,
        undefined, // Don't validate version on fallback
        this.CACHE_TTL_MS
      );

      if (cachedPayload) {
        this.translationsSubject.next(cachedPayload.data || {});
        this.metaSubject.next(cachedPayload.meta || null);
        this.currentLanguageSubject.next(lang);
        return true;
      }
    } catch (e) {
      console.warn('I18n: Failed to load from new cache:', e);
    }

    return false;
  }

  /**
   * Start background refresh for translations
   */
  private startBackgroundRefresh(): void {
    timer(this.BACKGROUND_REFRESH_INTERVAL, this.BACKGROUND_REFRESH_INTERVAL).pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        const lang = this.currentLanguageSubject.value;
        console.log('I18n: Background refresh for', lang);
        return this.loadTranslations(lang, false).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe();
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
