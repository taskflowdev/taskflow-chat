import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingOption } from '../../../../../app/api/models/setting-option';

@Component({
  selector: 'app-select-control',
  imports: [CommonModule],
  templateUrl: './select-control.component.html',
  styleUrls: ['./select-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectControlComponent {
  @Input() value: any;
  @Input() options: SettingOption[] = [];
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<any>();

  isOpen = false;

  get selectedLabel(): string {
    const selected = this.options.find(opt => opt.value === this.value);
    return selected ? selected.label! : 'Select an option';
  }

  get selectedIcon(): string | null {
    const selected = this.options.find(opt => opt.value === this.value);
    return selected?.icon || null;
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
    }
  }

  selectOption(option: SettingOption): void {
    if (!this.disabled) {
      this.valueChange.emit(option.value);
      this.isOpen = false;
    }
  }

  isSelected(option: SettingOption): boolean {
    return option.value === this.value;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }
}
