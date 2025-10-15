import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Interface for the runtime configuration loaded from assets/config.json
 * 
 * SECURITY NOTE: This config is served publicly as a static file.
 * DO NOT include sensitive values like encryption keys or API secrets.
 */
export interface AppConfig {
  apiUrl: string;
  production: boolean;
}

/**
 * Configuration loading states
 */
enum ConfigState {
  NOT_LOADED = 'NOT_LOADED',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  FAILED = 'FAILED'
}

/**
 * Service to load and provide runtime configuration from assets/config.json
 * This allows configuration to be set via environment variables at deployment time
 * without rebuilding the application.
 * 
 * SECURITY NOTE: Only non-sensitive configuration values should be in config.json
 * as it is publicly accessible. Sensitive values like encryption keys should be
 * embedded at build time using environment variables and file replacement.
 * 
 * Features:
 * - Loads config once during APP_INITIALIZER
 * - Caches config in memory and sessionStorage for redundancy
 * - Falls back to safe defaults if loading fails
 * - SSR-safe (uses defaults during server-side rendering)
 * - Never returns undefined - always has valid config
 */
@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private config: AppConfig | null = null;
  private configState: ConfigState = ConfigState.NOT_LOADED;
  private readonly CONFIG_URL = '/config.json';
  private readonly CONFIG_STORAGE_KEY = 'taskflow_app_config';
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Try to restore config from sessionStorage immediately
    // This helps handle cases where service might be recreated
    if (isPlatformBrowser(this.platformId)) {
      this.restoreConfigFromStorage();
    }
  }

  /**
   * Load the configuration from assets/config.json
   * Should be called during APP_INITIALIZER before the app starts
   * @returns Promise that resolves when configuration is loaded
   */
  async loadConfig(): Promise<void> {
    // If already loaded or loading, skip
    if (this.configState === ConfigState.LOADED && this.config) {
      console.log('AppConfig: Already loaded, skipping reload');
      return;
    }

    if (this.configState === ConfigState.LOADING) {
      console.log('AppConfig: Already loading, waiting...');
      // Wait for loading to complete
      await this.waitForConfigLoad();
      return;
    }

    // During SSR, use default values
    if (!isPlatformBrowser(this.platformId)) {
      console.log('AppConfig: SSR detected, using default config');
      this.config = this.getDefaultConfig();
      this.configState = ConfigState.LOADED;
      return;
    }

    // Try to restore from sessionStorage first
    if (this.restoreConfigFromStorage()) {
      console.log('AppConfig: Restored from sessionStorage');
      return;
    }

    // Load from HTTP with retry mechanism
    await this.loadConfigWithRetry();
  }

  /**
   * Load config from HTTP with retry mechanism
   */
  private async loadConfigWithRetry(): Promise<void> {
    this.configState = ConfigState.LOADING;
    
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`AppConfig: Loading config from ${this.CONFIG_URL} (attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS})`);
        
        const loadedConfig = await firstValueFrom(
          this.http.get<AppConfig>(this.CONFIG_URL)
        );
        
        // Validate the loaded config
        if (this.validateConfig(loadedConfig)) {
          this.config = loadedConfig;
          this.configState = ConfigState.LOADED;
          
          // Cache in sessionStorage for redundancy
          this.saveConfigToStorage();
          
          console.log('AppConfig: Successfully loaded and cached', {
            apiUrl: this.config.apiUrl,
            production: this.config.production
          });
          return;
        } else {
          console.error('AppConfig: Validation failed for loaded config');
          throw new Error('Invalid configuration structure');
        }
      } catch (error) {
        console.error(`AppConfig: Load attempt ${attempt} failed:`, error);
        
        if (attempt === this.MAX_RETRY_ATTEMPTS) {
          // All retries exhausted, use defaults
          console.warn('AppConfig: All retry attempts failed, using default configuration');
          this.config = this.getDefaultConfig();
          this.configState = ConfigState.FAILED;
          this.saveConfigToStorage(); // Save defaults too
          return;
        }
        
        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt - 1) * 100);
      }
    }
  }

  /**
   * Validate configuration object
   */
  private validateConfig(config: any): config is AppConfig {
    if (!config || typeof config !== 'object') {
      return false;
    }
    
    if (!config.apiUrl || typeof config.apiUrl !== 'string') {
      console.error('AppConfig: Missing or invalid apiUrl');
      return false;
    }
    
    if (typeof config.production !== 'boolean') {
      console.error('AppConfig: Missing or invalid production flag');
      return false;
    }
    
    return true;
  }

  /**
   * Wait for config to finish loading (if already in progress)
   */
  private async waitForConfigLoad(): Promise<void> {
    const maxWaitTime = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let elapsed = 0;

    while (this.configState === ConfigState.LOADING && elapsed < maxWaitTime) {
      await this.delay(checkInterval);
      elapsed += checkInterval;
    }

    if (this.configState === ConfigState.LOADING) {
      console.error('AppConfig: Timeout waiting for config to load');
      this.config = this.getDefaultConfig();
      this.configState = ConfigState.FAILED;
    }
  }

  /**
   * Restore configuration from sessionStorage
   * @returns true if successfully restored
   */
  private restoreConfigFromStorage(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    try {
      const stored = sessionStorage.getItem(this.CONFIG_STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        if (this.validateConfig(parsedConfig)) {
          this.config = parsedConfig;
          this.configState = ConfigState.LOADED;
          console.log('AppConfig: Successfully restored from sessionStorage');
          return true;
        }
      }
    } catch (error) {
      console.error('AppConfig: Failed to restore from sessionStorage:', error);
      sessionStorage.removeItem(this.CONFIG_STORAGE_KEY);
    }
    
    return false;
  }

  /**
   * Save configuration to sessionStorage for redundancy
   */
  private saveConfigToStorage(): void {
    if (!isPlatformBrowser(this.platformId) || !this.config) {
      return;
    }

    try {
      sessionStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('AppConfig: Failed to save to sessionStorage:', error);
    }
  }

  /**
   * Delay helper for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the API base URL
   * Always returns a valid URL, never undefined
   */
  getApiUrl(): string {
    if (!this.config) {
      console.warn('AppConfig: Config not loaded yet, using default API URL');
      return this.getDefaultConfig().apiUrl;
    }
    return this.config.apiUrl;
  }

  /**
   * Check if the app is running in production mode
   */
  isProduction(): boolean {
    if (!this.config) {
      return false;
    }
    return this.config.production;
  }

  /**
   * Get the entire configuration object
   * Always returns a valid config, never null/undefined
   */
  getConfig(): AppConfig {
    if (!this.config) {
      console.warn('AppConfig: Config not loaded yet, using default config');
      return this.getDefaultConfig();
    }
    return { ...this.config }; // Return a copy to prevent mutations
  }

  /**
   * Check if config has been successfully loaded
   */
  isConfigLoaded(): boolean {
    return this.configState === ConfigState.LOADED && this.config !== null;
  }

  /**
   * Get current config state for debugging
   */
  getConfigState(): string {
    return this.configState;
  }

  /**
   * Force reload configuration (for debugging or recovery)
   * Use with caution - normally config should be loaded once
   */
  async reloadConfig(): Promise<void> {
    console.log('AppConfig: Force reloading configuration');
    this.configState = ConfigState.NOT_LOADED;
    this.config = null;
    await this.loadConfig();
  }

  /**
   * Get configuration health status (for debugging)
   */
  getHealthStatus(): {
    state: string;
    hasConfig: boolean;
    configSource: string;
    config: AppConfig;
  } {
    return {
      state: this.configState,
      hasConfig: this.config !== null,
      configSource: this.config ? 'loaded' : 'default',
      config: this.getConfig()
    };
  }

  /**
   * Get default configuration (fallback values)
   */
  private getDefaultConfig(): AppConfig {
    return {
      apiUrl: 'https://localhost:44347',
      production: false
    };
  }
}
