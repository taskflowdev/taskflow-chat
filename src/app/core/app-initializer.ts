import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';

/**
 * APP_INITIALIZER factory function.
 * Verifies authentication before the app starts.
 * This ensures that protected routes don't flash before auth verification completes.
 * 
 * Only runs in browser environment - skips during SSR.
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

      // In browser, verify authentication if token exists
      const token = authService.getToken();
      if (!token) {
        // No token, user is not logged in - resolve immediately
        authService.setInitialized();
        resolve();
        return;
      }

      // Token exists, verify with server
      authService.verifyAuthentication().subscribe({
        next: () => {
          // Verification complete (success or failure)
          authService.setInitialized();
          resolve();
        },
        error: () => {
          // Verification failed
          authService.setInitialized();
          resolve();
        }
      });
    });
  };
}
