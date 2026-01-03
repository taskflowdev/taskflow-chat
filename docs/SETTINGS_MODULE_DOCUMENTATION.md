# Settings Module Implementation

## Overview
Enterprise-grade Angular settings module with dynamic rendering, auto-save functionality, and theme management.

## Architecture

### Module Structure
```
src/app/settings/
├── components/
│   ├── controls/                   # Reusable control components
│   │   ├── toggle-control/        # Boolean toggle switch
│   │   ├── select-control/        # Dropdown select
│   │   └── radio-control/         # Radio button group
│   ├── settings-layout/           # Main layout with sidebar
│   ├── settings-sidebar/          # Category navigation
│   ├── settings-category/         # Category page container
│   └── settings-renderer/         # Dynamic control renderer
└── settings-routing.module.ts      # Route definitions
```

### Core Services
```
src/app/core/services/
├── theme.service.ts               # Theme management (dark/light/system)
└── user-settings.service.ts       # Settings CRUD with auto-save
```

### Theme Tokens
```
src/theme/
├── light.tokens.json              # Light theme color tokens
└── dark.tokens.json               # Dark theme color tokens
```

## Features

### 1. Dynamic Rendering
- Settings are 100% runtime-driven from backend schema
- No hardcoded categories or keys
- Extensible architecture for new control types

### 2. Auto-Save
- 350ms debounce on value changes
- Automatic PATCH to backend
- Instant in-memory cache update
- Toast notification on save

### 3. Theme Management
- Three modes: `light`, `dark`, `system`
- System mode respects OS preference
- Token-based color system
- Applied via CSS variables

### 4. GitHub-Style Layout
- Vertical sidebar with category list
- Dynamic content area
- Responsive design
- Clean, modern UI

## Usage

### Accessing Settings
Navigate to `/settings` or `/settings/:categoryKey`

Default category: `appearance`

### Adding New Control Types
1. Create new control component in `components/controls/`
2. Implement `@Input() value` and `@Output() valueChange`
3. Add to `settings-renderer.component.html` with conditional rendering
4. Import in `SettingsRendererComponent`

Example:
```typescript
@Component({
  selector: 'app-text-control',
  imports: [CommonModule],
  template: `
    <input type="text" 
           [value]="value" 
           (input)="onChange($event)" />
  `
})
export class TextControlComponent {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();
  
  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
```

### Backend Schema Requirements

#### Catalog Response
```typescript
{
  categories: [
    {
      key: "appearance",
      displayName: "Appearance",
      description: "Customize the look and feel",
      order: 1,
      keys: [
        {
          key: "theme",
          label: "Theme",
          description: "Choose your preferred theme",
          type: "select",
          default: "system",
          options: [
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" }
          ],
          ui: {
            order: 1
          }
        }
      ]
    }
  ]
}
```

#### User Settings Response
```typescript
{
  settings: {
    appearance: {
      theme: "dark"
    }
  },
  userId: "user-123",
  tenantId: null
}
```

## API Integration

### Endpoints Used
- `GET /api/settings/Catalog` - Load schema
- `GET /api/Settings/me` - Load user settings
- `PUT /api/Settings/me` - Update settings

### Services
- `CatalogService` - Schema operations
- `SettingsService` - User settings CRUD
- Both from OpenAPI generated clients

## Theme System

### Token Application
Tokens are applied as CSS variables:
```css
:root {
  --color-own-message-bg: #007bff;
  --color-own-message-text: #ffffff;
  --color-sidebar-bg: #ffffff;
  /* ... more tokens */
}

[data-theme="dark"] {
  --color-own-message-bg: #0d6efd;
  --color-sidebar-bg: #212529;
  /* ... dark mode tokens */
}
```

### Using Tokens in Components
```scss
.my-component {
  background-color: var(--color-sidebar-bg, #ffffff);
  color: var(--color-text-primary, #212529);
}
```

### System Theme Detection
```typescript
// Listens to OS preference changes
window.matchMedia('(prefers-color-scheme: dark)')
```

## Change Detection
All components use `OnPush` change detection for optimal performance.

## Type Safety
- All models from OpenAPI generated clients
- No manual type definitions
- Strong typing throughout

## Future Enhancements
Support for additional control types:
- Multi-select
- Checkbox array
- Numeric range slider
- JSON editor
- Object compound settings
- File upload
- Color picker

## Testing
Manual testing recommended with live backend.
Automated tests require headless browser setup.

## Notes
- Theme only applies post-login (not on auth pages)
- Settings cache cleared on logout
- Toast notifications use existing `ToastService`
- Fully responsive design
- SSR-compatible (server-side rendering)
