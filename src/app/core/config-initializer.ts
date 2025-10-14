import { AppConfigService } from './services/app-config.service';

/**
 * Factory function for APP_INITIALIZER that loads runtime configuration
 * before the Angular app starts.
 * 
 * This ensures that all configuration values are available when services
 * and components initialize.
 */
export function appConfigInitializerFactory(
  appConfigService: AppConfigService
): () => Promise<void> {
  return () => appConfigService.loadConfig();
}
