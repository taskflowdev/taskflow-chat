import { I18nService } from './i18n.service';

/**
 * Factory function for APP_INITIALIZER with I18nService
 * 
 * This initializes the internationalization system:
 * 1. Loads saved language from localStorage
 * 2. Fetches translations from API
 * 3. Falls back to cached translations if API fails
 * 4. Sets up the document lang and dir attributes
 * 
 * @param i18nService The internationalization service
 * @returns Factory function that returns a Promise
 */
export function i18nInitializerFactory(
  i18nService: I18nService
): () => Promise<void> {
  return (): Promise<void> => {
    return i18nService.initialize();
  };
}
