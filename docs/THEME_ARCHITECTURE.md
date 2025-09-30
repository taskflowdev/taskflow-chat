# Theme Management Architecture

## Overview

This document describes the MNC-level theme management system implemented in TaskFlow Chat. The system provides:

- **Seamless theme application** across all modules and components
- **Exclusion of Auth pages** (Login, Signup, ForgotPassword) from dynamic theming
- **Default theme for unauthenticated users**
- **User-selected themes applied immediately after login**
- **API-generated theme models** for dynamic customization

---

## Architecture

### 1. Theme Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      App Initialization                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Check Auth      │
                    │ Status          │
                    └─────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
        ┌──────────────┐          ┌──────────────────┐
        │ Not          │          │ Authenticated    │
        │ Authenticated│          │                  │
        └──────────────┘          └──────────────────┘
                 │                         │
                 ▼                         ▼
        ┌──────────────┐          ┌──────────────────┐
        │ Apply Default│          │ Load User Theme  │
        │ Theme        │          │ from API/Cache   │
        └──────────────┘          └──────────────────┘
                 │                         │
                 ▼                         ▼
        ┌──────────────┐          ┌──────────────────┐
        │ Default Light│          │ Apply User Theme │
        │ or Dark Theme│          │ Tokens to DOM    │
        └──────────────┘          └──────────────────┘
