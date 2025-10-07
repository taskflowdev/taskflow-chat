# Keyboard Shortcut System Documentation

## Overview

The TaskFlow Chat application implements an enterprise-level keyboard shortcut management system designed for scalability, maintainability, and extensibility. The architecture follows SOLID principles and uses Angular best practices.

## Architecture

The system is built using three core services that work together:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Keyboard Input                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│             KeyboardShortcutService                          │
│  - Captures global keydown events                           │
│  - Matches events to registered shortcuts                   │
│  - Emits action events                                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│             ShortcutRegistryService                          │
│  - Stores shortcut metadata                                 │
│  - Provides query methods                                   │
│  - Handles conflict detection                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│             ShortcutHandlerService                           │
│  - Routes actions to handlers                               │
│  - Manages context-aware execution                          │
│  - Provides observable streams                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Feature Components                              │
│  - MainChatComponent                                         │
│  - DialogComponents                                          │
│  - Other feature modules                                     │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Models (`keyboard-shortcut.model.ts`)

#### Enums

- **ShortcutActionTypes**: Defines all possible shortcut actions
- **ShortcutContext**: Defines contexts where shortcuts can be active
- **ShortcutCategory**: Groups shortcuts for UI display

#### Interfaces

- **ShortcutKeyBinding**: Defines key combination (key + modifiers)
- **ShortcutMetadata**: Complete shortcut information
- **ShortcutExecutionResult**: Execution logging information
- **ShortcutConflict**: Conflict detection result

#### Helper Functions

- `isValidShortcutAction()`: Type guard for action validation
- `getKeyBindingDisplay()`: Format binding for display (e.g., "Ctrl + K")
- `areKeyBindingsEqual()`: Compare two bindings
- `doesEventMatchBinding()`: Match keyboard event to binding

### 2. ShortcutRegistryService

**Responsibility**: Central registry for all keyboard shortcuts

**Key Features**:
- Stores shortcuts with O(1) lookup by action
- Query shortcuts by action, category, or context
- Detect conflicting key bindings
- Enable/disable individual shortcuts
- Support for priority-based conflict resolution

**Usage Example**:
```typescript
constructor(private registry: ShortcutRegistryService) {}

// Get a specific shortcut
const shortcut = this.registry.getShortcutByAction(ShortcutActionTypes.OPEN_SEARCH);

// Get all shortcuts for a category
const navShortcuts = this.registry.getShortcutsByCategory(ShortcutCategory.NAVIGATION);

// Detect conflicts
const conflicts = this.registry.detectConflicts();

// Register custom shortcut
this.registry.registerShortcut({
  action: ShortcutActionTypes.CUSTOM_ACTION,
  binding: { key: 'x', ctrl: true },
  description: 'My custom action',
  category: ShortcutCategory.ACTIONS,
  context: ShortcutContext.GLOBAL,
  enabled: true,
  priority: 100
});
```

### 3. ShortcutHandlerService

**Responsibility**: Route and execute shortcut actions

**Key Features**:
- Routes actions to appropriate handlers
- Manages context-aware execution
- Integrates with Angular Router
- Provides RxJS observables for components
- Structured logging for debugging

**Usage Example**:
```typescript
constructor(private handler: ShortcutHandlerService) {}

ngOnInit() {
  // Subscribe to action requests
  this.handler.actionRequested$.subscribe(action => {
    this.handleShortcutAction(action);
  });

  // Set context for this component
  this.handler.setContext(ShortcutContext.CHAT_VIEW);
}

// Execute an action programmatically
executeAction() {
  this.handler.executeAction(ShortcutActionTypes.OPEN_SEARCH);
}
```

### 4. KeyboardShortcutService (Refactored)

**Responsibility**: Capture keyboard events and emit actions

**Key Features**:
- Global keydown event listener
- Input field detection (avoids conflicts)
- Integration with registry and handler services
- Backward compatibility with legacy code

**Usage Example**:
```typescript
constructor(private keyboard: KeyboardShortcutService) {}

ngOnInit() {
  // Set context
  this.keyboard.setContext(ShortcutContext.CHAT_VIEW);
}

// For backward compatibility
this.keyboard.shortcutTriggered$.subscribe(action => {
  console.log('Shortcut:', action);
});
```

## Default Shortcuts

| Shortcut | Action | Category | Context | Description |
|----------|--------|----------|---------|-------------|
| `?` + Shift | SHOW_SHORTCUTS | General | Global | Show keyboard shortcuts help |
| `Esc` | CLOSE_DIALOG | General | Dialog Open | Close any open dialog |
| `Ctrl + K` | OPEN_SEARCH | Navigation | Global | Search groups |
| `Ctrl + N` | CREATE_GROUP | Navigation | Global | Create new group |
| `Ctrl + I` | GROUP_INFO | Navigation | Chat View | Show group info |
| `/` | FOCUS_SEARCH | Navigation | Global | Focus search input |
| `Alt + ↑` | PREV_CHAT | Chat Navigation | Chat View | Navigate to previous chat |
| `Alt + ↓` | NEXT_CHAT | Chat Navigation | Chat View | Navigate to next chat |
| `Ctrl + B` | BACK_TO_LIST | Chat Navigation | Chat View | Back to chat list |
| `Ctrl + M` | NEW_MESSAGE | Actions | Chat View | Start new message |
| `Ctrl + Enter` | SEND_MESSAGE | Actions | Message Input | Send message |
| `Ctrl + S` | SAVE_CHANGES | Actions | Global | Save changes |

