import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeDto } from '../../../api/models';
import { ThemeCardComponent } from '../theme-card/theme-card.component';

@Component({
  selector: 'app-theme-selector-grid',
  standalone: true,
  imports: [CommonModule, ThemeCardComponent],
  templateUrl: './theme-selector-grid.component.html',
  styleUrls: ['./theme-selector-grid.component.scss']
})
export class ThemeSelectorGrid {
  @Input() themes: ThemeDto[] = [];
  @Input() selectedThemeId = '';
  @Output() themeSelected = new EventEmitter<string>();

  onThemeSelect(themeId: string): void {
    this.themeSelected.emit(themeId);
  }

  isSelected(theme: ThemeDto): boolean {
    return this.selectedThemeId === theme.id;
  }

  trackByThemeId(index: number, theme: ThemeDto): string {
    return theme.id || index.toString();
  }
}