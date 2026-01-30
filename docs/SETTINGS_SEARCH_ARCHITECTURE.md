# Settings Search - Visual Architecture Guide

## Component Hierarchy

```
SettingsLayoutComponent
├── SettingsSidebarComponent
└── SettingsContentArea
    ├── SettingsSearchComponent (always visible)
    │   ├── Search Input
    │   ├── Clear Button (conditional)
    │   └── Result Count (conditional)
    │
    └── [Conditional Rendering]
        │
        ├─── IF Search Active ───┐
        │    └── SettingsSearchResultsComponent
        │        ├── Result Item (clickable)
        │        │   ├── Title
        │        │   ├── Category Badge
        │        │   ├── Status Badges
        │        │   ├── Description
        │        │   └── Group
        │        └── No Results Message
        │
        └─── ELSE ───┐
             └── RouterOutlet
                 └── SettingsCategoryComponent
                     └── SettingsRendererComponent
                         [with data-setting-key attribute]
```

## Data Flow

```
User Input
    ↓
SettingsSearchComponent
    ↓ (keyup event)
searchQuery$ subject
    ↓ (debounce 200ms)
SettingsSearchService
    ↓
combineLatest([query$, index$])
    ↓
searchSettings() algorithm
    ↓
searchResults$ subject
    ↓
SettingsSearchResultsComponent
    ↓ (click or Enter)
Router.navigate()
    ↓
SettingsCategoryComponent loaded
    ↓ (after 300ms)
scrollToSetting()
    ↓
- Scroll animation
- Highlight animation
- Focus control
```

## Search Algorithm Flow

```
Query: "dark theme"
    ↓
Normalize: "dark theme"
Split terms: ["dark", "theme"]
    ↓
For each setting in index:
    ↓
Calculate Score:
├── Label match?
│   ├── Exact: +100
│   ├── Prefix: +80
│   └── Contains: +60
├── Tags match?
│   ├── Exact: +70
│   └── Contains: +50
├── Summary match?
│   ├── Exact: +40
│   └── Contains: +30
├── Description match? +20
├── Category match?
│   ├── Exact: +15
│   └── Contains: +10
└── All terms present? +5
    ↓
Sort by score (descending)
    ↓
Return top 20 results
```

## State Management

```
SettingsSearchService (Singleton)
│
├── searchQuerySubject: BehaviorSubject<string>
│   └── Current search query
│
├── searchIndexSubject: BehaviorSubject<SettingsSearchIndexItem[]>
│   └── Memoized search index
│
├── searchResultsSubject: BehaviorSubject<SettingsSearchResult[]>
│   └── Current search results (debounced)
│
└── Observables (public)
    ├── searchQuery$
    ├── searchResults$
    ├── isSearchActive$
    └── searchIndex$
```

## Index Building Process

```
CatalogResponse
    ↓
For each category:
    ↓
For each setting:
    ↓
Extract data:
├── Basic fields (key, label, description)
├── Extract aliases from options[].meta.aliases
└── Build searchableText (lowercase, combined)
    ↓
Create SettingsSearchIndexItem
    ↓
Add to index array
    ↓
Return flattened index
```

## Keyboard Event Handling

```
Global Window Events
│
├── "/" key pressed
│   └── Focus search input
│
├── "Escape" key pressed
│   └── Clear search
│
└── Arrow/Enter keys
    │
    ├── Check if in search context
    │   (input or results focused)
    │
    └── IF in context:
        ├── "ArrowUp" → selectPrevious()
        ├── "ArrowDown" → selectNext()
        └── "Enter" → navigateToSetting()
```

## Scroll-to-Setting Flow

```
Click Result or Press Enter
    ↓
Get setting key (e.g., "appearance.theme")
    ↓
Router.navigate(['/settings', 'appearance'])
    ↓
Wait 300ms for DOM update
    ↓
Find element: [data-setting-key="appearance.theme"]
    ↓
Parallel execution:
├── scrollIntoView({ behavior: 'smooth', block: 'center' })
├── Add class: 'setting-highlight-animation'
│   └── Remove after 2000ms
└── Focus first focusable element
```

## Theme Token Usage

```
Component Styles
    ↓
CSS Variables
    ↓
var(--searchInputBg)
var(--searchResultsItemHoverBg)
var(--settingHighlightBorder)
    ↓
Theme Service
    ↓
Load theme.light.json or theme.dark.json
    ↓
Apply CSS variables to :root
```

## Performance Optimizations

```
Catalog Changes
    ↓
Check if JSON changed (memoization)
    ↓
IF changed:
    └── Rebuild index
ELSE:
    └── Use cached index

User Types
    ↓
Debounce 200ms
    ↓
IF query empty:
    └── Return empty results
ELSE:
    └── Search memoized index
    └── Return top 20 results

Component Rendering
    ↓
OnPush Change Detection
    ↓
Only re-render when observables emit
```

## Accessibility Tree

```
Search Container
├── Search Input
│   ├── aria-label="Search settings"
│   └── aria-describedby="search-result-count"
│
├── Result Count
│   ├── id="search-result-count"
│   ├── aria-live="polite"
│   └── aria-atomic="true"
│
└── Results List
    └── Result Item
        ├── role="button"
        ├── tabindex="0"
        └── aria-label="[label] in [category]"
```

## Search Weight Distribution

```
Total Score Example:

Setting: "Dark Theme"
Query: "dark"

Scoring:
Label exact match:        100
Tag "dark-mode" contains:  50
Summary contains:          30
Category contains:         10
All terms match:            5
─────────────────────────
Total Score:              195

This would rank higher than:
- Description-only match: 20
- Category-only match: 10
```

## File Organization

```
src/app/settings/
│
├── components/
│   ├── settings-layout/
│   │   └── [integrates search]
│   │
│   ├── settings-renderer/
│   │   └── [has data-setting-key]
│   │
│   ├── settings-search/
│   │   ├── .component.ts
│   │   ├── .component.html
│   │   └── .component.scss
│   │
│   └── settings-search-results/
│       ├── .component.ts
│       ├── .component.html
│       └── .component.scss
│
├── services/
│   └── settings-search.service.ts
│
└── utils/
    ├── settings-search-index.ts
    └── scroll-to-setting.ts
```

## Future Extension Points

```
Current Architecture
    ↓
Can be extended for:
│
├── Command Palette (Ctrl+K)
│   └── Reuse SettingsSearchService
│   └── Add CommandPaletteComponent
│   └── Extend with actions/navigation
│
├── Fuzzy Search
│   └── Replace searchSettings() implementation
│   └── Use Fuse.js
│   └── Keep same interface
│
├── Search Filters
│   └── Add filter parameters
│   └── Filter before scoring
│   └── UI: filter chips/dropdown
│
└── Search Analytics
    └── Track queries
    └── Log result clicks
    └── Improve scoring based on data
```

---

This visual guide provides a high-level overview of the architecture and data flow. For detailed implementation, refer to:
- **Code**: `src/app/settings/`
- **Docs**: `docs/SETTINGS_SEARCH.md`
- **Guide**: `docs/SETTINGS_SEARCH_GUIDE.md`
