import {
  Component,
  ElementRef,
  ViewChild,
  forwardRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
  SecurityContext
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  RichEditorFormattingService,
  InlineFormat,
  BlockFormat
} from './rich-editor-formatting.service';

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichEditorComponent),
      multi: true
    },
    RichEditorFormattingService
  ],
  templateUrl: './rich-editor.component.html',
  styleUrls: ['./rich-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RichEditorComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @ViewChild('editorContent') editorContent!: ElementRef<HTMLDivElement>;
  
  @Input() placeholder: string = 'Type a message...';
  @Input() disabled: boolean = false;
  @Input() maxHeight: number = 150;
  
  @Output() enterPressed = new EventEmitter<void>();

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  showToolbar = false;
  toolbarButtons = [
    { format: 'bold', icon: 'bi-type-bold', title: 'Bold (Ctrl+B)' },
    { format: 'italic', icon: 'bi-type-italic', title: 'Italic (Ctrl+I)' },
    { format: 'underline', icon: 'bi-type-underline', title: 'Underline (Ctrl+U)' },
    { format: 'strikethrough', icon: 'bi-type-strikethrough', title: 'Strikethrough' },
    { format: 'code', icon: 'bi-code', title: 'Inline Code' },
    { format: 'ul', icon: 'bi-list-ul', title: 'Bullet List', divider: true },
    { format: 'ol', icon: 'bi-list-ol', title: 'Numbered List' },
    { format: 'blockquote', icon: 'bi-quote', title: 'Quote' },
    { format: 'pre', icon: 'bi-code-square', title: 'Code Block' }
  ];

  constructor(
    private formattingService: RichEditorFormattingService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngAfterViewInit(): void {
    // Set initial max height
    if (this.editorContent) {
      this.editorContent.nativeElement.style.maxHeight = `${this.maxHeight}px`;
    }
  }

  ngOnDestroy(): void {
    // No cleanup required - component is stateless
  }

  /**
   * ControlValueAccessor implementation
   */
  writeValue(value: string): void {
    if (this.editorContent) {
      // Sanitize HTML before setting to prevent XSS
      const sanitized = value ? this.formattingService.sanitizeHTML(value) : '';
      const safeSanitized = this.sanitizer.sanitize(SecurityContext.HTML, sanitized) || '';
      this.editorContent.nativeElement.innerHTML = safeSanitized;
      this.updatePlaceholderVisibility();
      this.cdr.markForCheck();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.editorContent) {
      this.editorContent.nativeElement.contentEditable = (!isDisabled).toString();
    }
    this.cdr.markForCheck();
  }

  /**
   * Handle input events from contenteditable
   */
  onInput(): void {
    const html = this.editorContent.nativeElement.innerHTML;
    const sanitized = this.formattingService.sanitizeHTML(html);
    this.onChange(sanitized);
    this.updatePlaceholderVisibility();
  }

  /**
   * Handle keydown events for shortcuts and special keys
   */
  onKeyDown(event: KeyboardEvent): void {
    // Enter key handling
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enterPressed.emit();
      return;
    }

    // Shift+Enter for new line (default behavior, do nothing)
    if (event.key === 'Enter' && event.shiftKey) {
      return;
    }

    // Formatting shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          this.applyFormat('bold');
          break;
        case 'i':
          event.preventDefault();
          this.applyFormat('italic');
          break;
        case 'u':
          event.preventDefault();
          this.applyFormat('underline');
          break;
      }
    }
  }

  /**
   * Handle paste events to strip formatting
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    
    const text = event.clipboardData?.getData('text/plain');
    if (!text) return;

    // Insert plain text at cursor position
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    // Move cursor to end of inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);

    // Trigger input event
    this.onInput();
  }

  /**
   * Handle focus event
   */
  onFocus(): void {
    this.showToolbar = true;
    this.onTouched();
    this.cdr.markForCheck();
  }

  /**
   * Handle blur event
   */
  onBlur(): void {
    // Delay hiding toolbar to allow button clicks
    setTimeout(() => {
      this.showToolbar = false;
      this.cdr.markForCheck();
    }, 200);
  }

  /**
   * Apply formatting to selected text
   */
  applyFormat(format: string): void {
    const inlineFormats: InlineFormat[] = ['bold', 'italic', 'underline', 'strikethrough', 'code'];
    const blockFormats: BlockFormat[] = ['ul', 'ol', 'blockquote', 'pre'];

    if (inlineFormats.includes(format as InlineFormat)) {
      this.formattingService.applyInlineFormat(format as InlineFormat);
    } else if (blockFormats.includes(format as BlockFormat)) {
      this.formattingService.applyBlockFormat(format as BlockFormat);
    }

    // Update content and trigger change
    this.onInput();
    
    // Return focus to editor
    this.editorContent.nativeElement.focus();
    this.cdr.markForCheck();
  }

  /**
   * Check if a format is currently active
   */
  isFormatActive(format: string): boolean {
    const inlineFormats: InlineFormat[] = ['bold', 'italic', 'underline', 'strikethrough', 'code'];
    const blockFormats: BlockFormat[] = ['ul', 'ol', 'blockquote', 'pre'];

    if (inlineFormats.includes(format as InlineFormat)) {
      return this.formattingService.isFormatActive(format as InlineFormat);
    } else if (blockFormats.includes(format as BlockFormat)) {
      return this.formattingService.isBlockFormatActive(format as BlockFormat);
    }

    return false;
  }

  /**
   * Update placeholder visibility based on content
   */
  private updatePlaceholderVisibility(): void {
    if (!this.editorContent) return;
    
    const isEmpty = !this.editorContent.nativeElement.textContent?.trim();
    
    if (isEmpty) {
      this.editorContent.nativeElement.classList.add('empty');
    } else {
      this.editorContent.nativeElement.classList.remove('empty');
    }
  }

  /**
   * Get current HTML content
   */
  getHTML(): string {
    if (!this.editorContent) return '';
    return this.formattingService.sanitizeHTML(this.editorContent.nativeElement.innerHTML);
  }

  /**
   * Get plain text content
   */
  getText(): string {
    if (!this.editorContent) return '';
    return this.editorContent.nativeElement.textContent || '';
  }

  /**
   * Clear editor content
   */
  clear(): void {
    if (this.editorContent) {
      this.editorContent.nativeElement.innerHTML = '';
      this.updatePlaceholderVisibility();
      this.onChange('');
    }
  }

  /**
   * Focus the editor
   */
  focus(): void {
    if (this.editorContent) {
      this.editorContent.nativeElement.focus();
    }
  }
}
