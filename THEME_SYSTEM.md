# Theme Management System Documentation

## Overview

This is a production-grade theme management system built for the TaskFlow Chat application. It provides a complete theming solution with support for multiple themes, accent variants, light/dark modes, and system theme synchronization.

## Architecture

### Core Components

#### 1. ThemeService (`src/app/shared/services/theme.service.ts`)

The central service that manages all theme operations:

- **Reactive State Management**: Uses `BehaviorSubject` to provide real-time theme updates
- **API Integration**: Fetches themes and user preferences from backend via OpenAPI-generated services
- **localStorage Caching**: Stores last applied theme for instant load on app startup
- **System Sync**: Detects and responds to OS-level theme changes
- **Token Application**: Applies theme tokens as CSS variables to `:root`

**Key Methods:**
- `loadAvailableThemes()`: Fetches all available themes from API
- `loadUserPreference()`: Loads user's saved theme preferences
- `loadEffectiveTheme()`: Gets merged theme (base + accent variant)
- `setTheme(themeId, variantId, isDark)`: Applies a specific theme
- `toggleDarkMode()`: Switches between light and dark modes
- `setSyncWithSystem(enabled)`: Enables/disables system theme sync

#### 2. Theme Components

##### ThemeProvider (`src/app/shared/components/theme/theme-provider.component.ts`)
- Initializes theme system on app startup
- Watches for user authentication changes
- Automatically loads user preferences after login

##### ThemeToggle (`src/app/shared/components/theme/theme-toggle.component.ts`)
- Quick toggle button for switching between light and dark modes
- Displays appropriate icon based on current theme
- Integrated into the navbar

##### ThemePreviewCard (`src/app/shared/components/theme/theme-preview-card.component.ts`)
- Shows a preview of a theme with its current accent
- Displays theme name, preview UI elements
- Allows selecting and applying themes
- Used in settings page

##### AccentSelector (`src/app/shared/components/theme/accent-selector.component.ts`)
- Circular color swatches for accent variants
- Visual selection with checkmark indicator
- Supports multiple accent colors per theme

#### 3. Settings Module

##### Settings Component (`src/app/settings/components/settings.component.ts`)
- Main settings page container
- Navigation for different settings sections
- Currently shows appearance settings

##### ThemeSettings Component (`src/app/settings/components/theme-settings.component.ts`)
- Complete theme customization interface
- Sync with system toggle
- Separate sections for light and dark themes
- Real-time theme preview and application
- Instant save to backend and localStorage

## Theme Token System

### Default Tokens

The following CSS variables are available and can be customized via themes:

#### Background & Surfaces
- `--BackgroundColor`: Primary page background
- `--SecondaryBackgroundColor`: Cards, containers, secondary surfaces

#### Text
- `--TextColor`: Primary text color
- `--TextMutedColor`: Secondary/muted text

#### Interactive Elements
- `--LinkColor`: Hyperlinks
- `--ButtonPrimary`: Primary button background
- `--ButtonPrimaryText`: Primary button text
- `--ButtonSecondary`: Secondary button background
- `--ButtonSecondaryText`: Secondary button text

#### Icons & Badges
- `--IconColor`: Icon color
- `--BadgeSuccess`: Success badge background
- `--BadgeWarning`: Warning badge background
- `--BadgeError`: Error badge background

#### Toasts
- `--ToastSuccess`: Success toast background
- `--ToastWarning`: Warning toast background
- `--ToastError`: Error toast background

#### Navigation
- `--NavbarBackground`: Navbar background color
- `--NavbarText`: Navbar text color
- `--NavbarBorder`: Navbar border color

#### Borders
- `--BorderColor`: General border color

### Usage in Components

Always use CSS variables for colors:

```scss
.my-component {
  background-color: var(--BackgroundColor);
  color: var(--TextColor);
  border: 1px solid var(--BorderColor);
}

.my-button {
  background: var(--ButtonPrimary);
  color: var(--ButtonPrimaryText);
}
```

## API Integration

### Endpoints Used

1. **GET /api/themes**
   - Fetches all available themes with variants
   - Public endpoint (no auth required)
   - Returns: `DynamicThemeDto[]`

2. **GET /api/themes/user**
   - Gets current user's theme preferences
   - Protected endpoint (requires authentication)
   - Returns: `DynamicUserThemeDto`

3. **POST /api/themes/user**
   - Saves user's theme preferences
   - Protected endpoint (requires authentication)
   - Body: `UpdateDynamicUserThemeDto`
   - Saves instantly when user changes theme

4. **GET /api/themes/user/effective**
   - Gets effective theme (merged base + accent)
   - Protected endpoint (requires authentication)
   - Returns: `EffectiveThemeDto`

### Data Models

From OpenAPI-generated models in `src/app/api/models/`:

- **DynamicThemeDto**: Theme information with variants
- **DynamicThemeVariantDto**: Accent variant with token overrides
- **DynamicUserThemeDto**: User's theme preferences
- **UpdateDynamicUserThemeDto**: DTO for updating preferences
- **EffectiveThemeDto**: Merged theme with all tokens

