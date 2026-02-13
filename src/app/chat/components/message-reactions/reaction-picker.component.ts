import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiEvent } from './reaction.models';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * Reaction Picker Component
 * 
 * Wraps ngx-emoji-mart with:
 * - Theme integration (light/dark mode)
 * - Proper positioning
 * - Outside click detection
 * - Keyboard navigation (ESC to close)
 * - Accessibility features
 */
@Component({
  selector: 'app-reaction-picker',
  imports: [CommonModule, PickerComponent],
  template: `
    <div class="reaction-picker-overlay" (click)="onOverlayClick()">
      <div class="reaction-picker-container" 
           [style.top]="position.top"
           [style.bottom]="position.bottom"
           [style.left]="position.left"
           [style.right]="position.right"
           (click)="$event.stopPropagation()"
           role="dialog"
           aria-label="Select emoji reaction"
           [attr.aria-modal]="true">
        <emoji-mart
          [set]="'apple'"
          [isNative]="true"
          [darkMode]="isDarkMode"
          [showPreview]="false"
          [perLine]="perLine"
          [emojiSize]="emojiSize"
          [i18n]="i18nConfig"
          [recent]="recentEmojis"
          (emojiClick)="onEmojiSelect($event)"
          [title]="'Pick your emoji reaction'">
        </emoji-mart>
      </div>
    </div>
  `,
  styleUrls: ['./reaction-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReactionPickerComponent implements OnInit, OnDestroy {
  @Input() position: { top?: string; bottom?: string; left?: string; right?: string } = {};
  @Input() recentEmojis: string[] = [];
  @Output() emojiSelected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  isDarkMode = false;
  perLine = 8;
  emojiSize = 24;

  i18nConfig = {
    search: 'Search emojis',
    categories: {
      search: 'Search Results',
      recent: 'Recently Used',
      people: 'Smileys & People',
      nature: 'Animals & Nature',
      foods: 'Food & Drink',
      activity: 'Activities',
      places: 'Travel & Places',
      objects: 'Objects',
      symbols: 'Symbols',
      flags: 'Flags'
    }
  };

  private themeSubscription: any;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.isDarkMode = theme === 'dark';
    });

    // Adjust picker size for mobile
    if (window.innerWidth <= 480) {
      this.perLine = 6;
      this.emojiSize = 20;
    } else if (window.innerWidth <= 768) {
      this.perLine = 7;
      this.emojiSize = 22;
    }

    // Focus trap: focus the picker container
    setTimeout(() => {
      const container = document.querySelector('.reaction-picker-container') as HTMLElement;
      if (container) {
        container.focus();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  /**
   * Handle emoji selection
   */
  onEmojiSelect(event: EmojiEvent): void {
    if (event && event.emoji && event.emoji.native) {
      this.emojiSelected.emit(event.emoji.native);
    }
  }

  /**
   * Handle overlay click (close picker)
   */
  onOverlayClick(): void {
    this.closed.emit();
  }

  /**
   * Handle ESC key to close picker
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closed.emit();
  }

  /**
   * Handle window resize
   */
  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth <= 480) {
      this.perLine = 6;
      this.emojiSize = 20;
    } else if (window.innerWidth <= 768) {
      this.perLine = 7;
      this.emojiSize = 22;
    } else {
      this.perLine = 8;
      this.emojiSize = 24;
    }
  }
}
