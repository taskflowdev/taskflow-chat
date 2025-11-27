/**
 * @file i18n.config.ts
 * @description Enterprise-level internationalization configuration for TaskFlow Chat
 *
 * This file contains all i18n-related configuration constants, types, and utilities.
 * Following MNC-grade standards with clean architecture and type safety.
 *
 * @version 1.0.0
 * @module CoreI18n
 */

import { isDevMode } from '@angular/core';

/**
 * Supported language configuration
 * Each entry contains:
 * - code: ISO 639-1 language code
 * - label: Display label in native language
 * - displayName: English display name
 * - direction: Text direction (ltr/rtl)
 */
export interface LanguageConfig {
  code: string;
  label: string;
  displayName: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Supported languages registry
 * Maps language codes to their full configuration
 */
export const SUPPORTED_LANGUAGES: readonly LanguageConfig[] = Object.freeze([
  { code: 'en', label: 'English', displayName: 'English', direction: 'ltr' },
  { code: 'es', label: 'Español', displayName: 'Spanish', direction: 'ltr' },
  { code: 'fr', label: 'Français', displayName: 'French', direction: 'ltr' },
  { code: 'de', label: 'Deutsch', displayName: 'German', direction: 'ltr' },
  { code: 'ja', label: '日本語', displayName: 'Japanese', direction: 'ltr' },
  { code: 'zh', label: '中文', displayName: 'Chinese', direction: 'ltr' }
]) as readonly LanguageConfig[];

/**
 * Language codes array for quick validation
 */
export const AVAILABLE_LANGUAGES: readonly string[] = SUPPORTED_LANGUAGES.map(l => l.code);

/**
 * Default application language
 * Used as fallback when user preference is not available
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * Fallback language for missing translations
 */
export const FALLBACK_LANGUAGE = 'en';

/**
 * Settings key for language preference storage
 * This matches the existing settings system pattern
 */
export const LANGUAGE_SETTINGS_KEY = 'language.interface';

/**
 * Settings category for language settings
 */
export const LANGUAGE_SETTINGS_CATEGORY = 'language';

/**
 * Path to translation files (relative to public folder)
 */
export const TRANSLATIONS_PATH = '/i18n';

/**
 * Production mode detection for Transloco configuration
 */
export const IS_PRODUCTION_MODE = (): boolean => !isDevMode();

/**
 * Validates if a language code is supported
 * @param lang Language code to validate
 * @returns true if language is supported
 */
export function isValidLanguage(lang: string | null | undefined): lang is string {
  return typeof lang === 'string' && AVAILABLE_LANGUAGES.includes(lang);
}

/**
 * Gets language configuration by code
 * @param code Language code
 * @returns Language configuration or undefined
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}

/**
 * Gets the display label for a language
 * @param code Language code
 * @returns Display label or code if not found
 */
export function getLanguageLabel(code: string): string {
  return getLanguageConfig(code)?.label ?? code;
}

/**
 * Normalizes a language code to supported format
 * Handles browser locale codes (en-US -> en)
 * @param lang Language code or locale
 * @returns Normalized language code or default
 */
export function normalizeLanguageCode(lang: string | null | undefined): string {
  if (!lang) {
    return DEFAULT_LANGUAGE;
  }

  // Extract base language from locale (en-US -> en)
  const baseLang = lang.split('-')[0].toLowerCase();

  return isValidLanguage(baseLang) ? baseLang : DEFAULT_LANGUAGE;
}
