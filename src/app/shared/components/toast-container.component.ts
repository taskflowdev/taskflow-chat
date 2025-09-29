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
      border: 1px solid var(--bs-border-color);
      background: var(--bs-body-bg);
      color: var(--bs-body-color);
    }

    .toast-success {
      --bs-toast-header-bg: color-mix(in srgb, var(--theme-success) 10%, var(--bs-body-bg));
      --bs-toast-header-border-color: color-mix(in srgb, var(--theme-success) 20%, transparent);
    }

    .toast-success .toast-header {
      color: var(--theme-success);
    }

    .toast-error {
      --bs-toast-header-bg: color-mix(in srgb, var(--theme-danger) 10%, var(--bs-body-bg));
      --bs-toast-header-border-color: color-mix(in srgb, var(--theme-danger) 20%, transparent);
    }

    .toast-error .toast-header {
      color: var(--theme-danger);
    }

    .toast-warning {
      --bs-toast-header-bg: color-mix(in srgb, var(--theme-warning) 10%, var(--bs-body-bg));
      --bs-toast-header-border-color: color-mix(in srgb, var(--theme-warning) 20%, transparent);
    }

    .toast-warning .toast-header {
      color: var(--theme-warning);
    }

    .toast-info {
      --bs-toast-header-bg: color-mix(in srgb, var(--theme-info) 10%, var(--bs-body-bg));
      --bs-toast-header-border-color: color-mix(in srgb, var(--theme-info) 20%, transparent);
    }

    .toast-info .toast-header {
      color: var(--theme-info);
    }

    .btn-close {
      filter: var(--bs-btn-close-white-filter, none);
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
