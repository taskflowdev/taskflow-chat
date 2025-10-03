import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-common-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="common-input-container">
      <label *ngIf="label" [for]="id" class="form-label">{{ label }}</label>
      <input
        [type]="type"
        [id]="id"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="form-control"
        [class.is-invalid]="isInvalid"
        [autocomplete]="autocomplete"
      />
      <div class="error-message" *ngIf="errorMessage && isInvalid">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .common-input-container {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .form-control {
      width: 100%;
      background: black;
      border: 1px solid #444444;
      border-radius: 6px;
      color: white;
      font-size: 0.875rem;
      padding: 0.75rem 0.875rem;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      background: black;
      border-color: #666666;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
      outline: none;
    }

    .form-control::placeholder {
      color: #888888;
    }

    .form-control.is-invalid {
      border-color: #e74c3c;
    }

    .form-control:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.75rem;
      margin-top: 0.375rem;
      display: block;
    }

    @media (max-width: 640px) {
      .form-label {
        font-size: 0.813rem;
      }

      .form-control {
        font-size: 0.813rem;
      }

      .error-message {
        font-size: 0.688rem;
      }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonInputComponent),
      multi: true
    }
  ]
})
export class CommonInputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() disabled = false;
  @Input() isInvalid = false;
  @Input() errorMessage?: string;
  @Input() autocomplete = 'off';
  @Input() id = `input-${Math.random().toString(36).substr(2, 9)}`;

  value = '';

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: string): void {
    this.value = value || '';
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

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }
}
