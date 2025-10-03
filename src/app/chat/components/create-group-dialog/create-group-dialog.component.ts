import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupsService } from '../../../api/services/groups.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CommonInputComponent } from '../../../shared/components/common-form-controls/common-input.component';
import { CommonButtonComponent } from '../../../shared/components/common-form-controls/common-button.component';
import { CommonToggleComponent } from '../../../shared/components/common-form-controls/common-toggle.component';

@Component({
  selector: 'app-create-group-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonInputComponent,
    CommonButtonComponent,
    CommonToggleComponent
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
    private router: Router
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
      return 'Group name is required';
    }
    if (field.errors['minlength']) {
      return 'Group name must be at least 3 characters';
    }
    if (field.errors['maxlength']) {
      return 'Group name must not exceed 50 characters';
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
          this.toastService.showSuccess('Group created successfully!', 'Success');
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
