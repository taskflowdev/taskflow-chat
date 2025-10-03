import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-common-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="common-toggle-container">
      <label class="common-toggle-label" *ngIf="label">
        {{ label }}
      </label>
      <div class="toggle-wrapper" [class.disabled]="disabled">
        <input
          type="checkbox"
          class="toggle-input"
          [id]="id"
          [checked]="value"
          [disabled]="disabled"
          (change)="onToggleChange($event)"
          (blur)="onTouched()"
        />
        <label [for]="id" class="toggle-switch">
          <span class="toggle-slider"></span>
        </label>
        <!-- Added ON/OFF text beside toggle -->
        <span class="toggle-value-text" *ngIf="onText || offText">
          {{ value ? onText : offText }}
        </span>
      </div>
      <span class="toggle-description" *ngIf="description">
        {{ description }}
      </span>
    </div>
  `,
  styles: [`
    .common-toggle-container {
      // display: grid;
      // display: flex;
      // flex-direction: column;
      // gap: 0.5rem;
    }

    .common-toggle-container > *:not(:last-child) {
      margin-bottom: 0.5rem;
    }

    .common-toggle-label {
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .toggle-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .toggle-wrapper.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toggle-input {
      display: none;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      cursor: pointer;
      background: #333333;
      border: 1px solid #444444;
      border-radius: 24px;
      transition: all 0.3s ease;
    }

    .toggle-slider {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      background: #666666;
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .toggle-input:checked + .toggle-switch {
      background: white;
      border-color: white;
    }

    .toggle-input:checked + .toggle-switch .toggle-slider {
      transform: translateX(20px);
      background: black;
    }

    .toggle-input:focus + .toggle-switch {
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }

    .toggle-wrapper.disabled .toggle-switch {
      cursor: not-allowed;
    }

    .toggle-description {
      color: #9ca3af;
      font-size: 0.8rem;
    }

    .toggle-value-text {
      border: 1px solid #444444;
      color: white;
      font-size: 0.813rem;
      font-weight: 500;
      border-radius: 10px;
      padding: 0.1rem 0.5rem 0.2rem 0.5rem;
    }

    @media (max-width: 640px) {
      .common-toggle-label {
        font-size: 0.813rem;
      }

      .toggle-description {
        font-size: 0.688rem;
      }

      .toggle-value-text {
        font-size: 0.75rem;
      }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonToggleComponent),
      multi: true
    }
  ]
})
export class CommonToggleComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() description?: string;
  @Input() disabled = false;
  @Input() id = `toggle-${Math.random().toString(36).substr(2, 9)}`;

  /** Text for ON/OFF states */
  @Input() onText: string = 'ON';
  @Input() offText: string = 'OFF';

  value = false;

  onChange: any = () => { };
  onTouched: any = () => { };

  writeValue(value: boolean): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onToggleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.checked;
    this.onChange(this.value);
  }
}
