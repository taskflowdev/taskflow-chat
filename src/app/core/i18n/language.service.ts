/**
 * @file language.service.ts
 * @description Core language management service for TaskFlow Chat
 *
 * Provides enterprise-grade language management with:
 * - Integration with existing settings system
 * - Runtime language switching without page reload
 * - RxJS-based reactive state management
 * - Logging for debugging and monitoring
 *
 * @version 1.0.0
 * @module CoreI18n
 */

import { Injectable, inject, OnDestroy } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, Observable, Subject, distinctUntilChanged, filter, takeUntil } from 'rxjs';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  LANGUAGE_SETTINGS_KEY,
  LANGUAGE_SETTINGS_CATEGORY,
  isValidLanguage,
  normalizeLanguageCode,
  LanguageConfig
} from './i18n.config';
import { UserSettingsService } from '../services/user-settings.service';

/**
 * Language change event interface
 */
export interface LanguageChangeEvent {
  previousLanguage: string;
  currentLanguage: string;
  timestamp: Date;
}

/**
 * LanguageService
 *
 * Central service for managing application language.
 * Acts as a bridge between Transloco and the application settings system.
 *
 * Key responsibilities:
 * 1. Load and apply saved language preference on app bootstrap
 * 2. Provide methods for runtime language switching
 * 3. Broadcast language changes via RxJS observables
 * 4. Integrate with UserSettingsService for persistence
 *
 * @example
 * ```typescript
 * // Inject in component
 * constructor(private languageService: LanguageService) {}
 *
 * // Switch language
 * this.languageService.setLanguage('es');
 *
 * // Subscribe to language changes
 * this.languageService.activeLanguage$.subscribe(lang => {
 *   console.log('Language changed to:', lang);
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LanguageService implements OnDestroy {
  private readonly transloco = inject(TranslocoService);
  private readonly userSettingsService = inject(UserSettingsService);

  /**
   * Current active language state
   */
  private readonly activeLanguageSubject = new BehaviorSubject<string>(DEFAULT_LANGUAGE);

  /**
   * Language change event emitter
   */
  private readonly languageChangeSubject = new Subject<LanguageChangeEvent>();

  /**
   * Destroy subject for cleanup
   */
  private readonly destroy$ = new Subject<void>();

  /**
   * Flag to track if service has been initialized
   */
  private initialized = false;

  /**
   * Observable stream of active language
   * Emits on every language change
   */
  public readonly activeLanguage$: Observable<string> = this.activeLanguageSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  /**
   * Observable stream of language change events
   * Provides before/after language info for tracking
   */
  public readonly languageChange$: Observable<LanguageChangeEvent> = this.languageChangeSubject.asObservable();

  /**
   * List of supported languages
   */
  public readonly supportedLanguages: readonly LanguageConfig[] = SUPPORTED_LANGUAGES;

  constructor() {
    // Subscribe to Transloco language changes to sync internal state
    this.transloco.langChanges$.pipe(
      filter(() => this.initialized),
      takeUntil(this.destroy$)
    ).subscribe((lang) => {
      if (lang !== this.activeLanguageSubject.value) {
        this.updateLanguageState(lang);
      }
    });
  }

  /**
   * Loads and applies the saved language preference on application bootstrap
   *
   * This method should be called during app initialization (APP_INITIALIZER)
   * to ensure the correct language is set before the UI renders.
   *
   * @returns Promise that resolves when language is loaded and applied
   */
  async loadLanguageOnBootstrap(): Promise<void> {
    console.log('[LanguageService] Loading language on bootstrap...');

    try {
      // Try to get saved language from settings
      const savedLanguage = this.getSavedLanguageFromSettings();

      if (savedLanguage) {
        console.log(`[LanguageService] Found saved language: ${savedLanguage}`);
        await this.applyLanguage(savedLanguage);
      } else {
        // No saved preference, detect from browser
        const browserLanguage = this.detectBrowserLanguage();
        console.log(`[LanguageService] No saved preference, using browser language: ${browserLanguage}`);
        await this.applyLanguage(browserLanguage);
      }

      this.initialized = true;
      console.log(`[LanguageService] Bootstrap complete. Active language: ${this.getActiveLanguage()}`);
    } catch (error) {
      console.error('[LanguageService] Error loading language on bootstrap:', error);
      // Fallback to default language
      await this.applyLanguage(DEFAULT_LANGUAGE);
      this.initialized = true;
    }
  }

  /**
   * Changes the application language at runtime
   *
   * This method:
   * 1. Validates the language code
   * 2. Updates Transloco's active language
   * 3. Persists preference to settings
   * 4. Emits change event for subscribers
   *
   * @param lang ISO 639-1 language code
   * @param persistToSettings Whether to save to settings (default: true)
   */
  async setLanguage(lang: string, persistToSettings: boolean = true): Promise<void> {
    const normalizedLang = normalizeLanguageCode(lang);

    if (!isValidLanguage(normalizedLang)) {
      console.warn(`[LanguageService] Invalid language code: ${lang}. Using default.`);
      return;
    }

    const previousLanguage = this.activeLanguageSubject.value;

    if (normalizedLang === previousLanguage) {
      console.debug(`[LanguageService] Language already set to: ${normalizedLang}`);
      return;
    }

    console.log(`[LanguageService] Changing language from ${previousLanguage} to ${normalizedLang}`);

    // Apply language to Transloco
    await this.applyLanguage(normalizedLang);

    // Persist to settings if requested
    if (persistToSettings) {
      this.persistLanguageToSettings(normalizedLang);
    }

    // Emit change event
    this.languageChangeSubject.next({
      previousLanguage,
      currentLanguage: normalizedLang,
      timestamp: new Date()
    });
  }

  /**
   * Gets the currently active language code
   *
   * @returns Current ISO 639-1 language code
   */
  getActiveLanguage(): string {
    return this.activeLanguageSubject.value;
  }

  /**
   * Checks if a language is currently active
   *
   * @param lang Language code to check
   * @returns true if the specified language is active
   */
  isActiveLanguage(lang: string): boolean {
    return normalizeLanguageCode(lang) === this.activeLanguageSubject.value;
  }

  /**
   * Checks if a language code is supported
   *
   * @param lang Language code to validate
   * @returns true if language is supported
   */
  isSupportedLanguage(lang: string): boolean {
    return isValidLanguage(lang);
  }

  /**
   * Gets the text direction for the current language
   *
   * @returns 'ltr' or 'rtl'
   */
  getCurrentDirection(): 'ltr' | 'rtl' {
    const config = SUPPORTED_LANGUAGES.find(l => l.code === this.getActiveLanguage());
    return config?.direction ?? 'ltr';
  }

  /**
   * Applies language to Transloco
   *
   * @param lang Language code to apply
   */
  private async applyLanguage(lang: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.transloco.setActiveLang(lang);
        this.updateLanguageState(lang);

        // Update document lang attribute for accessibility
        if (typeof document !== 'undefined') {
          document.documentElement.lang = lang;
          document.documentElement.dir = this.getCurrentDirection();
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Updates internal language state
   *
   * @param lang New language code
   */
  private updateLanguageState(lang: string): void {
    this.activeLanguageSubject.next(lang);
  }

  /**
   * Retrieves saved language from user settings
   *
   * @returns Saved language code or null
   */
  private getSavedLanguageFromSettings(): string | null {
    try {
      const savedValue = this.userSettingsService.getSettingValue(
        LANGUAGE_SETTINGS_CATEGORY,
        LANGUAGE_SETTINGS_KEY
      );

      if (savedValue && isValidLanguage(savedValue)) {
        return savedValue;
      }
    } catch (error) {
      console.debug('[LanguageService] Could not get saved language from settings:', error);
    }

    return null;
  }

  /**
   * Persists language preference to user settings
   *
   * @param lang Language code to persist
   */
  private persistLanguageToSettings(lang: string): void {
    try {
      this.userSettingsService.updateSetting(
        LANGUAGE_SETTINGS_CATEGORY,
        LANGUAGE_SETTINGS_KEY,
        lang
      );
      console.log(`[LanguageService] Language preference saved: ${lang}`);
    } catch (error) {
      console.error('[LanguageService] Failed to persist language to settings:', error);
    }
  }

  /**
   * Detects browser's preferred language
   *
   * @returns Detected language code or default
   */
  private detectBrowserLanguage(): string {
    if (typeof navigator === 'undefined') {
      return DEFAULT_LANGUAGE;
    }

    const browserLang = navigator.language || (navigator as any).userLanguage;
    return normalizeLanguageCode(browserLang);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
