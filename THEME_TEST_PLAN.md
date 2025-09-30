# Theme System Test Plan

## Manual Testing Guide

This guide helps you verify the theme system implementation works correctly.

---

## Test 1: Unauthenticated User - Default Theme

### Steps:
1. Clear browser cache and localStorage
2. Navigate to `http://localhost:4200/auth/login`

### Expected Results:
- ✓ Page loads immediately without waiting for API
- ✓ Default light theme applied (white background, dark text)
- ✓ No theme-related console errors
- ✓ Check DevTools > Elements > `:root` - should see CSS variables like `--BackgroundColor`
- ✓ Auth page has clean, professional styling

### Verification Commands:
```javascript
// Open DevTools Console
// Check root element styles
getComputedStyle(document.documentElement).getPropertyValue('--BackgroundColor')
// Should return: "#ffffff" or similar

// Check theme mode class
document.documentElement.classList.contains('light-mode')
// Should return: true

// Check localStorage (should be empty for unauthenticated)
localStorage.getItem('user-theme-tokens')
// Should return: null
```

---

## Test 2: System Dark Mode - Default Dark Theme

### Steps:
1. Clear browser cache and localStorage
2. Enable system dark mode (OS settings)
3. Navigate to `http://localhost:4200/auth/login`

### Expected Results:
- ✓ Page loads with default dark theme
- ✓ Dark background with light text
- ✓ `.dark-mode` class applied to `:root`
- ✓ No API calls made

### Verification Commands:
```javascript
// Check dark mode class
document.documentElement.classList.contains('dark-mode')
// Should return: true

// Check background color
getComputedStyle(document.documentElement).getPropertyValue('--BackgroundColor')
// Should return dark color like "#0d1117"
```

---

## Test 3: Login Flow - User Theme Application

### Steps:
1. Navigate to `http://localhost:4200/auth/login`
2. Enter valid credentials
3. Click "Sign In"

### Expected Results:
- ✓ Login successful
- ✓ Redirect to `/chats` or dashboard
- ✓ **API call** to `/api/themes/user/effective` made
- ✓ User's theme applied immediately
- ✓ Theme tokens stored in localStorage

### Verification Commands:
```javascript
// Check API call in DevTools > Network tab
// Look for: GET /api/themes/user/effective

// Check localStorage
const tokens = JSON.parse(localStorage.getItem('user-theme-tokens'));
console.log(tokens);
// Should return array like: [{ key: 'BackgroundColor', value: '#fff' }, ...]

// Verify theme applied
getComputedStyle(document.documentElement).getPropertyValue('--ButtonPrimary')
// Should return user's primary button color
```

---

## Test 4: Theme Persistence - Page Reload

### Steps:
1. After logging in (Test 3)
2. Refresh the page (F5 or Ctrl+R)

### Expected Results:
- ✓ Page loads with cached theme immediately
- ✓ No flash of default theme
- ✓ Theme from localStorage applied before API call
- ✓ Background API call to verify/update theme

### Verification Commands:
```javascript
// Check localStorage before reload
localStorage.getItem('user-theme-tokens')
// Should have cached tokens

// After reload, check if API call happens
// Network tab should show: GET /api/themes/user/effective
```

---

## Test 5: Auth Route Exclusion

### Steps:
1. While logged in
2. Navigate to `/auth/login`
3. Observe styling

### Expected Results:
- ✓ Auth page shows static styling (no dynamic theme)
- ✓ No theme tokens applied to auth pages
- ✓ Professional, clean appearance
- ✓ Check `:root` - CSS variables should not be applied on auth route

### Verification Commands:
```javascript
// On /auth/login page
const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--BackgroundColor');
console.log('BG Color:', bgColor);

// Theme should be static, not from API tokens
// Check if auth route is detected
window.location.pathname.startsWith('/auth/login')
// Should return: true
```

---

## Test 6: Navigation Between Routes

### Steps:
1. Login successfully
2. Navigate to `/chats`
3. Navigate to `/settings`
4. Navigate to `/auth/login`
5. Navigate back to `/chats`

### Expected Results:
- ✓ `/chats` - User theme applied
- ✓ `/settings` - User theme applied
- ✓ `/auth/login` - Static styling (no theme)
- ✓ Back to `/chats` - User theme reapplied

