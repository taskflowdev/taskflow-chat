import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard - Protects routes that require authentication
 * 
 * This guard is simplified because StartupService (via APP_INITIALIZER)
 * already verified authentication and loaded user profile before any routes render.
 * The guard just needs to check if user is authenticated.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(): boolean {
    // During SSR, allow navigation and defer authentication to client-side
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    // Check if user is authenticated
    // StartupService already verified this before routes render
    const token = this.authService.getToken();
    const currentUser = this.authService.getCurrentUser();
    
    if (token && currentUser) {
      return true;
    }

    // Not authenticated, redirect to login
    this.router.navigate(['/auth/login']);
    return false;
  }
}