import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ThemeService, ThemeMode } from './theme.service';
import { ThemesService } from '../../api/services/themes.service';
import { AuthService } from '../../auth/services/auth.service';
import { PLATFORM_ID } from '@angular/core';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockThemesService: jasmine.SpyObj<ThemesService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockThemes = [
    {
      id: '1',
      name: 'Light Default',
      isDarkTheme: false,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      isBuiltIn: true
    },
    {
      id: '2',
      name: 'Dark Default',
      isDarkTheme: true,
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      isBuiltIn: true
    }
  ];

  const mockUser = {
    id: 'user123',
    userName: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User'
  };

  beforeEach(() => {
    const themesServiceSpy = jasmine.createSpyObj('ThemesService', [
      'apiThemesGet$Json',
      'apiThemesUsersUserIdGet$Json',
      'apiThemesUsersUserIdPut$Json',
      'apiThemesUsersUserIdSyncPut$Json'
    ]);
    
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser'], {
      currentUser$: of(mockUser)
    });

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: ThemesService, useValue: themesServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(ThemeService);
    mockThemesService = TestBed.inject(ThemesService) as jasmine.SpyObj<ThemesService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup default mock responses
    mockThemesService.apiThemesGet$Json.and.returnValue(
      of({ success: true, data: mockThemes })
    );
    
    mockThemesService.apiThemesUsersUserIdGet$Json.and.returnValue(
      of({
        success: true,
        data: {
          lightThemeId: '1',
          darkThemeId: '2',
          syncWithSystem: false,
          lightTheme: mockThemes[0],
          darkTheme: mockThemes[1]
        }
      })
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load available themes', (done) => {
    service.availableThemes.subscribe(themes => {
      expect(themes).toEqual(mockThemes);
      expect(mockThemesService.apiThemesGet$Json).toHaveBeenCalled();
      done();
    });
  });

  it('should filter light themes correctly', (done) => {
    service.getLightThemes().subscribe(lightThemes => {
      expect(lightThemes.length).toBe(1);
      expect(lightThemes[0].isDarkTheme).toBeFalse();
      done();
    });
  });

  it('should filter dark themes correctly', (done) => {
    service.getDarkThemes().subscribe(darkThemes => {
      expect(darkThemes.length).toBe(1);
      expect(darkThemes[0].isDarkTheme).toBeTrue();
      done();
    });
  });

  it('should update theme preferences', (done) => {
    const updatedPreferences = {
      lightThemeId: '1',
      darkThemeId: '2',
      syncWithSystem: false
    };

    mockThemesService.apiThemesUsersUserIdPut$Json.and.returnValue(
      of({ success: true, data: updatedPreferences })
    );
    
    mockAuthService.getCurrentUser.and.returnValue(mockUser);

    service.updateThemePreferences('1', '2').subscribe(result => {
      expect(result).toEqual(updatedPreferences);
      expect(mockThemesService.apiThemesUsersUserIdPut$Json).toHaveBeenCalledWith({
        userId: mockUser.id,
        body: { lightThemeId: '1', darkThemeId: '2' }
      });
      done();
    });
  });

  it('should toggle system sync', (done) => {
    const updatedPreferences = {
      lightThemeId: '1',
      darkThemeId: '2',
      syncWithSystem: true
    };

    mockThemesService.apiThemesUsersUserIdSyncPut$Json.and.returnValue(
      of({ success: true, data: updatedPreferences })
    );
    
    mockAuthService.getCurrentUser.and.returnValue(mockUser);

    service.toggleSystemSync(true).subscribe(result => {
      expect(result).toEqual(updatedPreferences);
      expect(mockThemesService.apiThemesUsersUserIdSyncPut$Json).toHaveBeenCalledWith({
        userId: mockUser.id,
        body: { syncWithSystem: true }
      });
      done();
    });
  });
});