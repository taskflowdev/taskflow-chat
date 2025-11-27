/**
 * @file translation-loader.service.ts
 * @description HTTP-based translation loader for Transloco
 *
 * Implements TranslocoLoader interface to fetch translation JSON files
 * from the assets/i18n folder. Includes caching, error handling, and SSR support.
 *
 * @version 1.0.0
 * @module CoreI18n
 */

import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { TRANSLATIONS_PATH, DEFAULT_LANGUAGE } from './i18n.config';

// Import static translations for SSR
import enTranslations from '../../../../public/i18n/en.json';
import esTranslations from '../../../../public/i18n/es.json';
import frTranslations from '../../../../public/i18n/fr.json';
import deTranslations from '../../../../public/i18n/de.json';
import jaTranslations from '../../../../public/i18n/ja.json';
import zhTranslations from '../../../../public/i18n/zh.json';

/**
 * Static translations map for SSR
 * These are bundled with the server build to avoid HTTP calls during prerendering
 */
const STATIC_TRANSLATIONS: Record<string, Translation> = {
  en: enTranslations as Translation,
  es: esTranslations as Translation,
  fr: frTranslations as Translation,
  de: deTranslations as Translation,
  ja: jaTranslations as Translation,
  zh: zhTranslations as Translation
};

/**
 * TranslocoHttpLoader
 *
 * Enterprise-grade translation loader that:
 * - Fetches translation files via HTTP (browser)
 * - Uses static imports during SSR/prerendering
 * - Caches loaded translations in memory
 * - Provides fallback to default language on error
 * - Uses shareReplay for concurrent request optimization
 *
 * @example
 * ```typescript
 * // Transloco will automatically call getTranslation('en')
 * // when the active language is set to 'en'
 * ```
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * In-memory translation cache
   * Key: language code, Value: cached Observable
   */
  private readonly translationCache = new Map<string, Observable<Translation>>();

  /**
   * Loads translations for the specified language
   *
   * @param lang ISO 639-1 language code
   * @returns Observable of translation object
   */
  getTranslation(lang: string): Observable<Translation> {
    // For SSR/prerendering, use static translations
    if (!this.isBrowser) {
      const staticTranslation = STATIC_TRANSLATIONS[lang] || STATIC_TRANSLATIONS[DEFAULT_LANGUAGE] || {};
      return of(staticTranslation);
    }

    // Check cache first
    const cached = this.translationCache.get(lang);
    if (cached) {
      return cached;
    }

    // Build translation file URL
    const translationUrl = `${TRANSLATIONS_PATH}/${lang}.json`;

    // Fetch and cache the translation
    const translation$ = this.http.get<Translation>(translationUrl).pipe(
      tap(() => {
        console.debug(`[TranslocoHttpLoader] Loaded translations for: ${lang}`);
      }),
      catchError((error) => {
        console.error(`[TranslocoHttpLoader] Failed to load translations for ${lang}:`, error);

        // If this is not the default language, try loading default as fallback
        if (lang !== DEFAULT_LANGUAGE) {
          console.warn(`[TranslocoHttpLoader] Falling back to ${DEFAULT_LANGUAGE}`);
          return this.getTranslation(DEFAULT_LANGUAGE);
        }

        // Return empty translation object to prevent app crash
        return of({} as Translation);
      }),
      // Cache the result for concurrent requests
      shareReplay(1)
    );

    // Store in cache
    this.translationCache.set(lang, translation$);

    return translation$;
  }

  /**
   * Clears the translation cache
   * Useful for forcing a reload of translations
   */
  clearCache(): void {
    this.translationCache.clear();
    console.debug('[TranslocoHttpLoader] Translation cache cleared');
  }

  /**
   * Clears cache for a specific language
   * @param lang Language code to clear from cache
   */
  clearLanguageCache(lang: string): void {
    this.translationCache.delete(lang);
    console.debug(`[TranslocoHttpLoader] Cache cleared for: ${lang}`);
  }
}
