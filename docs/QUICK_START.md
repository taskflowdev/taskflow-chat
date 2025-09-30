# 🎨 Theme Management System - Quick Start

## What's Been Implemented

A comprehensive, production-ready theme management system that:
- ✅ Loads themes dynamically from API
- ✅ Supports Light/Dark modes with multiple accent variants
- ✅ Syncs with OS theme preferences
- ✅ Applies instantly with zero flash on load
- ✅ Persists to localStorage and backend
- ✅ Uses Angular signals for reactive updates

## Quick Start

### 1. Using ThemeService in Components

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService, ThemeMode } from '@shared';

@Component({...})
export class MyComponent {
  themeService = inject(ThemeService);

  // Switch to dark mode
  switchToDark() {
    this.themeService.updateThemeMode(ThemeMode.DARK).subscribe();
  }

  // Enable system sync
  enableSystemSync() {
    this.themeService.toggleSystemSync(true).subscribe();
  }

  // Select an accent variant
  selectAccent(variantId: string) {
    this.themeService.updateThemeVariant('light', variantId).subscribe();
  }
}
```

### 2. Using in Templates

```html
<!-- Show loading state -->
<div *ngIf="themeService.isLoading()">
  Loading themes...
</div>

<!-- List available themes -->
<div *ngFor="let theme of themeService.availableThemes()">
  <h3>{{ theme.name }}</h3>
  
  <!-- List variants -->
  <button *ngFor="let variant of theme.variants"
          (click)="selectAccent(variant.id)">
    {{ variant.name }}
  </button>
</div>

<!-- Current preferences -->
<p>Current mode: {{ themeService.userPreferences().currentMode }}</p>
<p>System sync: {{ themeService.userPreferences().syncWithSystem }}</p>
```

### 3. Using CSS Variables

```scss
.my-component {
  background: var(--background-color);
  color: var(--text-color);
  
  .card {
    background: var(--secondary-background-color);
    border-color: var(--border-color);
  }
  
  .button-primary {
    background: var(--button-primary);
    color: var(--button-primary-text);
  }
  
  .link {
    color: var(--link-color);
  }
}
```

## Available CSS Variables

All tokens from the API are available as CSS variables:

```css
--background-color
--secondary-background-color
--text-color
--text-muted-color
--link-color
--button-primary
--button-primary-text
--button-secondary
--button-secondary-text
--icon-color
--badge-success
--badge-danger
--badge-warning
--toast-success
--toast-error
--toast-warning
--accent-primary
--accent-secondary
```

## How It Works

### On App Load
1. Cached theme loaded from localStorage (instant)
2. Theme tokens applied to CSS variables
3. Themes fetched from API (background)
4. Cache updated

### On User Login
1. Authentication detected
2. User preferences loaded from API
3. User's theme applied
4. Preferences cached

### On Theme Change
1. UI updates immediately (reactive signals)
2. Theme saved to localStorage (instant)
3. CSS variables updated (instant)
4. Backend synced (async)

## API Endpoints

The system uses these auto-generated API endpoints:

```
GET  /api/themes              - Get all themes (public)
GET  /api/themes/user         - Get user preferences (protected)
POST /api/themes/user         - Save user preferences (protected)
GET  /api/themes/user/effective - Get effective theme (protected)
```

## Testing

Run tests for the theme system:

```bash
# All tests
npm test

# Theme service tests only
npm test -- --include='**/theme.service.spec.ts'

# Theme settings component tests
npm test -- --include='**/theme-settings*.spec.ts'
```

## Documentation

- 📖 [Full Architecture Guide](docs/THEME_SYSTEM.md)
- 📋 [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)

## File Structure

```
src/app/shared/
├── models/theme.models.ts        # Theme types & mapper
├── services/theme.service.ts     # Core service
├── services/theme.service.spec.ts # Tests
└── guards/theme.guard.ts         # Route guard

src/app/settings/components/theme-settings/
├── theme-settings-page.component.ts
├── theme-preview-card.component.ts
├── theme-mode-selector.component.ts
└── circular-color-selector.component.ts
```

## Key Features

### 🚀 Performance
- Instant theme loading from cache
- Zero flash on app load
- Lazy API calls
- Optimized change detection

### 🎯 User Experience
- Live theme preview
- Smooth transitions
- No page reload needed
- Preserved across sessions

### 🔧 Developer Experience
- Type-safe with TypeScript
- Reactive with Angular signals
- Comprehensive tests
- Full documentation

## Next Steps

The theme system is fully functional. To use it:

1. Navigate to Settings → Appearance
2. Choose Light, Dark, or System mode
3. Select an accent variant
4. Changes apply instantly!

For custom implementations, see the [documentation](docs/THEME_SYSTEM.md).
