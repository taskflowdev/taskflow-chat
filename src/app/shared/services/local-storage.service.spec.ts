import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve typed objects', () => {
    const testObj = { name: 'Test', value: 123, active: true };
    service.setItem('test-obj', testObj);
    
    const retrieved = service.getItem<typeof testObj>('test-obj');
    expect(retrieved).toEqual(testObj);
  });

  it('should handle encrypted storage', () => {
    const sensitiveData = { token: 'secret-token', userId: '123' };
    service.setEncryptedItem('sensitive', sensitiveData);
    
    const retrieved = service.getEncryptedItem<typeof sensitiveData>('sensitive');
    expect(retrieved).toEqual(sensitiveData);
  });

  it('should return null for non-existent items', () => {
    expect(service.getItem('non-existent')).toBeNull();
  });
});