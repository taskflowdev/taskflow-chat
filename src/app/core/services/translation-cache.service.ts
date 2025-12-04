import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocalStorageService } from '../../auth/services/local-storage.service';
import { TranslationPayloadDto } from '../../api/models/translation-payload-dto';

/**
 * Interface for cached translation data with metadata
 */
interface CachedTranslation {
  data: TranslationPayloadDto;
  cachedAt: number;
  version?: string;
}

/**
 * TranslationCacheService - Enterprise-grade encrypted translation caching
 *
 * Features:
 * - Encrypted storage using LocalStorageService (AES encryption)
 * - TTL-based cache validation
 * - Version-based cache invalidation
 * - Per-language cache management
 * - SSR compatible
 *
 * Architecture:
 * - Uses LocalStorageService for secure encrypted storage
 * - Each language has its own cache entry with metadata
 * - Cache entries include timestamp and version for validation
 * - Automatic cleanup of expired cache entries
 */
@Injectable({
  providedIn: 'root'
})
export class TranslationCacheService {
  private readonly CACHE_KEY_PREFIX = 'i18n_cache';
  private readonly DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private localStorageService: LocalStorageService
  ) {}

  /**
   * Get cached translations for a language
   * Returns null if cache is invalid, expired, or not found
   *
   * @param lang Language code
   * @param currentVersion Optional version to validate against cached version
   * @param ttlMs Time-to-live in milliseconds (default: 24 hours)
   * @returns Cached translation payload or null
   */
  getCachedTranslations(
    lang: string,
    currentVersion?: string,
    ttlMs: number = this.DEFAULT_TTL_MS
  ): TranslationPayloadDto | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(lang);
      const cachedData = this.localStorageService.getItem(cacheKey);

      if (!cachedData) {
        console.log(`TranslationCache: No cache found for language: ${lang}`);
        return null;
      }

      const cached: CachedTranslation = JSON.parse(cachedData);

      // Validate cache freshness
      const now = Date.now();
      const age = now - cached.cachedAt;

      if (age > ttlMs) {
        console.log(`TranslationCache: Cache expired for language: ${lang} (age: ${Math.round(age / 1000 / 60)} minutes)`);
        this.removeCachedTranslations(lang);
        return null;
      }

      // Validate version if provided
      if (currentVersion && cached.version && cached.version !== currentVersion) {
        console.log(`TranslationCache: Version mismatch for language: ${lang} (cached: ${cached.version}, current: ${currentVersion})`);
        this.removeCachedTranslations(lang);
        return null;
      }

      console.log(`TranslationCache: Valid cache found for language: ${lang} (age: ${Math.round(age / 1000 / 60)} minutes)`);
      return cached.data;
    } catch (error) {
      console.error('TranslationCache: Error reading cache:', error);
      return null;
    }
  }

  /**
   * Set cached translations for a language
   *
   * @param lang Language code
   * @param data Translation payload to cache
   * @param version Optional version string for cache invalidation
   */
  setCachedTranslations(
    lang: string,
    data: TranslationPayloadDto,
    version?: string
  ): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const cacheKey = this.getCacheKey(lang);
      const cached: CachedTranslation = {
        data,
        cachedAt: Date.now(),
        version: version || data.meta?.version
      };

      const serialized = JSON.stringify(cached);
      this.localStorageService.setItem(cacheKey, serialized);
      console.log(`TranslationCache: Cached translations for language: ${lang} (version: ${cached.version})`);
    } catch (error) {
      console.error('TranslationCache: Error writing cache:', error);
    }
  }

  /**
   * Remove cached translations for a specific language
   *
   * @param lang Language code
   */
  removeCachedTranslations(lang: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const cacheKey = this.getCacheKey(lang);
      this.localStorageService.removeItem(cacheKey);
      console.log(`TranslationCache: Removed cache for language: ${lang}`);
    } catch (error) {
      console.error('TranslationCache: Error removing cache:', error);
    }
  }

  /**
   * Clear all cached translations
   * Uses LocalStorageService for consistency with encrypted storage pattern
   */
  clearAllCaches(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      // Note: LocalStorageService doesn't provide a way to list keys,
      // so we need to access localStorage directly here for cleanup.
      // This is acceptable for a maintenance operation.
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
            keysToRemove.push(key);
          }
        }

        // Remove all matching keys using LocalStorageService
        keysToRemove.forEach(key => {
          this.localStorageService.removeItem(key);
        });

        console.log(`TranslationCache: Cleared ${keysToRemove.length} cache entries`);
      }
    } catch (error) {
      console.error('TranslationCache: Error clearing all caches:', error);
    }
  }

  /**
   * Get cache metadata for a language without loading full data
   *
   * @param lang Language code
   * @returns Cache metadata or null if not found
   */
  getCacheMetadata(lang: string): { cachedAt: number; version?: string; age: number } | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(lang);
      const cachedData = this.localStorageService.getItem(cacheKey);

      if (!cachedData) {
        return null;
      }

      const cached: CachedTranslation = JSON.parse(cachedData);
      const age = Date.now() - cached.cachedAt;

      return {
        cachedAt: cached.cachedAt,
        version: cached.version,
        age
      };
    } catch (error) {
      console.error('TranslationCache: Error reading cache metadata:', error);
      return null;
    }
  }

  /**
   * Generate cache key for a language
   */
  private getCacheKey(lang: string): string {
    return `${this.CACHE_KEY_PREFIX}_${lang}`;
  }
}
