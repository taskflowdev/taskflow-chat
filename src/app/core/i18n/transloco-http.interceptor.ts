/**
 * @file transloco-http.interceptor.ts
 * @description HTTP interceptor for adding Accept-Language header
 *
 * Automatically appends the Accept-Language header to all outgoing HTTP requests,
 * ensuring backend services can provide localized responses.
 *
 * @version 1.0.0
 * @module CoreI18n
 */

import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { LanguageService } from './language.service';

/**
 * TranslocoHttpInterceptor
 *
 * Intercepts all HTTP requests and adds the Accept-Language header
 * based on the currently active language.
 *
 * This enables:
 * - Server-side localization of responses
 * - Content negotiation for API endpoints
 * - Consistent language context across client-server
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * { provide: HTTP_INTERCEPTORS, useClass: TranslocoHttpInterceptor, multi: true }
 * ```
 */
@Injectable()
export class TranslocoHttpInterceptor implements HttpInterceptor {
  private readonly languageService = inject(LanguageService);

  /**
   * URLs that should NOT have the Accept-Language header added
   * Typically includes external APIs or CDN resources
   */
  private readonly excludedUrlPatterns: RegExp[] = [
    /^https?:\/\/cdn\./i,
    /\.json$/i  // Skip for static JSON files like translations
  ];

  /**
   * Intercepts HTTP requests and adds Accept-Language header
   *
   * @param request The outgoing HTTP request
   * @param next The next handler in the chain
   * @returns Observable of HTTP event
   */
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Skip if URL matches exclusion patterns
    if (this.shouldExclude(request.url)) {
      return next.handle(request);
    }

    // Get current active language
    const currentLang = this.languageService.getActiveLanguage();

    // Clone request with Accept-Language header
    const localizedRequest = request.clone({
      setHeaders: {
        'Accept-Language': this.formatAcceptLanguage(currentLang)
      }
    });

    return next.handle(localizedRequest);
  }

  /**
   * Checks if URL should be excluded from language header injection
   *
   * @param url Request URL to check
   * @returns true if URL should be excluded
   */
  private shouldExclude(url: string): boolean {
    return this.excludedUrlPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Formats the Accept-Language header value
   * Follows HTTP specification with quality values
   *
   * @param primaryLang Primary language code
   * @returns Formatted Accept-Language header value
   */
  private formatAcceptLanguage(primaryLang: string): string {
    // Format: primary-lang, en;q=0.9, *;q=0.5
    // This tells the server: prefer primary language, then English, then anything
    if (primaryLang === 'en') {
      return 'en, *;q=0.5';
    }
    return `${primaryLang}, en;q=0.9, *;q=0.5`;
  }
}
