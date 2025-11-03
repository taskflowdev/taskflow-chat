import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonTooltipDirective } from "../../../shared/components/common-tooltip";

/**
 * ScrollToBottomButtonComponent
 *
 * Floating button that appears when user scrolls up in chat.
 * Provides instant scroll-to-bottom functionality.
 *
 * Features:
 * - Smooth fade-in/fade-out animations
 * - Accessible with keyboard support
 * - OnPush change detection for performance
 * - Reusable across different contexts
 */
@Component({
  selector: 'app-scroll-to-bottom-button',
  standalone: true,
  imports: [CommonModule, CommonTooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeSlide', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(20px) scale(0.9)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)'
      })),
      transition('void => *', animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('* => void', animate('150ms cubic-bezier(0.4, 0.0, 1, 1)'))
    ])
  ],
  template: `
    <button
      class="scroll-to-bottom-btn"
      [@fadeSlide]
      (click)="onScrollClick()"
      (keydown.enter)="onScrollClick()"
      (keydown.space)="onScrollClick(); $event.preventDefault()"
      type="button"
      aria-label="Scroll to bottom"
      appCommonTooltip="Scroll to bottom">
      <i class="bi bi-arrow-down"></i>
    </button>
  `,
  styles: [`
    .scroll-to-bottom-btn {
      position: fixed;
      bottom: 100px;
      right: 2rem;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
      z-index: 1000;

      &:hover {
        background: #ffffff;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 3px 6px rgba(0, 0, 0, 0.25);
      }

      &:active {
        transform: translateY(0) scale(0.95);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      &:focus-visible {
        outline: 2px solid #22c55e;
        outline-offset: 2px;
      }

      i {
        font-size: 1.5rem;
        color: #000;
        font-weight: bold;
      }
    }

    @media (max-width: 768px) {
      .scroll-to-bottom-btn {
        bottom: 90px;
        right: 1rem;
        width: 40px;
        height: 40px;

        i {
          font-size: 1.1rem;
        }
      }
    }
  `]
})
export class ScrollToBottomButtonComponent {
  @Output() scrollClick = new EventEmitter<void>();

  onScrollClick(): void {
    this.scrollClick.emit();
  }
}
