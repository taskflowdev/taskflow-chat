/**
 * @file language.facade.ts
 * @description Facade for language management UI interactions
 *
 * Provides a simplified interface for UI components to interact with
 * the language system. Acts as an abstraction layer between UI and
 * core language services.
 *
 * @version 1.0.0
 * @module CoreI18n
 */

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LanguageService, LanguageChangeEvent } from './language.service';
import { LanguageConfig, SUPPORTED_LANGUAGES, getLanguageLabel } from './i18n.config';

/**
 * Language option for UI dropdown/select components
 */
export interface LanguageOption {
  value: string;
  label: string;
  displayName: string;
  isActive: boolean;
}

/**
 * LanguageFacade
 *
 * UI-focused abstraction over the LanguageService.
 * Provides simple, synchronous-feeling methods for common UI operations.
 *
 * Benefits:
 * - Decouples UI from core service implementation
 * - Provides memoized/computed values
 * - Simplifies component code
 *
 * @example
 * ```typescript
 * // In a component
 * constructor(private languageFacade: LanguageFacade) {}
 *
 * // Get options for dropdown
 * languages = this.languageFacade.getLanguageOptions$();
 *
 * // Handle selection
 * onLanguageChange(lang: string) {
 *   this.languageFacade.switchLanguage(lang);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LanguageFacade {
  private readonly languageService = inject(LanguageService);

  /**
   * Observable stream of language options with active state
   * Suitable for dropdown/select components
   */
  readonly languageOptions$: Observable<LanguageOption[]> = this.languageService.activeLanguage$.pipe(
    map(activeLang => this.buildLanguageOptions(activeLang))
  );

  /**
   * Observable stream of the currently active language label
   */
  readonly activeLanguageLabel$: Observable<string> = this.languageService.activeLanguage$.pipe(
    map(lang => getLanguageLabel(lang))
  );

  /**
   * Observable stream of language change events
   */
  readonly languageChanged$: Observable<LanguageChangeEvent> = this.languageService.languageChange$;

  /**
   * Current language code (snapshot)
   */
  get currentLanguage(): string {
    return this.languageService.getActiveLanguage();
  }

  /**
   * Current language display label (snapshot)
   */
  get currentLanguageLabel(): string {
    return getLanguageLabel(this.currentLanguage);
  }

  /**
   * List of all supported languages
   */
  get supportedLanguages(): readonly LanguageConfig[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Switches the application language
   * Returns a promise for async/await usage in components
   *
   * @param langCode ISO 639-1 language code
   * @returns Promise that resolves when language is changed
   */
  async switchLanguage(langCode: string): Promise<void> {
    return this.languageService.setLanguage(langCode);
  }

  /**
   * Gets a snapshot of language options
   * Useful for one-time reads in templates
   *
   * @returns Array of language options
   */
  getLanguageOptions(): LanguageOption[] {
    return this.buildLanguageOptions(this.currentLanguage);
  }

  /**
   * Checks if a specific language is currently active
   *
   * @param langCode Language code to check
   * @returns true if active
   */
  isActive(langCode: string): boolean {
    return this.languageService.isActiveLanguage(langCode);
  }

  /**
   * Checks if a language is supported
   *
   * @param langCode Language code to check
   * @returns true if supported
   */
  isSupported(langCode: string): boolean {
    return this.languageService.isSupportedLanguage(langCode);
  }

  /**
   * Gets the text direction for current language
   *
   * @returns 'ltr' or 'rtl'
   */
  getTextDirection(): 'ltr' | 'rtl' {
    return this.languageService.getCurrentDirection();
  }

  /**
   * Builds language options array with active state
   *
   * @param activeLang Current active language code
   * @returns Formatted language options
   */
  private buildLanguageOptions(activeLang: string): LanguageOption[] {
    return SUPPORTED_LANGUAGES.map(lang => ({
      value: lang.code,
      label: lang.label,
      displayName: lang.displayName,
      isActive: lang.code === activeLang
    }));
  }
}
