import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupsService } from '../../../api/services/groups.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CommonInputComponent } from '../../../shared/components/common-form-controls/common-input.component';
import { CommonButtonComponent } from '../../../shared/components/common-form-controls/common-button.component';
import { CommonToggleComponent } from '../../../shared/components/common-form-controls/common-toggle.component';
import { TranslatePipe, I18nService } from '../../../core/i18n';

@Component({
  selector: 'app-create-group-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonInputComponent,
    CommonButtonComponent,
    CommonToggleComponent,
    TranslatePipe
  ],
  templateUrl: './create-group-dialog.component.html',
  styleUrls: ['./create-group-dialog.component.scss']
})
export class CreateGroupDialogComponent implements OnInit {
  createGroupForm!: FormGroup;
  isLoading = false;

  @Output() groupCreated = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private groupsService: GroupsService,
    private toastService: ToastService,
    private router: Router,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.createGroupForm = this.fb.group({
      groupName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      isPublic: [false]
    });
  }

  getFieldError(fieldName: string): boolean {
    const field = this.createGroupForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.createGroupForm.get(fieldName);
    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return this.i18n.t('dialogs.create-group.controls.group-name.errors.required');
    }
    if (field.errors['minlength']) {
      // Note: The JSON translation key for min-length validation uses 'max-length' key
      // which contains the message "Group name must be at least 3 characters"
      return this.i18n.t('dialogs.create-group.controls.group-name.errors.max-length');
    }
    if (field.errors['maxlength']) {
      return this.i18n.t('dialogs.create-group.controls.group-name.errors.max-length');
    }
    return '';
  }

  onSubmit(): void {
    if (this.createGroupForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const formValue = this.createGroupForm.value;
    const groupName = formValue.groupName.trim();
    const isPublic = formValue.isPublic;

    this.groupsService.apiGroupsPost$Json({
      body: {
        name: groupName,
        isPublic: isPublic
      }
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.toastService.showSuccess('Group created.', 'Success');
          this.closeDialog();
          // Emit event to refresh the chat list instead of full page reload
          this.groupCreated.emit();
        } else {
          this.toastService.showError(response.message || 'Failed to create group', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || error?.message || 'Failed to create group. Please try again.';
        this.toastService.showError(errorMessage, 'Error');
      }
    });
  }

  closeDialog(): void {
    // Remove the URL fragment
    this.router.navigate([], { fragment: undefined });
  }
}
