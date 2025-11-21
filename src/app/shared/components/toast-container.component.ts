import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService } from '../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 9999;">
      <div
        *ngFor="let toast of toasts; trackBy: trackByToastId"
        class="toast show"
        [ngClass]="getToastClass(toast.type)"
        role="alert">
        <div class="toast-header">
          <i [class]="getToastIcon(toast.type)" class="me-2"></i>
          <strong class="me-auto">{{ toast.title || getDefaultTitle(toast.type) }}</strong>
          <button
            type="button"
            class="btn-close"
            (click)="removeToast(toast.id)"
            aria-label="Close"></button>
        </div>
        <div class="toast-body">
          {{ toast.message }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      min-width: 300px;
      margin-bottom: 0.5rem;
      background: var(--taskflow-color-toast-bg, #000);
      color: var(--taskflow-color-toast-text, #fff);
      border: 1px solid var(--taskflow-color-toast-border, rgba(255,255,255,0.2));
    }

    .toast-success {
      --bs-toast-header-bg: var(--taskflow-color-toast-header-bg-success, rgba(34,197,94,0.08));
      --bs-toast-header-border-color: var(--taskflow-color-toast-header-border-success, rgba(34,197,94,0.16));
    }

    .toast-success .toast-header {
      color: var(--taskflow-color-toast-header-text-success, #16a34a);
    }

    .toast-error {
      --bs-toast-header-bg: var(--taskflow-color-toast-header-bg-error, rgba(220,38,38,0.08));
      --bs-toast-header-border-color: var(--taskflow-color-toast-header-border-error, rgba(220,38,38,0.16));
    }

    .toast-error .toast-header {
      color: var(--taskflow-color-toast-header-text-error, #dc2626);
    }

    .toast-warning {
      --bs-toast-header-bg: var(--taskflow-color-toast-header-bg-warning, rgba(245,158,11,0.08));
      --bs-toast-header-border-color: var(--taskflow-color-toast-header-border-warning, rgba(245,158,11,0.16));
    }

    .toast-warning .toast-header {
      color: var(--taskflow-color-toast-header-text-warning, #f59e0b);
    }

    .toast-info {
      --bs-toast-header-bg: var(--taskflow-color-toast-header-bg-info, rgba(59,130,246,0.08));
      --bs-toast-header-border-color: var(--taskflow-color-toast-header-border-info, rgba(59,130,246,0.16));
    }

    .toast-info .toast-header {
      color: var(--taskflow-color-toast-header-text-info, #3b82f6);
    }

    /* Close button uses currentColor in Bootstrap's SVG; set it from theme tokens */
    .toast .btn-close {
      color: var(--taskflow-color-toast-close, rgba(255,255,255,0.9)) !important;
      background: transparent;
      border: none;
      opacity: 0.95;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .toast .btn-close:hover,
    .toast .btn-close:focus {
      background: var(--taskflow-color-toast-close-hover, rgba(255,255,255,0.06)) !important;
      border-radius: 6px;
      color: var(--taskflow-color-toast-close, rgba(255,255,255,0.95)) !important;
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastService) { }

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  removeToast(id: string): void {
    this.toastService.removeToast(id);
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  getToastClass(type: string): string {
    return `toast-${type}`;
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'bi bi-check-circle-fill';
      case 'error':
        return 'bi bi-emoji-frown-fill';
      case 'warning':
        return 'bi bi-exclamation-circle-fill';
      case 'info':
        return 'bi bi-lightbulb-fill';
      default:
        return 'bi bi-bell-fill';
    }
  }

  getDefaultTitle(type: string): string {
    switch (type) {
      case 'success':
        return 'All Done!';
      case 'error':
        return 'Oops, Error!';
      case 'warning':
        return 'Heads Up!';
      case 'info':
        return 'For Your Information';
      default:
        return 'Notice';
    }
  }
}
