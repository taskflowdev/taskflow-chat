import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { GuestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('GuestGuard', () => {
  let guard: GuestGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'getCurrentUser'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        GuestGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    guard = TestBed.inject(GuestGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is not authenticated (no token)', () => {
    authService.getToken.and.returnValue(null);
    authService.getCurrentUser.and.returnValue(null);
    
    const result = guard.canActivate();
    
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should allow access when user has token but no user data', () => {
    authService.getToken.and.returnValue('fake-token');
    authService.getCurrentUser.and.returnValue(null);
    
    const result = guard.canActivate();
    
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /chats when user is fully authenticated', () => {
    authService.getToken.and.returnValue('fake-token');
    authService.getCurrentUser.and.returnValue({ 
      id: '1', 
      userName: 'testuser', 
      email: 'test@test.com',
      fullName: 'Test User'
    });
    
    const result = guard.canActivate();
    
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/chats'], { replaceUrl: true });
  });
});
