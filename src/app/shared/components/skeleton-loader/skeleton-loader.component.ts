import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'circle' | 'rectangle' | 'chat-item' | 'message' | 'chat-header';

/**
 * Reusable skeleton loader component with dark theme support
 * Provides different skeleton types for various UI elements
 */
@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" [ngSwitch]="type">
      
      <!-- Text skeleton -->
      <div *ngSwitchCase="'text'" 
           class="skeleton skeleton-text" 
           [style.width]="width"
           [style.height]="height || '1rem'"
           [style.opacity]="fadeOpacity">
      </div>
      
      <!-- Circle skeleton -->
      <div *ngSwitchCase="'circle'" 
           class="skeleton skeleton-circle" 
           [style.width]="width || '40px'"
           [style.height]="height || '40px'"
           [style.opacity]="fadeOpacity">
      </div>
      
      <!-- Rectangle skeleton -->
      <div *ngSwitchCase="'rectangle'" 
           class="skeleton skeleton-rectangle" 
           [style.width]="width"
           [style.height]="height"
           [style.opacity]="fadeOpacity">
      </div>
      
      <!-- Chat item skeleton -->
      <div *ngSwitchCase="'chat-item'" class="skeleton-chat-item" [style.opacity]="fadeOpacity">
        <div class="skeleton skeleton-circle" style="width: 40px; height: 40px;"></div>
        <div class="skeleton-chat-content">
          <div class="skeleton skeleton-text" style="width: 70%; height: 1rem; margin-bottom: 0.25rem;"></div>
          <div class="skeleton skeleton-text" style="width: 90%; height: 0.875rem;"></div>
        </div>
        <div class="skeleton-chat-meta">
          <div class="skeleton skeleton-text" style="width: 40px; height: 0.75rem;"></div>
        </div>
      </div>
      
      <!-- Message skeleton -->
      <div *ngSwitchCase="'message'" class="skeleton-message" [style.opacity]="fadeOpacity">
        <div class="skeleton skeleton-circle" style="width: 32px; height: 32px;"></div>
        <div class="skeleton-message-content">
          <div class="skeleton skeleton-text" style="width: 60%; height: 0.875rem; margin-bottom: 0.25rem;"></div>
          <div class="skeleton skeleton-text" style="width: 85%; height: 1rem;"></div>
        </div>
      </div>

      <!-- Chat header skeleton -->
      <div *ngSwitchCase="'chat-header'" class="skeleton-chat-header" [style.opacity]="fadeOpacity">
        <div class="skeleton-header-info">
          <div class="skeleton skeleton-text" style="width: 180px; height: 1.2rem; margin-bottom: 0.25rem;"></div>
          <div class="skeleton skeleton-text" style="width: 100px; height: 0.875rem;"></div>
        </div>
        <div class="skeleton-header-actions">
          <div class="skeleton skeleton-circle" style="width: 36px; height: 36px;"></div>
        </div>
      </div>
      
    </div>
  `,
  styleUrls: ['./skeleton-loader.component.scss']
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'text';
  @Input() width?: string;
  @Input() height?: string;
  @Input() count: number = 1;
  @Input() fadeOpacity: number = 1; // For progressive fade effect

  constructor() {}
}