### Verification:
- Check if theme mode class changes
- Verify CSS variables presence/absence based on route

---

## Test 7: Theme Change in Settings

### Steps:
1. Login successfully
2. Navigate to `/settings/theme`
3. Change theme (select different variant or mode)
4. Observe immediate changes

### Expected Results:
- ✓ Theme updates immediately across all pages
- ✓ No page reload required
- ✓ New theme saved to API
- ✓ LocalStorage updated with new tokens
- ✓ Navigate to other pages - new theme persists

---

## Test 8: API Failure Handling

### Steps:
1. Login successfully
2. Open DevTools > Network
3. Throttle network to "Offline"
4. Reload page

### Expected Results:
- ✓ Page loads with cached theme from localStorage
- ✓ No errors shown to user
- ✓ Theme still functional
- ✓ Console may log API error (gracefully handled)

### Verification Commands:
```javascript
// Check if cached theme is used
const cachedTokens = localStorage.getItem('user-theme-tokens');
console.log('Using cached theme:', cachedTokens !== null);
```

---

## Test 9: Logout Flow

### Steps:
1. Login successfully
2. Navigate to `/chats`
3. Logout

### Expected Results:
- ✓ Redirect to `/auth/login`
- ✓ localStorage cleared (including theme tokens)
- ✓ Default theme applied
- ✓ No user-specific styling

### Verification Commands:
```javascript
// After logout
localStorage.getItem('user-theme-tokens')
// Should return: null

localStorage.getItem('taskflow_chat_token')
// Should return: null (logged out)
```

---

## Test 10: SSR Compatibility

### Steps:
1. Build app with SSR: `npm run build`
2. Run SSR server: `npm run serve:ssr:taskflow-chat`
3. Navigate to app in browser

### Expected Results:
- ✓ No server-side errors in console
- ✓ Platform checks prevent SSR DOM manipulation
- ✓ Theme applied only in browser
- ✓ No hydration errors

---

## Automated Testing

### Unit Test Example

```typescript
describe('ThemeService', () => {
  let service: ThemeService;
  let router: Router;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    router = TestBed.inject(Router);
  });

  it('should apply default theme for unauthenticated users', () => {
    spyOn(document.documentElement.style, 'setProperty');
    service.applyDefaultTheme();
    expect(document.documentElement.style.setProperty).toHaveBeenCalled();
  });

  it('should skip theme on auth routes', () => {
    spyOn(router, 'url').and.returnValue('/auth/login');
    const result = service['isAuthRoute']();
    expect(result).toBe(true);
  });

  it('should load user theme from API', (done) => {
    service.loadUserTheme().subscribe(() => {
      // Verify API was called
      // Verify tokens applied
      done();
    });
  });
});
```

---

## Performance Testing

### Metrics to Check:
1. **Initial Load (Unauthenticated)**
   - Target: < 100ms for theme application
   - No API calls

2. **Login Flow**
   - Target: Theme applied within 200ms of login
   - Single API call to `/api/themes/user/effective`

3. **Page Reload (Authenticated)**
   - Target: Cached theme applied < 50ms
   - Background API call for verification

4. **Route Navigation**
   - Target: Theme check < 10ms
   - Minimal DOM manipulation

---

## Accessibility Testing

### Checks:
- [ ] High contrast mode respected
- [ ] Color combinations meet WCAG AA standards
- [ ] Theme changes don't affect screen readers
- [ ] Focus indicators visible in all themes
- [ ] Reduced motion respected (`prefers-reduced-motion`)

---

## Cross-Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Known Issues and Limitations

### Current Limitations:
1. Theme change requires navigation for full effect on some components
2. Some third-party components may not respect CSS variables

### Future Improvements:
1. Preload theme before app bootstrap
2. More granular token control
3. Theme animation transitions
4. Custom theme builder UI

---

## Troubleshooting

### Theme not applying?
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check localStorage for tokens
4. Ensure not on auth route

### Flicker on load?
1. Verify default theme application
2. Check CSS transition timing
3. Ensure theme cached properly

### Auth pages showing theme?
1. Check route detection in ThemeService
2. Verify AUTH_ROUTES array
3. Test isAuthRoute() method
