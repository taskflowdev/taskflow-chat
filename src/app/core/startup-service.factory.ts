import { StartupService } from './services/startup.service';

/**
 * Factory function for APP_INITIALIZER with StartupService
 * 
 * This provides a comprehensive initialization pipeline that:
 * 1. Verifies authentication with /me endpoint
 * 2. Loads user settings if authenticated
 * 3. Applies theme before first render
 * 4. Ensures minimum splash screen duration for smooth UX
 * 
 * @param startupService The startup initialization service
 * @returns Factory function that returns a Promise
 */
export function startupServiceFactory(
  startupService: StartupService
): () => Promise<void> {
  return (): Promise<void> => {
    return startupService.initialize();
  };
}
