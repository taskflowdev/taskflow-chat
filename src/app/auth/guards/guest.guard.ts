import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

/**
 * GuestGuard prevents authenticated users from accessing login/signup pages.
 * This ensures that logged-in users are automatically redirected to the main app.
 * 
 * IMPORTANT: This guard blocks route activation (returns Observable) to prevent
 * the login/signup UI from flashing before redirect.
 */
@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(): Observable<boolean> {
    // During SSR, allow navigation and defer to client-side
    if (!isPlatformBrowser(this.platformId)) {
      return of(true);
    }

    const token = this.authService.getToken();
    const currentUser = this.authService.getCurrentUser();

    // No token means user is not authenticated, allow access to guest pages
    if (!token) {
      return of(true);
    }

    // If we have both token and user data, redirect to chats immediately
    // Return Observable to ensure route activation is blocked
    if (currentUser) {
      return of(false).pipe(
        tap(() => {
          this.router.navigate(['/chats'], { replaceUrl: true });
        })
      );
    }

    // Token exists but no user data in memory
    // Verify authentication with server before deciding
    // This Observable blocks route activation until verification completes
    return this.authService.verifyAuthentication().pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          // User is authenticated, redirect to chats
          this.router.navigate(['/chats'], { replaceUrl: true });
          return false;
        }
        // Authentication failed, allow access to guest pages
        return true;
      })
    );
  }
}
