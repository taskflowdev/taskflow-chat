import { Injectable, Inject, PLATFORM_ID, OnDestroy, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of, Subject, catchError, tap, map, takeUntil, timer, switchMap } from 'rxjs';
import { I18NService as ApiI18NService } from '../../api/services/i-18-n.service';
import { TranslationPayloadDto } from '../../api/models/translation-payload-dto';
import { TranslationPayloadMeta } from '../../api/models/translation-payload-meta';
import { LanguageDto } from '../../api/models/language-dto';

/**
 * Storage key for caching translations locally
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
 * This follows the pattern used by theme settings: 'language-region.interfaceLanguage'
 */
export const LANGUAGE_SETTING_CATEGORY = 'language-region';
export const LANGUAGE_SETTING_KEY = 'language-region.interfaceLanguage';

/**
 * I18nService - Enterprise-grade internationalization service for Angular
 * 
 * Features:
 * - Fetches translations from API endpoint
 * - Integrates with UserSettingsService for persisting language preference
 * - Caches translations in memory and localStorage
 * - Reactive language switching using BehaviorSubject
 * - Supports nested key lookup with dot notation
 * - Supports placeholder interpolation ({{key}}, {key})
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

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiI18NService: ApiI18NService,
    private injector: Injector
  ) {
    // Register with UserSettingsService to break circular dependency
    // This allows UserSettingsService to call setLanguage on us
    this.registerWithUserSettingsService();
  }

  /**
   * Register this service with UserSettingsService
   * This breaks the circular dependency by allowing UserSettingsService to find us
   */
  private registerWithUserSettingsService(): void {
    // Delay registration to avoid issues during construction
    setTimeout(() => {
      try {
        // Dynamic import to avoid compile-time circular dependency
        const userSettingsService = this.injector.get<any>('UserSettingsService' as any, null);
        if (userSettingsService && typeof userSettingsService.setI18nService === 'function') {
          userSettingsService.setI18nService(this);
        }
      } catch (e) {
        // UserSettingsService not available, that's OK
      }
    }, 0);
  }

  /**
   * Initialize the i18n service with default language
   * Called during app initialization
   * The actual language will be set by UserSettingsService after settings load
   * 
   * @param lang Optional initial language (defaults to 'en')
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
      this.loadTranslations(lang).subscribe({
        next: () => {
          this.initializedSubject.next(true);
          this.startBackgroundRefresh();
          resolve();
        },
        error: (err) => {
          console.error('I18n: Failed to load translations:', err);
          // Try to use cached translations
          if (this.loadFromCache(lang)) {
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
   * 
   * @param lang Language code (e.g., 'en', 'ar')
   */
  setLanguage(lang: string): void {
    if (!lang || lang === this.currentLanguageSubject.value) {
      return;
    }

    this.loadingSubject.next(true);
    this.loadTranslations(lang).subscribe({
      next: () => {
        this.currentLanguageSubject.next(lang);
        this.languageChangedSubject.next(lang);
        this.loadingSubject.next(false);
        console.log(`I18n: Language changed to ${lang}`);
      },
      error: (err) => {
        console.error(`I18n: Failed to load translations for ${lang}:`, err);
        this.loadingSubject.next(false);
      }
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
   * Load translations from API
   */
  private loadTranslations(lang: string): Observable<TranslationPayloadDto | null> {
    return this.apiI18NService.apiI18NLangGet$Json({ lang }).pipe(
      map(response => response.data || null),
      tap(payload => {
        if (payload) {
          this.translationsSubject.next(payload.data || {});
          this.metaSubject.next(payload.meta || null);
          this.currentLanguageSubject.next(lang);
          
          // Cache translations
          this.cacheTranslations(lang, payload);
        }
      }),
      catchError(err => {
        console.error('I18n: API error:', err);
        // Try to use cached translations
        if (this.loadFromCache(lang)) {
          console.log('I18n: Using cached translations');
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
   * @param template Translation template
   * @param params Parameters to interpolate
   */
  private interpolate(template: string, params: Record<string, any>): string {
    let result = template;

    // Handle {{key}} format (double braces)
    result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
    });

    // Handle {key} format (single braces)
    result = result.replace(/\{(\w+(?:-\w+)*)\}/g, (_, key) => {
      // Handle kebab-case keys like {date-time}
      const normalizedKey = key.replace(/-/g, '');
      const value = params[key] ?? params[normalizedKey];
      return value !== undefined ? String(value) : `{${key}}`;
    });

    return result;
  }

  /**
   * Cache translations to localStorage
   */
  private cacheTranslations(lang: string, payload: TranslationPayloadDto): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const cacheKey = `${TRANSLATIONS_CACHE_KEY}_${lang}`;
      const metaKey = `${TRANSLATIONS_META_KEY}_${lang}`;
      
      localStorage.setItem(cacheKey, JSON.stringify(payload.data || {}));
      localStorage.setItem(metaKey, JSON.stringify(payload.meta || {}));
    } catch (e) {
      console.warn('I18n: Failed to cache translations:', e);
    }
  }

  /**
   * Load translations from localStorage cache
   */
  private loadFromCache(lang: string): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    try {
      const cacheKey = `${TRANSLATIONS_CACHE_KEY}_${lang}`;
      const metaKey = `${TRANSLATIONS_META_KEY}_${lang}`;
      
      const cachedData = localStorage.getItem(cacheKey);
      const cachedMeta = localStorage.getItem(metaKey);

      if (cachedData) {
        this.translationsSubject.next(JSON.parse(cachedData));
        this.currentLanguageSubject.next(lang);
        
        if (cachedMeta) {
          this.metaSubject.next(JSON.parse(cachedMeta));
        }
        
        return true;
      }
    } catch (e) {
      console.warn('I18n: Failed to load from cache:', e);
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
        return this.loadTranslations(lang).pipe(
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