```

### 2. Default Theme Constants

Located in: `src/app/shared/constants/default-theme.constants.ts`

**Purpose:**
- Provide theme tokens for unauthenticated users
- Support both light and dark modes based on system preference
- Eliminate API dependency for initial load

**Key Constants:**
```typescript
DEFAULT_LIGHT_THEME  // Light theme for unauthenticated users
DEFAULT_DARK_THEME   // Dark theme for unauthenticated users
```

**Available Tokens:**
- Base tokens: BackgroundColor, TextColor, BorderColor, etc.
- Accent tokens: ButtonPrimary, ToastSuccess, IconPrimary, etc.

### 3. Theme Service

Located in: `src/app/shared/services/theme.service.ts`

**Responsibilities:**

1. **Default Theme Application**
   - `applyDefaultTheme()` - Applies default theme for unauthenticated users
   - Checks system preference for dark/light mode
   - No API calls required

2. **User Theme Loading**
   - `loadUserTheme()` - Fetches user's theme from API
   - Uses `DynamicThemesService.apiThemesUserEffectiveGet()`
   - Caches theme in localStorage for quick reloads

3. **Auth Route Detection**
   - `isAuthRoute()` - Checks if current route is an auth page
   - Skips theme application on auth routes

4. **Token Application**
   - `applyTokensToDOM()` - Sets CSS custom properties
   - Uses format: `--{tokenKey}` (e.g., `--BackgroundColor`)
   - Reactive updates via BehaviorSubject

### 4. App Component Integration

Located in: `src/app/app.component.ts`

**Workflow:**

1. **OnInit:**
   - Check authentication status
   - If not authenticated → `applyDefaultTheme()`
   - If authenticated → `loadUserTheme()` from API/cache

2. **Navigation Listener:**
   - Monitor route changes
   - Reapply appropriate theme based on route and auth status

3. **Auth State Listener:**
   - Subscribe to `currentUser$` from AuthService
   - Load user theme immediately after successful login

### 5. Auth Routes Exclusion

Auth routes are excluded from dynamic theming:
- `/auth/login`
- `/auth/signup`
- `/auth/forgot-password`

**How it works:**
- ThemeService checks current route before applying tokens
- AppComponent handles route-specific theme logic
- Auth pages use static styling from `styles.scss`

---

## CSS Architecture

### Global CSS Variables

Located in: `src/styles.scss`

**Theme Modes:**
```css
.light-mode {
  background-color: var(--BackgroundColor, #ffffff);
  color: var(--TextColor, #212529);
}

.dark-mode {
  background-color: var(--BackgroundColor, #1a1d29);
  color: var(--TextColor, #ffffff);
}
```

**Dynamic Tokens:**
All components use CSS custom properties:
```css
:root {
  --BackgroundColor: #ffffff;
  --ButtonPrimary: #007bff;
  --ToastSuccess: #198754;
  /* ... more tokens ... */
}
```

**Smooth Transitions:**
```css
:root {
  transition: background-color 0.2s ease, 
              color 0.2s ease,
              border-color 0.2s ease;
}
```

---

## API Integration

### Endpoints Used

1. **Get User Theme (Authenticated)**
   - `GET /api/themes/user/effective`
   - Returns: `EffectiveThemeDto` with merged tokens

2. **Get Available Themes (Public)**
   - `GET /api/themes`
   - Returns: List of all available themes

3. **Update User Theme (Authenticated)**
   - `POST /api/themes/user`
   - Saves user's theme preference

### Response Format

```typescript
interface EffectiveThemeDto {
  name: string;
  themeId: string;
  themeType: string;
  variantId: string;
  variantName: string;
  tokens: { [key: string]: string };
}
```

Example:
```json
{
  "name": "Light - Blue",
  "themeId": "light-theme-id",
  "themeType": "Light",
  "variantId": "blue-variant-id",
  "variantName": "Blue",
  "tokens": {
    "BackgroundColor": "#ffffff",
    "ButtonPrimary": "#0969da",
    "ToastSuccess": "#1a7f37"
  }
}
```

---

## Theme Application Logic

### For Unauthenticated Users

1. Check system preference (`prefers-color-scheme: dark`)
2. Select appropriate default theme (light/dark)
3. Convert theme to token array
4. Apply tokens to DOM via CSS custom properties
5. Set theme mode class (`.light-mode` or `.dark-mode`)

### For Authenticated Users

1. Call `/api/themes/user/effective`
2. Parse response tokens
3. Update BehaviorSubject for reactive updates
4. Cache tokens in localStorage
5. Apply tokens to DOM
6. On failure, fallback to cached theme or default

### Route-Based Behavior

**Auth Routes** (`/auth/*`):
- Use static CSS styling
- No dynamic token application
- Clean, professional appearance

**Protected Routes** (`/chats`, `/settings`):
- Apply user theme if authenticated
- Apply default theme if not authenticated
- Reactive updates when theme changes

---

## Caching Strategy

### LocalStorage Keys

1. **`theme-preferences`** - User theme preferences (for settings page)
2. **`user-theme-tokens`** - Cached theme tokens from API

### Cache Flow

```
Login → API Call → Save to Cache → Apply Theme
                      ↓
                   Next Load
                      ↓
              Read from Cache → Apply Immediately
                      ↓
              API Call (background) → Update if changed
```

---

## Benefits

1. ✅ **No API failures** for unauthenticated users
2. ✅ **Auth pages remain unthemed** - professional, clean look
3. ✅ **Global theme application** after login
4. ✅ **Smooth UX** with cached themes and reactive updates
5. ✅ **Extensible** - easy to add new tokens or themes
6. ✅ **SSR-safe** - proper platform checks for browser-only code

---

## Usage Examples

### Accessing Theme Service

```typescript
import { ThemeService } from '@app/shared/services/theme.service';

constructor(private themeService: ThemeService) {}

ngOnInit() {
  // Subscribe to theme updates
  this.themeService.getThemeTokens$().subscribe(tokens => {
    console.log('Theme updated:', tokens);
  });
}
```

### Using CSS Variables in Components

```scss
.my-component {
  background: var(--BackgroundColor);
  color: var(--TextColor);
  border: 1px solid var(--BorderColor);
}

.my-button {
  background: var(--ButtonPrimary);
  color: var(--ButtonPrimaryText);
  
  &:hover {
    background: var(--ButtonPrimaryHover);
  }
}
```

### Checking Auth Route in Service

```typescript
private isAuthRoute(): boolean {
  const currentUrl = this.router.url;
  return this.AUTH_ROUTES.some(route => currentUrl.startsWith(route));
}
```

---

## Troubleshooting

### Theme not applying

1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check localStorage for cached tokens
4. Ensure route is not an auth route

### Flicker on load

1. Verify default theme is applied in AppComponent
2. Check CSS transition timing
3. Ensure theme is cached properly

### Auth pages showing theme

1. Verify route checking logic in ThemeService
2. Check AUTH_ROUTES array includes all auth paths
3. Ensure AppComponent route handler is working
