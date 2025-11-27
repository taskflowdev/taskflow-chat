/**
 * @file index.ts
 * @description Public API for the i18n module
 *
 * Barrel file that exports all public i18n APIs.
 * Import from 'src/app/core/i18n' to access any i18n functionality.
 *
 * @version 1.0.0
 * @module CoreI18n
 */

// Configuration and types
export * from './i18n.config';

// Services
export { LanguageService } from './language.service';
export type { LanguageChangeEvent } from './language.service';
export { LanguageFacade } from './language.facade';
export type { LanguageOption } from './language.facade';
export { TranslocoHttpLoader } from './translation-loader.service';

// Interceptor
export { TranslocoHttpInterceptor } from './transloco-http.interceptor';

// Resolver
export { LanguageResolver, languageResolverFn } from './language.resolver';
export type { LanguageResolverData } from './language.resolver';

// Modules
export { I18nModule } from './i18n.module';
export { translocoProviders, TranslocoModule } from './transloco-root.module';
