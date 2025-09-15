import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService as ApiAuthService } from '../../api/services/auth.service';
import { LoginDto, RegisterDto, TokenDto, UserDto } from '../../api/models';

/**
 * Proxy service for authentication operations
 * Wraps the auto-generated API AuthService to provide business logic and error handling
 * Following MNC coding standards with proper separation of concerns
 */
@Injectable({
  providedIn: 'root'
})
export class AuthServiceProxy {

  constructor(private apiAuthService: ApiAuthService) { }

  /**
   * Authenticates user with login credentials
   * @param credentials User login credentials
   * @returns Observable with authentication result
   */
  login(credentials: LoginDto): Observable<{ success: boolean; data?: TokenDto; message?: string }> {
    return this.apiAuthService.apiAuthLoginPost({
      body: credentials
    }).pipe(
      map(response => ({
        success: response.success ?? false,
        data: response.data,
        message: response.message
      })),
      catchError(error => {
        console.error('AuthServiceProxy - Login error:', error);
        return of({
          success: false,
          message: error.error?.message || 'Login failed. Please try again.'
        });
      })
    );
  }

  /**
   * Registers a new user
   * @param userData User registration data
   * @returns Observable with registration result
   */
  register(userData: RegisterDto): Observable<{ success: boolean; data?: TokenDto; message?: string }> {
    return this.apiAuthService.apiAuthRegisterPost({
      body: userData
    }).pipe(
      map(response => ({
        success: response.success ?? false,
        data: response.data,
        message: response.message
      })),
      catchError(error => {
        console.error('AuthServiceProxy - Registration error:', error);
        return of({
          success: false,
          message: error.error?.message || 'Registration failed. Please try again.'
        });
      })
    );
  }

  /**
   * Gets current user profile
   * @returns Observable with user data
   */
  getUserProfile(): Observable<{ success: boolean; data?: UserDto; message?: string }> {
    return this.apiAuthService.apiAuthMeGet().pipe(
      map(response => ({
        success: response.success ?? false,
        data: response.data,
        message: response.message
      })),
      catchError(error => {
        console.error('AuthServiceProxy - Get user profile error:', error);
        return of({
          success: false,
          message: error.error?.message || 'Failed to get user profile.'
        });
      })
    );
  }

  /**
   * Refreshes authentication token
   * @param refreshTokenDto Refresh token data
   * @returns Observable with new token data
   */
  refreshToken(refreshTokenDto: { refreshToken: string }): Observable<{ success: boolean; data?: TokenDto; message?: string }> {
    return this.apiAuthService.apiAuthRefreshPost({
      body: refreshTokenDto
    }).pipe(
      map(response => ({
        success: response.success ?? false,
        data: response.data,
        message: response.message
      })),
      catchError(error => {
        console.error('AuthServiceProxy - Token refresh error:', error);
        return of({
          success: false,
          message: error.error?.message || 'Token refresh failed.'
        });
      })
    );
  }
}