import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard SSR Fix', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'getCurrentUser', 'verifyAuthentication']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'server' } // Simulate SSR
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow navigation during SSR (server-side)', () => {
    // During SSR, guard should return true
    const result = guard.canActivate();
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

describe('AuthGuard Client-side', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'getCurrentUser', 'verifyAuthentication']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' } // Simulate browser
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should redirect to login when no token is present', () => {
    authService.getToken.and.returnValue(null);
    
    const result = guard.canActivate();
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should allow access when user data exists', () => {
    authService.getToken.and.returnValue('valid-token');
    authService.getCurrentUser.and.returnValue({ id: '1', userName: 'test', email: 'test@test.com', fullName: 'Test User' });
    
    const result = guard.canActivate();
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should verify authentication when token exists but no user data', (done) => {
    authService.getToken.and.returnValue('valid-token');
    authService.getCurrentUser.and.returnValue(null);
    authService.verifyAuthentication.and.returnValue(of(true));
    
    const result = guard.canActivate();
    if (typeof result === 'boolean') {
      fail('Expected Observable, got boolean');
      return;
    }
    
    result.subscribe((canActivate: boolean) => {
      expect(canActivate).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });
  });
});