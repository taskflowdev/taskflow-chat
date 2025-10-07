# Keyboard Shortcut System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INPUT                                   │
│                    (Keyboard Events)                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  KeyboardShortcutService                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • Global keydown event listener                              │  │
│  │ • Input field detection                                      │  │
│  │ • Event-to-action mapping                                    │  │
│  │ • Context-aware filtering                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  ShortcutRegistryService                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • Shortcut metadata storage (Map)                            │  │
│  │ • Query by action/category/context                           │  │
│  │ • Conflict detection                                         │  │
│  │ • Priority-based resolution                                  │  │
│  │ • Enable/disable shortcuts                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  ShortcutHandlerService                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • Action routing                                             │  │
│  │ • Angular Router integration                                 │  │
│  │ • RxJS Observable streams                                    │  │
│  │ • Execution logging                                          │  │
│  │ • Error handling                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   Router    │  │  Dialogs    │  │ Components  │
    │  Navigation │  │  Management │  │   Actions   │
    └─────────────┘  └─────────────┘  └─────────────┘
```

## Data Flow

### Event Capture Flow

```
Keyboard Event
    │
    ├─ Check if typing in input? ──→ Yes ──→ Allow (unless Ctrl+K/Esc)
    │                                │
    └─ No                            └─ Block normal shortcuts
       │
       ▼
   Create KeyBinding
       │
       ▼
   Registry Lookup (by binding + context)
       │
       ├─ Match found? ──→ Yes ──→ Emit action
       │                     │
       └─ No ──→ Ignore      └─ Execute via handler
```

### Action Routing Flow

```
Action Event
    │
    ├─ Is handled by service? ──→ Yes ──→ Route to Angular Router/Dialog
    │                               │
    └─ No                           └─ Navigate/Open/Close
       │
       ▼
   Broadcast to components
       │
       ▼
   Component handles action
   (PREV_CHAT, NEXT_CHAT, etc.)
```

## Service Responsibilities

### KeyboardShortcutService
**Focus**: Event Capture Layer
```
┌────────────────────────────────────────┐
│  INPUT: Keyboard Events                │
│  OUTPUT: ShortcutActionTypes           │
│                                        │
│  • Listens to document.keydown         │
│  • Detects input field context         │
│  • Matches events to shortcuts          │
│  • Emits actions via Subject            │
└────────────────────────────────────────┘
```

### ShortcutRegistryService
**Focus**: Data Management Layer
```
┌────────────────────────────────────────┐
│  INPUT: ShortcutMetadata               │
│  OUTPUT: Shortcut lookups, conflicts   │
│                                        │
│  • Stores all shortcut definitions      │
│  • Provides query interfaces            │
│  • Detects binding conflicts            │
│  • Manages enabled/disabled state       │
└────────────────────────────────────────┘
```

### ShortcutHandlerService
**Focus**: Action Execution Layer
```
┌────────────────────────────────────────┐
│  INPUT: ShortcutActionTypes            │
│  OUTPUT: Navigation, Events, Logs      │
│                                        │
│  • Routes actions to handlers           │
│  • Manages execution context            │
│  • Provides Observable streams          │
│  • Logs execution results               │
└────────────────────────────────────────┘
```

## Context System

```
ShortcutContext Hierarchy:

GLOBAL ────────────────────────────┐
    │                              │
    ├─ CHAT_VIEW ──────────────┐   │
    │      │                    │   │
    │      ├─ CONVERSATION      │   │
    │      └─ SIDEBAR           │   │
    │                            │   │
    ├─ DIALOG_OPEN              │   │
    │                            │   │
    └─ MESSAGE_INPUT             │   │
                                 │   │
         All contexts can        │   │
         use GLOBAL shortcuts ───┘   │
                                     │
         Context-specific        ────┘
         shortcuts only work
         in their context
```

## Conflict Resolution

```
Two shortcuts with same key binding:

