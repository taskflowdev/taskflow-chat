/**
 * I18n Module - Enterprise-grade internationalization for Angular
 * 
 * This module provides a complete i18n solution:
 * 
 * ## Features
 * - Fetches translations from API endpoint (GET api/i18n/{lang})
 * - Integrates with UserSettingsService for language preference persistence
 * - Caches translations in memory and localStorage
 * - Reactive language switching using BehaviorSubject
 * - Supports nested keys with dot notation
 * - Supports placeholder interpolation ({{key}}, {key})
 * - Automatic RTL support for Arabic, Hebrew, etc.
 * - SSR compatible
 * 
 * ## Setup
 * 
 * 1. Add to app.config.ts:
 * ```typescript
 * import { I18nService, I18nInterceptor, i18nInitializerFactory } from './core/i18n';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // ... other providers
 *     { provide: HTTP_INTERCEPTORS, useClass: I18nInterceptor, multi: true },
 *     {
 *       provide: APP_INITIALIZER,
 *       useFactory: i18nInitializerFactory,
 *       deps: [I18nService],
 *       multi: true
 *     },
 *   ]
 * };
 * ```
 * 
 * 2. Add RtlDirective to root component:
 * ```typescript
 * @Component({
 *   selector: 'app-root',
 *   imports: [RtlDirective, ...],
 *   template: '<div appRtl><router-outlet></router-outlet></div>'
 * })
 * export class AppComponent {}
 * ```
 * 
 * ## Usage
 * 
 * ### In TypeScript:
 * ```typescript
 * constructor(private i18n: I18nService) {}
 * 
 * // Get translation
 * const text = this.i18n.t('navbar.settings');
 * 
 * // With interpolation
 * const text = this.i18n.t('sidebar.last-message.types.text', { 
 *   sender: 'John', 
 *   message: 'Hello' 
 * });
 * 
 * // Change language via settings
 * this.userSettingsService.updateSetting('language-region', 'language-region.interfaceLanguage', 'ar');
 * 
 * // Check if RTL
 * if (this.i18n.isRTL()) { ... }
 * ```
 * 
 * ### In Templates:
 * ```html
 * <!-- Simple translation -->
 * <span>{{ 'navbar.settings' | translate }}</span>
 * 
 * <!-- With interpolation -->
 * <span>{{ 'messages.count' | translate:{ count: 10 } }}</span>
 * ```
 * 
 * ## API Response Format
 * 
 * The service expects the following response format from GET api/i18n/{lang}:
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "meta": {
 *       "lang": "en",
 *       "version": "2025.12.01.111451",
 *       "generatedAt": "2025-12-01T11:14:51.0487299+00:00",
 *       "totalKeys": 255
 *     },
 *     "data": {
 *       "navbar": {
 *         "settings": "Settings",
 *         "chats": "Chats"
 *       },
 *       "sidebar": {
 *         "last-message": {
 *           "types": {
 *             "text": "{{sender}}: {{message}}"
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 */

// Services
export * from './i18n.service';
export * from './i18n-initializer';

// Pipes
export * from './translate.pipe';

// Directives
export * from './rtl.directive';

// Interceptor
export * from './i18n.interceptor';
