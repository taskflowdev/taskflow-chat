# Theme Management System

## Overview

This application implements an enterprise-grade, production-ready theme management system supporting both **Dark** and **Light** themes. The architecture is built for scalability, maintainability, and accessibility.

## Features

### ✅ Core Functionality
- **Dual Theme Support**: Dark (default) and Light themes
- **System Preference Detection**: Automatically detects and respects `prefers-color-scheme`
- **Persistent Storage**: Theme preference saved in localStorage
- **Runtime Theme Switching**: Seamless switching via toggle button in navbar
- **Smooth Transitions**: GPU-accelerated CSS transitions with reduced-motion support
- **Keyboard Accessible**: Full keyboard navigation (Space/Enter to toggle)
- **Screen Reader Friendly**: Proper ARIA labels and semantic HTML

### 🎨 Design System
- **Semantic Color Tokens**: Single source of truth in `src/styles/design-tokens.scss`
- **CSS Custom Properties**: CSS variables for all themeable properties
- **Consistent Naming**: Semantic naming (e.g., `--color-text-primary`, `--color-bg-primary`)
- **Future-Ready**: Easily extensible for brand themes or multi-tenant support

### ♿ Accessibility
- **WCAG Compliance**: Color contrast ratios meet accessibility standards
- **Reduced Motion**: Respects `prefers-reduced-motion` user preference
- **Focus Indicators**: Visible focus rings for keyboard navigation
- **ARIA Labels**: Proper labeling for screen readers

## Architecture

### File Structure

```
src/
├── styles/
│   └── design-tokens.scss          # Theme color tokens & CSS variables
├── app/
│   ├── core/
│   │   └── theme/
│   │       ├── theme.types.ts       # TypeScript types & enums
│   │       └── theme.service.ts     # Theme management service
│   └── shared/
│       └── components/
│           └── theme-toggle/
│               └── theme-toggle.component.ts  # Toggle button component
```

### Key Components

#### 1. Design Tokens (`design-tokens.scss`)

Defines all colors as CSS custom properties for both themes:

```scss
:root,
[data-theme="dark"] {
  --color-bg-primary: #000000;
  --color-text-primary: #ffffff;
  // ... more tokens
}

[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-text-primary: #0f172a;
  // ... more tokens
}
```

#### 2. Theme Service (`theme.service.ts`)

Core service handling:
- Theme initialization
- System preference detection
- localStorage persistence
- Theme switching logic
- Observable state management

```typescript
constructor(private themeService: ThemeService) {
  this.themeService.currentTheme$.subscribe(theme => {
    console.log('Current theme:', theme);
  });
}

// Toggle theme
this.themeService.toggleTheme();

// Set specific theme
this.themeService.setTheme(Theme.LIGHT);
```

#### 3. Theme Toggle Component (`theme-toggle.component.ts`)

Accessible toggle button with:
- Moon icon for dark theme
- Sun icon for light theme
- Keyboard support
- ARIA labels
- Smooth animations

### Theme Scoping

Themes are applied via a `data-theme` attribute on the `<html>` element:

```html
<html data-theme="dark">  <!-- or "light" -->
```

All components consume semantic CSS variables that automatically update when the theme changes.

## Usage Guide

### For Developers

#### Using Semantic Tokens in Components

Always use semantic tokens, never hardcoded colors:

```scss
// ✅ GOOD - Uses semantic tokens
.my-component {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

// ❌ BAD - Hardcoded colors
.my-component {
  background: #000000;
  color: white;
  border: 1px solid #444444;
}
```

#### Adding New Components

1. Import design tokens in global styles (already done)
2. Use semantic CSS variables in component styles
3. Add transitions for smooth theme changes:

```scss
.my-component {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: background-color var(--transition-normal) var(--ease-in-out),
              color var(--transition-normal) var(--ease-in-out);
}
```

#### Accessing Theme in TypeScript