┌─────────────────────────────────────────┐
│  Conflict Detection                     │
│                                         │
│  Shortcut A: Ctrl+K (GLOBAL)           │
│  Shortcut B: Ctrl+K (CHAT_VIEW)        │
│                                         │
│  Resolution:                            │
│  ├─ Different contexts? ──→ No conflict │
│  │                                      │
│  └─ Same context?                       │
│      └─ Higher priority wins            │
└─────────────────────────────────────────┘
```

## Observable Streams

```
┌─────────────────────────────────────────────────────────────┐
│  ShortcutHandlerService Observables                         │
│                                                             │
│  actionRequested$                                           │
│  ├─ Emits: ShortcutActionTypes                            │
│  ├─ Used by: Components that handle shortcuts              │
│  └─ Example: MainChatComponent subscribes to handle        │
│              PREV_CHAT, NEXT_CHAT                          │
│                                                             │
│  executionResult$                                           │
│  ├─ Emits: ShortcutExecutionResult                        │
│  ├─ Used by: Logging, monitoring, debugging               │
│  └─ Contains: action, timestamp, success, error           │
└─────────────────────────────────────────────────────────────┘
```

## Component Integration Pattern

```typescript
// Standard integration pattern for components

@Component({...})
export class MyComponent implements OnInit, OnDestroy {
  private subscription?: Subscription;

  constructor(private handler: ShortcutHandlerService) {}

  ngOnInit() {
    // 1. Set context
    this.handler.setContext(ShortcutContext.MY_CONTEXT);

    // 2. Subscribe to actions
    this.subscription = this.handler.actionRequested$.subscribe(
      action => this.handleAction(action)
    );
  }

  ngOnDestroy() {
    // 3. Cleanup
    this.subscription?.unsubscribe();
  }

  private handleAction(action: ShortcutActionTypes) {
    // Handle component-specific actions
    switch (action) {
      case ShortcutActionTypes.MY_ACTION:
        this.doSomething();
        break;
    }
  }
}
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Test Coverage (53 tests)                                   │
│                                                             │
│  keyboard-shortcut.model.spec.ts (20 tests)                │
│  ├─ Helper function tests                                  │
│  ├─ Type guard tests                                       │
│  ├─ Key binding comparison                                 │
│  └─ Event matching                                         │
│                                                             │
│  shortcut-registry.service.spec.ts (19 tests)              │
│  ├─ Registry operations                                    │
│  ├─ Query methods                                          │
│  ├─ Conflict detection                                     │
│  ├─ Enable/disable                                         │
│  └─ Priority resolution                                    │
│                                                             │
│  shortcut-handler.service.spec.ts (14 tests)               │
│  ├─ Action routing                                         │
│  ├─ Observable streams                                     │
│  ├─ Context management                                     │
│  ├─ Error handling                                         │
│  └─ Integration tests                                      │
└─────────────────────────────────────────────────────────────┘
```

## Extension Points

### Adding a New Shortcut

```
1. Define Action
   └─ Add to ShortcutActionTypes enum

2. Register Shortcut
   └─ Add metadata to ShortcutRegistryService

3. Handle Action
   ├─ Service-handled: Add to ShortcutHandlerService
   └─ Component-handled: Subscribe in component

4. Test
   └─ Add unit tests for the new shortcut
```

### Adding a New Context

```
1. Define Context
   └─ Add to ShortcutContext enum

2. Set Context in Component
   └─ Call handler.setContext(NEW_CONTEXT)

3. Register Context-Specific Shortcuts
   └─ Set context property in ShortcutMetadata

4. Test Context Switching
   └─ Verify shortcuts activate/deactivate
```

## Performance Characteristics

```
┌─────────────────────────────────────────────────────────────┐
│  Operation              │ Time Complexity │ Space Complexity │
│─────────────────────────┼─────────────────┼──────────────────│
│  Lookup by action       │ O(1)            │ O(n)             │
│  Lookup by binding      │ O(n)            │ O(n)             │
│  Detect conflicts       │ O(n log n)      │ O(n)             │
│  Event matching         │ O(1)            │ O(1)             │
│  Action execution       │ O(1)            │ O(1)             │
└─────────────────────────────────────────────────────────────┘

n = number of registered shortcuts (default: 12)
```

## Production Considerations

### Memory Usage
- Registry: ~1KB per shortcut
- Event listeners: 1 global listener
- Subscriptions: Per-component cleanup required

### Browser Compatibility
- Keyboard events: All modern browsers
- RxJS: Angular dependency
- Platform detection: SSR-safe with isPlatformBrowser

### Security
- No eval() or dynamic code execution
- Enum-based actions (no string injection)
- Input field detection prevents conflicts
