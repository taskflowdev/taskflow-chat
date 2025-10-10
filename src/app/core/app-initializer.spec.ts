import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { appInitializerFactory } from './app-initializer';
import { AuthService } from '../auth/services/auth.service';
import { of } from 'rxjs';

describe('appInitializerFactory', () => {
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'verifyAuthentication',
      'setInitialized'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should resolve immediately during SSR', async () => {
    const platformId = 'server';
    const initFn = appInitializerFactory(authService, platformId);

    await initFn();

    expect(authService.setInitialized).toHaveBeenCalled();
    expect(authService.verifyAuthentication).not.toHaveBeenCalled();
  });

  it('should resolve immediately when no token exists', async () => {
    const platformId = 'browser';
    authService.getToken.and.returnValue(null);
    const initFn = appInitializerFactory(authService, platformId);

    await initFn();

    expect(authService.setInitialized).toHaveBeenCalled();
    expect(authService.verifyAuthentication).not.toHaveBeenCalled();
  });

  it('should verify authentication when token exists', async () => {
    const platformId = 'browser';
    authService.getToken.and.returnValue('test-token');
    authService.verifyAuthentication.and.returnValue(of(true));
    const initFn = appInitializerFactory(authService, platformId);

    await initFn();

    expect(authService.verifyAuthentication).toHaveBeenCalled();
    expect(authService.setInitialized).toHaveBeenCalled();
  });

  it('should handle verification error gracefully', async () => {
    const platformId = 'browser';
    authService.getToken.and.returnValue('test-token');
    authService.verifyAuthentication.and.returnValue(of(false));
    const initFn = appInitializerFactory(authService, platformId);

    await initFn();

    expect(authService.verifyAuthentication).toHaveBeenCalled();
    expect(authService.setInitialized).toHaveBeenCalled();
  });

  it('should set initialized even if verification throws error', async () => {
    const platformId = 'browser';
    authService.getToken.and.returnValue('test-token');
    authService.verifyAuthentication.and.returnValue(
      new (class {
        subscribe(callbacks: any) {
          callbacks.error(new Error('Network error'));
        }
      })() as any
    );
    const initFn = appInitializerFactory(authService, platformId);

    await initFn();

    expect(authService.setInitialized).toHaveBeenCalled();
  });
});
