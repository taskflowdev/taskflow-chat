import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { AuthService as ApiAuthService } from '../../api/api/auth.service';
import { LoginDto, RegisterDto, UserDto } from '../../api/model/models';
import { LocalStorageService } from './local-storage.service';

export interface AuthUser {
  id: string;
  userName: string;
  email: string;
  fullName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'taskflow_chat_token';
  private readonly REFRESH_TOKEN_KEY = 'taskflow_chat_refresh_token';
  private readonly USER_KEY = 'taskflow_chat_user';

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private apiAuthService: ApiAuthService,
    private localStorageService: LocalStorageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Check if user is logged in on service initialization (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      this.checkAuthStatus();
    }
  }

  login(credentials: LoginDto): Observable<{ success: boolean; user?: AuthUser; error?: string }> {
    return this.apiAuthService.apiAuthLoginPost(credentials).pipe(
      tap(response => {
        if (response.success && response.data && isPlatformBrowser(this.platformId)) {
          // Store tokens and user data
          const tokenData = response.data;
          if (tokenData.accessToken) {
            this.localStorageService.setItem(this.TOKEN_KEY, tokenData.accessToken);
          }
          if (tokenData.refreshToken) {
            this.localStorageService.setItem(this.REFRESH_TOKEN_KEY, tokenData.refreshToken);
          }

          // Get user profile after successful login
          this.getUserProfile().subscribe();
        }
      }),
      map(response => ({
        success: response.success || false,
        error: response.success ? undefined : response.message || 'Login failed'
      })),
      catchError(error => {
        console.error('Login error:', error);
        return of({
          success: false,
          error: error.error?.message || 'Login failed. Please try again.'
        });
      })
    );
  }

  register(userData: RegisterDto): Observable<{ success: boolean; user?: AuthUser; error?: string }> {
    return this.apiAuthService.apiAuthRegisterPost(userData).pipe(
      tap(response => {
        if (response.success && response.data && isPlatformBrowser(this.platformId)) {
          // Store tokens after successful registration
          const tokenData = response.data;
          if (tokenData.accessToken) {
            this.localStorageService.setItem(this.TOKEN_KEY, tokenData.accessToken);
          }
          if (tokenData.refreshToken) {
            this.localStorageService.setItem(this.REFRESH_TOKEN_KEY, tokenData.refreshToken);
          }

          // Get user profile after successful registration
          this.getUserProfile().subscribe();
        }
      }),
      map(response => ({
        success: response.success || false,
        error: response.success ? undefined : response.message || 'Registration failed'
      })),
      catchError(error => {
        console.error('Registration error:', error);
        return of({
          success: false,
          error: error.error?.message || 'Registration failed. Please try again.'
        });
      })
    );
  }

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Clear stored data
    this.localStorageService.removeItem(this.TOKEN_KEY);
    this.localStorageService.removeItem(this.REFRESH_TOKEN_KEY);
    this.localStorageService.removeItem(this.USER_KEY);

    // Update current user
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return this.localStorageService.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return this.localStorageService.getItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // TODO: Check token expiration
    return true;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  private getUserProfile(): Observable<AuthUser | null> {
    return this.apiAuthService.apiAuthMeGet().pipe(
      map(response => {
        if (response.success && response.data && isPlatformBrowser(this.platformId)) {
          const user: AuthUser = {
            id: response.data.id || '',
            userName: response.data.userName || '',
            email: response.data.email || '',
            fullName: response.data.fullName || ''
          };

          // Store user data
          this.localStorageService.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);

          return user;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return of(null);
      })
    );
  }

  private getUserFromStorage(): AuthUser | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const userData = this.localStorageService.getItem(this.USER_KEY);
    if (userData) {
      try {
        return JSON.parse(userData) as AuthUser;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.localStorageService.removeItem(this.USER_KEY);
      }
    }
    return null;
  }

  private checkAuthStatus(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.getToken();
    if (token && !this.getCurrentUser()) {
      // Have token but no user data, try to fetch user profile
      this.getUserProfile().subscribe();
    }
  }

  refreshToken(): Observable<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return of(false);

    return this.apiAuthService.apiAuthRefreshPost({ refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data && isPlatformBrowser(this.platformId)) {
          const tokenData = response.data;
          if (tokenData.accessToken) {
            this.localStorageService.setItem(this.TOKEN_KEY, tokenData.accessToken);
          }
          if (tokenData.refreshToken) {
            this.localStorageService.setItem(this.REFRESH_TOKEN_KEY, tokenData.refreshToken);
          }
        }
      }),
      map(response => response.success || false),
      catchError(error => {
        console.error('Token refresh error:', error);
        this.logout(); // Clear invalid tokens
        return of(false);
      })
    );
  }
}