## Context-Aware Shortcuts

The system supports context-aware shortcuts that are only active in specific UI states:

- **GLOBAL**: Active everywhere in the application
- **CHAT_VIEW**: Active when viewing chats
- **DIALOG_OPEN**: Active when a dialog is open
- **MESSAGE_INPUT**: Active when message input is focused
- **SIDEBAR**: Active in sidebar
- **CONVERSATION**: Active in conversation view

## Adding New Shortcuts

### Step 1: Add Action to Enum
```typescript
// In keyboard-shortcut.model.ts
export enum ShortcutActionTypes {
  // ... existing actions
  MY_NEW_ACTION = 'MY_NEW_ACTION'
}
```

### Step 2: Register in ShortcutRegistryService
```typescript
// In shortcut-registry.service.ts initializeDefaultShortcuts()
{
  action: ShortcutActionTypes.MY_NEW_ACTION,
  binding: { key: 'x', ctrl: true },
  description: 'My new action',
  category: ShortcutCategory.ACTIONS,
  context: ShortcutContext.GLOBAL,
  enabled: true,
  priority: 100
}
```

### Step 3: Handle in Component or Service
```typescript
// In your component
private handleShortcutAction(action: ShortcutActionTypes): void {
  switch (action) {
    case ShortcutActionTypes.MY_NEW_ACTION:
      this.doMyAction();
      break;
  }
}
```

## Testing

The system includes comprehensive unit tests:

- **keyboard-shortcut.model.spec.ts**: Tests for helper functions (20 tests)
- **shortcut-registry.service.spec.ts**: Tests for registry operations (19 tests)
- **shortcut-handler.service.spec.ts**: Tests for action handling (14 tests)

Run tests:
```bash
npm test -- --include='**/shortcut*.spec.ts' --watch=false
```

## Conflict Detection

The system automatically detects conflicting shortcuts:

```typescript
const conflicts = this.registry.detectConflicts();
conflicts.forEach(conflict => {
  console.log('Conflict detected:', conflict.binding);
  console.log('Conflicting shortcuts:', conflict.conflictingShortcuts);
});
```

Conflicts are resolved by:
1. **Context**: Shortcuts with different contexts don't conflict
2. **Priority**: Higher priority shortcuts take precedence
3. **Enabled state**: Disabled shortcuts are ignored

## Debugging

Enable logging in ShortcutHandlerService:
```typescript
constructor(private handler: ShortcutHandlerService) {
  this.handler.setLoggingEnabled(true);
}
```

Console output includes:
- Action execution attempts
- Success/failure status
- Context changes
- Timestamps

## Best Practices

1. **Always set context** in components that handle shortcuts
2. **Clean up subscriptions** in `ngOnDestroy()`
3. **Use enums** instead of string literals for actions
4. **Register shortcuts centrally** in ShortcutRegistryService
5. **Test shortcuts** with unit tests
6. **Document shortcuts** in UI (use SHOW_SHORTCUTS action)
7. **Avoid conflicting bindings** - check with `detectConflicts()`

## Future Extensions

The architecture supports:
- User-customizable shortcuts (save preferences)
- Keyboard shortcut overlay component
- Multi-language key names
- Platform-specific shortcuts (Mac vs Windows)
- Shortcut recording UI
- Import/export shortcut configurations

## Migration Guide

For existing code using the old shortcut system:

### Before:
```typescript
@HostListener('document:keydown', ['$event'])
handleKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey && event.key === 'k') {
    this.openSearch();
  }
}
```

### After:
```typescript
constructor(private handler: ShortcutHandlerService) {}

ngOnInit() {
  this.handler.actionRequested$.subscribe(action => {
    if (action === ShortcutActionTypes.OPEN_SEARCH) {
      this.openSearch();
    }
  });
}

ngOnDestroy() {
  // Subscriptions are automatically cleaned up
}
```

## Performance Considerations

- Registry uses Map for O(1) lookup
- Event listeners are registered once globally
- Context filtering happens before action execution
- Disabled shortcuts are excluded early in the pipeline

## Security Notes

- Input field detection prevents shortcuts from interfering with form input
- Special shortcuts (Ctrl+K, Esc) work even in input fields
- No execution of untrusted action strings (enum-based)

## Support

For issues or questions about the keyboard shortcut system:
1. Check this documentation
2. Review the unit tests for examples
3. Enable logging for debugging
4. Check for conflicts with `detectConflicts()`
