# Authentication System - Quick Reference

## For Developers

### Adding a New Protected Route

```typescript
// In app.routes.ts
{
  path: '',
  component: MainLayoutComponent,
  canActivate: [AuthGuard],
  children: [
    {
      path: 'your-route',
      component: YourComponent
    }
  ]
}
```

### Accessing Current User in Components

```typescript
import { AuthService } from './auth/services/auth.service';

export class YourComponent {
  currentUser$ = this.authService.currentUser$;
  
  constructor(private authService: AuthService) {}
  
  // In template
  // <div *ngIf="currentUser$ | async as user">
  //   Welcome {{ user.fullName }}
  // </div>
}
```

### Checking Authentication Status

```typescript
// Check if user has token
const isAuthenticated = this.authService.isAuthenticated();

// Get current user synchronously
const user = this.authService.getCurrentUser();

// Get current user as observable
this.authService.currentUser$.subscribe(user => {
  if (user) {
    console.log('User is logged in:', user);
  } else {
    console.log('User is logged out');
  }
});
```

### Manual Logout

```typescript
this.authService.logout();
this.router.navigate(['/auth/login']);
```

### Showing Loading Screen

The loading screen automatically shows during app initialization. To show it manually:

```typescript
// In your component
isLoading$ = this.authService.authInitializing$;

// In template
<app-loading-screen *ngIf="isLoading$ | async"></app-loading-screen>
```

### Making Authenticated API Calls

Just use HttpClient - the AuthInterceptor automatically adds the token:

```typescript
this.http.get('/api/your-endpoint').subscribe(data => {
  // Authorization header is automatically added
});
```

### Handling Auth Errors in Components

```typescript
this.authService.login(credentials).subscribe({
  next: (result) => {
    if (result.success) {
      // Wait for user to be set
      this.authService.currentUser$.pipe(
        filter(user => user !== null),
        take(1)
      ).subscribe(() => {
        this.router.navigate(['/chats'], { replaceUrl: true });
      });
    } else {
      // Error is already shown in toast by AuthService
      console.error(result.error);
    }
  }
});
```

## Common Patterns

### Redirect After Login

```typescript
// Always use replaceUrl to prevent back-button loops
this.router.navigate(['/chats'], { replaceUrl: true });
```

### Wait for User Data Before Navigation

```typescript
this.authService.currentUser$.pipe(
  filter(user => user !== null),
  take(1)
).subscribe(user => {
  this.router.navigate(['/chats'], { replaceUrl: true });
});
```

### Check Auth in ngOnInit

```typescript
ngOnInit() {
  const currentUser = this.authService.getCurrentUser();
  if (this.authService.isAuthenticated() && currentUser) {
    this.router.navigate(['/chats'], { replaceUrl: true });
  }
}
```

### Prevent Execution During SSR

```typescript
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

constructor(@Inject(PLATFORM_ID) private platformId: Object) {
  if (isPlatformBrowser(this.platformId)) {
    // Browser-only code
  }
}
```

## File Locations

```
src/app/
├── auth/
│   ├── guards/
│   │   ├── auth.guard.ts           # Protects authenticated routes
│   │   ├── guest.guard.ts          # Protects guest routes (login/signup)
│   │   └── *.spec.ts               # Tests
│   ├── interceptors/
│   │   ├── auth.interceptor.ts     # Handles tokens and 401 errors
│   │   └── auth.interceptor.spec.ts
│   └── services/
│       ├── auth.service.ts         # Core authentication service
│       └── auth.service.spec.ts
├── core/
│   ├── app-initializer.ts          # APP_INITIALIZER factory
│   └── app-initializer.spec.ts
├── shared/
│   └── components/
│       └── loading-screen/
│           ├── loading-screen.component.ts
│           └── loading-screen.component.spec.ts
├── app.config.ts                   # APP_INITIALIZER registration
├── app.routes.ts                   # Route guards configuration
└── app.component.ts                # Loading screen integration
```

## API Endpoints Used

- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/register` - Create new account
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

## Environment Variables

Currently uses default API configuration. To customize:

```typescript
// In src/app/api/api-configuration.ts
rootUrl: string = 'https://your-api-url.com';
```

## Debug Tips

### Enable Auth Logging

```typescript
// In auth.service.ts, uncomment console.log statements
// Or add this to see all auth state changes:
this.authService.currentUser$.subscribe(user => {
  console.log('Current user changed:', user);
});
```

### Check Token in DevTools

```javascript
// In browser console
localStorage.getItem('taskflow_chat_token')
```

### Monitor HTTP Requests

Open browser DevTools → Network tab → Filter by "api" to see all API calls with Authorization headers.

## Quick Fixes

### "User not authenticated" after refresh

- Check if token is in localStorage
- Verify `/api/auth/me` endpoint returns user data
- Check browser console for errors

### Loading screen doesn't hide

- Verify `APP_INITIALIZER` completes
- Check `authInitializing$` observable in console
- Look for errors in `verifyAuthentication()`

### 401 errors not triggering refresh

- Verify AuthInterceptor is registered in app.config.ts
- Check if refresh token exists
- Look for errors in `refreshAccessToken()`

### Routes not protected

- Add AuthGuard to route configuration
- Check guard is imported and provided
- Verify guard logic in browser console
