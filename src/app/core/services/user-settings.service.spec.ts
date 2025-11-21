import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { UserSettingsService } from './user-settings.service';
import { SettingsService } from '../../api/services/settings.service';
import { CatalogService } from '../../api/services/catalog.service';
import { ApiConfiguration } from '../../api/api-configuration';
import { ThemeService } from './theme.service';
import { SettingsCacheService } from './settings-cache.service';
import { of, throwError } from 'rxjs';
import { EffectiveSettingsResponse } from '../../api/models/effective-settings-response';
import { CatalogResponse } from '../../api/models/catalog-response';

describe('UserSettingsService', () => {
  let service: UserSettingsService;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let catalogService: jasmine.SpyObj<CatalogService>;
  let apiConfiguration: jasmine.SpyObj<ApiConfiguration>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let settingsCacheService: jasmine.SpyObj<SettingsCacheService>;

  const mockEffectiveSettings: EffectiveSettingsResponse = {
    settings: {
      appearance: {
        'appearance.theme': 'dark',
        'appearance.fontSize': 'medium'
      }
    },
    userId: 'user-123',
    tenantId: 'tenant-456'
  };

  const mockCatalog: CatalogResponse = {
    categories: [
      {
        key: 'appearance',
        displayName: 'Appearance',
        description: 'Appearance settings',
        keys: [
          {
            key: 'appearance.theme',
            label: 'Theme',
            description: 'Color theme',
            type: 'select',
            default: 'system',
            options: [
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' }
            ]
          },
          {
            key: 'appearance.fontSize',
            label: 'Font Size',
            description: 'Font size',
            type: 'select',
            default: 'medium',
            options: [
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' }
            ]
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', [
      'apiSettingsMeGet$Json',
      'apiSettingsMePut$Json'
    ]);
    const catalogServiceSpy = jasmine.createSpyObj('CatalogService', [
      'apiSettingsCatalogGet$Json'
    ]);
    const apiConfigurationSpy = jasmine.createSpyObj('ApiConfiguration', [], {
      rootUrl: 'https://localhost:44347'
    });
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', [
      'initialize',
      'setTheme',
      'setFontSize'
    ]);
    const settingsCacheServiceSpy = jasmine.createSpyObj('SettingsCacheService', [
      'getCachedSettings',
      'setCachedSettings'
    ]);

    TestBed.configureTestingModule({
      providers: [
        UserSettingsService,
        { provide: SettingsService, useValue: settingsServiceSpy },
        { provide: CatalogService, useValue: catalogServiceSpy },
        { provide: ApiConfiguration, useValue: apiConfigurationSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: SettingsCacheService, useValue: settingsCacheServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(UserSettingsService);
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    catalogService = TestBed.inject(CatalogService) as jasmine.SpyObj<CatalogService>;
    apiConfiguration = TestBed.inject(ApiConfiguration) as jasmine.SpyObj<ApiConfiguration>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    settingsCacheService = TestBed.inject(SettingsCacheService) as jasmine.SpyObj<SettingsCacheService>;

    // Setup default mock responses
    settingsService.apiSettingsMeGet$Json.and.returnValue(of({ 
      success: true, 
      data: mockEffectiveSettings 
    }));
    settingsService.apiSettingsMePut$Json.and.returnValue(of({ 
      success: true, 
      data: { 
        id: 'setting-1',
        category: 'appearance',
        ownerId: 'user-123',
        ownerType: 'User',
        payload: {},
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } 
    }));
    catalogService.apiSettingsCatalogGet$Json.and.returnValue(of({ 
      success: true, 
      data: mockCatalog 
    }));
    settingsCacheService.getCachedSettings.and.returnValue(null);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadCatalog', () => {
    it('should load catalog from backend', (done) => {
      service.loadCatalog().subscribe(catalog => {
        expect(catalog).toEqual(mockCatalog);
        expect(catalogService.apiSettingsCatalogGet$Json).toHaveBeenCalled();
        done();
      });
    });

    it('should handle catalog load errors', (done) => {
      catalogService.apiSettingsCatalogGet$Json.and.returnValue(
        throwError(() => new Error('Load failed'))
      );

      service.loadCatalog().subscribe({
        error: (err) => {
          expect(err.message).toBe('Load failed');
          done();
        }
      });
    });
  });

  describe('loadUserSettings', () => {
    it('should load settings from API when no cache', (done) => {
      settingsCacheService.getCachedSettings.and.returnValue(null);

      service.loadUserSettings().subscribe(settings => {
        expect(settings).toEqual(mockEffectiveSettings);
        expect(settingsService.apiSettingsMeGet$Json).toHaveBeenCalled();
        expect(themeService.initialize).toHaveBeenCalledWith('dark', 'medium');
        done();
      });
    });

    it('should load settings from cache when available', (done) => {
      settingsCacheService.getCachedSettings.and.returnValue(mockEffectiveSettings);

      service.loadUserSettings().subscribe(settings => {
        expect(settings).toEqual(mockEffectiveSettings);
        expect(settingsService.apiSettingsMeGet$Json).not.toHaveBeenCalled();
        expect(themeService.initialize).toHaveBeenCalledWith('dark', 'medium');
        done();
      });
    });
  });

  describe('updateSetting', () => {
    beforeEach((done) => {
      // Load initial settings
      service.loadUserSettings().subscribe(() => done());
    });

    it('should update in-memory cache immediately', () => {
      service.updateSetting('appearance', 'appearance.theme', 'light');
      
      const value = service.getSettingValue('appearance', 'appearance.theme');
      expect(value).toBe('light');
    });

    it('should apply theme effect immediately', () => {
      service.updateSetting('appearance', 'appearance.theme', 'light');
      
      expect(themeService.setTheme).toHaveBeenCalledWith('light');
    });

    it('should debounce multiple rapid updates', fakeAsync(() => {
      // Make multiple rapid updates
      service.updateSetting('appearance', 'appearance.theme', 'light');
      tick(100);
      service.updateSetting('appearance', 'appearance.theme', 'dark');
      tick(100);
      service.updateSetting('appearance', 'appearance.theme', 'system');
      
      // API should not be called yet
      expect(settingsService.apiSettingsMePut$Json).not.toHaveBeenCalled();
      
      // Wait for debounce time
      tick(300);
      
      // API should be called once with final value
      expect(settingsService.apiSettingsMePut$Json).toHaveBeenCalledTimes(1);
      expect(settingsService.apiSettingsMePut$Json).toHaveBeenCalledWith({
        body: {
          category: 'appearance',
          payload: { 'appearance.theme': 'system' }
        }
      });

      // Cleanup
      flush();
    }));

    it('should merge updates by category', fakeAsync(() => {
      // Make multiple updates to same category
      service.updateSetting('appearance', 'appearance.theme', 'light');
      service.updateSetting('appearance', 'appearance.fontSize', 'large');
      
      // Wait for debounce
      tick(300);
      
      // Should be called once with both updates
      expect(settingsService.apiSettingsMePut$Json).toHaveBeenCalledTimes(1);
      expect(settingsService.apiSettingsMePut$Json).toHaveBeenCalledWith({
        body: {
          category: 'appearance',
          payload: {
            'appearance.theme': 'light',
            'appearance.fontSize': 'large'
          }
        }
      });

      // Cleanup
      flush();
    }));

    it('should refresh settings after save', fakeAsync(() => {
      service.updateSetting('appearance', 'appearance.theme', 'light');
      
      tick(300);
      
      // Should refresh after save
      expect(settingsService.apiSettingsMeGet$Json).toHaveBeenCalled();

      // Cleanup
      flush();
    }));

    it('should handle save errors gracefully', fakeAsync(() => {
      settingsService.apiSettingsMePut$Json.and.returnValue(
        throwError(() => new Error('Save failed'))
      );

      service.updateSetting('appearance', 'appearance.theme', 'light');
      
      tick(300);
      
      // Service should continue to work despite error
      expect(settingsService.apiSettingsMePut$Json).toHaveBeenCalled();

      // Cleanup
      flush();
    }));
  });

  describe('getSettingValue', () => {
    beforeEach((done) => {
      service.loadUserSettings().subscribe(() => done());
    });

    it('should get setting value', () => {
      const value = service.getSettingValue('appearance', 'appearance.theme');
      expect(value).toBe('dark');
    });

    it('should return undefined for non-existent setting', () => {
      const value = service.getSettingValue('nonexistent', 'key');
      expect(value).toBeUndefined();
    });
  });

  describe('getDefaultValue', () => {
    beforeEach((done) => {
      catalogService.apiSettingsCatalogGet$Json.and.returnValue(of({ 
        success: true, 
        data: mockCatalog 
      }));
      service.loadCatalog().subscribe(() => done());
    });

    it('should get default value from catalog', () => {
      const value = service.getDefaultValue('appearance', 'appearance.theme');
      expect(value).toBe('system');
    });

    it('should return undefined for non-existent setting', () => {
      const value = service.getDefaultValue('nonexistent', 'key');
      expect(value).toBeUndefined();
    });
  });

  describe('resetToDefault', () => {
    beforeEach((done) => {
      catalogService.apiSettingsCatalogGet$Json.and.returnValue(of({ 
        success: true, 
        data: mockCatalog 
      }));
      service.loadCatalog().subscribe(() => {
        service.loadUserSettings().subscribe(() => done());
      });
    });

    it('should reset setting to default value', fakeAsync(() => {
      service.resetToDefault('appearance', 'appearance.theme');
      
      const value = service.getSettingValue('appearance', 'appearance.theme');
      expect(value).toBe('system'); // default value
      
      // Cleanup
      flush();
    }));
  });

  describe('isModifiedFromDefault', () => {
    beforeEach((done) => {
      catalogService.apiSettingsCatalogGet$Json.and.returnValue(of({ 
        success: true, 
        data: mockCatalog 
      }));
      service.loadCatalog().subscribe(() => {
        service.loadUserSettings().subscribe(() => done());
      });
    });

    it('should detect modified setting', () => {
      const isModified = service.isModifiedFromDefault('appearance', 'appearance.theme');
      expect(isModified).toBe(true); // current is 'dark', default is 'system'
    });

    it('should detect unmodified setting', () => {
      service.updateSetting('appearance', 'appearance.theme', 'system');
      const isModified = service.isModifiedFromDefault('appearance', 'appearance.theme');
      expect(isModified).toBe(false);
    });
  });

  describe('refreshSettings', () => {
    it('should force refresh from API', (done) => {
      service.refreshSettings().subscribe(settings => {
        expect(settings).toEqual(mockEffectiveSettings);
        expect(settingsService.apiSettingsMeGet$Json).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('pending updates queue', () => {
    beforeEach((done) => {
      service.loadUserSettings().subscribe(() => done());
    });

    it('should queue multiple updates before save', fakeAsync(() => {
      // Make 3 updates quickly
      service.updateSetting('appearance', 'appearance.theme', 'light');
      tick(50);
      service.updateSetting('appearance', 'appearance.fontSize', 'large');
      tick(50);
      service.updateSetting('appearance', 'appearance.theme', 'dark');
      
      // API should not be called yet
      expect(settingsService.apiSettingsMePut$Json).not.toHaveBeenCalled();
      
      // Wait for debounce
      tick(300);
      
      // Should merge and save all updates
      expect(settingsService.apiSettingsMePut$Json).toHaveBeenCalledTimes(1);
      expect(settingsService.apiSettingsMePut$Json).toHaveBeenCalledWith({
        body: {
          category: 'appearance',
          payload: {
            'appearance.theme': 'dark', // last value wins
            'appearance.fontSize': 'large'
          }
        }
      });

      // Cleanup
      flush();
    }));

    it('should not make duplicate saves', fakeAsync(() => {
      service.updateSetting('appearance', 'appearance.theme', 'light');
      tick(150);
      service.updateSetting('appearance', 'appearance.theme', 'light'); // same value
      
      tick(300);
      
      // Should still only call once
      expect(settingsService.apiSettingsMePut$Json).toHaveBeenCalledTimes(1);

      // Cleanup
      flush();
    }));
  });
});
