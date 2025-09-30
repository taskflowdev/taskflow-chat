# Theme System - Quick Start Guide

## For Developers

### Using Theme Tokens in Your Components

Always use CSS variables for theming:

```scss
// ✅ GOOD - Uses theme tokens
.my-card {
  background-color: var(--BackgroundColor);
  color: var(--TextColor);
  border: 1px solid var(--BorderColor);
}

// ❌ BAD - Hardcoded colors
.my-card {
  background-color: #ffffff;
  color: #000000;
  border: 1px solid #e5e7eb;
}
```

### Available Theme Tokens

| Token | Purpose | Example Value |
|-------|---------|---------------|
| `--BackgroundColor` | Page background | `#ffffff` |
| `--SecondaryBackgroundColor` | Card/container background | `#f8fafc` |
| `--TextColor` | Primary text | `#0f172a` |
| `--TextMutedColor` | Secondary text | `#64748b` |
| `--LinkColor` | Links | `#3b82f6` |
| `--ButtonPrimary` | Primary button | `#22c55e` |
| `--ButtonPrimaryText` | Primary button text | `#ffffff` |
| `--ButtonSecondary` | Secondary button | `#e5e7eb` |
| `--ButtonSecondaryText` | Secondary button text | `#0f172a` |
| `--IconColor` | Icons | `#64748b` |
| `--BadgeSuccess` | Success badge | `#22c55e` |
| `--ToastSuccess` | Success toast | `#22c55e` |
| `--NavbarBackground` | Navbar background | `#000000` |
| `--NavbarText` | Navbar text | `#ffffff` |
| `--BorderColor` | Borders | `#e5e7eb` |

### Accessing Theme State in TypeScript

```typescript
import { Component, OnInit } from '@angular/core';
import { ThemeService } from '@shared/services/theme.service';

@Component({
  selector: 'app-example',
  template: `
    <div>Current theme: {{ themeName }}</div>
    <div>Is dark: {{ isDark }}</div>
  `
})
export class ExampleComponent implements OnInit {
  themeName: string = '';
  isDark: boolean = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.themeService.themeState$.subscribe(state => {
      this.themeName = state.effectiveTheme?.name || 'Default';
      this.isDark = state.isDark;
    });
  }
}
```

### Programmatically Changing Theme

```typescript
// Toggle dark mode
this.themeService.toggleDarkMode();

// Set specific theme
this.themeService.setTheme('theme-id', 'variant-id', false); // false = light

// Enable system sync
this.themeService.setSyncWithSystem(true);
```

## For Users

### Accessing Theme Settings

1. Click on your profile picture in the top-right
2. Select "Settings" from the dropdown
3. Navigate to "Appearance" tab (default)

### Changing Your Theme

1. Browse available themes in the Light/Dark sections
2. Click on accent color swatches to preview
3. Click "Apply" to set the theme
4. Changes save automatically

### Sync with System

Enable "Sync with system" to automatically match your OS theme:
- When enabled, the app follows your system's light/dark preference
- Your selected light and dark themes will be used accordingly
- Theme changes instantly when you change your OS settings

### Theme Toggle

Use the sun/moon icon in the navbar to quickly switch between light and dark modes.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           User Interaction              │
│  (Settings Page / Theme Toggle Button)  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           ThemeService                  │
│  - Manages theme state (BehaviorSubject)│
│  - Fetches themes from API              │
│  - Saves preferences to API & localStorage│
│  - Applies CSS variables to :root       │
│  - Handles system theme detection       │
└─────────────┬───────────────────────────┘
              │
              ├─────────────────┐
              ▼                 ▼
    ┌─────────────────┐   ┌──────────────┐
    │   Backend API   │   │ localStorage │
    │  /api/themes/*  │   │   (cache)    │
    └─────────────────┘   └──────────────┘
              │
              ▼
    ┌─────────────────────────────────────┐
    │     CSS Variables Applied to DOM    │
    │        (--BackgroundColor, etc.)    │
    └─────────────────────────────────────┘
              │
              ▼
    ┌─────────────────────────────────────┐
    │      UI Updates Automatically       │
    │    (All components using tokens)    │
    └─────────────────────────────────────┘
```

## How It Works

1. **App Startup**
   - ThemeProvider component initializes
   - Loads cached theme from localStorage (instant display)
   - Fetches available themes from API

2. **User Login**
   - ThemeService fetches user preferences from API
   - Applies user's saved theme
   - Overrides cached theme if different

3. **Theme Change**
   - User selects new theme in settings
   - ThemeService applies immediately (CSS variables)
   - Saves to localStorage (fast)
   - Saves to backend API (persistent)
   - Smooth transition animation (0.25s)

4. **System Sync** (if enabled)
   - Watches OS theme changes
   - Automatically switches between user's light/dark themes
   - Updates in real-time

## Adding New Themes (Backend)

The theme system is fully driven by the backend API. To add new themes:

1. Create theme in backend with base tokens
2. Add accent variants with token overrides
3. Set a default variant
4. Theme appears automatically in UI

No frontend changes needed!

## Testing

```bash
# Run all tests
npm test

# Run only theme service tests
npm test -- --include='**/theme.service.spec.ts'

# Build production
npm run build
```

## Common Patterns

### Responsive Theme-Aware Components

```scss
.my-component {
  background: var(--BackgroundColor);
  color: var(--TextColor);
  padding: 1rem;
  border-radius: 8px;
  transition: all 0.25s ease-in-out; // Smooth theme transitions
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
}
```

### Theme-Aware Buttons

```scss
.btn-primary {
  background: var(--ButtonPrimary);
  color: var(--ButtonPrimaryText);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
}
```

### Conditional Styling Based on Theme

```typescript
@Component({
  template: `
    <div [class.dark-mode]="isDark">
      <!-- Content -->
    </div>
  `
})
export class MyComponent {
  isDark$ = this.themeService.themeState$.pipe(
    map(state => state.isDark)
  );
}
```

## Troubleshooting

**Q: Theme not loading on page refresh**
- Check if localStorage is enabled
- Verify API endpoint is accessible
- Check browser console for errors

**Q: Colors not changing**
- Ensure you're using CSS variables, not hardcoded colors
- Check if the token name is correct
- Verify theme is being applied to `:root`

**Q: Theme flashing on load**
- This means cached theme isn't being applied fast enough
- Check ThemeProvider is in app root
- Verify localStorage service is working

**Q: Settings page not showing themes**
- Check API endpoint returns themes
- Verify user is authenticated
- Check browser network tab for failed requests

## Performance Tips

1. **Use CSS Variables**: Hardware-accelerated, no re-render needed
2. **Avoid Inline Styles**: Use classes with theme tokens instead
3. **Minimize Theme Subscriptions**: Subscribe once, share values
4. **Use Transitions Wisely**: Keep them short (0.25s max)

## Security Notes

- Theme preferences are user-specific (requires authentication)
- No sensitive data in theme tokens
- localStorage uses encrypted storage service
- All API calls use standard authentication

---

For detailed documentation, see [THEME_SYSTEM.md](./THEME_SYSTEM.md)
