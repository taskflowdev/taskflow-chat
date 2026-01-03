# Profile Component Documentation

## Overview
The Profile component is a production-ready, reusable component in the Settings module that displays user profile information in a GitHub-style layout.

## Location
`src/app/settings/components/profile/`

## Files
- `profile.component.ts` - Component logic
- `profile.component.html` - Component template
- `profile.component.scss` - Component styles

## Features

### 1. GitHub-Style Design
- Clean, professional layout similar to GitHub's profile page
- Card-based sections for different information types
- Responsive design that adapts to mobile devices

### 2. User Information Display
The component displays the following user information:
- **Profile Header**
  - Avatar with user initials
  - Full name or username
  - Username with @ prefix

- **Personal Information Section**
  - Full name
  - Username
  - Email address

- **Account Information Section**
  - User ID (displayed in monospace font)
  - Account creation date (formatted)

### 3. Avatar Generation
- Automatically generates user initials from full name
- Falls back to username initials if full name is not available
- Displayed in a circular avatar with gradient background
- 80px size for desktop, 64px for mobile

### 4. Date Formatting
- Formats ISO date strings to readable format (e.g., "January 1, 2024")
- Handles missing dates gracefully with "N/A" fallback

### 5. Loading States
- Uses skeleton loader while user data is being fetched
- Reactive design using RxJS observables

### 6. Responsive Design
- Desktop: Grid layout with labels on left, values on right
- Mobile: Stacked layout with centered profile header
- Proper spacing and readability on all screen sizes

## Integration

### Routing
The profile component is integrated into the settings routing:
```typescript
{ path: 'profile', component: ProfileComponent }
```

It's set as the default route when navigating to `/settings`.

### Sidebar Navigation
Added to settings sidebar as the first item:
- Icon: `bi-person` (default), `bi-person-fill` (active)
- Label: Translated via `settings.profile.title`
- Route: `/settings/profile`

## Translation Keys

The component uses the following translation keys:
- `settings.profile.title` - Sidebar title
- `settings.profile.personal-info` - Personal information section header
- `settings.profile.full-name` - Full name label
- `settings.profile.username` - Username label
- `settings.profile.email` - Email label
- `settings.profile.account-info` - Account information section header
- `settings.profile.user-id` - User ID label
- `settings.profile.joined` - Joined date label

## Dependencies

### Services
- `AuthService` - Provides current user data via `currentUser$` observable

### Components
- `SkeletonLoaderComponent` - Shows loading state

### Pipes
- `TranslatePipe` - Handles i18n translations
- `AsyncPipe` - Handles observable subscriptions

## Styling

### CSS Variables Used
The component follows the design token system:
- `--taskflow-color-border-subtle` - Border colors
- `--taskflow-color-border-default` - Card borders
- `--taskflow-color-text-primary` - Primary text color
- `--taskflow-color-text-secondary` - Secondary text color
- `--taskflow-color-canvas-subtle` - Card background
- `--taskflow-color-canvas-default` - Nested backgrounds
- `--taskflow-color-primary` - Avatar gradient start
- `--taskflow-color-accent-emphasis` - Avatar gradient end
- `--taskflow-font-font-size-*` - Font sizes
- `--taskflow-font-line-height-*` - Line heights

### Animations
- Fade-in animation on component load (200ms)
- Smooth easing function for professional feel

## Code Quality

### Change Detection
Uses `OnPush` strategy for optimal performance

### Type Safety
Fully typed with TypeScript interfaces:
- `AuthUser` interface from `AuthService`

### Error Handling
- Graceful handling of missing user data
- Fallback values for all fields
- Try-catch blocks for date parsing

### Reusability
- No hardcoded values
- Configurable via observables
- Follows Angular best practices
- Standalone component (no module dependencies)

## Usage Example

The component is automatically loaded when navigating to:
```
/settings
/settings/profile
```

No additional configuration is required. The component automatically:
1. Subscribes to current user data
2. Displays user information
3. Formats dates
4. Generates avatar initials
5. Handles loading states

## Future Enhancements

Potential improvements (not implemented):
1. Profile photo upload
2. Edit profile functionality
3. Role/permission display
4. Account statistics
5. Activity history
6. Export profile data

## Testing Considerations

When testing this component:
1. Verify all user fields are displayed correctly
2. Test with missing/null user data
3. Test date formatting with various date formats
4. Verify responsive behavior on different screen sizes
5. Ensure translations work for all supported languages
6. Verify loading states work correctly
7. Test avatar initial generation with various name formats
