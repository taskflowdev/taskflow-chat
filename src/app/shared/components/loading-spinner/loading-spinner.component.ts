import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" [class.inline]="inline">
      <div 
        class="spinner"
        [class]="'spinner-' + size"
        [style.color]="color"
      ></div>
      <div *ngIf="text" class="spinner-text" [style.color]="color">
        {{ text }}
      </div>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .spinner-container.inline {
      display: inline-flex;
      flex-direction: row;
      padding: 0;
      gap: 0.5rem;
    }

    .spinner {
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-left: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border-width: 2px;
    }

    .spinner-md {
      width: 24px;
      height: 24px;
      border-width: 2px;
    }

    .spinner-lg {
      width: 32px;
      height: 32px;
      border-width: 3px;
    }

    .spinner-xl {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .spinner-text {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .inline .spinner-text {
      margin-top: 0;
      margin-left: 0.5rem;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() color: string = '#007bff';
  @Input() text: string = '';
  @Input() inline: boolean = false;
}