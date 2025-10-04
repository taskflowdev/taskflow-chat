import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { GroupsService } from '../../../api/services/groups.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CommonInputComponent } from '../../../shared/components/common-form-controls/common-input.component';
import { CommonButtonComponent } from '../../../shared/components/common-form-controls/common-button.component';
import { CommonToggleComponent } from '../../../shared/components/common-form-controls/common-toggle.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

export interface GroupInfo {
  groupId: string;
  name: string;
  isPublic: boolean;
  memberCount?: number;
  createdAt?: string;
}

@Component({
  selector: 'app-group-info-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonInputComponent,
    CommonButtonComponent,
    CommonToggleComponent,
    SkeletonLoaderComponent
  ],
  templateUrl: './group-info-dialog.component.html',
  styleUrls: ['./group-info-dialog.component.scss']
})
export class GroupInfoDialogComponent implements OnInit {
  @Input() groupId!: string;
  @Output() closed = new EventEmitter<void>();
  @Output() groupUpdated = new EventEmitter<void>();

  groupInfoForm!: FormGroup;
  isLoading = false;
  isLoadingDetails = true;
  groupInfo: GroupInfo | null = null;

  constructor(
    private fb: FormBuilder,
    private groupsService: GroupsService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.groupInfoForm = this.fb.group({
      groupName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      isPublic: [false]
    });

    this.loadGroupDetails();
  }

  private loadGroupDetails(): void {
    this.isLoadingDetails = true;

    this.groupsService.apiGroupsIdGet$Json({ id: this.groupId }).subscribe({
      next: (response) => {
        this.isLoadingDetails = false;
        if (response.success && response.data) {
          this.groupInfo = {
            groupId: response.data.groupId || '',
            name: response.data.name || '',
            isPublic: response.data.isPublic || false,
            memberCount: response.data.memberCount,
            createdAt: response.data.createdAt
          };

          // Populate form with current values
          this.groupInfoForm.patchValue({
            groupName: this.groupInfo.name,
            isPublic: this.groupInfo.isPublic
          });
        } else {
          this.toastService.showError('Failed to load group details', 'Error');
        }
      },
      error: (error) => {
        this.isLoadingDetails = false;
        const errorMessage = error?.error?.message || error?.message || 'Failed to load group details';
        this.toastService.showError(errorMessage, 'Error');
      }
    });
  }

  getFieldError(fieldName: string): boolean {
    const field = this.groupInfoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.groupInfoForm.get(fieldName);
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
    if (this.groupInfoForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const formValue = this.groupInfoForm.value;
    const groupName = formValue.groupName.trim();

    // Update group name
    this.groupsService.apiGroupsIdNamePut$Json({
      id: this.groupId,
      body: {
        name: groupName
      }
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.toastService.showSuccess('Group information updated.', 'Success');
          this.groupUpdated.emit();
          this.closeDialog();
        } else {
          this.toastService.showError(response.message || 'Failed to update group', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || error?.message || 'Failed to update group. Please try again.';
        this.toastService.showError(errorMessage, 'Error');
      }
    });
  }

  closeDialog(): void {
    this.closed.emit();
  }
}
