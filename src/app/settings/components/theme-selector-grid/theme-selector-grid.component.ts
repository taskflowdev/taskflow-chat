import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ThemeDto } from '../../../api/models';

@Component({
  selector: 'app-theme-selector-grid',
  templateUrl: './theme-selector-grid.component.html',
  styleUrls: ['./theme-selector-grid.component.scss']
})
export class ThemeSelectorGrid {
  @Input() themes: ThemeDto[] = [];
  @Input() selectedThemeId = '';
  @Input() isLoading: boolean = false;
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