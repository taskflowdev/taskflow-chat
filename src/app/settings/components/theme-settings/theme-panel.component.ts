import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Theme } from '../../../shared/models/theme.models';
import { AccentSelectorComponent } from './accent-selector.component';

@Component({
  selector: 'app-theme-panel',
  standalone: true,
  imports: [CommonModule, AccentSelectorComponent],
  templateUrl: './theme-panel.component.html',
  styleUrls: ['./theme-panel.component.scss']
})
export class ThemePanelComponent {
  @Input() mode: 'light' | 'dark' = 'light';
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() themes: Theme[] = [];
  @Input() selectedVariantId: string = '';
  @Input() isActive: boolean = false;

  @Output() variantChange = new EventEmitter<string>();

  onVariantSelect(variantId: string): void {
    this.variantChange.emit(variantId);
  }

  get modeIcon(): string {
    return this.mode === 'light' ? 'bi-sun-fill' : 'bi-moon-fill';
  }

  get activeStatusText(): string {
    return this.isActive ? 'Currently active' : 'Inactive';
  }
}