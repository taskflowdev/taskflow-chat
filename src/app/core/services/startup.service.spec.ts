import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { StartupService } from './startup.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserSettingsService } from './user-settings.service';
import { of, throwError } from 'rxjs';

describe('StartupService', () => {
  let service: StartupService;
  let authService: jasmine.SpyObj<AuthService>;
  let userSettingsService: jasmine.SpyObj<UserSettingsService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'getCurrentUser',
      'verifyAuthenticationWithServer',
      'logout',
      'setInitialized'
    ]);
    const userSettingsServiceSpy = jasmine.createSpyObj('UserSettingsService', [
      'loadUserSettings',
      'initializeDefaultTheme'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        StartupService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserSettingsService, useValue: userSettingsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(StartupService);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    userSettingsService = TestBed.inject(UserSettingsService) as jasmine.SpyObj<UserSettingsService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should resolve immediately during SSR', async () => {
    const ssrService = new StartupService(
      'server',
      authService,
      userSettingsService,
      router
    );

    await ssrService.initialize();

    expect(authService.setInitialized).toHaveBeenCalled();
    expect(authService.verifyAuthenticationWithServer).not.toHaveBeenCalled();
  });

  it('should initialize default theme when no token exists', async () => {
    authService.getToken.and.returnValue(null);

    await service.initialize();

    expect(userSettingsService.initializeDefaultTheme).toHaveBeenCalled();
    expect(authService.verifyAuthenticationWithServer).not.toHaveBeenCalled();
    expect(authService.setInitialized).toHaveBeenCalled();
  });

  it('should verify authentication and load settings when token exists', async () => {
    authService.getToken.and.returnValue('test-token');
    authService.verifyAuthenticationWithServer.and.returnValue(of(true));
    userSettingsService.loadUserSettings.and.returnValue(of(null));

    await service.initialize();

    expect(authService.verifyAuthenticationWithServer).toHaveBeenCalled();
    expect(userSettingsService.loadUserSettings).toHaveBeenCalled();
    expect(authService.setInitialized).toHaveBeenCalled();
  });

  it('should handle authentication failure gracefully', async () => {
    authService.getToken.and.returnValue('test-token');
    authService.verifyAuthenticationWithServer.and.returnValue(of(false));

    await service.initialize();

    expect(authService.verifyAuthenticationWithServer).toHaveBeenCalled();
    expect(authService.logout).toHaveBeenCalled();
    expect(userSettingsService.initializeDefaultTheme).toHaveBeenCalled();
    expect(authService.setInitialized).toHaveBeenCalled();
  });

  it('should handle settings load failure gracefully', async () => {
    authService.getToken.and.returnValue('test-token');
    authService.verifyAuthenticationWithServer.and.returnValue(of(true));
    userSettingsService.loadUserSettings.and.returnValue(throwError(() => new Error('Settings load failed')));

    await service.initialize();

    expect(authService.verifyAuthenticationWithServer).toHaveBeenCalled();
    expect(userSettingsService.loadUserSettings).toHaveBeenCalled();
    expect(userSettingsService.initializeDefaultTheme).toHaveBeenCalled();
    expect(authService.setInitialized).toHaveBeenCalled();
  });

  it('should handle complete pipeline failure gracefully', async () => {
    authService.getToken.and.returnValue('test-token');
    authService.verifyAuthenticationWithServer.and.returnValue(throwError(() => new Error('Network error')));

    await service.initialize();

    expect(authService.logout).toHaveBeenCalled();
    expect(userSettingsService.initializeDefaultTheme).toHaveBeenCalled();
    expect(authService.setInitialized).toHaveBeenCalled();
  });

  it('should enforce minimum splash duration', async () => {
    authService.getToken.and.returnValue(null);
    const startTime = Date.now();

    await service.initialize();

    const elapsedTime = Date.now() - startTime;
    // Should take at least the minimum splash duration (800ms)
    expect(elapsedTime).toBeGreaterThanOrEqual(800);
  });
});
