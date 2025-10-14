import { AppConfigService } from './services/app-config.service';

/**
 * Factory function for APP_INITIALIZER that loads runtime configuration
 * before the Angular app starts.
 * 
 * This ensures that all configuration values are available when services
 * and components initialize.
 * 
 * Features:
 * - Loads config before app bootstraps
 * - Never fails - uses defaults if config can't be loaded
 * - Logs config status for debugging
 */
export function appConfigInitializerFactory(
  appConfigService: AppConfigService
): () => Promise<void> {
  return async () => {
    try {
      await appConfigService.loadConfig();
      
      // Log the health status after loading
      const health = appConfigService.getHealthStatus();
      console.log('AppConfig Initializer: Configuration loaded', {
        state: health.state,
        hasConfig: health.hasConfig,
        apiUrl: health.config.apiUrl,
        production: health.config.production
      });
      
      // Always resolve successfully - app should start even if config fails
      return Promise.resolve();
    } catch (error) {
      // This should never happen as loadConfig handles all errors internally
      console.error('AppConfig Initializer: Unexpected error during config load', error);
      // Still resolve to allow app to start with defaults
      return Promise.resolve();
    }
  };
}