```typescript
import { ThemeService } from '@app/core/theme/theme.service';
import { Theme } from '@app/core/theme/theme.types';

constructor(private themeService: ThemeService) {
  // Get current theme
  const current = this.themeService.getCurrentTheme();
  
  // Subscribe to theme changes
  this.themeService.currentTheme$.subscribe(theme => {
    if (theme === Theme.LIGHT) {
      // Do something for light theme
    }
  });
}
```

### For Users

#### Switching Themes

1. Click the theme toggle button in the navbar (moon/sun icon)
2. Theme preference is automatically saved
3. Preference persists across sessions

#### System Preference

The app respects your system's theme preference by default. To override:
- Simply click the theme toggle button
- Your manual preference takes priority

## Theme Exclusions

### Auth Pages

Auth pages (login, signup, forgot password) **do not participate** in theme switching and remain in **dark theme only**. This is by design for consistent branding during authentication.

## Available Semantic Tokens

### Background Colors
- `--color-bg-primary`: Primary background
- `--color-bg-secondary`: Secondary background
- `--color-bg-tertiary`: Tertiary background
- `--color-bg-hover`: Hover state background
- `--color-bg-active`: Active state background
- `--color-bg-input`: Input field background

### Text Colors
- `--color-text-primary`: Primary text
- `--color-text-secondary`: Secondary text
- `--color-text-tertiary`: Tertiary/muted text
- `--color-text-disabled`: Disabled text
- `--color-text-inverted`: Inverted text (for contrast)

### Border Colors
- `--color-border-primary`: Primary borders
- `--color-border-secondary`: Secondary borders
- `--color-border-focus`: Focus state borders

### Surface Colors
- `--color-surface-primary`: Primary surfaces (cards, modals)
- `--color-surface-secondary`: Secondary surfaces
- `--color-surface-elevated`: Elevated surfaces

### Status Colors
- `--color-success`: Success state
- `--color-error`: Error state
- `--color-warning`: Warning state
- `--color-info`: Info state

### Interactive
- `--color-link`: Link color
- `--color-link-hover`: Link hover color

### Shadows
- `--shadow-sm`: Small shadow
- `--shadow-md`: Medium shadow
- `--shadow-lg`: Large shadow
- `--shadow-xl`: Extra large shadow

### Transitions
- `--transition-fast`: 150ms
- `--transition-normal`: 250ms
- `--transition-slow`: 350ms

### Spacing & Radius
- `--space-*`: Spacing scale (xs, sm, md, lg, xl, 2xl)
- `--radius-*`: Border radius (sm, md, lg, xl, full)

## Performance Optimizations

1. **CSS Variables**: Instant theme switching without JavaScript
2. **GPU Acceleration**: Uses `transform` and `opacity` for animations
3. **Minimal Repaints**: Only themeable properties transition
4. **Reduced Motion**: Disables animations for users who prefer reduced motion

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (CSS custom properties required)

## Future Enhancements

This architecture supports:
- **Brand Themes**: Add company-specific color schemes
- **Multi-Tenant Themes**: Different themes per organization
- **High Contrast Mode**: Enhanced accessibility
- **Custom Theme Builder**: User-defined color schemes

## Testing

### Manual Testing Checklist

- [ ] Theme toggle button visible in navbar
- [ ] Toggle switches between light and dark themes
- [ ] Theme persists after page reload
- [ ] System preference detected correctly
- [ ] All pages except auth support theming
- [ ] Auth pages remain dark only
- [ ] Smooth transitions without flicker
- [ ] Keyboard navigation works (Tab, Space, Enter)
- [ ] Screen reader announces theme changes
- [ ] Reduced motion preference respected

### Browser Testing

Test in:
- Chrome
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Theme not applying
- Check that `ThemeService` is initialized in `app.component.ts`
- Verify `design-tokens.scss` is imported in `styles.scss`
- Check browser console for errors

### Colors not changing
- Ensure components use CSS variables (`var(--color-*)`)
- Verify `data-theme` attribute on `<html>` element
- Check that semantic tokens are defined for both themes

### Transitions not smooth
- Add transition properties to components
- Check `prefers-reduced-motion` setting
- Verify `--transition-*` variables are defined

## Support

For questions or issues, contact the development team or create an issue in the repository.
