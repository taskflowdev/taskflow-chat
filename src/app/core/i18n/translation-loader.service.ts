/**
 * @file translation-loader.service.ts
 * @description HTTP-based translation loader for Transloco
 *
 * Implements TranslocoLoader interface to fetch translation JSON files
 * from the assets/i18n folder. Includes caching and error handling.
 *
 * @version 1.0.0
 * @module CoreI18n
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { TRANSLATIONS_PATH, DEFAULT_LANGUAGE } from './i18n.config';

/**
 * TranslocoHttpLoader
 *
 * Enterprise-grade translation loader that:
 * - Fetches translation files via HTTP
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
