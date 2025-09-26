import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeDto } from '../../../api/models';
import { ThemePreviewComponent } from '../theme-preview/theme-preview.component';

@Component({
  selector: 'app-theme-card',
  standalone: true,
  imports: [CommonModule, ThemePreviewComponent],
  templateUrl: './theme-card.component.html',
  styleUrls: ['./theme-card.component.scss']
})
export class ThemeCardComponent {
  @Input() theme: ThemeDto | null = null;
  @Input() selected = false;
  @Output() themeClick = new EventEmitter<void>();

  onClick(): void {
    this.themeClick.emit();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.themeClick.emit();
    }
  }

  get cardClasses(): string[] {
    const classes = ['theme-card'];
    if (this.selected) {
      classes.push('theme-card--selected');
    }
    if (this.theme?.isDarkTheme) {
      classes.push('theme-card--dark');
    }
    return classes;
  }
}