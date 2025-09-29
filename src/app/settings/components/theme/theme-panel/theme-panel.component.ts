import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeDto } from '../../../../api/models/theme-dto';
import { ThemeCard } from '../theme-card/theme-card.component';

/**
 * Theme panel component for light or dark themes
 * Displays theme options with preview cards
 */
@Component({
  selector: 'app-theme-panel',
  standalone: true,
  imports: [CommonModule, ThemeCard],
  template: `
    <div class="theme-panel" [class.active]="isActive">
      <div class="panel-header">
        <h5 class="panel-title">
          <i class="bi me-2" [ngClass]="getPanelIcon()"></i>
          {{ getPanelTitle() }}
        </h5>
        <div class="panel-badge" [class.badge-active]="isActive">
          {{ isActive ? 'Active' : 'Inactive' }}
        </div>
      </div>

      <div class="panel-description">
        <p class="text-muted">
          {{ getPanelDescription() }}
        </p>
      </div>

      <div class="themes-grid" *ngIf="themes.length > 0; else noThemesTemplate">
        <app-theme-card
          *ngFor="let theme of themes; trackBy: trackByThemeId"
          [theme]="theme"
          [isSelected]="theme.id === selectedThemeId"
          [isActive]="isActive && theme.id === selectedThemeId"
          (select)="onThemeSelect(theme)">
        </app-theme-card>
      </div>

      <ng-template #noThemesTemplate>
        <div class="no-themes text-center py-4">
          <i class="bi bi-palette text-muted display-6"></i>
          <p class="text-muted mt-2">No {{ themeMode }} themes available</p>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./theme-panel.component.scss']
})
export class ThemePanel {
  @Input() themeMode: 'light' | 'dark' = 'light';
  @Input() themes: ThemeDto[] = [];
  @Input() selectedThemeId: string | undefined;
  @Input() isActive: boolean = false;

  @Output() themeSelect = new EventEmitter<string>();

  getPanelTitle(): string {
    return this.themeMode === 'light' ? 'Light themes' : 'Dark themes';
  }

  getPanelDescription(): string {
    return this.themeMode === 'light' 
      ? 'Choose your preferred light theme variation and accent colors.'
      : 'Choose your preferred dark theme variation and accent colors.';
  }

  getPanelIcon(): string {
    return this.themeMode === 'light' ? 'bi-sun-fill' : 'bi-moon-fill';
  }

  onThemeSelect(theme: ThemeDto): void {
    if (theme.id) {
      this.themeSelect.emit(theme.id);
    }
  }

  trackByThemeId(index: number, theme: ThemeDto): string {
    return theme.id || index.toString();
  }
}