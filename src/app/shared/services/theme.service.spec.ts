import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { DynamicThemesService } from '../../api/services/dynamic-themes.service';
import { LocalStorageService } from '../../auth/services/local-storage.service';
import { PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockThemesService: jasmine.SpyObj<DynamicThemesService>;
  let mockLocalStorageService: jasmine.SpyObj<LocalStorageService>;

  beforeEach(() => {
    mockThemesService = jasmine.createSpyObj('DynamicThemesService', [
      'apiThemesGet',
      'apiThemesUserGet',
      'apiThemesUserPost',
      'apiThemesUserEffectiveGet'
    ]);

    mockLocalStorageService = jasmine.createSpyObj('LocalStorageService', [
      'getItem',
      'setItem',
      'removeItem'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: DynamicThemesService, useValue: mockThemesService },
        { provide: LocalStorageService, useValue: mockLocalStorageService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load available themes', (done) => {
    const mockThemes = [
      { id: '1', name: 'Light', themeType: 'light' },
      { id: '2', name: 'Dark', themeType: 'dark' }
    ];

    mockThemesService.apiThemesGet.and.returnValue(of({ 
      success: true, 
      data: mockThemes 
    }));

    service.loadAvailableThemes().subscribe(() => {
      const state = service.getCurrentState();
      expect(state.availableThemes.length).toBe(2);
      done();
    });
  });

  it('should handle theme loading errors gracefully', (done) => {
    mockThemesService.apiThemesGet.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    service.loadAvailableThemes().subscribe(themes => {
      expect(themes).toEqual([]);
      done();
    });
  });
});
