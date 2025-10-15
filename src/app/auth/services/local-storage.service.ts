import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as CryptoJS from 'crypto-js';
import { BUILD_CONFIG } from '../../core/config/build-config';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
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

      return this.decrypt(encryptedValue);
    } catch (error) {
      console.error('Error getting localStorage item:', error);
      // If decryption fails, remove the corrupted item
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
   * @param value The value to encrypt
   * @returns The encrypted value
   */
  private encrypt(value: string): string {
    // Use the build-time encryption key (embedded during build, not in config.json)
    return CryptoJS.AES.encrypt(value, BUILD_CONFIG.ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt a value using AES decryption
   * @param encryptedValue The encrypted value to decrypt
   * @returns The decrypted value
   */
  private decrypt(encryptedValue: string): string {
    // Use the build-time encryption key (embedded during build, not in config.json)
    const bytes = CryptoJS.AES.decrypt(encryptedValue, BUILD_CONFIG.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}