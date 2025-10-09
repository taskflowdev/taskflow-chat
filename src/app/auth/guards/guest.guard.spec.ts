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
      'getCurrentUser',
      'verifyAuthentication'
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

  it('should allow access when user is not authenticated', () => {
    authService.getToken.and.returnValue(null);
    
    const result = guard.canActivate();
    
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /chats when user is authenticated with token and user data', () => {
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

  it('should verify authentication when token exists but no user data', (done) => {
    authService.getToken.and.returnValue('fake-token');
    authService.getCurrentUser.and.returnValue(null);
    authService.verifyAuthentication.and.returnValue(of(true));
    
    const result$ = guard.canActivate();
    
    if (typeof result$ === 'object') {
      result$.subscribe(result => {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/chats'], { replaceUrl: true });
        done();
      });
    }
  });

  it('should allow access when verification fails', (done) => {
    authService.getToken.and.returnValue('fake-token');
    authService.getCurrentUser.and.returnValue(null);
    authService.verifyAuthentication.and.returnValue(of(false));
    
    const result$ = guard.canActivate();
    
    if (typeof result$ === 'object') {
      result$.subscribe(result => {
        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    }
  });
});
