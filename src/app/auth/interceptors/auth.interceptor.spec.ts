import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'refreshAccessToken',
      'logout'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header to API requests', () => {
    authService.getToken.and.returnValue('test-token');

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    
    req.flush({});
  });

  it('should not add Authorization header to login endpoint', () => {
    authService.getToken.and.returnValue('test-token');

    httpClient.post('/api/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    
    req.flush({});
  });

  it('should not add Authorization header to register endpoint', () => {
    authService.getToken.and.returnValue('test-token');

    httpClient.post('/api/auth/register', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.headers.has('Authorization')).toBe(false);
    
    req.flush({});
  });

  it('should handle 401 error by attempting token refresh', () => {
    authService.getToken.and.returnValue('old-token');
    authService.refreshAccessToken.and.returnValue(of(true));

    httpClient.get('/api/test').subscribe();

    // First request with old token fails with 401
    const req1 = httpMock.expectOne('/api/test');
    req1.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // After successful refresh, original request should be retried
    authService.getToken.and.returnValue('new-token');
    
    const req2 = httpMock.expectOne('/api/test');
    expect(req2.request.headers.get('Authorization')).toBe('Bearer new-token');
    req2.flush({ data: 'success' });
  });

  it('should logout and navigate to login when refresh fails', () => {
    authService.getToken.and.returnValue('old-token');
    authService.refreshAccessToken.and.returnValue(of(false));

    httpClient.get('/api/test').subscribe(
      () => {},
      () => {}
    );

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/signin']);
  });

  it('should not add Authorization header in server-side rendering', () => {
    TestBed.resetTestingModule();
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    authService.getToken.and.returnValue('test-token');

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    
    req.flush({});
  });
});
