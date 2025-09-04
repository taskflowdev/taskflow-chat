import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly TOKEN_KEY = 'taskflow_chat_token';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private localStorageService: LocalStorageService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only add token for API requests and in browser environment
    if (isPlatformBrowser(this.platformId) && this.shouldAddToken(request)) {
      const token = this.localStorageService.getItem(this.TOKEN_KEY);
      if (token) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    }

    return next.handle(request);
  }

  private shouldAddToken(request: HttpRequest<any>): boolean {
    // Add token to API requests (those starting with /api/ or the configured base path)
    const url = request.url.toLowerCase();
    return url.includes('/api/') || url.includes('/auth/');
  }
}