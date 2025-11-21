import { AppInitService } from './services/app-init.service';

/**
 * Factory function for APP_INITIALIZER
 * 
 * This replaces the old appInitializerFactory and provides a more
 * comprehensive initialization pipeline that:
 * 1. Waits for authentication
 * 2. Loads user settings
 * 3. Applies theme before first render
 * 4. Ensures minimum splash screen duration
 * 
 * @param appInitService The application initialization service
 * @returns Factory function that returns a Promise
 */
export function appInitServiceFactory(
  appInitService: AppInitService
): () => Promise<void> {
  return (): Promise<void> => {
    return appInitService.initialize();
  };
}
