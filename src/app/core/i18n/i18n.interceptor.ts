import { Injectable, Inject, PLATFORM_ID, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { I18nService } from './i18n.service';

/**
 * I18nInterceptor - HTTP interceptor for adding language header to API requests
 * 
 * This interceptor:
 * - Adds 'X-Language' header to all API requests
 * - Helps the backend serve localized responses
 * - Only runs in browser environment
 * 
 * The header format is:
 * ```
 * X-Language: en
 * ```
 * 
 * Usage:
 * Register in app.config.ts:
 * ```typescript
 * { provide: HTTP_INTERCEPTORS, useClass: I18nInterceptor, multi: true }
 * ```
 */
@Injectable()
export class I18nInterceptor implements HttpInterceptor {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private injector: Injector
  ) {}

  /**
   * Lazily get I18nService to avoid circular dependency
   */
  private get i18nService(): I18nService {
    return this.injector.get(I18nService);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip on server
    if (!isPlatformBrowser(this.platformId)) {
      return next.handle(request);
    }

    // Only add header to API requests
    if (!this.shouldAddHeader(request)) {
      return next.handle(request);
    }

    // Get current language
    const lang = this.i18nService.getLanguage();

    // Clone request and add language header
    const modifiedRequest = request.clone({
      setHeaders: {
        'X-Language': lang
      }
    });

    return next.handle(modifiedRequest);
  }

  /**
   * Determine if the language header should be added to this request
   */
  private shouldAddHeader(request: HttpRequest<any>): boolean {
    const url = request.url.toLowerCase();
    
    // Add to API requests
    return url.includes('/api/');
  }
}
