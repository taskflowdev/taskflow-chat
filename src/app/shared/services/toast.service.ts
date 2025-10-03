import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  autoHide?: boolean;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  showSuccess(message: string, title?: string, autoHide: boolean = true, duration: number = 5000): void {
    this.addToast({
      id: this.generateId(),
      type: 'success',
      title,
      message,
      autoHide,
      duration
    });
  }

  showError(message: string, title?: string, autoHide: boolean = true, duration: number = 5000): void {
    this.addToast({
      id: this.generateId(),
      type: 'error',
      title,
      message,
      autoHide,
      duration
    });
  }

  showWarning(message: string, title?: string, autoHide: boolean = true, duration: number = 5000): void {
    this.addToast({
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      autoHide,
      duration
    });
  }

  showInfo(message: string, title?: string, autoHide: boolean = true, duration: number = 5000): void {
    this.addToast({
      id: this.generateId(),
      type: 'info',
      title,
      message,
      autoHide,
      duration
    });
  }

  private addToast(toast: Toast): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    if (toast.autoHide) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration);
    }
  }

  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);
    this.toastsSubject.next(filteredToasts);
  }

  clearAll(): void {
    this.toastsSubject.next([]);
  }
}