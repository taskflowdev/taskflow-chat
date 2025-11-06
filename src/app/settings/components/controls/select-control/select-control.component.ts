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

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.valueChange.emit(target.value);
  }
}
