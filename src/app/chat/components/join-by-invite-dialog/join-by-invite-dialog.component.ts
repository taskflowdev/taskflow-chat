import { Component, AfterViewInit, ElementRef, EventEmitter, Output, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupsService } from '../../../api/services/groups.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CommonButtonComponent } from '../../../shared/components/common-form-controls/common-button.component';
import { TranslatePipe, I18nService } from '../../../core/i18n';

@Component({
  selector: 'app-join-by-invite-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CommonButtonComponent, TranslatePipe],
  templateUrl: './join-by-invite-dialog.component.html',
  styleUrl: './join-by-invite-dialog.component.scss'
})
export class JoinByInviteDialogComponent implements AfterViewInit {
  @Output() groupSelected = new EventEmitter<string>();
  @Output() groupJoined = new EventEmitter<void>();
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly codeLength = 8;
  joinForm: FormGroup;
  isLoading = false;
  focusedIndex: number | null = null;
  hasInteracted = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private groupsService: GroupsService,
    private toastService: ToastService,
    private i18n: I18nService
  ) {
    this.joinForm = this.fb.group({
      inviteCode: this.fb.array(Array.from({ length: this.codeLength }, () => this.fb.control('')))
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.focusInput(0), 0);
  }

  get codeControls(): FormArray {
    return this.joinForm.get('inviteCode') as FormArray;
  }

  asFormControl(control: AbstractControl): FormControl {
    return control as FormControl;
  }

  get isCodeComplete(): boolean {
    return this.codeControls.controls.every(control => !!control.value);
  }

  onInput(index: number, event: Event): void {
    this.hasInteracted = true;
    const input = event.target as HTMLInputElement;
    const sanitized = this.sanitizeInput(input.value);
    const char = sanitized.slice(-1);

    this.codeControls.at(index).setValue(char);
    input.value = char;

    if (char && index < this.codeLength - 1) {
      this.focusInput(index + 1);
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key.length === 1 || event.key === 'Backspace') {
      this.hasInteracted = true;
    }
    const currentValue = this.codeControls.at(index).value as string;

    if (event.key === 'Backspace' && !currentValue && index > 0) {
      event.preventDefault();
      this.codeControls.at(index - 1).setValue('');
      this.focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < this.codeLength - 1) {
      event.preventDefault();
      this.focusInput(index + 1);
    }
  }

  onPaste(index: number, event: ClipboardEvent): void {
    this.hasInteracted = true;
    event.preventDefault();

    const pasteText = event.clipboardData?.getData('text') || '';
    const sanitized = this.sanitizeInput(pasteText);

    if (!sanitized) {
      return;
    }

    const chars = sanitized.split('');
    let currentIndex = index;

    chars.forEach((char) => {
      if (currentIndex < this.codeLength) {
        this.codeControls.at(currentIndex).setValue(char);
        currentIndex += 1;
      }
    });

    const nextIndex = Math.min(currentIndex, this.codeLength - 1);
    this.focusInput(nextIndex);
  }

  onFocus(index: number): void {
    this.focusedIndex = index;
    this.codeInputs.get(index)?.nativeElement.select();
  }

  onBlur(): void {
    this.focusedIndex = null;
  }

  onSubmit(): void {
    if (!this.isCodeComplete || this.isLoading) {
      return;
    }

    const inviteCode = this.codeControls.value.join('');
    this.isLoading = true;

    this.groupsService.apiGroupsJoinPost$Json({
      body: { inviteCode }
    }).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success && response.data) {
          this.toastService.showSuccess(
            this.i18n.t('dialogs.join-by-invite.notifications.joined'),
            this.i18n.t('dialogs.join-by-invite.notifications.joined-title')
          );

          if (response.data.groupId) {
            this.groupSelected.emit(response.data.groupId);
          }

          this.groupJoined.emit();
          this.closeDialog();
          return;
        }

        const errorMessage = response.message || this.i18n.t('dialogs.join-by-invite.notifications.error');
        this.toastService.showError(errorMessage, this.i18n.t('dialogs.join-by-invite.notifications.error-title'));
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || this.i18n.t('dialogs.join-by-invite.notifications.error');
        this.toastService.showError(errorMessage, this.i18n.t('dialogs.join-by-invite.notifications.error-title'));
      }
    });
  }

  closeDialog(): void {
    this.router.navigate([], { fragment: undefined, queryParamsHandling: 'preserve' });
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }

  onEscapePress(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDialog();
    }
  }

  private focusInput(index: number): void {
    const target = this.codeInputs.get(index)?.nativeElement;
    if (target) {
      target.focus();
      target.select();
    }
  }

  private sanitizeInput(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }
}
