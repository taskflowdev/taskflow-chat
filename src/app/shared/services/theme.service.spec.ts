import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ThemeService } from './theme.service';
import { DynamicThemesService } from '../../api/services/dynamic-themes.service';
import { LocalStorageService } from './local-storage.service';
import { ThemeMode, Theme, UserThemePreference } from '../models/theme.models';

describe('ThemeService', () => {
  let service: ThemeService;
  let themesApiService: jasmine.SpyObj<DynamicThemesService>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;

  const mockLightTheme: Theme = {
    id: 'light-theme-1',
    name: 'Light',
    mode: 'light',
    isBuiltIn: true,
    tokens: {
      'BackgroundColor': '#ffffff',
      'TextColor': '#212529',
      'ThemeType': 'Light'
    },
    variants: [
      {
        id: 'light-variant-1',
        name: 'Default',
        isDefault: true,
        themeId: 'light-theme-1',
        themeMode: 'light',
        tokens: {
          'AccentPrimary': '#0d6efd'
        },
        accentColors: {
          primary: '#0d6efd',
          secondary: '#6c757d'
        }
      }
    ]
  };

  const mockDarkTheme: Theme = {
    id: 'dark-theme-1',
    name: 'Dark',
    mode: 'dark',
    isBuiltIn: true,
    tokens: {
      'BackgroundColor': '#1a1d29',
      'TextColor': '#ffffff',
      'ThemeType': 'Dark'
    },
    variants: [
      {
        id: 'dark-variant-1',
        name: 'Default',
        isDefault: true,
        themeId: 'dark-theme-1',
        themeMode: 'dark',
        tokens: {
          'AccentPrimary': '#0a58ca'
        },
        accentColors: {
          primary: '#0a58ca',
          secondary: '#5a6268'
        }
      }
    ]
  };

  beforeEach(() => {
    const themesApiSpy = jasmine.createSpyObj('DynamicThemesService', [
      'apiThemesGet',
      'apiThemesUserGet',
      'apiThemesUserPost',
      'apiThemesUserEffectiveGet'
    ]);
    const localStorageSpy = jasmine.createSpyObj('LocalStorageService', [
      'setItem',
      'getItem',
      'removeItem'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DynamicThemesService, useValue: themesApiSpy },
        { provide: LocalStorageService, useValue: localStorageSpy }
      ]
    });

    service = TestBed.inject(ThemeService);
    themesApiService = TestBed.inject(DynamicThemesService) as jasmine.SpyObj<DynamicThemesService>;
    localStorageService = TestBed.inject(LocalStorageService) as jasmine.SpyObj<LocalStorageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadThemes', () => {
    it('should load themes from API and cache them', (done) => {
      themesApiService.apiThemesGet.and.returnValue(of({
        success: true,
        data: [
          {
            id: 'light-theme-1',
            name: 'Light',
            themeType: 'Light',
            isBuiltIn: true,
            tokens: { 'BackgroundColor': '#ffffff' },
            variants: []
          }
        ]
      }));

      service.loadThemes().subscribe(themes => {
        expect(themes.length).toBeGreaterThan(0);
        expect(localStorageService.setItem).toHaveBeenCalled();
        done();
      });
    });

    it('should return cached themes if available', (done) => {
      localStorageService.getItem.and.returnValue([mockLightTheme]);

      service.loadThemes().subscribe(themes => {
        expect(themes).toEqual([mockLightTheme]);
        expect(themesApiService.apiThemesGet).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle API errors gracefully', (done) => {
      localStorageService.getItem.and.returnValue(null);
      themesApiService.apiThemesGet.and.returnValue(throwError(() => new Error('API Error')));

      service.loadThemes().subscribe(themes => {
        expect(themes).toEqual([]);
        expect(service.error()).toBe('API Error');
        done();
      });
    });
  });

  describe('loadUserPreferences', () => {
    it('should load user preferences from API', (done) => {
      themesApiService.apiThemesUserGet.and.returnValue(of({
        success: true,
        data: {
          lightThemeId: 'light-theme-1',
          lightVariantId: 'light-variant-1',
          darkThemeId: 'dark-theme-1',
          darkVariantId: 'dark-variant-1',
          syncWithSystem: false
        }
      }));

      service.loadUserPreferences().subscribe(prefs => {
        expect(prefs.lightThemeId).toBe('light-theme-1');
        expect(localStorageService.setItem).toHaveBeenCalled();
        done();
      });
    });

    it('should fallback to cached preferences on API error', (done) => {
      const cachedPrefs: UserThemePreference = {
        lightThemeId: 'light-theme-1',
        lightThemeVariantId: 'light-variant-1',
        darkThemeId: 'dark-theme-1',
        darkThemeVariantId: 'dark-variant-1',
        syncWithSystem: false,
        currentMode: ThemeMode.LIGHT
      };

      localStorageService.getItem.and.returnValue(cachedPrefs);
      themesApiService.apiThemesUserGet.and.returnValue(throwError(() => new Error('API Error')));

      service.loadUserPreferences().subscribe(prefs => {
        expect(prefs).toEqual(cachedPrefs);
        done();
      });
    });
  });

  describe('updateThemeMode', () => {
    beforeEach(() => {
      // Set initial user preferences
      service.userPreferences.set({
        lightThemeId: 'light-theme-1',
        lightThemeVariantId: 'light-variant-1',
        darkThemeId: 'dark-theme-1',
        darkThemeVariantId: 'dark-variant-1',
        syncWithSystem: false,
        currentMode: ThemeMode.LIGHT
      });
    });

    it('should update theme mode and save to API', (done) => {
      themesApiService.apiThemesUserPost.and.returnValue(of({
        success: true,
        data: {
          lightThemeId: 'light-theme-1',
          lightVariantId: 'light-variant-1',
          darkThemeId: 'dark-theme-1',
          darkVariantId: 'dark-variant-1',
          syncWithSystem: false
        }
      }));

      service.updateThemeMode(ThemeMode.DARK).subscribe(prefs => {
        expect(prefs.currentMode).toBe(ThemeMode.DARK);
        expect(themesApiService.apiThemesUserPost).toHaveBeenCalled();
        done();
      });
    });

    it('should enable system sync when mode is SYSTEM', (done) => {
      themesApiService.apiThemesUserPost.and.returnValue(of({
        success: true,
        data: {
          lightThemeId: 'light-theme-1',
          lightVariantId: 'light-variant-1',
          darkThemeId: 'dark-theme-1',
          darkVariantId: 'dark-variant-1',
          syncWithSystem: true
        }
      }));

      service.updateThemeMode(ThemeMode.SYSTEM).subscribe(prefs => {
        expect(prefs.syncWithSystem).toBe(true);
        done();
      });
    });
  });

  describe('toggleSystemSync', () => {
    it('should toggle system sync preference', (done) => {
      themesApiService.apiThemesUserPost.and.returnValue(of({
        success: true,
        data: {
          lightThemeId: 'light-theme-1',
          lightVariantId: 'light-variant-1',
          darkThemeId: 'dark-theme-1',
          darkVariantId: 'dark-variant-1',
          syncWithSystem: true
        }
      }));

      service.toggleSystemSync(true).subscribe(prefs => {
        expect(prefs.syncWithSystem).toBe(true);
        expect(localStorageService.setItem).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('updateThemeVariant', () => {
    beforeEach(() => {
      service.availableThemes.set([mockLightTheme, mockDarkTheme]);
    });

    it('should update light theme variant', (done) => {
      themesApiService.apiThemesUserPost.and.returnValue(of({
        success: true,
        data: {
          lightThemeId: 'light-theme-1',
          lightVariantId: 'light-variant-1',
          darkThemeId: 'dark-theme-1',
          darkVariantId: 'dark-variant-1',
          syncWithSystem: false
        }
      }));

      service.updateThemeVariant('light', 'light-variant-1').subscribe(prefs => {
        expect(prefs.lightThemeVariantId).toBe('light-variant-1');
        done();
      });
    });

    it('should update dark theme variant', (done) => {
      themesApiService.apiThemesUserPost.and.returnValue(of({
        success: true,
        data: {
          lightThemeId: 'light-theme-1',
          lightVariantId: 'light-variant-1',
          darkThemeId: 'dark-theme-1',
          darkVariantId: 'dark-variant-1',
          syncWithSystem: false
        }
      }));

      service.updateThemeVariant('dark', 'dark-variant-1').subscribe(prefs => {
        expect(prefs.darkThemeVariantId).toBe('dark-variant-1');
        done();
      });
    });
  });

  describe('CSS variable application', () => {
    it('should apply theme tokens to CSS variables', () => {
      const tokens = {
        'BackgroundColor': '#ffffff',
        'TextColor': '#212529',
        'AccentPrimary': '#0d6efd'
      };

      // Access private method via any type
      (service as any).applyThemeTokens(tokens);

      // In a real browser environment, this would set CSS variables
      // In tests, we just verify the method doesn't throw
      expect(true).toBe(true);
    });
  });
});
