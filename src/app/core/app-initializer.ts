import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';

/**
 * APP_INITIALIZER factory function.
 * Initializes authentication state before the app starts.
 * This ensures that protected routes don't flash before auth state is ready.
 * 
 * Only runs in browser environment - skips during SSR.
 * 
 * IMPORTANT: Does NOT make HTTP requests during initialization to avoid
 * circular dependency with AuthInterceptor. Instead, it restores user state
 * from localStorage if available.
 */
export function appInitializerFactory(
  authService: AuthService,
  platformId: Object
): () => Promise<void> {
  return (): Promise<void> => {
    return new Promise((resolve) => {
      // During SSR, skip initialization and resolve immediately
      if (!isPlatformBrowser(platformId)) {
        authService.setInitialized();
        resolve();
        return;
      }

      // In browser, check if we have stored authentication data
      const token = authService.getToken();
      const currentUser = authService.getCurrentUser();
      
      // If we have both token and user data, consider initialized
      // The guards will verify with the server if needed
      if (token && currentUser) {
        authService.setInitialized();
        resolve();
        return;
      }
      
      // If we have a token but no user data, clear the token
      // This handles the case where user data was cleared but token wasn't
      if (token && !currentUser) {
        authService.logout();
      }
      
      // No valid auth state, user is not logged in
      authService.setInitialized();
      resolve();
    });
  };
}
