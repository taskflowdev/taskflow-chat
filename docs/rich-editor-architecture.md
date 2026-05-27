# Rich Text Editor - Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chat Conversation Component                  │
│  - Manages message sending, reply preview, typing indicators     │
│  - Integrates rich editor for message composition                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Uses (imports)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Rich Editor Component                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ControlValueAccessor (ngModel/FormControl support)       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Responsibilities:                                                │
│  • Contenteditable div management                                │
│  • Keyboard event handling (Enter, Shift+Enter, Ctrl+B/I/U)     │
│  • Paste event handling (plain text only)                        │
│  • Focus/blur management                                         │
│  • Toolbar visibility control                                    │
│  • Input/output sanitization                                     │
│                                                                   │
│  ┌────────────────┐        ┌──────────────────┐                 │
│  │  HTML Template │        │  SCSS Styles     │                 │
│  │  - Editor div  │        │  - Theme vars    │                 │
│  │  - Toolbar     │        │  - Responsive    │                 │
│  └────────────────┘        └──────────────────┘                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Depends on
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Rich Editor Formatting Service                      │
│                                                                   │
│  Core APIs Used:                                                 │
│  • window.getSelection()                                         │
│  • Selection.getRangeAt(0)                                       │
│  • Range.surroundContents()                                      │
│  • Range.extractContents()                                       │
│  • Range.insertNode()                                            │
│  • document.createElement()                                      │
│                                                                   │
│  Methods:                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Inline Formatting (applyInlineFormat)                    │   │
│  │  • bold → <strong>                                       │   │
│  │  • italic → <em>                                         │   │
│  │  • underline → <u>                                       │   │
│  │  • strikethrough → <s>                                   │   │
│  │  • code → <code>                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Block Formatting (applyBlockFormat)                      │   │
│  │  • ul → <ul><li>                                         │   │
│  │  • ol → <ol><li>                                         │   │
│  │  • blockquote → <blockquote><p>                          │   │
│  │  • pre → <pre><code>                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Format Detection (isFormatActive)                        │   │
│  │  • Traverses DOM tree from selection                     │   │
│  │  • Checks for formatting tags                            │   │
│  │  • Updates toolbar button states                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ HTML Sanitization (sanitizeHTML)                         │   │
│  │  • Remove empty tags                                     │   │
│  │  • Clean unnecessary spans                               │   │
│  │  • Strip inline styles                                   │   │
│  │  • Normalize whitespace                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Input
    │
    ▼
┌──────────────────────┐
│ Keyboard Event       │
│ • keydown            │
│ • paste              │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Rich Editor Component                │
│ • onKeyDown()                        │
│ • onPaste()                          │
│ • onInput()                          │
└──────┬───────────────────────────────┘
       │
       ├─── Formatting Request ────────────┐
       │                                    │
       ▼                                    ▼
┌──────────────────────┐         ┌─────────────────────────┐
│ Formatting Service   │         │ HTML Sanitization       │
│ • applyInlineFormat  │         │ • sanitizeHTML()        │
│ • applyBlockFormat   │         │ • DomSanitizer          │
└──────┬───────────────┘         └──────┬──────────────────┘
       │                                 │
       └──────── Updated DOM ────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │ ControlValueAccessor
           │ • onChange()
           └─────┬───────────┘
                 │
                 ▼
         ┌───────────────────┐
         │ Parent Component  │
         │ (ngModel update)  │
         └───────────────────┘
```

## Component Interaction

```
Chat Conversation Component
│
├─ Rich Editor Component
│  │
│  ├─ View Layer (HTML)
│  │  ├─ Formatting Toolbar
│  │  │  ├─ Bold Button → applyFormat('bold')
│  │  │  ├─ Italic Button → applyFormat('italic')
│  │  │  ├─ ... (other buttons)
│  │  │
│  │  └─ Content Editable Div
│  │     ├─ contenteditable="true"
│  │     ├─ role="textbox"
│  │     └─ aria-multiline="true"
│  │
│  ├─ Logic Layer (TypeScript)
│  │  ├─ ControlValueAccessor
│  │  │  ├─ writeValue()
│  │  │  ├─ registerOnChange()
│  │  │  └─ registerOnTouched()
│  │  │
│  │  ├─ Event Handlers
│  │  │  ├─ onKeyDown()
│  │  │  ├─ onPaste()
│  │  │  ├─ onInput()
│  │  │  ├─ onFocus()
│  │  │  └─ onBlur()
│  │  │
│  │  └─ Public API
│  │     ├─ getHTML()
│  │     ├─ getText()
│  │     ├─ clear()
│  │     └─ focus()
│  │
│  └─ Formatting Service
│     ├─ Selection & Range API
│     ├─ Format Application
│     ├─ Format Detection
│     └─ HTML Sanitization
```

## Security Layers

```
User Input → Paste Event → Plain Text Only
                               │
                               ▼
