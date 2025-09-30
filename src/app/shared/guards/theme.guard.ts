import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

/**
 * Guard that allows all routes to pass through
 * Theme application is now handled by AppComponent based on auth status
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeGuard implements CanActivate {

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Simply allow all routes - theme management is handled in AppComponent
    return true;
  }
}