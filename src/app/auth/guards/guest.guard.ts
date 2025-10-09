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

    // If we have user data in memory, redirect to chats
    if (currentUser) {
      return of(false).pipe(
        tap(() => {
          this.router.navigate(['/chats'], { replaceUrl: true });
        })
      );
    }

    // Have token but no user in memory - try to restore from localStorage
    const restoredUser = this.authService.restoreUserFromStorage();
    if (restoredUser) {
      return of(false).pipe(
        tap(() => {
          this.router.navigate(['/chats'], { replaceUrl: true });
        })
      );
    }

    // No stored user data, allow access to guest pages
    return of(true);
  }
}
