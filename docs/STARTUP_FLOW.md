# Application Startup Flow Documentation

This document describes the refactored application startup flow that provides a professional loading experience similar to modern apps like Microsoft Teams, Gmail, and Slack.

## Overview

The application now implements a proper global loading/splash screen that appears immediately when the user opens the app, while authentication and initialization happen in the background before the main UI renders.

## Architecture

### Key Components

1. **StartupService** (`src/app/core/services/startup.service.ts`)
   - Centralized initialization service
   - Runs via APP_INITIALIZER before Angular renders any routes
   - Handles authentication verification, settings load, and theme initialization

2. **Initial Loading Screen** (`src/index.html`)
   - Inline HTML/CSS loader that appears immediately on page load
   - Shows before Angular bootstrap completes
   - Uses CSS animations for smooth loading experience

3. **Angular Loading Screen Component** (`src/app/shared/components/loading-screen/loading-screen.component.ts`)
   - Angular component version of the loading screen
   - Takes over after initial loader
   - Shows during any remaining initialization

4. **Simplified Auth Guards**
   - `AuthGuard`: Protects authenticated routes
   - `GuestGuard`: Prevents authenticated users from accessing login/signup
   - Both guards now simply check authentication state (no redundant verification)

## Startup Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Opens Application                                       │
│    → Browser loads index.html                                   │
│    → Initial loader appears instantly (inline CSS)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Angular Bootstrap Starts                                     │
│    → APP_INITIALIZER providers run sequentially:                │
│      a. AppConfigService loads runtime config                   │
│      b. StartupService.initialize() runs                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. StartupService Initialization Pipeline                       │
│    → Check if token exists in localStorage                      │
│    → If token exists:                                           │
│      - Call /api/auth/me to verify token and get user profile   │
│      - If successful: Load user settings                        │
│      - If failed: Clear tokens, initialize default theme        │
│    → If no token:                                               │
│      - Initialize default theme                                 │
│    → Ensure minimum splash duration (800ms)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. APP_INITIALIZER Completes                                    │
│    → AuthService.setInitialized() called                        │
│    → Angular proceeds to route activation                       │
│    → Initial loader hidden via 'app-loaded' class               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Route Guards Execute                                         │
│    → AuthGuard: Check token + currentUser                       │
│      - If authenticated: Allow route                            │
│      - If not authenticated: Redirect to /auth/login            │
│    → GuestGuard: Check token + currentUser                      │
│      - If authenticated: Redirect to /chats                     │
│      - If not authenticated: Allow route                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Main Application Renders                                     │
│    → User sees appropriate route (login or main app)            │
│    → All initialization complete                                │
│    → Theme applied, settings loaded                             │
└─────────────────────────────────────────────────────────────────┘
```

## Benefits of This Approach

### 1. **No Blank White Screen**
- Initial loader appears instantly from index.html
- Users see branded loading screen immediately

### 2. **Single /me API Call**
- StartupService calls /me once during startup
- No duplicate verification in guards
- Efficient use of server resources

### 3. **Proper Error Handling**
- Failed authentication clears tokens and initializes defaults
- Settings load failure doesn't block app startup
- Network errors handled gracefully

### 4. **Simplified Guards**
- Guards just check authentication state
- No HTTP calls or complex logic in guards
- Faster route activation

### 5. **Professional UX**
- Minimum splash duration prevents flickering
- Smooth transitions between loading states
- Consistent with modern web apps

## Implementation Details

### StartupService Initialize Pipeline

```typescript
initialize() {
  // 1. Skip during SSR
  if (!isPlatformBrowser) return;
  
  // 2. Record start time for minimum duration
  startTime = Date.now();
  
  // 3. Run initialization
  if (hasToken) {
    // Verify with server
    verifyAuthenticationWithServer()
      .pipe(
        switchMap(authenticated => {
          if (authenticated) {
            // Load user settings
            return loadUserSettings();
          } else {
            // Clear invalid token
            logout();
            initializeDefaultTheme();
            return of(void 0);
          }
        })
      );
  } else {
    // No token, initialize defaults
    initializeDefaultTheme();
  }
  
  // 4. Ensure minimum splash duration
  const elapsed = Date.now() - startTime;
  const remaining = max(0, MIN_SPLASH_DURATION - elapsed);
  setTimeout(() => setInitialized(), remaining);
}
```

### APP_INITIALIZER Configuration

```typescript
// app.config.ts
{
  provide: APP_INITIALIZER,
  useFactory: startupServiceFactory,
  deps: [StartupService],
  multi: true
}

