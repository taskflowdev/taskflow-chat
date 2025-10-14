import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Interface for the runtime configuration loaded from assets/config.json
 */
export interface AppConfig {
  apiUrl: string;
  encryptionKey: string;
  production: boolean;
}

/**
 * Service to load and provide runtime configuration from assets/config.json
 * This allows configuration to be set via environment variables at deployment time
 * without rebuilding the application.
 */
@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private config: AppConfig | null = null;
  private readonly CONFIG_URL = '/config.json';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Load the configuration from assets/config.json
   * Should be called during APP_INITIALIZER before the app starts
   * @returns Promise that resolves when configuration is loaded
   */
  async loadConfig(): Promise<void> {
    // During SSR, use default values
    if (!isPlatformBrowser(this.platformId)) {
      this.config = this.getDefaultConfig();
      return;
    }

    try {
      // Load config.json from assets folder
      this.config = await firstValueFrom(
        this.http.get<AppConfig>(this.CONFIG_URL)
      );
      
      // Validate required fields
      if (!this.config.apiUrl) {
        console.error('Configuration error: apiUrl is required');
        this.config = this.getDefaultConfig();
      }
      if (!this.config.encryptionKey) {
        console.error('Configuration error: encryptionKey is required');
        this.config = this.getDefaultConfig();
      }
    } catch (error) {
      console.error('Failed to load configuration from config.json:', error);
      console.warn('Using default configuration values');
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * Get the API base URL
   */
  getApiUrl(): string {
    return this.config?.apiUrl || 'https://localhost:44347';
  }

  /**
   * Get the encryption key for local storage
   */
  getEncryptionKey(): string {
    return this.config?.encryptionKey || 'default-key-change-me';
  }

  /**
   * Check if the app is running in production mode
   */
  isProduction(): boolean {
    return this.config?.production || false;
  }

  /**
   * Get the entire configuration object
   */
  getConfig(): AppConfig {
    return this.config || this.getDefaultConfig();
  }

  /**
   * Get default configuration (fallback values)
   */
  private getDefaultConfig(): AppConfig {
    return {
      apiUrl: 'https://localhost:44347',
      encryptionKey: 'default-key-change-me',
      production: false
    };
  }
}
