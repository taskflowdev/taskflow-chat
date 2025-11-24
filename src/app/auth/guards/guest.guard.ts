import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

/**
 * GuestGuard - Prevents authenticated users from accessing login/signup pages
 * 
 * This guard is simplified because StartupService (via APP_INITIALIZER)
 * already verified authentication before routes render.
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

  canActivate(): boolean {
    // During SSR, allow navigation and defer to client-side
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    const token = this.authService.getToken();
    const currentUser = this.authService.getCurrentUser();

    // If authenticated, redirect to chats
    if (token && currentUser) {
      this.router.navigate(['/chats'], { replaceUrl: true });
      return false;
    }

    // Not authenticated, allow access to guest pages
    return true;
  }
}
