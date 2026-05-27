# Rich Text Editor Component

A production-ready, custom-built rich text editor for Angular applications using modern Web APIs.

## Features

- **Modern Web APIs**: Uses Selection & Range API instead of deprecated `execCommand`
- **Reactive Forms**: Full `ControlValueAccessor` implementation for seamless form integration
- **Rich Formatting**: Supports inline (bold, italic, underline, strikethrough, code) and block (lists, quotes, code blocks) formatting
- **Keyboard Shortcuts**: Ctrl+B, Ctrl+I, Ctrl+U for quick formatting
- **Security**: Built-in HTML sanitization and XSS prevention
- **Accessibility**: Full ARIA support and keyboard navigation
- **Performance**: OnPush change detection strategy
- **Responsive**: Mobile-friendly design

## Usage

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RichEditorComponent } from './shared/components/rich-editor';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [FormsModule, RichEditorComponent],
  template: `
    <app-rich-editor
      [(ngModel)]="content"
      [placeholder]="'Type your message...'"
      [disabled]="false"
      (enterPressed)="onSend()"
    ></app-rich-editor>
  `
})
export class ExampleComponent {
  content = '';

  onSend() {
    console.log('Content:', this.content);
  }
}
```

### With Reactive Forms

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RichEditorComponent } from './shared/components/rich-editor';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [ReactiveFormsModule, RichEditorComponent],
  template: `
    <form [formGroup]="form">
      <app-rich-editor
        formControlName="message"
        [placeholder]="'Type your message...'"
        (enterPressed)="onSubmit()"
      ></app-rich-editor>
    </form>
  `
})
export class ExampleComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      message: ['']
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Message:', this.form.value.message);
    }
  }
}
```

## Component API

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `placeholder` | `string` | `'Type a message...'` | Placeholder text shown when editor is empty |
| `disabled` | `boolean` | `false` | Disables the editor |
| `maxHeight` | `number` | `150` | Maximum height in pixels before scrolling |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `enterPressed` | `EventEmitter<void>` | Emitted when Enter key is pressed (without Shift) |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getHTML()` | `string` | Returns sanitized HTML content |
| `getText()` | `string` | Returns plain text content (no HTML) |
| `clear()` | `void` | Clears all content |
| `focus()` | `void` | Focuses the editor |

## Keyboard Shortcuts

- **Ctrl+B** / **Cmd+B**: Toggle bold
- **Ctrl+I** / **Cmd+I**: Toggle italic
- **Ctrl+U** / **Cmd+U**: Toggle underline
- **Enter**: Emit `enterPressed` event (typically for sending message)
- **Shift+Enter**: Insert line break

## Formatting Toolbar

The editor includes a compact formatting toolbar that appears when the editor is focused:

- Bold (strong)
- Italic (em)
- Underline (u)
- Strikethrough (s)
- Inline Code (code)
- Bullet List (ul)
- Numbered List (ol)
- Blockquote
- Code Block (pre)

## HTML Output

The editor produces clean, semantic HTML:

```html
<!-- Inline formatting -->
<strong>bold text</strong>
<em>italic text</em>
<u>underlined text</u>
<s>strikethrough text</s>
<code>inline code</code>

<!-- Block formatting -->
<ul>
  <li>Bullet item</li>
</ul>

<ol>
  <li>Numbered item</li>
</ol>

<blockquote>
  <p>Quoted text</p>
</blockquote>

<pre><code>Code block</code></pre>
```

## Security

The editor includes multiple security layers:

1. **HTML Sanitization**: All input is sanitized using Angular's `DomSanitizer`
2. **Paste Protection**: Pasted content is converted to plain text
3. **XSS Prevention**: DOM manipulation avoids `innerHTML` where possible
4. **Output Cleaning**: All output is sanitized and normalized

## Styling

The editor inherits styling from CSS variables:

```scss
// Background and borders
--taskflow-color-input-bg
--taskflow-color-input-border
--taskflow-color-input-border-focus

// Text colors
--taskflow-color-text-primary
--taskflow-color-text-secondary
--taskflow-color-text-disabled

// Font sizes
--taskflow-font-font-size-normal
```

### Custom Styling

To customize the editor appearance:

```scss
app-rich-editor {
  ::ng-deep .editor-content {
    // Your custom styles
    border-radius: 12px;
    padding: 1rem;
  }
  
  ::ng-deep .formatting-toolbar {
    // Toolbar customization
    background: #333;
  }
}
```

## Accessibility

The editor is fully accessible:

- `role="textbox"` with `aria-multiline="true"`
- `aria-label` for screen readers
- Keyboard navigation for all features
- Focus management
- Visible focus indicators

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern browsers supporting Selection & Range APIs

## Performance

- **OnPush Change Detection**: Optimized for performance
- **Minimal Re-renders**: Only updates when necessary
- **Lightweight**: No external dependencies
- **Tree-shakeable**: Can be imported individually

## Migration from Textarea

Replace standard textareas with the rich editor:

```typescript
// Before
<textarea 
  [(ngModel)]="message" 
  (keydown.enter)="send()"
  placeholder="Type a message...">
</textarea>

// After
<app-rich-editor
  [(ngModel)]="message"
  (enterPressed)="send()"
  [placeholder]="'Type a message...'">
</app-rich-editor>
```

## Integration Example (Chat Application)

See `src/app/chat/components/chat-conversation/chat-conversation.component.ts` for a complete example of integrating the rich editor into a chat application with:

- Message sending on Enter
- Reply preview above editor
- Send button integration
- Typing indicators
- Focus management

## License

Part of the TaskFlow Chat application.
