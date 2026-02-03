import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-control.component.html',
  styleUrls: ['./toggle-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleControlComponent {
  @Input() value: boolean = false;
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<boolean>();

  toggle(): void {
    if (!this.disabled) {
      this.valueChange.emit(!this.value);
    }
  }
}
