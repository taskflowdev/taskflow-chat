# Feature Indicator Component

A reusable, customizable component to display visual indicators (dots) for new or important features in your application.

## Usage

### Basic Usage

```html
<app-feature-indicator></app-feature-indicator>
```

### With Custom Inputs

```html
<div style="position: relative; display: inline-block;">
  <button>New Feature Button</button>
  <app-feature-indicator position="top-right" [size]="12" color="#22c55e" animation="pulse" [animationDuration]="2"></app-feature-indicator>
</div>
```

## Inputs

### `position`

- **Type:** `'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'`
- **Default:** `'top-right'`
- **Description:** Position of the indicator relative to the parent element.

### `size`

- **Type:** `number`
- **Default:** `12`
- **Description:** Size of the indicator dot in pixels.

### `color`

- **Type:** `string`
- **Default:** `'var(--taskflow-color-indicator-color)'`
- **Description:** Color of the indicator dot. Accepts CSS color values (hex, rgb, theme tokens, etc.).

### `pulseColor`

- **Type:** `string`
- **Default:** `'var(--taskflow-color-indicator-bg)'`
- **Description:** Color of the pulse/blink ring effect.

### `animation`

- **Type:** `'pulse' | 'blink' | 'none'`
- **Default:** `'pulse'`
- **Description:** Animation type for the indicator.
  - `pulse`: Expands a colored ring outward (recommended for attention)
  - `blink`: Fades opacity in and out
  - `none`: No animation

### `animationDuration`

- **Type:** `number`
- **Default:** `2`
- **Description:** Duration of the animation in seconds.

### `borderColor`

- **Type:** `string`
- **Default:** `'var(--taskflow-color-chat-sidebar-bg)'`
- **Description:** Border color of the indicator dot. Usually matches the background color of the parent element.

### `offset`

- **Type:** `number`
- **Default:** `4`
- **Description:** Offset from the edge in pixels (horizontal and vertical).

### `customClass`

- **Type:** `string`
- **Default:** `''`
- **Description:** Custom CSS class name for additional styling.

### `visible`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Show or hide the indicator.

## Examples

### Example 1: Default Green Pulse Indicator

```html
<div style="position: relative;">
  <button>Feature Button</button>
  <app-feature-indicator></app-feature-indicator>
</div>
```

### Example 2: Blinking Red Indicator at Bottom-Left

```html
<div style="position: relative;">
  <div class="card">Card Content</div>
  <app-feature-indicator position="bottom-left" color="#ef4444" [pulseColor]="'rgba(239, 68, 68, 0.1)'" animation="blink" [animationDuration]="1.5"></app-feature-indicator>
</div>
```

### Example 3: Static Indicator (No Animation)

```html
<div style="position: relative;">
  <span>Updated</span>
  <app-feature-indicator animation="none" [size]="8" color="#3b82f6"></app-feature-indicator>
</div>
```

### Example 4: Large Indicator with Custom Class

```html
<div style="position: relative;">
  <img src="avatar.jpg" alt="User" />
  <app-feature-indicator [size]="20" color="#10b981" position="bottom-right" [offset]="2" customClass="indicator-shadow"></app-feature-indicator>
</div>
```

## CSS Custom Properties

The component uses CSS custom properties internally for dynamic styling. You can override them if needed:

```scss
.feature-indicator {
  --indicator-color: #22c55e;
  --indicator-pulse-color: rgba(34, 197, 94, 0.1);
  --indicator-border-color: #ffffff;
  --indicator-animation-duration: 2s;
}
```

## Important Notes

1. **Parent Container:** The parent element must have `position: relative` for the indicator to position correctly.
2. **Theme Tokens:** The component uses theme tokens by default. Make sure your theme is properly loaded.
3. **Border Color:** The `borderColor` input should typically match your parent's background color for a clean appearance.
4. **Accessibility:** Consider adding ARIA attributes to your parent element if the indicator indicates important information.

## Theme Integration

The component uses the following theme tokens:

- `--taskflow-color-indicator-color`: Main indicator color (default: green)
- `--taskflow-color-indicator-color-emphasis`: Darker shade for emphasis
- `--taskflow-color-indicator-bg`: Light background for pulse effect

These tokens are defined in your theme files (`theme.light.json` and `theme.dark.json`).
