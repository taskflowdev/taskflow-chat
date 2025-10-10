import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthService as ApiAuthService } from '../../api/services/auth.service';
import { LocalStorageService } from './local-storage.service';
import { ToastService } from '../../shared/services/toast.service';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let apiAuthService: jasmine.SpyObj<ApiAuthService>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    const apiAuthServiceSpy = jasmine.createSpyObj('ApiAuthService', [
      'apiAuthLoginPost',
      'apiAuthRegisterPost',
      'apiAuthRefreshPost',
      'apiAuthMeGet'
    ]);
    const localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', [
      'getItem',
      'setItem',
      'removeItem'
    ]);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', [
      'showSuccess',
      'showError',
      'showWarning',
      'showInfo'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiAuthService, useValue: apiAuthServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(AuthService);
    apiAuthService = TestBed.inject(ApiAuthService) as jasmine.SpyObj<ApiAuthService>;
    localStorageService = TestBed.inject(LocalStorageService) as jasmine.SpyObj<LocalStorageService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('authInitializing$', () => {
    it('should emit initial true state', (done) => {
      service.authInitializing$.subscribe(isInitializing => {
        expect(isInitializing).toBe(true);
        done();
      });
    });

    it('should emit false after setInitialized is called', (done) => {
      service.setInitialized();
      
      service.authInitializing$.subscribe(isInitializing => {
        expect(isInitializing).toBe(false);
        done();
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh token and update storage', (done) => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      };

      localStorageService.getItem.and.returnValue('old-refresh-token');
      apiAuthService.apiAuthRefreshPost.and.returnValue(of(mockResponse));

      service.refreshAccessToken().subscribe(success => {
        expect(success).toBe(true);
        expect(localStorageService.setItem).toHaveBeenCalledWith(
          'taskflow_chat_token',
          'new-access-token'
        );
        expect(localStorageService.setItem).toHaveBeenCalledWith(
          'taskflow_chat_refresh_token',
          'new-refresh-token'
        );
        done();
      });
    });

    it('should handle refresh failure and logout', (done) => {
      localStorageService.getItem.and.returnValue('old-refresh-token');
      apiAuthService.apiAuthRefreshPost.and.returnValue(
        throwError(() => new Error('Refresh failed'))
      );

      spyOn(service, 'logout');

      service.refreshAccessToken().subscribe(success => {
        expect(success).toBe(false);
        expect(service.logout).toHaveBeenCalled();
        expect(toastService.showError).toHaveBeenCalled();
        done();
      });
    });

    it('should return false when no refresh token exists', (done) => {
      localStorageService.getItem.and.returnValue(null);

      service.refreshAccessToken().subscribe(success => {
        expect(success).toBe(false);
        expect(apiAuthService.apiAuthRefreshPost).not.toHaveBeenCalled();
        done();
      });
    });

    it('should prevent multiple simultaneous refresh requests', (done) => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh'
        }
      };

      localStorageService.getItem.and.returnValue('refresh-token');
      apiAuthService.apiAuthRefreshPost.and.returnValue(of(mockResponse));

      // Start two refresh requests simultaneously
      const refresh1$ = service.refreshAccessToken();
      const refresh2$ = service.refreshAccessToken();

      let completed = 0;
      const checkCompletion = () => {
        completed++;
        if (completed === 2) {
          // Both should complete, but API should only be called once
          expect(apiAuthService.apiAuthRefreshPost).toHaveBeenCalledTimes(1);
          done();
        }
      };

      refresh1$.subscribe(() => checkCompletion());
      refresh2$.subscribe(() => checkCompletion());
    });
  });

  describe('verifyAuthentication', () => {
    it('should return true when user data already exists', (done) => {
      localStorageService.getItem.and.returnValue('test-token');
      spyOn(service, 'getCurrentUser').and.returnValue({
        id: '1',
        userName: 'testuser',
        email: 'test@test.com',
        fullName: 'Test User'
      });

      service.verifyAuthentication().subscribe(isValid => {
        expect(isValid).toBe(true);
        expect(apiAuthService.apiAuthMeGet).not.toHaveBeenCalled();
        done();
      });
    });

    it('should verify with server when token exists but no user data', (done) => {
      const mockUserResponse = {
        success: true,
        data: {
          id: '1',
          userName: 'testuser',
          email: 'test@test.com',
          fullName: 'Test User'
        }
      };

      localStorageService.getItem.and.returnValue('test-token');
      spyOn(service, 'getCurrentUser').and.returnValue(null);
      apiAuthService.apiAuthMeGet.and.returnValue(of(mockUserResponse));

      service.verifyAuthentication().subscribe(isValid => {
        expect(isValid).toBe(true);
        expect(apiAuthService.apiAuthMeGet).toHaveBeenCalled();
        done();
      });
    });

    it('should return false when no token exists', (done) => {
      localStorageService.getItem.and.returnValue(null);

      service.verifyAuthentication().subscribe(isValid => {
        expect(isValid).toBe(false);
        expect(apiAuthService.apiAuthMeGet).not.toHaveBeenCalled();
        done();
      });
    });

    it('should logout and return false on verification failure', (done) => {
      localStorageService.getItem.and.returnValue('invalid-token');
      spyOn(service, 'getCurrentUser').and.returnValue(null);
      spyOn(service, 'logout');
      apiAuthService.apiAuthMeGet.and.returnValue(
        throwError(() => new Error('Unauthorized'))
      );

      service.verifyAuthentication().subscribe(isValid => {
        expect(isValid).toBe(false);
        expect(service.logout).toHaveBeenCalled();
        expect(toastService.showError).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('login', () => {
    it('should show success toast on successful login', (done) => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'token',
          refreshToken: 'refresh'
        }
      };

      apiAuthService.apiAuthLoginPost.and.returnValue(of(mockResponse));
      apiAuthService.apiAuthMeGet.and.returnValue(of({
        success: true,
        data: {
          id: '1',
          userName: 'testuser',
          email: 'test@test.com',
          fullName: 'Test User'
        }
      }));

      service.login({ userName: 'test', password: 'pass' }).subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should show error toast on login failure', (done) => {
      apiAuthService.apiAuthLoginPost.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid credentials' } }))
      );

      service.login({ userName: 'test', password: 'wrong' }).subscribe(result => {
        expect(result.success).toBe(false);
        expect(toastService.showError).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('register', () => {
    it('should show success toast on successful registration', (done) => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'token',
          refreshToken: 'refresh'
        }
      };

      apiAuthService.apiAuthRegisterPost.and.returnValue(of(mockResponse));
      apiAuthService.apiAuthMeGet.and.returnValue(of({
        success: true,
        data: {
          id: '1',
          userName: 'newuser',
          email: 'new@test.com',
          fullName: 'New User'
        }
      }));

      service.register({
        userName: 'newuser',
        email: 'new@test.com',
        password: 'pass',
        fullName: 'New User'
      }).subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should show error toast on registration failure', (done) => {
      apiAuthService.apiAuthRegisterPost.and.returnValue(
        throwError(() => ({ error: { message: 'Username already exists' } }))
      );

      service.register({
        userName: 'existinguser',
        email: 'test@test.com',
        password: 'pass',
        fullName: 'Test'
      }).subscribe(result => {
        expect(result.success).toBe(false);
        expect(toastService.showError).toHaveBeenCalled();
        done();
      });
    });
  });
});
