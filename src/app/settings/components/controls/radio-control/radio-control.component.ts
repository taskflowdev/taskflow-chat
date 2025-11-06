import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingOption } from '../../../../../app/api/models/setting-option';

@Component({
  selector: 'app-radio-control',
  imports: [CommonModule],
  templateUrl: './radio-control.component.html',
  styleUrls: ['./radio-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioControlComponent {
  @Input() value: any;
  @Input() options: SettingOption[] = [];
  @Input() name: string = '';
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<any>();

  onChange(newValue: any): void {
    this.valueChange.emit(newValue);
  }
}
