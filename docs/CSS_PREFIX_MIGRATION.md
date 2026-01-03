# CSS Custom Properties Migration - TaskFlow Prefix

## Overview

This document describes the migration from inline CSS custom properties to a dedicated stylesheet with `taskflow-` prefix to avoid conflicts with Bootstrap and other CSS libraries.

## Changes Made

### 1. Theme Service Updates (`theme.service.ts`)

**Before:**
- CSS variables were applied directly to `document.documentElement.style` (inline styles)
- Variables used generic names: `--color-*`, `--font-*`
- Caused HTML element to have hundreds of inline style attributes

**After:**
- CSS variables are injected into a dedicated `<style>` element in `<head>`
- Variables use `--taskflow-` prefix: `--taskflow-color-*`, `--taskflow-font-*`
- Clean HTML element without inline styles
- Better separation of concerns

### 2. New Files Created

**`src/theme/theme-variables.scss`**
- Placeholder stylesheet for theme variables documentation
- Imported in `styles.scss` for proper cascade
- Actual variables are injected by ThemeService at runtime

### 3. Variable Naming Convention

All CSS custom properties now follow this pattern:

```scss
// Color tokens
--taskflow-color-background
--taskflow-color-text-primary
--taskflow-color-text-secondary
--taskflow-color-navbar-bg
--taskflow-color-sidebar-bg
--taskflow-color-dropdown-bg
--taskflow-color-button-primary-bg
--taskflow-color-accent
// ... and 85+ more

// Typography tokens
--taskflow-font-font-size-base
--taskflow-font-font-size-h1
--taskflow-font-font-size-normal
--taskflow-font-line-height-base
--taskflow-font-line-height-heading
// ... and 30+ more
```

### 4. Updated Components (24 files)

All production components (excluding auth) have been updated to use the new `taskflow-` prefixed variables:

**Settings Module:**
- settings-layout.component.scss
- settings-sidebar.component.scss
- settings-category.component.scss
- settings-renderer.component.scss
- toggle-control.component.scss
- select-control.component.scss
- radio-control.component.scss

**Shared Components:**
- navbar.component.scss
- nav-links.component.scss
- user-dropdown.component.scss
- common-dropdown.component.scss
- confirmation-dialog.component.scss
- tabs.component.scss
- footer.component.scss
- skeleton-loader.component.scss
- main-layout.component.scss

**Chat Components:**
- chat-message.component.scss
- chat-conversation.component.scss
- chat-sidebar.component.scss
- main-chat.component.scss
- group-info-dialog.component.scss
- create-group-dialog.component.scss
- keyboard-shortcuts-dialog.component.scss

**Global:**
- styles.scss

## Benefits

### 1. No Bootstrap Conflicts
- `--taskflow-` prefix ensures zero naming collisions with Bootstrap's CSS variables
- Future-proof against third-party library conflicts

### 2. Clean HTML
- No inline styles in the `<html>` element
- Easier debugging in browser DevTools
- Better separation of structure and presentation

### 3. Better Performance
- Single stylesheet injection vs. hundreds of inline style operations
- Batched updates via `requestAnimationFrame`
- Reduced DOM mutations

### 4. Maintainability
- Clear ownership: all `--taskflow-*` variables are managed by ThemeService
- Easy to identify theme-related variables in CSS
- Consistent naming convention across the entire application

## Usage Example

```scss
// Component stylesheet
.my-component {
  // Use TaskFlow theme tokens
  background: var(--taskflow-color-surface);
  color: var(--taskflow-color-text-primary);
  border: 1px solid var(--taskflow-color-border);
  font-size: var(--taskflow-font-font-size-normal);
  
  // With fallback for SSR
  background: var(--taskflow-color-surface, #ffffff);
  
  // Smooth transitions
  transition: background-color 0.2s ease, color 0.2s ease;
}
```

## Theme Service Architecture

```typescript
// ThemeService creates and manages a dedicated <style> element
private createStyleElement(): void {
  let styleEl = document.getElementById('taskflow-theme-variables') as HTMLStyleElement;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'taskflow-theme-variables';
    styleEl.type = 'text/css';
    document.head.appendChild(styleEl);
  }
  
  this.styleElement = styleEl;
}

// Variables are injected as CSS text, not inline styles
private applyTheme(mode: ThemeMode): void {
  const cssVariables: string[] = [];
  
  Object.entries(tokens.colors).forEach(([key, value]) => {
    cssVariables.push(`  --taskflow-color-${key}: ${value};`);
  });
  
  this.styleElement.textContent = `:root {\n${cssVariables.join('\n')}\n}`;
}
```

## Backward Compatibility

Auth components continue to use existing variables without the `taskflow-` prefix:
- `--primary-green`, `--dark-green`, `--primary-black`, etc.
- These variables remain in `styles.scss` for auth pages
- No migration needed for auth components (as per requirements)

## Testing

To verify the changes:

1. **Check HTML Element:**
   - Open DevTools → Elements tab
   - Select `<html>` element
   - Should see NO inline `style` attribute with hundreds of CSS variables

2. **Check Head Stylesheet:**
   - Open DevTools → Elements tab → `<head>` section
   - Look for `<style id="taskflow-theme-variables">`
   - Should contain all `--taskflow-*` variables

3. **Test Theme Switching:**
   - Navigate to `/settings/appearance`
   - Change theme from Light → Dark → System
   - All UI elements should update instantly
   - No flicker or delay

4. **Verify No Conflicts:**
   - Check Bootstrap components still work
   - No CSS variable naming collisions
   - All third-party components unaffected

## Migration Command

The following command was used to update all component stylesheets:

```bash
# Update all production component SCSS files
find src/app -name "*.scss" ! -path "*/auth/*" -exec sed -i 's/var(--color-/var(--taskflow-color-/g' {} \;
find src/app -name "*.scss" ! -path "*/auth/*" -exec sed -i 's/var(--font-/var(--taskflow-font-/g' {} \;
sed -i 's/var(--color-/var(--taskflow-color-/g' src/styles.scss
sed -i 's/var(--font-/var(--taskflow-font-/g' src/styles.scss
```

## Future Extensions

The `taskflow-` prefix pattern can be extended for:
- `--taskflow-spacing-*` for density modes
- `--taskflow-shadow-*` for elevation tokens
- `--taskflow-radius-*` for border radius tokens
- `--taskflow-duration-*` for animation timing tokens

## Related Files

- `src/app/core/services/theme.service.ts` - Service implementation
- `src/theme/theme-variables.scss` - Variable placeholder/documentation
- `src/theme/theme.light.json` - Light theme token definitions
- `src/theme/theme.dark.json` - Dark theme token definitions
- `src/styles.scss` - Global styles with theme import

## References

- GitHub Issue: CSS variables appearing as inline styles
- Bootstrap CSS Variables: https://getbootstrap.com/docs/5.3/customize/css-variables/
- CSS Custom Properties Spec: https://www.w3.org/TR/css-variables-1/
