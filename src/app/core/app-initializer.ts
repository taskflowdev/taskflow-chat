import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';

/**
 * APP_INITIALIZER factory function.
 * Initializes authentication state before the app starts.
 * This ensures that protected routes don't flash before auth state is ready.
 * 
 * Shows a loading screen for a minimum duration to provide smooth UX.
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

      // Minimum time to show loading screen (in ms) for smooth UX
      const MIN_LOADING_TIME = 800;
      const startTime = Date.now();

      // In browser, check if we have stored authentication data
      const token = authService.getToken();
      const currentUser = authService.getCurrentUser();
      
      // Function to complete initialization with minimum delay
      const completeInitialization = () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
        
        setTimeout(() => {
          authService.setInitialized();
          resolve();
        }, remainingTime);
      };

      // If we have both token and user data, consider initialized
      // The guards will verify with the server if needed
      if (token && currentUser) {
        completeInitialization();
        return;
      }
      
      // If we have a token but no user data, clear the token
      // This handles the case where user data was cleared but token wasn't
      if (token && !currentUser) {
        authService.logout();
      }
      
      // No valid auth state, user is not logged in
      completeInitialization();
    });
  };
}
