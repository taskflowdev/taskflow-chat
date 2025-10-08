import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-common-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="getButtonClasses()"
      (click)="handleClick($event)"
    >
      <span *ngIf="loading" class="spinner"></span>
      <span [class.loading-text]="loading">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    button {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      position: relative;
      box-sizing: border-box;
      line-height: 1.5;
    }

    /* Sizes */
    .btn-small {
      font-size: 0.75rem;
      padding: 0.5rem 0.75rem;
    }

    .btn-medium {
      font-size: 0.875rem;
      padding: 0.75rem 1rem;
    }

    .btn-large {
      font-size: 1rem;
      padding: 0.875rem 1.25rem;
    }

    .btn-full-width {
      width: 100%;
    }

    /* Primary variant - white background */
    .btn-primary {
      background: white;
      color: black;
      border-color: transparent;
    }

    .btn-primary:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .btn-primary:disabled {
      background: #1a1a1a;
      color: #999999;
      cursor: not-allowed;
    }

    /* Secondary variant - transparent with border */
    .btn-secondary {
      background: transparent;
      border: 1px solid #444444;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #333333;
      border-color: #555555;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Danger variant */
    .btn-danger {
      background: #dc2626;
      border: none;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn-danger:disabled {
      background: #991b1b;
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Success variant */
    .btn-success {
      background: #16a34a;
      border: none;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #15803d;
    }

    .btn-success:disabled {
      background: #166534;
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Warning variant */
    .btn-warning {
      background: #f59e0b;
      border: none;
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: #d97706;
    }

    .btn-warning:disabled {
      background: #b45309;
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* All button variants have consistent border */
    .btn-primary,
    .btn-secondary,
    .btn-danger,
    .btn-success,
    .btn-warning {
      border-width: 1px;
      border-style: solid;
    }

    .btn-danger,
    .btn-success,
    .btn-warning {
      border-color: transparent;
    }

    /* Loading state */
    // .spinner {
    //   width: 14px;
    //   height: 14px;
    //   border: 2px solid rgba(255, 255, 255, 0.3);
    //   border-top-color: currentColor;
    //   border-radius: 50%;
    //   animation: spin 0.6s linear infinite;
    // }

    // .btn-primary .spinner {
    //   border-color: rgba(0, 0, 0, 0.3);
    //   border-top-color: black;
    // }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-text {
      opacity: 0.7;
    }

    @media (max-width: 640px) {
      .btn-small {
        font-size: 0.688rem;
        padding: 0.438rem 0.625rem;
      }

      .btn-medium {
        font-size: 0.813rem;
        padding: 0.625rem 0.875rem;
      }

      .btn-large {
        font-size: 0.938rem;
        padding: 0.75rem 1rem;
      }
    }
  `]
})
export class CommonButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<Event>();

  getButtonClasses(): string {
    const classes = [
      `btn-${this.variant}`,
      `btn-${this.size}`
    ];

    if (this.fullWidth) {
      classes.push('btn-full-width');
    }

    return classes.join(' ');
  }

  handleClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
