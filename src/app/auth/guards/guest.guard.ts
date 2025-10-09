import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of, map } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

/**
 * GuestGuard prevents authenticated users from accessing login/signup pages.
 * This ensures that logged-in users are automatically redirected to the main app.
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

  canActivate(): Observable<boolean> | boolean {
    // During SSR, allow navigation and defer to client-side
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    const token = this.authService.getToken();
    const currentUser = this.authService.getCurrentUser();

    // No token means user is not authenticated, allow access to guest pages
    if (!token) {
      return true;
    }

    // If we have both token and user data, redirect to chats
    if (currentUser) {
      this.router.navigate(['/chats'], { replaceUrl: true });
      return false;
    }

    // Token exists but no user data in memory
    // Verify authentication with server before deciding
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
