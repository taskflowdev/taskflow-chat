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

    /* Primary variant */
    .btn-primary {
      background: var(--taskflow-color-button-primary-bg);
      color: var(--taskflow-color-button-primary-text);
      border-color: var(--taskflow-color-button-primary-border, transparent);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--taskflow-color-button-primary-bg-hover);
    }

    .btn-primary:disabled {
      background: var(--taskflow-color-button-primary-disabled-bg);
      color: var(--taskflow-color-button-disabled-text);
      cursor: not-allowed;
    }

    /* Secondary variant */
    .btn-secondary {
      background: var(--taskflow-color-button-secondary-bg, transparent);
      border: 1px solid var(--taskflow-color-button-secondary-border);
      color: var(--taskflow-color-button-secondary-text);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--taskflow-color-button-secondary-bg-hover);
      border-color: var(--taskflow-color-button-secondary-border-hover);
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Danger variant */
    .btn-danger {
      background: var(--taskflow-color-button-danger-bg);
      border: none;
      color: var(--taskflow-color-button-danger-text);
    }

    .btn-danger:hover:not(:disabled) {
      background: var(--taskflow-color-button-danger-bg-hover);
    }

    .btn-danger:disabled {
      background: var(--taskflow-color-button-danger-bg-disabled);
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Success variant */
    .btn-success {
      background: var(--taskflow-color-button-success-bg);
      border: none;
      color: var(--taskflow-color-button-success-text);
    }

    .btn-success:hover:not(:disabled) {
      background: var(--taskflow-color-button-success-bg-hover);
    }

    .btn-success:disabled {
      background: var(--taskflow-color-button-success-bg-disabled);
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Warning variant */
    .btn-warning {
      background: var(--taskflow-color-button-warning-bg);
      border: none;
      color: var(--taskflow-color-button-warning-text);
    }

    .btn-warning:hover:not(:disabled) {
      background: var(--taskflow-color-button-warning-bg-hover);
    }

    .btn-warning:disabled {
      background: var(--taskflow-color-button-warning-bg-disabled);
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
      border-color: var(--taskflow-color-button-variant-border, transparent);
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
