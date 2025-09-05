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
    }
    
    .toast-success {
      --bs-toast-header-bg: rgba(34, 197, 94, 0.1);
      --bs-toast-header-border-color: rgba(34, 197, 94, 0.2);
    }
    
    .toast-success .toast-header {
      color: #16a34a;
    }
    
    .toast-error {
      --bs-toast-header-bg: rgba(220, 38, 38, 0.1);
      --bs-toast-header-border-color: rgba(220, 38, 38, 0.2);
    }
    
    .toast-error .toast-header {
      color: #dc2626;
    }
    
    .toast-warning {
      --bs-toast-header-bg: rgba(245, 158, 11, 0.1);
      --bs-toast-header-border-color: rgba(245, 158, 11, 0.2);
    }
    
    .toast-warning .toast-header {
      color: #f59e0b;
    }
    
    .toast-info {
      --bs-toast-header-bg: rgba(59, 130, 246, 0.1);
      --bs-toast-header-border-color: rgba(59, 130, 246, 0.2);
    }
    
    .toast-info .toast-header {
      color: #3b82f6;
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastService) {}

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
        return 'bi bi-x-circle-fill';
      case 'warning':
        return 'bi bi-exclamation-triangle-fill';
      case 'info':
        return 'bi bi-info-circle-fill';
      default:
        return 'bi bi-info-circle-fill';
    }
  }

  getDefaultTitle(type: string): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      default:
        return 'Notification';
    }
  }
}