Typed Content → contenteditable div → DOM Operations
                               │
                               ▼
                    Selection & Range API
                    (No innerHTML manipulation)
                               │
                               ▼
                      Content Changed
                               │
                               ▼
                    HTML Sanitization
                    • Remove empty tags
                    • Strip inline styles
                    • Clean spans
                               │
                               ▼
                     DomSanitizer
                     (Angular security)
                               │
                               ▼
                      Clean HTML Output
                               │
                               ▼
                       Parent Component
```

## Styling Integration

```
Theme Variables (CSS Custom Properties)
│
├─ Input Styling
│  ├─ --taskflow-color-input-bg
│  ├─ --taskflow-color-input-border
│  └─ --taskflow-color-input-border-focus
│
├─ Text Colors
│  ├─ --taskflow-color-text-primary
│  ├─ --taskflow-color-text-secondary
│  └─ --taskflow-color-text-disabled
│
├─ Surface Colors
│  ├─ --taskflow-color-surface-hover
│  ├─ --taskflow-color-background-hover
│  └─ --taskflow-color-border
│
└─ Typography
   ├─ --taskflow-font-font-size-normal
   └─ --taskflow-font-line-height-base

Applied to:
├─ .editor-content (main editor)
├─ .formatting-toolbar (toolbar)
└─ Formatted content (<strong>, <em>, etc.)
```

## Keyboard Shortcuts Flow

```
User Presses Key
       │
       ▼
onKeyDown Event
       │
       ├─── Enter (no Shift) ────────► enterPressed.emit()
       │                                      │
       │                                      ▼
       │                              Parent sends message
       │
       ├─── Shift+Enter ─────────────► Insert line break
       │                                (default behavior)
       │
       ├─── Ctrl+B ──────────────────► applyFormat('bold')
       │                                      │
       ├─── Ctrl+I ──────────────────► applyFormat('italic')
       │                                      │
       └─── Ctrl+U ──────────────────► applyFormat('underline')
                                              │
                                              ▼
                                  Formatting Service
                                  • Get current selection
                                  • Apply/remove format
                                  • Preserve cursor position
                                              │
                                              ▼
                                       Update DOM
                                              │
                                              ▼
                                    Trigger onChange
```

## Performance Optimization

```
Component Level:
├─ OnPush Change Detection
│  └─ Only updates when:
│     ├─ @Input changes
│     ├─ Events fired
│     └─ Manual markForCheck()
│
├─ Event Handling
│  └─ Debounced typing indicator
│     └─ 500ms timeout
│
└─ DOM Manipulation
   └─ Direct node transfers
      └─ No innerHTML parsing

Service Level:
├─ Caching
│  └─ Selection/Range reused
│
├─ Minimal DOM Queries
│  └─ Store references
│
└─ Efficient Tree Traversal
   └─ Break early when found
```

## Testing Strategy

```
Unit Tests
│
├─ Component Tests (rich-editor.component.spec.ts)
│  ├─ Component creation
│  ├─ ControlValueAccessor interface
│  ├─ Event emission (enterPressed)
│  ├─ Content manipulation (clear, getText, getHTML)
│  └─ Security (XSS prevention)
│
└─ Service Tests (rich-editor-formatting.service.spec.ts)
   ├─ HTML sanitization
   ├─ Empty tag removal
   ├─ Span cleaning
   ├─ Style stripping
   ├─ Whitespace normalization
   └─ HTML to plain text conversion

Integration Tests
│
└─ Chat Conversation Component
   ├─ Message sending with rich content
   ├─ Reply preview with rich editor
   ├─ Typing indicators
   └─ Focus management
```

## Browser Compatibility

```
Modern Browsers (90%+ support)
│
├─ Chrome/Edge 90+
│  └─ Full Selection & Range API support
│
├─ Firefox 88+
│  └─ Full Selection & Range API support
│
├─ Safari 14+
│  └─ Full Selection & Range API support
│
└─ Mobile Browsers
   ├─ iOS Safari 14+
   └─ Chrome Android 90+

Not Supported:
└─ Internet Explorer (deprecated)
```

## Extension Points

For future enhancements:

```
1. Additional Formats
   └─ rich-editor-formatting.service.ts
      ├─ Add new format types
      └─ Implement toggle methods

2. Custom Toolbar
   └─ rich-editor.component.ts
      └─ Modify toolbarButtons array

3. Plugins/Extensions
   └─ Create service extensions
      ├─ ImagePlugin
      ├─ LinkPlugin
      └─ EmojiPlugin

4. Custom Validators
   └─ Angular validators
      ├─ MaxLength
      ├─ MinLength
      └─ ContentType
```