// startup-service.factory.ts
export function startupServiceFactory(startupService: StartupService) {
  return (): Promise<void> => {
    return startupService.initialize();
  };
}
```

### Loading Screen Display Logic

```typescript
// app.component.ts
isAppInitializing$ = combineLatest([
  authService.authInitializing$,
  userSettingsService.loading$
]).pipe(
  map(([authLoading, settingsLoading]) => authLoading || settingsLoading)
);
```

```html
<!-- app.component.html -->
<app-loading-screen *ngIf="isAppInitializing$ | async"></app-loading-screen>
<router-outlet />
```

## Configuration

### Minimum Splash Duration
The minimum splash screen duration can be adjusted in `StartupService`:

```typescript
private readonly MIN_SPLASH_DURATION = 800; // milliseconds
```

### Loading Screen Styling
Customize the loading screen appearance in two places:

1. **index.html** - Initial loader (inline CSS)
2. **loading-screen.component.ts** - Angular component styles

Both use CSS custom properties for theming:
- `--taskflow-color-loading-screen-bg`: Background color
- `--taskflow-color-loading-logo`: Logo color
- `--taskflow-color-loading-loader`: Loader bar color
- `--taskflow-color-loading-loader-track`: Loader track color
- `--taskflow-color-loading-text`: Loading text color

## Testing

### StartupService Tests
Located in `src/app/core/services/startup.service.spec.ts`

Key test scenarios:
- SSR handling (immediate resolution)
- No token scenario (default theme initialization)
- Successful authentication (verify + load settings)
- Authentication failure (logout + defaults)
- Settings load failure (fallback to defaults)
- Network error handling
- Minimum splash duration enforcement

### Manual Testing Checklist

1. **First Load (Not Authenticated)**
   - [ ] Splash screen appears immediately
   - [ ] No blank white screen
   - [ ] Redirects to login page
   - [ ] Default theme applied

2. **First Load (Authenticated)**
   - [ ] Splash screen appears immediately
   - [ ] /me API called once
   - [ ] User settings loaded
   - [ ] Theme applied from settings
   - [ ] Redirects to /chats

3. **Page Refresh (Authenticated)**
   - [ ] Splash screen shows briefly
   - [ ] /me API called to verify token
   - [ ] Settings loaded from cache first
   - [ ] No flickering or blank screens

4. **Invalid Token**
   - [ ] Token cleared on /me failure
   - [ ] Redirects to login
   - [ ] Default theme applied

5. **Network Error**
   - [ ] App doesn't hang
   - [ ] Graceful fallback to defaults
   - [ ] User can proceed to login

## Migration Notes

### Removed Components
- `AppInitService` (replaced by `StartupService`)
- `appInitServiceFactory` (replaced by `startupServiceFactory`)

### Changed Behavior
- Guards no longer call `restoreUserFromStorage()`
- Guards no longer make HTTP calls
- Authentication verification happens once at startup
- Settings load happens before route activation

### Backward Compatibility
- All existing auth flows (login, register, logout) remain unchanged
- API interceptor still handles 401 errors
- Token refresh mechanism unchanged
- LocalStorage keys remain the same

## Troubleshooting

### Issue: Loading screen never disappears
**Cause**: APP_INITIALIZER never resolves
**Solution**: Check browser console for errors in StartupService

### Issue: Duplicate /me calls
**Cause**: Code outside StartupService calling getUserProfile
**Solution**: Search codebase for getUserProfile calls, ensure only called after login/register

### Issue: Theme not applied on startup
**Cause**: Settings service not properly initialized
**Solution**: Check UserSettingsService.loadUserSettings() is called and theme is applied

### Issue: Guards still redirecting incorrectly
**Cause**: Authentication state not properly set
**Solution**: Verify StartupService calls setInitialized() and auth state is correct

## Future Enhancements

Possible improvements to consider:

1. **Retry Logic**: Add retry mechanism for failed /me calls
2. **Offline Mode**: Detect offline and show appropriate message
3. **Progressive Loading**: Show different messages during startup phases
4. **Analytics**: Track startup time and failure rates
5. **Skeleton Screens**: Show content skeletons instead of loading spinner
6. **Animated Transitions**: Add fade-in effect when transitioning from loader to app
