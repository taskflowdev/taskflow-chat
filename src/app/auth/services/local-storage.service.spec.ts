import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { AppConfigService } from '../../core/services/app-config.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let appConfigService: AppConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LocalStorageService,
        AppConfigService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(LocalStorageService);
    appConfigService = TestBed.inject(AppConfigService);
    
    // Mock the config service to return a test encryption key
    spyOn(appConfigService, 'getEncryptionKey').and.returnValue('test-encryption-key-for-testing');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve encrypted data', () => {
    const testKey = 'test_key';
    const testValue = 'test_value_123';

    // Set the item
    service.setItem(testKey, testValue);

    // Get the item
    const retrievedValue = service.getItem(testKey);

    expect(retrievedValue).toBe(testValue);

    // Clean up
    service.removeItem(testKey);
  });

  it('should handle storing and retrieving tokens', () => {
    const tokenKey = 'taskflow_chat_token';
    const tokenValue = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

    service.setItem(tokenKey, tokenValue);
    const retrievedToken = service.getItem(tokenKey);

    expect(retrievedToken).toBe(tokenValue);

    service.removeItem(tokenKey);
  });

  it('should return null for non-existent keys', () => {
    const result = service.getItem('non_existent_key');
    expect(result).toBeNull();
  });

  it('should remove items correctly', () => {
    const testKey = 'test_remove';
    const testValue = 'test_value';

    service.setItem(testKey, testValue);
    expect(service.getItem(testKey)).toBe(testValue);

    service.removeItem(testKey);
    expect(service.getItem(testKey)).toBeNull();
  });

  it('should detect localStorage availability', () => {
    const isAvailable = service.isAvailable();
    expect(typeof isAvailable).toBe('boolean');
  });
});