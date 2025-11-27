/**
 * @file transloco-root.module.ts
 * @description Transloco root configuration module
 *
 * Provides the core Transloco configuration for the application.
 * Should be imported once in the root application module/config.
 *
 * @version 1.0.0
 * @module CoreI18n
 */

import { Provider, isDevMode } from '@angular/core';
import {
  provideTransloco,
  TranslocoModule,
  TRANSLOCO_CONFIG,
  TRANSLOCO_LOADER,
  translocoConfig
} from '@jsverse/transloco';
import { TranslocoHttpLoader } from './translation-loader.service';
import {
  AVAILABLE_LANGUAGES,
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE
} from './i18n.config';

/**
 * Creates Transloco configuration object
 *
 * Configuration options:
 * - availableLangs: List of supported language codes
 * - defaultLang: Default language to use
 * - fallbackLang: Fallback when translation is missing
 * - reRenderOnLangChange: Re-render components on language change
 * - prodMode: Enable production optimizations
 * - missingHandler: Configure missing translation handling
 */
const createTranslocoConfig = () => translocoConfig({
  availableLangs: [...AVAILABLE_LANGUAGES],
  defaultLang: DEFAULT_LANGUAGE,
  fallbackLang: FALLBACK_LANGUAGE,
  reRenderOnLangChange: true,
  prodMode: !isDevMode(),
  missingHandler: {
    useFallbackTranslation: true,
    allowEmpty: false,
    logMissingKey: isDevMode()
  }
});

/**
 * Transloco root providers
 *
 * Use with provideTransloco() in standalone applications
 * or import TranslocoRootModule in module-based apps
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     ...translocoProviders
 *   ]
 * };
 * ```
 */
export const translocoProviders: Provider[] = [
  provideTransloco({
    config: {
      availableLangs: [...AVAILABLE_LANGUAGES],
      defaultLang: DEFAULT_LANGUAGE,
      fallbackLang: FALLBACK_LANGUAGE,
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
      missingHandler: {
        useFallbackTranslation: true,
        allowEmpty: false,
        logMissingKey: isDevMode()
      }
    },
    loader: TranslocoHttpLoader
  })
];

/**
 * Export TranslocoModule for use in feature modules
 */
export { TranslocoModule };
