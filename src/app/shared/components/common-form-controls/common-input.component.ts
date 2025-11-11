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
      background: var(--taskflow-color-common-input-bg);
      border: 1px solid var(--taskflow-color-common-input-border) !important;
      border-radius: 6px;
      color: var(--taskflow-color-common-input-text);
      font-size: 0.875rem;
      padding: 0.75rem 0.875rem;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      background: var(--taskflow-color-common-input-bg) !important;
      border-color: var(--taskflow-color-common-input-border-focus) !important;
      box-shadow: 0 0 0 2px var(--taskflow-color-common-input-box-shadow) !important;
      outline: none;
    }

    .form-control::placeholder {
      color: var(--taskflow-color-common-input-placeholder-text) !important;
    }

    .form-control.is-invalid {
      border-color: var(--taskflow-color-common-input-invalid-border) !important;
    }

    .form-control:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-message {
      min-height: 1rem;
      color: var(--taskflow-color-common-input-invalid-error-msg-text);
      font-size: 0.85rem;
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

  onChange: any = () => { };
  onTouched: any = () => { };

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
