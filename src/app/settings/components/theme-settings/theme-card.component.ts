import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeVariant } from '../../../shared/models/theme.models';
import { AccentSelectorComponent } from './accent-selector.component';

@Component({
  selector: 'app-theme-card',
  standalone: true,
  imports: [CommonModule, AccentSelectorComponent],
  templateUrl: './theme-card.component.html',
  styleUrls: ['./theme-card.component.scss']
})
export class ThemeCardComponent {
  @Input() variant!: ThemeVariant;
  @Input() isSelected: boolean = false;
  @Input() isActive: boolean = false;

  @Output() click = new EventEmitter<void>();

  onCardClick(): void {
    this.click.emit();
  }

  onCardKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.click.emit();
    }
  }

  get statusText(): string {
    if (this.isActive) return 'Active';
    if (this.isSelected) return 'Selected';
    return 'Select';
  }

  get statusIcon(): string {
    if (this.isActive) return 'bi-check-circle-fill';
    if (this.isSelected) return 'bi-circle-fill';
    return 'bi-circle';
  }
}