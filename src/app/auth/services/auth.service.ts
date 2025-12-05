import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, catchError, map, of, tap, shareReplay, finalize } from 'rxjs';
import { AuthService as ApiAuthService } from '../../api/services/auth.service';
import { LoginDto, RegisterDto, UserDto, ForgotPasswordDto, ResetPasswordDto } from '../../api/models';
import { LocalStorageService } from './local-storage.service';
import { ToastService } from '../../shared/services/toast.service';

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

  // Track if app is initializing (verifying authentication)
  private authInitializingSubject = new BehaviorSubject<boolean>(true);
  public authInitializing$ = this.authInitializingSubject.asObservable();

  // In-flight refresh token request to prevent multiple parallel refreshes
  private refreshTokenInProgress$: Observable<boolean> | null = null;

  constructor(
    private apiAuthService: ApiAuthService,
    private localStorageService: LocalStorageService,
    private toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Check if user is logged in on service initialization (only in browser)
    // Note: Full verification is handled by APP_INITIALIZER
    if (isPlatformBrowser(this.platformId)) {
      this.checkAuthStatus();
    }
  }

  /**
   * Login with username and password.
   * Stores tokens and fetches user profile on success.
   */
  login(credentials: LoginDto): Observable<{ success: boolean; user?: AuthUser; error?: string }> {
    return this.apiAuthService.apiAuthLoginPost({ body: credentials }).pipe(
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
        const errorMessage = error.error?.message || 'Login failed. Please try again.';
        this.toastService.showError(errorMessage, 'Login Failed');
        return of({
          success: false,
          error: errorMessage
        });
      })
    );
  }

  /**
   * Register a new user account.
   * Stores tokens and fetches user profile on success.
   */
  register(userData: RegisterDto): Observable<{ success: boolean; user?: AuthUser; error?: string }> {
    return this.apiAuthService.apiAuthRegisterPost({ body: userData }).pipe(
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
        const errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.toastService.showError(errorMessage, 'Registration Failed');
        return of({
          success: false,
          error: errorMessage
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
    // During SSR, we cannot determine authentication status reliably
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const token = this.getToken();
    if (!token) return false;

    // TODO: Check token expiration
    return true;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Restore user from localStorage and update the BehaviorSubject.
   * Used by guards on page refresh to restore auth state.
   * @returns The restored user or null
   */
  restoreUserFromStorage(): AuthUser | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const userData = this.localStorageService.getItem(this.USER_KEY);
    if (userData) {
      try {
        const user = JSON.parse(userData) as AuthUser;
        this.currentUserSubject.next(user);
        return user;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.localStorageService.removeItem(this.USER_KEY);
      }
    }
    return null;
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
    const currentUser = this.getCurrentUser();

    // If we have a token but no user in memory, restore from localStorage
    // Don't make HTTP calls here to avoid circular dependency on init
    if (token && !currentUser) {
      this.restoreUserFromStorage();
    }
  }

  /**
   * Refresh the access token using the refresh token.
   * Prevents multiple simultaneous refresh attempts.
   * @returns Observable<boolean> indicating success
   */
  refreshAccessToken(): Observable<boolean> {
    // If a refresh is already in progress, return that observable
    if (this.refreshTokenInProgress$) {
      return this.refreshTokenInProgress$;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(false);
    }

    // Create and cache the refresh request
    this.refreshTokenInProgress$ = this.apiAuthService.apiAuthRefreshPost({
      body: { refreshToken }
    }).pipe(
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
        this.toastService.showError('Session expired. Please login again.', 'Authentication Error');
        this.logout(); // Clear invalid tokens
        return of(false);
      }),
      finalize(() => {
        // Clear the in-flight request after completion
        this.refreshTokenInProgress$ = null;
      }),
      shareReplay(1) // Share the result with multiple subscribers
    );

    return this.refreshTokenInProgress$;
  }

  /**
   * Verify current authentication status.
   * This method checks localStorage first and only makes server calls when necessary.
   * @returns Observable<boolean> indicating if user is authenticated
   */
  verifyAuthentication(): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(false);
    }

    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    // If we already have user data in memory, consider authenticated
    if (this.getCurrentUser()) {
      return of(true);
    }

    // Try to restore from localStorage first (avoids HTTP call)
    const restoredUser = this.restoreUserFromStorage();
    if (restoredUser) {
      return of(true);
    }

    // No stored user data, user needs to login again
    return of(false);
  }

  /**
   * Set the auth initialization state.
   * Called by APP_INITIALIZER after verification completes.
   */
  setInitialized(): void {
    this.authInitializingSubject.next(false);
  }

  /**
   * Verify authentication with server by fetching user profile.
   * This is used during app startup to verify the stored token is still valid.
   * @returns Observable<boolean> indicating if authentication is valid
   */
  verifyAuthenticationWithServer(): Observable<boolean> {
    return this.getUserProfile().pipe(
      map(user => user !== null)
    );
  }

  /**
   * Request a password reset email.
   * @param email User's email address
   * @returns Observable with success status and message
   */
  requestPasswordReset(email: string): Observable<{ success: boolean; message?: string; requiresSecurityCode?: boolean }> {
    const payload: ForgotPasswordDto = { email };
    return this.apiAuthService.apiAuthForgotPasswordPost({ body: payload }).pipe(
      map(response => ({
        success: response.success || false,
        message: response.data?.message || response.message || undefined,
        requiresSecurityCode: response.data?.requiresSecurityCode || false
      })),
      catchError(error => {
        console.error('Password reset request error:', error);
        const errorMessage = error.error?.message || 'Failed to send reset email. Please try again.';
        return of({
          success: false,
          message: errorMessage
        });
      })
    );
  }

  /**
   * Reset password using token from email.
   * @param payload Object containing email, token, and newPassword
   * @returns Observable with success status and message
   */
  resetPassword(payload: { email: string; token: string; newPassword: string }): Observable<{ success: boolean; message?: string }> {
    const resetDto: ResetPasswordDto = {
      email: payload.email,
      token: payload.token,
      newPassword: payload.newPassword,
      confirmPassword: payload.newPassword
    };
    return this.apiAuthService.apiAuthResetPasswordPost({ body: resetDto }).pipe(
      map(response => ({
        success: response.success || false,
        message: response.data?.message || response.message || undefined
      })),
      catchError(error => {
        console.error('Password reset error:', error);
        const errorMessage = error.error?.message || 'Failed to reset password. Please try again.';
        return of({
          success: false,
          message: errorMessage
        });
      })
    );
  }

  /**
   * Validate a password reset token.
   * @param email User's email address
   * @param token Reset token from email
   * @returns Observable with validation status
   */
  validateResetToken(email: string, token: string): Observable<{ valid: boolean; message?: string }> {
    return this.apiAuthService.apiAuthValidateResetTokenGet({ email, token }).pipe(
      map(response => ({
        valid: response.data || false,
        message: response.message || undefined
      })),
      catchError(error => {
        console.error('Token validation error:', error);
        return of({
          valid: false,
          message: error.error?.message || 'Invalid or expired reset token.'
        });
      })
    );
  }

  /**
   * Resend reset link (same as requestPasswordReset).
   * @param email User's email address
   * @returns Observable with success status and message
   */
  resendResetLink(email: string): Observable<{ success: boolean; message?: string }> {
    return this.requestPasswordReset(email);
  }
}
