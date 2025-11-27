/**
 * @file language.resolver.ts
 * @description Route resolver for preloading translations
 *
 * Ensures translations are loaded before route activation,
 * preventing flash of untranslated content (FOUTC).
 *
 * @version 1.0.0
 * @module CoreI18n
 */

import { Injectable, inject } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { catchError, first, map, tap } from 'rxjs/operators';
import { LanguageService } from './language.service';

/**
 * Language resolver result interface
 */
export interface LanguageResolverData {
  language: string;
  loaded: boolean;
}

/**
 * LanguageResolver
 *
 * Route resolver that ensures translations are loaded before
 * the route component renders. This prevents:
 * - Flash of untranslated content
 * - Translation key flicker
 * - Layout shift from different text lengths
 *
 * Usage:
 * ```typescript
 * // In route configuration
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   resolve: { language: LanguageResolver }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LanguageResolver implements Resolve<LanguageResolverData> {
  private readonly transloco = inject(TranslocoService);
  private readonly languageService = inject(LanguageService);

  /**
   * Resolves the route by ensuring translations are loaded
   *
   * @param route Activated route snapshot
   * @param state Router state snapshot
   * @returns Observable that completes when translations are ready
   */
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<LanguageResolverData> {
    const currentLang = this.languageService.getActiveLanguage();

    // Check if translations are already loaded
    const existingTranslation = this.transloco.getTranslation(currentLang);

    if (existingTranslation && Object.keys(existingTranslation).length > 0) {
      // Translations already loaded
      return of({
        language: currentLang,
        loaded: true
      });
    }

    // Load translations and wait for completion
    return this.transloco.load(currentLang).pipe(
      first(),
      tap(() => {
        console.debug(`[LanguageResolver] Translations loaded for route: ${state.url}`);
      }),
      map(() => ({
        language: currentLang,
        loaded: true
      })),
      catchError(error => {
        console.error('[LanguageResolver] Failed to load translations:', error);
        // Return with loaded: false to indicate failure, but don't block navigation
        return of({
          language: currentLang,
          loaded: false
        });
      })
    );
  }
}

/**
 * Factory function for creating the resolver
 * Can be used with functional resolvers in Angular 15+
 */
export const languageResolverFn = () => {
  const transloco = inject(TranslocoService);
  const languageService = inject(LanguageService);
  const currentLang = languageService.getActiveLanguage();

  return transloco.load(currentLang).pipe(
    first(),
    map(() => ({
      language: currentLang,
      loaded: true
    })),
    catchError(() => of({
      language: currentLang,
      loaded: false
    }))
  );
};
