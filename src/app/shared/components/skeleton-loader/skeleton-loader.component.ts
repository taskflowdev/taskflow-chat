import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SkeletonConfig {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="skeleton-loader"
      [class]="config.className || ''"
      [style.width]="config.width || '100%'"
      [style.height]="config.height || '20px'"
      [style.border-radius]="config.borderRadius || '4px'"
    ></div>
  `,
  styles: [`
    .skeleton-loader {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .skeleton-loader.circle {
      border-radius: 50%;
    }

    .skeleton-loader.rounded {
      border-radius: 8px;
    }

    .skeleton-loader.text {
      height: 16px;
      border-radius: 4px;
    }

    .skeleton-loader.text-lg {
      height: 20px;
      border-radius: 4px;
    }

    .skeleton-loader.avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .skeleton-loader.avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .skeleton-loader.avatar-lg {
      width: 48px;
      height: 48px;
      border-radius: 50%;
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() config: SkeletonConfig = {};
}