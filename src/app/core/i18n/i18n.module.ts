/**
 * @file i18n.module.ts
 * @description Central i18n module for TaskFlow Chat
 *
 * Aggregates and exports all i18n-related services, modules, and utilities.
 * Feature modules should import this module for translation support.
 *
 * @version 1.0.0
 * @module CoreI18n
 */

import { NgModule } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

/**
 * I18nModule
 *
 * Feature module for internationalization support.
 * Import this in any feature module that needs translation capabilities.
 *
 * Provides:
 * - TranslocoModule for template pipes and directives
 * - Access to translation services via DI
 *
 * @example
 * ```typescript
 * // In a feature module
 * @NgModule({
 *   imports: [
 *     CommonModule,
 *     I18nModule
 *   ]
 * })
 * export class MyFeatureModule { }
 * ```
 *
 * @example
 * ```typescript
 * // In a standalone component
 * @Component({
 *   imports: [I18nModule]
 * })
 * export class MyComponent { }
 * ```
 */
@NgModule({
  imports: [
    TranslocoModule
  ],
  exports: [
    TranslocoModule
  ]
})
export class I18nModule { }
