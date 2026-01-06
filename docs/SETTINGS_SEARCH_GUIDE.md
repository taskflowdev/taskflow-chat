# Settings Search - Developer Guide

## Quick Start

The Settings Search is automatically integrated into the Settings Layout. No additional setup is required.

## Using the Search

### For End Users:

1. **Open Search**: Press `/` anywhere in the settings page to focus the search input
2. **Type Query**: Start typing to search across all settings
3. **Navigate Results**: Use `↑` and `↓` arrow keys to navigate through results
4. **Select Result**: Press `Enter` or click a result to jump to that setting
5. **Clear Search**: Press `Esc` to clear the search and return to category view

### For Developers:

#### Programmatic Search

```typescript
import { SettingsSearchService } from './settings/services/settings-search.service';

constructor(private searchService: SettingsSearchService) {}

// Set search query
this.searchService.setSearchQuery('theme');

// Get current results
const results = this.searchService.getCurrentResults();

// Clear search
this.searchService.clearSearch();

// Check if search is active
const isActive = this.searchService.isSearchActive();
```

#### Scroll to Setting Programmatically

```typescript
import { scrollToSetting } from './settings/utils/scroll-to-setting';

// Scroll to a setting
await scrollToSetting('appearance.theme', {
  behavior: 'smooth',
  block: 'center',
  focusControl: true,
  updateHash: true
});
```

#### Deep Linking to Settings

You can link directly to a setting using URL hash:

```
https://yourapp.com/settings/appearance#appearance.theme
```

The page will automatically scroll to the setting and highlight it.

## Adding New Settings

When adding new settings to the catalog, the search index is automatically updated. Make sure to include:

1. **Label** - Clear, descriptive label (highest search weight)
2. **Summary** - Brief description (good for search)
3. **Tags** - Relevant tags for discoverability
4. **Aliases** - Add to `options[].meta.aliases` for alternative search terms

Example:

```json
{
  "key": "darkMode",
  "label": "Dark Mode",
  "summary": "Enable dark theme for better visibility in low light",
  "tags": ["theme", "appearance", "dark"],
  "options": [
    {
      "value": "dark",
      "label": "Dark",
      "meta": {
        "aliases": ["night", "black", "dark theme"]
      }
    }
  ]
}
```

## Customizing Search Behavior

### Change Debounce Time

Edit `src/app/settings/services/settings-search.service.ts`:

```typescript
debounceTime(200) // Change to your preferred value (ms)
```

### Change Max Results

Edit `src/app/settings/services/settings-search.service.ts`:

```typescript
const results = searchSettings(query, index, 50); // Change from 20 to 50
```

### Modify Search Weights

Edit `src/app/settings/utils/settings-search-index.ts` in the `calculateScore` function:

```typescript
// Label matches (highest weight: 100)
if (labelLower === query) {
  score += 100; // Change this value
}
```

## Theming

All colors are defined in theme tokens. To customize:

1. Edit `src/theme/theme.light.json` for light theme
2. Edit `src/theme/theme.dark.json` for dark theme

Search-related tokens start with `search*` or `settingHighlight*`.

## Accessibility

The search is fully accessible by default:

- **Keyboard Navigation**: All features accessible via keyboard
- **ARIA Labels**: All interactive elements have descriptive labels
- **Screen Reader Support**: Results count is announced automatically
- **Focus Management**: Focus follows navigation

## Performance Tips

1. **Index is Memoized**: Don't worry about rebuilding the index - it only rebuilds when catalog changes
2. **Search is Debounced**: Input is debounced by 200ms to avoid excessive searches
3. **Limited Results**: Only top 20 results are returned for performance
4. **Pre-computed Text**: Searchable text is computed once during indexing

## Troubleshooting

### Search not working

1. Check that `SettingsSearchService` is provided (it's root-level by default)
2. Verify catalog is loaded in `UserSettingsService`
3. Check browser console for errors

### Results not appearing

1. Verify catalog has data
2. Check that search query matches something in the catalog
3. Use browser DevTools to inspect `searchResults$` observable

### Keyboard shortcuts not working

1. Ensure no other element is capturing the keyboard event
2. Check that the search input has proper event handlers
3. Verify no conflicting shortcuts in the application

### Highlight animation not showing

1. Check that `data-setting-key` attribute is present on setting elements
2. Verify CSS variables for `settingHighlightBg` and `settingHighlightBorder` are defined
3. Ensure animation keyframes are not being overridden

## Code Review Checklist

When reviewing PRs that modify search functionality:

- [ ] No hardcoded colors (all use theme tokens)
- [ ] Keyboard navigation still works
- [ ] ARIA labels are present and accurate
- [ ] Performance optimizations are maintained (memoization, debouncing)
- [ ] TypeScript types are correct and strict
- [ ] No network calls added to search
- [ ] Search weights remain balanced
- [ ] Documentation is updated

## Integration with Command Palette (Future)

The search components are designed to be reusable. To integrate with a command palette:

1. Reuse `SettingsSearchService` for data
2. Create a new UI component (modal/dialog)
3. Use same keyboard navigation logic
4. Add additional command types (actions, navigation, etc.)

Example structure:

```typescript
interface CommandPaletteItem extends SettingsSearchResult {
  type: 'setting' | 'action' | 'navigation';
  action?: () => void;
}
```

## Support

For questions or issues:

1. Check this guide first
2. Review `docs/SETTINGS_SEARCH.md` for technical details
3. Check code comments in implementation files
4. Open an issue on GitHub with steps to reproduce

---

**Last Updated**: 2026-01-06
