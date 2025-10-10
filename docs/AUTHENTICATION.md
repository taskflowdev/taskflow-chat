# Authentication System Documentation

## Overview

This document describes the enterprise-grade authentication system implemented for TaskFlow Chat. The system provides secure, flicker-free authentication with automatic token refresh, proper SSR handling, and comprehensive error handling.

## Architecture

### Key Components

#### 1. AuthService (`src/app/auth/services/auth.service.ts`)

The core authentication service that manages user state and authentication flow.

**Key Features:**
- `currentUser$`: BehaviorSubject that emits the current authenticated user
- `authInitializing$`: BehaviorSubject tracking initialization state (used by loading screen)
- Token management: `getToken()`, `setToken()`, `clearToken()`
- `login()`: Authenticates user and stores tokens
- `register()`: Creates new user account
- `logout()`: Clears all authentication data
- `verifyAuthentication()`: Validates token with server
- `refreshAccessToken()`: Silently refreshes expired tokens with deduplication
- SSR-safe: All browser-only operations are guarded with `isPlatformBrowser()`

**Token Refresh Deduplication:**
The service tracks in-flight refresh requests using `refreshTokenInProgress$` to ensure only one refresh happens at a time, even if multiple 401 errors occur simultaneously.

#### 2. AuthGuard (`src/app/auth/guards/auth.guard.ts`)

Protects routes that require authentication.

**Behavior:**
- During SSR: Allows navigation (defers to client-side)
- No token: Redirects to `/auth/login`
- Token + user data in memory: Allows access immediately
- Token but no user data: Calls `verifyAuthentication()` and waits for result
- Verification fails: Redirects to `/auth/login`

#### 3. GuestGuard (`src/app/auth/guards/guest.guard.ts`)

Prevents authenticated users from accessing login/signup pages.

**Behavior:**
- During SSR: Allows navigation
- No token: Allows access (user is not authenticated)
- Token + user data: Redirects to `/chats` with `replaceUrl: true`
- Token but no user data: Calls `verifyAuthentication()`, redirects if authenticated

#### 4. AuthInterceptor (`src/app/auth/interceptors/auth.interceptor.ts`)

Handles automatic token attachment and refresh on 401 errors.

**Features:**
- Automatically attaches `Authorization: Bearer <token>` to API requests
- Excludes auth endpoints (login, register, refresh) from token attachment
- On 401 error:
  1. Triggers token refresh using `AuthService.refreshAccessToken()`
  2. Queues other requests until refresh completes
  3. Retries failed request with new token
  4. If refresh fails, logs out and redirects to login

**Request Queueing:**
Uses RxJS `BehaviorSubject` to queue requests during token refresh, ensuring all pending requests use the new token.

#### 5. APP_INITIALIZER (`src/app/core/app-initializer.ts`)

Runs before the Angular app fully initializes to verify authentication.

**Purpose:**
- Prevents UI flicker by verifying auth before any routes render
- Shows loading screen during verification
- Only runs in browser (skips during SSR)
- Sets `authInitializing$` to false when complete

**Behavior:**
- SSR: Resolves immediately
- No token: Resolves immediately (user not logged in)
- Token exists: Calls `verifyAuthentication()`, then resolves

#### 6. LoadingScreenComponent (`src/app/shared/components/loading-screen/loading-screen.component.ts`)

Full-screen loading splash shown during app initialization.

**Features:**
- Black background with centered logo
- Animated spinner
- Accessible with proper ARIA attributes
- z-index: 10000 to sit above all content
- Prevents interaction while loading

## Authentication Flow

### Initial App Load

1. APP_INITIALIZER runs before app renders
2. LoadingScreen is shown (black splash with logo)
3. If token exists, `verifyAuthentication()` is called
4. `authInitializing$` emits false when verification completes
5. LoadingScreen hides
6. Router navigates based on auth state

### Login Flow

1. User submits login form
2. `AuthService.login()` calls API
3. On success:
   - Stores access and refresh tokens
   - Calls `/api/auth/me` to fetch user profile
   - Emits user via `currentUser$`
4. Component waits for `currentUser$` emission
5. Navigates to `/chats` with `replaceUrl: true`
6. GuestGuard prevents returning to login page

### Token Refresh Flow

1. Request to protected API returns 401
2. AuthInterceptor catches error
3. Checks if refresh is already in progress
4. If not, calls `AuthService.refreshAccessToken()`
5. Other 401 errors wait for this refresh to complete
6. On success:
   - Updates stored tokens
   - Retries all failed requests with new token
