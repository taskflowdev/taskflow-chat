import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthUser } from '../../../../../auth/services/auth.service';
import { CommonTooltipDirective } from "../../../common-tooltip/common-tooltip.component";

export interface DropdownItem {
  label: string;
  icon: string;
  action?: string;
  href?: string;
  divider?: boolean;
  shortcutKey?: string;
  isBold?: boolean;
}

/**
 * Reusable user dropdown component for navbar
 * Provides clean interface for user actions with proper event handling
 */
@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  imports: [CommonModule, CommonTooltipDirective],
  template: `
    <div class="user-section" *ngIf="user">
      <div class="dropdown">
        <button
          class="btn user-dropdown-btn border-0"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false">
          <span class="user-name">{{ user.fullName }}</span>
          <i class="bi bi-chevron-down dropdown-icon"></i>
        </button>

        <ul class="dropdown-menu dropdown-menu-end">
          <ng-container *ngFor="let item of dropdownItems; trackBy: trackByLabel">
            <li *ngIf="!item.divider">
              <!-- For link items -->
              <a
                *ngIf="item.href"
                class="dropdown-item d-flex align-items-center justify-content-between"
                [href]="item.href"
                [appCommonTooltip]="item.label">
                <div class="d-flex align-items-center">
                  <i class="bi me-2" [ngClass]="item.icon"></i>
                  <span [class.bold-label]="item.isBold">{{ item.label }}</span>
                </div>
                <span *ngIf="item.shortcutKey" class="shortcut-key">{{ item.shortcutKey }}</span>
              </a>

              <!-- For button items -->
              <button
                *ngIf="!item.href"
                class="dropdown-item d-flex align-items-center justify-content-between"
                (click)="onItemClick(item)"
                [appCommonTooltip]="item.label">
                <div>
                  <i class="bi me-2" [ngClass]="item.icon"></i>
                  <span [class.bold-label]="item.isBold">{{ item.label }}</span>
                </div>
                <span *ngIf="item.shortcutKey" class="shortcut-key-dropdown">{{ item.shortcutKey }}</span>
              </button>
            </li>

            <li *ngIf="item.divider">
              <hr class="dropdown-divider">
            </li>
          </ng-container>
        </ul>
      </div>
    </div>
  `,
  styleUrls: ['./user-dropdown.component.scss']
})
export class UserDropdownComponent {
  @Input() user: AuthUser | null = null;
  @Input() dropdownItems: DropdownItem[] = [];

  @Output() itemClick = new EventEmitter<DropdownItem>();

  /**
   * Handle dropdown item click
   */
  onItemClick(item: DropdownItem): void {
    this.itemClick.emit(item);
  }

  /**
   * Track function for ngFor optimization
   */
  trackByLabel(index: number, item: DropdownItem): string {
    return item.label + index;
  }
}
