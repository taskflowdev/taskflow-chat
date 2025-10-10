import { Injectable, Inject, PLATFORM_ID, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthInterceptor handles:
 * 1. Attaching Authorization headers to outgoing API requests
 * 2. Handling 401 errors by attempting to refresh the access token
 * 3. Retrying the original request after token refresh
 * 4. Redirecting to login if refresh fails
 * 
 * Note: Uses Injector to lazily inject AuthService to avoid circular dependency
 * (AuthService -> HttpClient -> HTTP_INTERCEPTORS -> AuthInterceptor -> AuthService)
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private injector: Injector,
    private router: Router
  ) {}

  /**
   * Lazily get AuthService to avoid circular dependency
   */
  private get authService(): AuthService {
    return this.injector.get(AuthService);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only process in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return next.handle(request);
    }

    // Add token to request if needed
    if (this.shouldAddToken(request)) {
      const token = this.authService.getToken();
      if (token) {
        request = this.addAuthHeader(request, token);
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401 && this.shouldHandleUnauthorized(request)) {
          return this.handle401Error(request, next);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Add Authorization header to request
   */
  private addAuthHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Determine if token should be added to this request
   */
  private shouldAddToken(request: HttpRequest<any>): boolean {
    const url = request.url.toLowerCase();
    // Don't add token to auth endpoints (login, register, refresh)
    if (url.includes('/api/auth/login') || 
        url.includes('/api/auth/register') ||
        url.includes('/api/auth/refresh')) {
      return false;
    }
    // Add token to other API requests
    return url.includes('/api/');
  }

  /**
   * Determine if 401 error should trigger token refresh
   */
  private shouldHandleUnauthorized(request: HttpRequest<any>): boolean {
    const url = request.url.toLowerCase();
    // Don't retry auth endpoints
    return !url.includes('/api/auth/login') && 
           !url.includes('/api/auth/register') &&
           !url.includes('/api/auth/refresh');
  }

  /**
   * Handle 401 error by attempting to refresh token and retry request
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshAccessToken().pipe(
        switchMap((success: boolean) => {
          this.isRefreshing = false;
          
          if (success) {
            const newToken = this.authService.getToken();
            this.refreshTokenSubject.next(newToken);
            
            // Retry the original request with new token
            return next.handle(this.addAuthHeader(request, newToken!));
          } else {
            // Refresh failed, logout and redirect to login
            this.authService.logout();
            this.router.navigate(['/auth/login']);
            return throwError(() => new Error('Token refresh failed'));
          }
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return throwError(() => error);
        })
      );
    } else {
      // Wait for token refresh to complete, then retry request
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addAuthHeader(request, token));
        })
      );
    }
  }
}