import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly ENCRYPTION_KEY = 'taskflow-chat-secure-key-2024';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Set an item in localStorage with optional encryption
   * @param key The key to store the value under
   * @param value The value to store (will be JSON.stringify'd and optionally encrypted)
   * @param encrypt Whether to encrypt the value (default: false)
   */
  setItem<T>(key: string, value: T, encrypt: boolean = false): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const stringValue = JSON.stringify(value);
      const finalValue = encrypt ? this.encrypt(stringValue) : stringValue;
      localStorage.setItem(key, finalValue);
    } catch (error) {
      console.error('Error setting localStorage item:', error);
    }
  }

  /**
   * Get an item from localStorage with optional decryption
   * @param key The key to retrieve the value for
   * @param encrypt Whether the value was encrypted (default: false)
   * @returns The parsed value or null if not found
   */
  getItem<T>(key: string, encrypt: boolean = false): T | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const storedValue = localStorage.getItem(key);
      if (!storedValue) {
        return null;
      }

      const decryptedValue = encrypt ? this.decrypt(storedValue) : storedValue;
      return JSON.parse(decryptedValue) as T;
    } catch (error) {
      console.error('Error getting localStorage item:', error);
      // If parsing/decryption fails, remove the corrupted item
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Set an encrypted item in localStorage
   * @param key The key to store the value under
   * @param value The value to store (will be encrypted)
   */
  setEncryptedItem<T>(key: string, value: T): void {
    this.setItem(key, value, true);
  }

  /**
   * Get an encrypted item from localStorage
   * @param key The key to retrieve the value for
   * @returns The decrypted and parsed value or null if not found
   */
  getEncryptedItem<T>(key: string): T | null {
    return this.getItem<T>(key, true);
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
   * Get all keys from localStorage
   * @returns Array of all localStorage keys
   */
  getAllKeys(): string[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param key The key to check
   * @returns true if the key exists
   */
  hasItem(key: string): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    return localStorage.getItem(key) !== null;
  }

  /**
   * Get the storage size of a specific key in bytes (approximate)
   * @param key The key to check
   * @returns Size in bytes or 0 if not found
   */
  getItemSize(key: string): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 0;
    }

    const item = localStorage.getItem(key);
    return item ? new Blob([item]).size : 0;
  }

  /**
   * Encrypt a value using AES encryption
   * @param value The value to encrypt
   * @returns The encrypted value
   */
  private encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, this.ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt a value using AES decryption
   * @param encryptedValue The encrypted value to decrypt
   * @returns The decrypted value
   */
  private decrypt(encryptedValue: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}