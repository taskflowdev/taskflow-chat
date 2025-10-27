import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as CryptoJS from 'crypto-js';
import { AppConfigService } from '../../core/services/app-config.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private appConfigService: AppConfigService
  ) {}

  /**
   * Set an item in localStorage with encryption
   * @param key The key to store the value under
   * @param value The value to store (will be encrypted)
   */
  setItem(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const encryptedValue = this.encrypt(value);
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Error setting localStorage item:', error);
    }
  }

  /**
   * Get an item from localStorage with decryption
   * @param key The key to retrieve the value for
   * @returns The decrypted value or null if not found
   */
  getItem(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) {
        return null;
      }

      const decrypted = this.decrypt(encryptedValue);
      
      // If decrypted successfully with fallback key, re-encrypt with current key
      // This auto-migrates data encrypted with old keys
      const currentKey = this.appConfigService.getEncryptionKey();
      if (currentKey && currentKey !== 'default-key-change-me' && decrypted) {
        // Re-encrypt to ensure consistency
        this.setItem(key, decrypted);
      }
      
      return decrypted;
    } catch (error) {
      console.error('Error getting localStorage item:', error);
      // If decryption fails completely, remove the corrupted item
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Remove an item from localStorage
   * @param key The key to remove
   */
  removeItem(key: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing localStorage item:', error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Check if localStorage is available
   * @returns true if localStorage is available and working
   */
  isAvailable(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    try {
      const testKey = '__localStorage_test__';
      const testValue = 'test';
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return retrieved === testValue;
    } catch (error) {
      console.error('localStorage is not available:', error);
      return false;
    }
  }

  /**
   * Encrypt a value using AES encryption
   * Always uses the configured encryption key from AppConfigService
   * @param value The value to encrypt
   * @returns The encrypted value
   */
  private encrypt(value: string): string {
    const encryptionKey = this.appConfigService.getEncryptionKey();
    
    // Ensure we have a valid key (should always be true after AppConfigService loads)
    if (!encryptionKey || encryptionKey === 'default-key-change-me') {
      console.warn('LocalStorageService: Using default encryption key - config may not be loaded yet');
    }
    
    // Always use the key from config service (it provides defaults if needed)
    return CryptoJS.AES.encrypt(value, encryptionKey).toString();
  }

  /**
   * Decrypt a value using AES decryption
   * Tries with configured key first, then fallback key if that fails
   * @param encryptedValue The encrypted value to decrypt
   * @returns The decrypted value
   */
  private decrypt(encryptedValue: string): string {
    const encryptionKey = this.appConfigService.getEncryptionKey();
    
    // Try with configured key first
    try {
      if (encryptionKey && encryptionKey !== 'default-key-change-me') {
        const bytes = CryptoJS.AES.decrypt(encryptedValue, encryptionKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (decrypted) {
          return decrypted;
        }
      }
    } catch (error) {
      console.warn('LocalStorageService: Decryption with configured key failed, trying fallback');
    }
    
    // If configured key failed or is not set, try fallback key
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, 'default-key-change-me');
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (decrypted) {
        console.warn('LocalStorageService: Decrypted with fallback key, consider re-encrypting');
        return decrypted;
      }
    } catch (error) {
      console.error('LocalStorageService: Decryption with fallback key also failed');
    }
    
    // If both attempts failed, throw error
    throw new Error('Failed to decrypt value with both configured and fallback keys');
  }
}