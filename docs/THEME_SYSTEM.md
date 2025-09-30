# Theme Management System

This document describes the comprehensive theme management system implemented in TaskFlow Chat.

## Overview

The theme management system is fully dynamic, leveraging API-generated models to provide:
- **Light and Dark themes** with **multiple accent variants** (5 each)
- **Default accents** for both Light and Dark modes
- **Dynamic application of UI tokens**: background, text, buttons, icons, badges, toast notifications
- **Immediate theme application** after login based on user preferences
- **Instant persistence** to localStorage and backend when changed
- **System theme synchronization** for automatic Light/Dark switching
- **Fast, smooth theme application** on app load (no flashes)

## Architecture

### Core Components

1. **ThemeService** (`src/app/shared/services/theme.service.ts`)
   - Fetches themes and variants from API
   - Loads and saves user theme preferences
   - Merges base theme + accent tokens dynamically
   - Maintains reactive state using Angular signals
   - Handles system theme sync
   - Caches themes in localStorage for fast load

2. **Theme Models** (`src/app/shared/models/theme.models.ts`)
   - `Theme`: Represents a base theme (Light or Dark)
   - `ThemeVariant`: Represents an accent variant of a theme
   - `UserThemePreference`: User's theme preferences
   - `EffectiveTheme`: Currently applied theme
   - `ThemeMapper`: Utility class to convert API DTOs to UI models

3. **ThemeGuard** (`src/app/shared/guards/theme.guard.ts`)
   - Applies neutral theme to authentication pages
   - Allows user theme on all other pages

### API Integration

The system uses the following API endpoints (auto-generated from OpenAPI):

- `GET /api/themes` - Get all available themes with variants
- `GET /api/themes/user` - Get user's theme preferences
- `POST /api/themes/user` - Save user's theme preferences
- `GET /api/themes/user/effective` - Get the effective theme for the user

## Theme Application Flow

### On App Initialization

1. App loads → `AppComponent.ngOnInit()` executes
2. ThemeService loads cached theme from localStorage
3. Cached theme tokens are immediately applied to CSS variables
4. Themes are fetched from API asynchronously
5. If user is authenticated, user preferences are loaded
6. User's theme is applied based on preferences

### On Login

1. User logs in successfully
2. AuthService emits currentUser$ event
3. AppComponent detects authentication
4. ThemeService loads user preferences from API
5. Theme is applied based on user preferences
6. Theme is cached in localStorage

### On Theme Change

1. User changes theme in settings
2. ThemeService updates local state
3. Theme is saved to localStorage immediately
4. Theme is persisted to backend API asynchronously
5. Theme tokens are applied to CSS variables
6. UI updates instantly via reactive signals

## CSS Variables

All theme tokens from the API are converted to CSS variables and applied to `:root`:

```css
:root {
  --background-color: #ffffff;
  --secondary-background-color: #f8f9fa;
  --text-color: #212529;
  --text-muted-color: #6c757d;
  --link-color: #007bff;
  --button-primary: #007bff;
  --button-primary-text: #ffffff;
  --accent-primary: #007bff;
  /* ... more tokens */
}
```

Token keys are converted from PascalCase to kebab-case automatically.

## System Theme Sync

The system can automatically switch between Light and Dark themes based on OS preferences:

```typescript
// Detect OS theme preference
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const prefersDark = mediaQuery.matches;

// Listen for changes
mediaQuery.addEventListener('change', (e) => {
  if (syncWithSystem) {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});
```

## Performance Optimizations

1. **Cached Theme Loading**: Theme is cached in localStorage and applied immediately on app load
2. **Lazy API Calls**: Themes are fetched asynchronously after initial cached theme is applied
3. **Reactive Updates**: Uses Angular signals for efficient change detection
4. **Smooth Transitions**: CSS transitions for theme changes
5. **ShareReplay**: API calls are cached using RxJS shareReplay operator

## Usage Examples

### In Components

```typescript
import { ThemeService } from '@shared/services/theme.service';

export class MyComponent {
  themeService = inject(ThemeService);

  // Get available themes
  themes = this.themeService.availableThemes();

  // Get user preferences
  preferences = this.themeService.userPreferences();

  // Update theme mode
  setDarkMode() {
    this.themeService.updateThemeMode(ThemeMode.DARK).subscribe();
  }

  // Update variant
  selectVariant(variantId: string) {
    this.themeService.updateThemeVariant('light', variantId).subscribe();
  }
}
```

### In Templates

```html
<div *ngIf="themeService.isLoading()">Loading themes...</div>

<button *ngFor="let variant of themeService.availableThemes()[0].variants"
        (click)="selectVariant(variant.id)">
  {{ variant.name }}
</button>
```

### In CSS

```css
.my-component {
  background: var(--background-color);
  color: var(--text-color);
  border-color: var(--border-color);
}

.primary-button {
  background: var(--button-primary);
  color: var(--button-primary-text);
}
```

## Testing

Comprehensive unit tests are provided in `theme.service.spec.ts`:

```bash
npm test -- --include='**/theme.service.spec.ts'
```

## Future Enhancements

- [ ] Custom theme creation by users
- [ ] Theme import/export
- [ ] More granular token customization
- [ ] Animation preferences
- [ ] High contrast mode
