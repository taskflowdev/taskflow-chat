import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'circle' | 'rectangle' | 'chat-item' | 'message' | 'chat-header' | 'settings-sidebar' | 'settings-item' | 'settings-category' | 'profile-page';
export type ControlType = 'select' | 'radio';

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
      <div *ngSwitchCase="'message'" class="skeleton-message-wrapper" [style.opacity]="fadeOpacity">
        <!-- Other's message (left side) -->
        <div class="skeleton-message skeleton-message-other">
          <div class="skeleton-message-bubble skeleton-message-bubble-other">
            <div class="skeleton-message-header">
              <div class="skeleton skeleton-text" style="width: 80px; height: 0.875rem; margin-bottom: 0.25rem;"></div>
              <div class="skeleton skeleton-text" style="width: 40px; height: 0.75rem;"></div>
            </div>
            <div class="skeleton skeleton-text" style="width: 75%; height: 1rem;"></div>
          </div>
        </div>

        <!-- Own message (right side) -->
        <div class="skeleton-message skeleton-message-own">
          <div class="skeleton-message-bubble skeleton-message-bubble-own">
            <div class="skeleton skeleton-text" style="width: 65%; height: 1rem; margin-bottom: 0.25rem;"></div>
            <div class="skeleton-message-footer">
              <div class="skeleton skeleton-text" style="width: 130px; height: 0.75rem;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat header skeleton -->
      <div *ngSwitchCase="'chat-header'" class="skeleton-chat-header" [style.opacity]="fadeOpacity">
        <div class="skeleton-header-info">
          <div class="skeleton skeleton-text" style="width: 120px; height: 1.25rem; margin-bottom: 0.25rem;"></div>
          <div class="skeleton skeleton-text" style="width: 80px; height: 0.875rem;"></div>
        </div>

        <!-- Action icon (e.g., 3-dot button) -->
        <!-- <div class="skeleton-header-actions">
          <div class="skeleton skeleton-circle" style="width: 28px; height: 28px;"></div>
        </div> -->
      </div>

      <!-- Settings sidebar skeleton -->
      <div *ngSwitchCase="'settings-sidebar'" class="skeleton-settings-sidebar" [style.opacity]="fadeOpacity">
        <!-- Title -->
        <div class="skeleton skeleton-text" style="width: 120px; height: 1.75rem; margin-bottom: 1rem;"></div>

        <!-- Profile Section -->
        <div class="skeleton-profile-section skeleton skeleton-text" style="padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <!-- <div class="skeleton skeleton-circle" style="width: 40px; height: 40px; flex-shrink: 0;"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton-text" style="width: 70%; height: 1rem; margin-bottom: 0.25rem;"></div>
            <div class="skeleton skeleton-text" style="width: 50%; height: 0.875rem;"></div>
          </div> -->
            <div style="width: 50px; height: 50px; flex-shrink: 0;">
          </div>
        </div>

        <!-- Divider -->
        <div style="height: 1px; background-color: var(--taskflow-color-profile-divider, #2d333b); margin-bottom: 1rem;"></div>

        <!-- Menu Items Spinner -->
        <div class="skeleton-settings-sidebar-spinner">
          <div class="skeleton-spinner" aria-label="Loading settings categories"></div>
          <span class="skeleton-spinner-text">Loading...</span>
        </div>
      </div>

      <!-- Settings category skeleton -->
      <div *ngSwitchCase="'settings-category'" class="skeleton-settings-category" [style.opacity]="fadeOpacity">
        <div class="skeleton-settings-category-info">
          <div class="skeleton-item-header-icon">
            <div class="skeleton skeleton-text" style="width: 50px; height: 50px;"></div>
          </div>
          <div class="skeleton skeleton-text" style="width: 200px; height: 1.75rem; margin-bottom: 0.2rem;"></div>
          <div class="skeleton skeleton-text" style="width: 90%; height: 1rem;"></div>
        </div>
      </div>

      <!-- Settings item skeleton -->
      <div *ngSwitchCase="'settings-item'" class="skeleton-settings-item" [style.opacity]="fadeOpacity">
        <div class="skeleton-item-header-icon">
            <div class="skeleton skeleton-text" style="width: 40px; height: 40px; margin-bottom: 0.2rem;"></div>
        </div>
        <div class="skeleton-item-header">
          <div class="skeleton-item-info">
            <div class="skeleton skeleton-text" style="width: 150px; height: 1rem; margin-bottom: 0.2rem;"></div>
            <div class="skeleton skeleton-text" style="width: 90%; height: 0.875rem;"></div>
          </div>
        </div>
        <div class="skeleton-item-control">
          <!-- Select control skeleton -->
          <div *ngIf="controlType === 'select'" class="skeleton-select-control">
            <div class="skeleton skeleton-rectangle" style="width: 160px; height: 38px;"></div>
          </div>
          <!-- Radio control skeleton -->
          <div *ngIf="controlType === 'radio'" class="skeleton-radio-control">
            <div class="skeleton-radio-group">
              <div class="skeleton-radio-option">
                <div class="skeleton skeleton-rectangle" style="width: 100%; height: 80px;"></div>
              </div>
              <div class="skeleton-radio-option">
                <div class="skeleton skeleton-rectangle" style="width: 100%; height: 80px;"></div>
              </div>
              <div class="skeleton-radio-option">
                <div class="skeleton skeleton-rectangle" style="width: 100%; height: 80px;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags Section -->
        <div *ngIf="showTags" class="skeleton-tags-section">
          <hr>
          <div class="skeleton-tags-container">
            <div class="skeleton-tag skeleton">
              <div class="skeleton-rectangle" style="width: 60px; height: 1.25rem;"></div>
            </div>
            <div class="skeleton-tag skeleton">
              <div class="skeleton-rectangle" style="width: 75px; height: 1.25rem;"></div>
            </div>
            <div class="skeleton-tag skeleton">
              <div class="skeleton-rectangle" style="width: 50px; height: 1.25rem;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile page skeleton -->
      <div *ngSwitchCase="'profile-page'" class="skeleton-profile-page" [style.opacity]="fadeOpacity">
        <div class="skeleton-profile-header">
          <div class="skeleton skeleton-circle" style="width: 80px; height: 80px;"></div>
          <div class="skeleton-profile-header-text">
            <div class="skeleton skeleton-text" style="width: 200px; height: 2rem; margin-bottom: 0.5rem;"></div>
            <div class="skeleton skeleton-text" style="width: 150px; height: 1.25rem;"></div>
          </div>
        </div>
        <div class="skeleton-profile-section">
          <div class="skeleton skeleton-text" style="width: 180px; height: 1.5rem; margin-bottom: 1rem;"></div>
          <div class="skeleton-detail-row">
            <div class="skeleton skeleton-text" style="width: 120px; height: 1rem;"></div>
            <div class="skeleton skeleton-text" style="width: 60%; height: 1rem;"></div>
          </div>
          <div class="skeleton-detail-row">
            <div class="skeleton skeleton-text" style="width: 120px; height: 1rem;"></div>
            <div class="skeleton skeleton-text" style="width: 50%; height: 1rem;"></div>
          </div>
          <div class="skeleton-detail-row">
            <div class="skeleton skeleton-text" style="width: 120px; height: 1rem;"></div>
            <div class="skeleton skeleton-text" style="width: 70%; height: 1rem;"></div>
          </div>
        </div>
        <div class="skeleton-profile-section">
          <div class="skeleton skeleton-text" style="width: 180px; height: 1.5rem; margin-bottom: 1rem;"></div>
          <div class="skeleton-detail-row">
            <div class="skeleton skeleton-text" style="width: 120px; height: 1rem;"></div>
            <div class="skeleton skeleton-text" style="width: 55%; height: 1rem;"></div>
          </div>
          <div class="skeleton-detail-row">
            <div class="skeleton skeleton-text" style="width: 120px; height: 1rem;"></div>
            <div class="skeleton skeleton-text" style="width: 45%; height: 1rem;"></div>
          </div>
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
  @Input() showBackButton: boolean = false; // For chat-header skeleton
  @Input() controlType: ControlType = 'select'; // For settings-item skeleton
  @Input() showTags: boolean = true; // For settings-item skeleton with tags

  constructor() { }
}
