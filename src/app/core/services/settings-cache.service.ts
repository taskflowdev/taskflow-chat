import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocalStorageService } from '../../auth/services/local-storage.service';
import { EffectiveSettingsResponse } from '../../api/models/effective-settings-response';
import { versionedKey, now, isCacheFresh } from '../utils/settings.utils';

/**
 * Cached settings data structure with versioning
 */
interface CachedSettings {
  version: number;
  timestamp: number;
  data: EffectiveSettingsResponse;
}

/**
 * SettingsCacheService
 * 
 * Manages cached user settings with versioning support.
 * Provides fast initial load from cache and background refresh from API.
 * 
 * Features:
 * - Encrypted storage via LocalStorageService
 * - Versioned schema (future-proof migrations)
 * - Cache freshness validation
 * - Automatic background refresh
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsCacheService {
  private readonly CACHE_KEY = 'user_settings';
  private readonly CURRENT_VERSION = 1;
  private readonly CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private localStorageService: LocalStorageService
  ) {}

  /**
   * Get cached settings if available and fresh
   * @returns Cached settings or null if not available/stale
   */
  getCachedSettings(): EffectiveSettingsResponse | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const key = versionedKey(this.CACHE_KEY, this.CURRENT_VERSION);
      const cachedData = this.localStorageService.getItem(key);

      if (!cachedData) {
        return null;
      }

      const cached: CachedSettings = JSON.parse(cachedData);

      // Validate version
      if (cached.version !== this.CURRENT_VERSION) {
        console.warn('Settings cache version mismatch, clearing cache');
        this.clearCache();
        return null;
      }

      // Check if cache is still fresh
      if (!isCacheFresh(cached.timestamp, this.CACHE_MAX_AGE)) {
        console.log('Settings cache expired, will fetch fresh data');
        return null;
      }

      console.log('Using cached settings');
      return cached.data;
    } catch (error) {
      console.error('Error reading cached settings:', error);
      this.clearCache();
      return null;
    }
  }

  /**
   * Save settings to cache
   * @param settings Settings to cache
   */
  setCachedSettings(settings: EffectiveSettingsResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const cached: CachedSettings = {
        version: this.CURRENT_VERSION,
        timestamp: now(),
        data: settings
      };

      const key = versionedKey(this.CACHE_KEY, this.CURRENT_VERSION);
      this.localStorageService.setItem(key, JSON.stringify(cached));
      console.log('Settings cached successfully');
    } catch (error) {
      console.error('Error caching settings:', error);
    }
  }

  /**
   * Clear cached settings
   */
  clearCache(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const key = versionedKey(this.CACHE_KEY, this.CURRENT_VERSION);
      this.localStorageService.removeItem(key);
      
      // Also clear old versions if they exist
      for (let version = 1; version < this.CURRENT_VERSION; version++) {
        const oldKey = versionedKey(this.CACHE_KEY, version);
        this.localStorageService.removeItem(oldKey);
      }
      
      console.log('Settings cache cleared');
    } catch (error) {
      console.error('Error clearing settings cache:', error);
    }
  }

  /**
   * Check if cached settings exist and are fresh
   * @returns True if valid cache exists
   */
  hasFreshCache(): boolean {
    return this.getCachedSettings() !== null;
  }

  /**
   * Get cache age in milliseconds
   * @returns Cache age or -1 if no cache
   */
  getCacheAge(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return -1;
    }

    try {
      const key = versionedKey(this.CACHE_KEY, this.CURRENT_VERSION);
      const cachedData = this.localStorageService.getItem(key);

      if (!cachedData) {
        return -1;
      }

      const cached: CachedSettings = JSON.parse(cachedData);
      return now() - cached.timestamp;
    } catch (error) {
      return -1;
    }
  }

  /**
   * Migrate from old cache version to new version
   * Override this method when incrementing CURRENT_VERSION
   */
  private migrateCache(oldVersion: number, oldData: any): CachedSettings | null {
    // Future: Implement migration logic when version changes
    // For now, just return null to force refresh
    console.warn(`No migration path from version ${oldVersion} to ${this.CURRENT_VERSION}`);
    return null;
  }
}
