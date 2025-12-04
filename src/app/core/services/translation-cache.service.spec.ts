import { TestBed } from '@angular/core/testing';
import { TranslationCacheService } from './translation-cache.service';
import { LocalStorageService } from '../../auth/services/local-storage.service';
import { TranslationPayloadDto } from '../../api/models/translation-payload-dto';

describe('TranslationCacheService', () => {
  let service: TranslationCacheService;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;

  const mockTranslationPayload: TranslationPayloadDto = {
    data: {
      'navbar': {
        'settings': 'Settings',
        'profile': 'Profile'
      }
    },
    meta: {
      lang: 'en',
      version: '1.0',
      totalKeys: 2,
      generatedAt: new Date().toISOString()
    }
  };

  beforeEach(() => {
    const localStorageSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem', 'removeItem']);

    TestBed.configureTestingModule({
      providers: [
        TranslationCacheService,
        { provide: LocalStorageService, useValue: localStorageSpy }
      ]
    });

    service = TestBed.inject(TranslationCacheService);
    localStorageService = TestBed.inject(LocalStorageService) as jasmine.SpyObj<LocalStorageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setCachedTranslations', () => {
    it('should cache translations with metadata', () => {
      service.setCachedTranslations('en', mockTranslationPayload, '1.0');

      expect(localStorageService.setItem).toHaveBeenCalledWith(
        'i18n_cache_en',
        jasmine.any(String)
      );
    });

    it('should include timestamp and version in cache', () => {
      let capturedData: string = '';
      localStorageService.setItem.and.callFake((key: string, value: string) => {
        capturedData = value;
      });

      service.setCachedTranslations('en', mockTranslationPayload, '1.0');

      const cached = JSON.parse(capturedData);
      expect(cached.cachedAt).toBeDefined();
      expect(cached.version).toBe('1.0');
      expect(cached.data).toEqual(mockTranslationPayload);
    });
  });

  describe('getCachedTranslations', () => {
    it('should return null if no cache exists', () => {
      localStorageService.getItem.and.returnValue(null);

      const result = service.getCachedTranslations('en');

      expect(result).toBeNull();
    });

    it('should return cached data if valid and not expired', () => {
      const cachedData = {
        data: mockTranslationPayload,
        cachedAt: Date.now(),
        version: '1.0'
      };
      localStorageService.getItem.and.returnValue(JSON.stringify(cachedData));

      const result = service.getCachedTranslations('en', '1.0');

      expect(result).toEqual(mockTranslationPayload);
    });

    it('should return null if cache is expired', () => {
      const oneDayAgo = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const cachedData = {
        data: mockTranslationPayload,
        cachedAt: oneDayAgo,
        version: '1.0'
      };
      localStorageService.getItem.and.returnValue(JSON.stringify(cachedData));

      const result = service.getCachedTranslations('en', '1.0');

      expect(result).toBeNull();
      expect(localStorageService.removeItem).toHaveBeenCalledWith('i18n_cache_en');
    });

    it('should return null if version mismatch', () => {
      const cachedData = {
        data: mockTranslationPayload,
        cachedAt: Date.now(),
        version: '1.0'
      };
      localStorageService.getItem.and.returnValue(JSON.stringify(cachedData));

      const result = service.getCachedTranslations('en', '2.0');

      expect(result).toBeNull();
      expect(localStorageService.removeItem).toHaveBeenCalledWith('i18n_cache_en');
    });
  });

  describe('removeCachedTranslations', () => {
    it('should remove cache for specific language', () => {
      service.removeCachedTranslations('en');

      expect(localStorageService.removeItem).toHaveBeenCalledWith('i18n_cache_en');
    });
  });

  describe('getCacheMetadata', () => {
    it('should return metadata without loading full data', () => {
      const cachedAt = Date.now();
      const cachedData = {
        data: mockTranslationPayload,
        cachedAt,
        version: '1.0'
      };
      localStorageService.getItem.and.returnValue(JSON.stringify(cachedData));

      const metadata = service.getCacheMetadata('en');

      expect(metadata).toBeDefined();
      expect(metadata!.cachedAt).toBe(cachedAt);
      expect(metadata!.version).toBe('1.0');
      expect(metadata!.age).toBeGreaterThanOrEqual(0);
    });

    it('should return null if no cache exists', () => {
      localStorageService.getItem.and.returnValue(null);

      const metadata = service.getCacheMetadata('en');

      expect(metadata).toBeNull();
    });
  });
});