7. On failure:
   - Logs out user
   - Redirects to `/auth/login`
   - Shows toast notification

### Logout Flow

1. `AuthService.logout()` is called
2. Clears tokens from localStorage
3. Emits `null` to `currentUser$`
4. Router redirects to `/auth/login`
5. AuthGuard blocks access to protected routes

## Route Protection

### Protected Routes (Require Authentication)

```typescript
{
  path: '',
  component: MainLayoutComponent,
  canActivate: [AuthGuard],
  children: [
    { path: 'chats', loadChildren: ... },
    // Add more protected routes here
  ]
}
```

### Guest Routes (Only for Non-Authenticated)

```typescript
{
  path: 'auth',
  canActivate: [GuestGuard],
  loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
}
```

## Error Handling

All authentication errors display user-friendly toast notifications:

- Login failed: "Login failed. Please try again."
- Session expired: "Session expired. Please login again."
- Token refresh failed: "Session expired. Please login again."
- Registration failed: "Registration failed. Please try again."

## SSR Considerations

All authentication code is SSR-safe:

- Guards return `true` during SSR (defer to client)
- AuthService methods check `isPlatformBrowser()` before accessing localStorage
- APP_INITIALIZER skips verification during SSR
- AuthInterceptor only adds tokens in browser environment

## Testing

### Unit Tests

Tests are provided for:
- **GuestGuard**: Authentication scenarios and navigation
- **LoadingScreenComponent**: Rendering and accessibility
- **AuthInterceptor**: Token attachment and 401 handling
- **AuthService**: Token refresh, verification, login/register
- **APP_INITIALIZER**: Initialization flow

Run tests:
```bash
npm test
```

### Manual Testing Checklist

- [ ] Login with valid credentials redirects to /chats
- [ ] Login with invalid credentials shows error toast
- [ ] After login, navigating to /auth/login redirects to /chats
- [ ] Logout redirects to /auth/login
- [ ] After logout, protected routes redirect to /auth/login
- [ ] Token refresh happens automatically on 401
- [ ] Multiple 401s only trigger one refresh
- [ ] Refresh failure logs out and redirects to login
- [ ] Loading screen shows during initial app load
- [ ] No UI flicker on initial load
- [ ] Back button after login doesn't return to login page
- [ ] SSR doesn't break authentication flow

## Configuration

### Token Storage Keys

Defined in `AuthService`:
```typescript
private readonly TOKEN_KEY = 'taskflow_chat_token';
private readonly REFRESH_TOKEN_KEY = 'taskflow_chat_refresh_token';
private readonly USER_KEY = 'taskflow_chat_user';
```

### API Endpoints

Defined in auto-generated API service:
- POST `/api/auth/login` - Login
- POST `/api/auth/register` - Register
- POST `/api/auth/refresh` - Refresh token
- GET `/api/auth/me` - Get current user

## Security Best Practices

1. **Token Storage**: Tokens are encrypted in localStorage using AES (handled by LocalStorageService)
2. **Token Refresh**: Automatic silent refresh prevents token expiration interruptions
3. **Request Deduplication**: Multiple 401s trigger only one refresh
4. **Logout on Refresh Failure**: Invalid refresh tokens immediately log out user
5. **SSR Safety**: No sensitive data accessed during server-side rendering
6. **Route Protection**: All protected routes are behind AuthGuard
7. **Guest Protection**: GuestGuard prevents authenticated users from seeing login/signup

## Troubleshooting

### Loading screen stays visible

- Check browser console for errors
- Verify APP_INITIALIZER is completing
- Check if `authInitializing$` emits false

### Token refresh not working

- Verify `/api/auth/refresh` endpoint is accessible
- Check refresh token is stored correctly
- Look for errors in AuthInterceptor

### SSR errors

- Ensure all localStorage access is guarded with `isPlatformBrowser()`
- Verify guards return `true` during SSR
- Check PLATFORM_ID injection

### Routes not protected

- Verify AuthGuard is applied to protected routes
- Check GuestGuard is applied to auth routes
- Ensure guards are provided in app.config.ts

## Future Enhancements

Potential improvements:
- Token expiration checking before API calls
- Refresh token rotation
- Remember me functionality with longer token expiry
- Multi-factor authentication support
- Session management across tabs
- Biometric authentication support
