import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

/**
 * Reusable tabs component with accessibility support
 * 
 * Features:
 * - Native ARIA attributes for screen readers
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Responsive design (pills on mobile, vertical on desktop)
 * - OnPush change detection for performance
 * 
 * @example
 * ```typescript
 * tabs: Tab[] = [
 *   { id: 'general', label: 'General', icon: 'bi-info-circle' },
 *   { id: 'members', label: 'Members', icon: 'bi-people' }
 * ];
 * 
 * <app-tabs
 *   [tabs]="tabs"
 *   [activeTabId]="activeTab"
 *   [orientation]="'vertical'"
 *   (tabChange)="onTabChange($event)">
 * </app-tabs>
 * ```
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent {
  /**
   * Array of tab definitions
   */
  @Input() tabs: Tab[] = [];

  /**
   * Currently active tab ID
   */
  @Input() activeTabId: string = '';

  /**
   * Tab orientation: vertical (default) or horizontal
   */
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';

  /**
   * Emitted when user selects a different tab
   */
  @Output() tabChange = new EventEmitter<string>();

  /**
   * Handle tab selection
   */
  selectTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled && tabId !== this.activeTabId) {
      this.tabChange.emit(tabId);
    }
  }

  /**
   * Handle keyboard navigation
   */
  onKeyDown(event: KeyboardEvent, currentIndex: number): void {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = this.getNextEnabledTabIndex(currentIndex);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = this.getPreviousEnabledTabIndex(currentIndex);
        break;
      case 'Home':
        event.preventDefault();
        newIndex = this.getFirstEnabledTabIndex();
        break;
      case 'End':
        event.preventDefault();
        newIndex = this.getLastEnabledTabIndex();
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex && newIndex >= 0) {
      const newTab = this.tabs[newIndex];
      if (newTab && !newTab.disabled) {
        this.selectTab(newTab.id);
        // Focus the new tab button
        setTimeout(() => {
          const button = document.querySelector(`[data-tab-index="${newIndex}"]`) as HTMLElement;
          button?.focus();
        }, 0);
      }
    }
  }

  /**
   * Get next enabled tab index
   */
  private getNextEnabledTabIndex(currentIndex: number): number {
    for (let i = currentIndex + 1; i < this.tabs.length; i++) {
      if (!this.tabs[i].disabled) {
        return i;
      }
    }
    return currentIndex;
  }

  /**
   * Get previous enabled tab index
   */
  private getPreviousEnabledTabIndex(currentIndex: number): number {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!this.tabs[i].disabled) {
        return i;
      }
    }
    return currentIndex;
  }

  /**
   * Get first enabled tab index
   */
  private getFirstEnabledTabIndex(): number {
    for (let i = 0; i < this.tabs.length; i++) {
      if (!this.tabs[i].disabled) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Get last enabled tab index
   */
  private getLastEnabledTabIndex(): number {
    for (let i = this.tabs.length - 1; i >= 0; i--) {
      if (!this.tabs[i].disabled) {
        return i;
      }
    }
    return this.tabs.length - 1;
  }
}
