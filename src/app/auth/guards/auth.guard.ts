import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of, map, catchError, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(): Observable<boolean> | boolean {
    // During SSR, allow navigation and defer authentication to client-side
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    // Client-side: perform actual authentication check
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // If we have user data in memory, allow access immediately
    if (this.authService.getCurrentUser()) {
      return true;
    }

    // Verify token validity with server
    return this.authService.verifyAuthentication().pipe(
      tap(isValid => {
        if (!isValid) {
          this.router.navigate(['/auth/login']);
        }
      }),
      catchError(() => {
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }
}