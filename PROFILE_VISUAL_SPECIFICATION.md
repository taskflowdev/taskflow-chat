# Profile Tab - Visual Specification

## Overview
This document provides a visual specification of the Profile tab implementation in the Settings module, designed in GitHub style.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                │
│  ┌────────────────┐  ┌────────────────────────────────────────────┐   │
│  │ SIDEBAR        │  │ CONTENT AREA                                │   │
│  │                │  │                                             │   │
│  │ ● Profile  ◄───┼──┤  ┌──────────────────────────────────────┐  │   │
│  │   Accessibility│  │  │ PROFILE HEADER                        │  │   │
│  │   Appearance   │  │  │                                       │  │   │
│  │   Language     │  │  │  ╔════╗                               │  │   │
│  │   ...          │  │  │  ║ JD ║  John Doe                     │  │   │
│  │                │  │  │  ╚════╝  @johndoe                     │  │   │
│  │                │  │  │                                       │  │   │
│  │                │  │  └──────────────────────────────────────┘  │   │
│  │                │  │                                             │   │
│  │                │  │  ┌──────────────────────────────────────┐  │   │
│  │                │  │  │ Personal Information                  │  │   │
│  │                │  │  │ ────────────────────────────────────  │  │   │
│  │                │  │  │                                       │  │   │
│  │                │  │  │  👤 Full Name         John Doe        │  │   │
│  │                │  │  │  🏷️  Username          johndoe        │  │   │
│  │                │  │  │  ✉️  Email             john@example.com│  │   │
│  │                │  │  │                                       │  │   │
│  │                │  │  └──────────────────────────────────────┘  │   │
│  │                │  │                                             │   │
│  │                │  │  ┌──────────────────────────────────────┐  │   │
│  │                │  │  │ Account Information                   │  │   │
│  │                │  │  │ ────────────────────────────────────  │  │   │
│  │                │  │  │                                       │  │   │
│  │                │  │  │  🔑 User ID           abc123def456    │  │   │
│  │                │  │  │  📅 Joined            January 1, 2024 │  │   │
│  │                │  │  │                                       │  │   │
│  │                │  │  └──────────────────────────────────────┘  │   │
│  │                │  │                                             │   │
│  └────────────────┘  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Sidebar (Left Panel)
- **Width**: Fixed width sidebar
- **First Item**: Profile (with person icon)
  - Default Icon: `bi-person`
  - Active Icon: `bi-person-fill`
- **Other Items**: Dynamic categories from catalog
- **Active State**: Blue highlight on active route

### 2. Profile Header
- **Avatar Circle**:
  - Size: 80px × 80px (desktop), 64px × 64px (mobile)
  - Background: Linear gradient (primary → accent)
  - Border: 3px solid border-default color
  - Content: User initials (2 letters, uppercase)
  - Shadow: Subtle drop shadow
  
- **Name Display**:
  - Full name: H1 size, bold, primary text color
  - Username: Large size, with @ prefix, secondary text color
  - Layout: Vertical stack, left-aligned (desktop), center-aligned (mobile)

### 3. Personal Information Card
- **Container**:
  - Background: Subtle canvas color
  - Border: 1px solid border-default
  - Border Radius: 8px
  - Padding: 24px
  
- **Section Title**:
  - "Personal Information"
  - H3 size, bold, primary text color
  
- **Detail Rows** (3 rows):
  1. Full Name
  2. Username
  3. Email
  
- **Row Structure**:
  - Grid: 2 columns (200px | 1fr) on desktop
  - Stack: Single column on mobile
  - Icon + Label (left/top) | Value (right/bottom)
  - Border bottom on each row (except last)

### 4. Account Information Card
- **Container**: Same as Personal Information Card
- **Section Title**: "Account Information"
- **Detail Rows** (2 rows):
  1. User ID - in monospace font with code-style background
  2. Joined - formatted date

## Color Scheme (Using Design Tokens)

### Light Theme
- **Text Primary**: `#24292f`
- **Text Secondary**: `#57606a`
- **Border Subtle**: `#d0d7de`
- **Border Default**: `#d0d7de`
- **Canvas Subtle**: `#f6f8fa`
- **Canvas Default**: `#ffffff`
- **Avatar Gradient**: `#0969da` → `#8250df`

### Dark Theme
- Colors automatically adjust via CSS variables
- Same structure and layout
- Proper contrast maintained

## Responsive Behavior

### Desktop (> 768px)
```
[Sidebar - Fixed] [Profile Content - Flexible]
                  [Header: Avatar + Name side by side]
                  [Cards: Label-Value in grid]
```

### Mobile (≤ 768px)
```
[Sidebar - Collapsible/Hidden]
[Profile Content - Full Width]
  [Header: Centered Avatar]
  [Header: Centered Name]
  [Cards: Label above Value]
```

## Animations

### Page Load
- **Animation**: Fade in + slight upward movement
- **Duration**: 200ms
- **Easing**: `cubic-bezier(0.2, 0, 0.38, 0.9)`

### State Changes
- Smooth transitions on hover
- No jarring movements

## Icons Used

| Element | Icon | Library |
|---------|------|---------|
| Sidebar Active | `bi-person-fill` | Bootstrap Icons |
| Sidebar Inactive | `bi-person` | Bootstrap Icons |
| Full Name | `bi-person` | Bootstrap Icons |
| Username | `bi-person-badge` | Bootstrap Icons |
| Email | `bi-envelope` | Bootstrap Icons |
| User ID | `bi-key` | Bootstrap Icons |
| Joined Date | `bi-calendar-check` | Bootstrap Icons |

## Typography

### Font Sizes
- **Profile Name**: H1 (var(--taskflow-font-font-size-h1))
- **Username**: Large (var(--taskflow-font-font-size-large))
- **Section Titles**: H3 (var(--taskflow-font-font-size-h3))
- **Labels**: Base (var(--taskflow-font-font-size-base))
- **Values**: Base (var(--taskflow-font-font-size-base))
- **User ID**: Small + Monospace (var(--taskflow-font-font-size-small))

### Font Weights
- **Profile Name**: 600
- **Section Titles**: 600
- **Labels**: 600
- **Values**: Normal

## Spacing

### Component Spacing
- **Header Bottom Margin**: 32px
- **Between Cards**: 32px
- **Card Padding**: 24px (desktop), 16px (mobile)
- **Detail Row Gap**: 16px
- **Detail Row Padding**: 12px vertical
- **Avatar-Name Gap**: 24px (desktop)

### Grid Spacing
- **Column Gap**: 24px
- **Icon-Label Gap**: 8px

## Loading State

When loading:
```
┌─────────────────────────────────────────┐
│ [Skeleton: Wide rectangle]              │
│                                         │
│ [Skeleton: Rectangle]                   │
│ [Skeleton: Rectangle]                   │
└─────────────────────────────────────────┘
```

## Accessibility

- **ARIA Labels**: Proper labels on all interactive elements
- **Semantic HTML**: Section tags, headings hierarchy
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: All information accessible
- **Color Contrast**: WCAG AA compliant

## Integration Points

1. **Data Source**: `AuthService.currentUser$`
2. **Routing**: `/settings/profile`
3. **Sidebar**: First item in settings navigation
4. **Translations**: Uses i18n system
5. **Theme**: Respects user's theme preference

## GitHub-Style Elements

✓ Clean, minimalist design
✓ Card-based sections
✓ Subtle borders and backgrounds
✓ Icon + label pattern
✓ Professional typography
✓ Monospace for technical data (ID)
✓ Responsive grid layout
✓ Subtle animations
✓ Proper spacing and hierarchy