## Features

### ✅ Multiple Themes
- Support for unlimited themes from backend
- Light and Dark theme types
- Each theme can have multiple accent variants

### ✅ Accent Variants
- 5+ accent colors per theme (configurable via backend)
- Default accent for each theme
- Tokens from variants override base theme tokens

### ✅ System Sync
- Automatic detection of OS theme preference
- Real-time response to system theme changes
- Can be enabled/disabled by user

### ✅ Instant Application
- Theme changes apply immediately
- Smooth transitions (0.25s ease-in-out)
- No page reload required

### ✅ Persistence
- **localStorage**: Caches last theme for instant load
- **Backend API**: Stores preferences across devices
- Survives page refreshes and app restarts

### ✅ Performance
- Cached theme applied before API call
- Minimal re-renders using reactive streams
- Smooth transitions without jarring changes

### ✅ Type Safety
- Full TypeScript integration
- OpenAPI-generated models
- Compile-time type checking

## User Flows

### First-Time User
1. App loads with default light theme from CSS variables
2. User logs in
3. Backend returns default theme preferences
4. Theme is applied immediately

### Existing User
1. App loads cached theme from localStorage (instant)
2. User logs in
3. Backend returns saved preferences
4. If different from cache, updates theme smoothly

### Changing Theme
1. User navigates to Settings > Appearance
2. Sees available themes with previews
3. Clicks on a theme or accent variant
4. Theme applies instantly with smooth transition
5. Saved to localStorage and backend simultaneously

### System Sync
1. User enables "Sync with system"
2. App detects OS theme (light/dark)
3. Applies appropriate user-selected theme
4. Watches for OS theme changes
5. Updates theme automatically when OS changes

## Development Guide

### Adding New Tokens

1. Add to backend theme/variant configuration
2. Token automatically appears in `EffectiveThemeDto`
3. Use in components: `var(--YourNewToken)`
4. Add fallback in `:root` in `src/styles.scss`

### Creating Custom Theme Components

```typescript
import { Component, OnInit } from '@angular/core';
import { ThemeService } from './shared/services/theme.service';

@Component({
  selector: 'app-my-component',
  template: `<div [style.background]="bgColor">...</div>`
})
export class MyComponent implements OnInit {
  bgColor: string = '';
  
  constructor(private themeService: ThemeService) {}
  
  ngOnInit() {
    this.themeService.themeState$.subscribe(state => {
      // Access current theme state
      console.log('Current theme:', state.effectiveTheme?.name);
      console.log('Is dark:', state.isDark);
    });
  }
}
```

### Testing

Run theme service tests:
```bash
npm test -- --include='**/theme.service.spec.ts'
```

All tests use mocked dependencies for fast, reliable testing.

## File Structure

```
src/app/
├── shared/
│   ├── services/
│   │   ├── theme.service.ts           # Core theme service
│   │   └── theme.service.spec.ts      # Tests
│   └── components/
│       └── theme/
│           ├── theme-provider.component.ts
│           ├── theme-toggle.component.ts
│           ├── theme-preview-card.component.ts
│           └── accent-selector.component.ts
├── settings/
│   ├── components/
│   │   ├── settings.component.ts
│   │   └── theme-settings.component.ts
│   └── settings-routing.module.ts
└── api/
    ├── services/
    │   └── dynamic-themes.service.ts  # Generated API service
    └── models/
        ├── dynamic-theme-dto.ts
        ├── dynamic-theme-variant-dto.ts
        ├── dynamic-user-theme-dto.ts
        ├── update-dynamic-user-theme-dto.ts
        └── effective-theme-dto.ts
```

## Browser Support

- All modern browsers supporting CSS variables
- Chrome, Firefox, Safari, Edge (latest versions)
- No IE11 support (CSS variables not supported)

## Performance Considerations

- Themes are cached in memory after first load
- Only one API call per login session
- CSS variable changes are hardware-accelerated
- Minimal DOM manipulation

## Security

- All theme preferences saved per-user (authenticated)
- No XSS risk (tokens are CSS values only)
- LocalStorage uses encrypted storage service
- API calls use standard auth interceptors

## Future Enhancements

Potential improvements:
- Custom user-created themes
- Theme import/export
- Theme preview before applying
- More granular token control
- Animation preferences
- High contrast mode support
- Reduced motion support

## Troubleshooting

### Theme not applying
- Check browser console for errors
- Verify API endpoints are accessible
- Check user authentication status
- Clear localStorage and refresh

### Wrong theme on load
- Theme service may be loading cached theme
- Check localStorage for `taskflow_chat_last_theme`
- Verify backend returns correct preferences

### Slow theme changes
- Check network tab for slow API calls
- Verify transitions are not too long
- Check for component re-render loops

## Support

For issues or questions:
- Check browser console for errors
- Review API responses in network tab
- Verify theme tokens in Elements inspector
- Check ThemeService state via `themeService.getCurrentState()`
