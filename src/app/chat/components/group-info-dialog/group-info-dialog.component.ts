import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { GroupsService } from '../../../api/services/groups.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CommonInputComponent } from '../../../shared/components/common-form-controls/common-input.component';
import { CommonButtonComponent } from '../../../shared/components/common-form-controls/common-button.component';
import { CommonToggleComponent } from '../../../shared/components/common-form-controls/common-toggle.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

export interface GroupInfo {
  groupId: string;
  name: string;
  visibility: string;
  memberCount?: number;
  createdAt?: string;
}

/**
 * Enterprise-level Group Info Dialog Component
 * 
 * Features:
 * - View and edit group information
 * - Delete group with confirmation
 * - Update group settings (name, visibility)
 * - Real-time validation and error handling
 */
@Component({
  selector: 'app-group-info-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonInputComponent,
    CommonButtonComponent,
    CommonToggleComponent,
    SkeletonLoaderComponent,
    ConfirmationDialogComponent
  ],
  templateUrl: './group-info-dialog.component.html',
  styleUrls: ['./group-info-dialog.component.scss']
})
export class GroupInfoDialogComponent implements OnInit {
  @Input() groupId!: string;
  @Input() triggerDelete = false; // Auto-trigger delete confirmation when true
  @Output() closed = new EventEmitter<void>();
  @Output() groupUpdated = new EventEmitter<void>();
  @Output() groupDeleted = new EventEmitter<string>();

  groupInfoForm!: FormGroup;
  isLoading = false;
  isLoadingDetails = true;
  isDeleting = false;
  showDeleteConfirmation = false;
  groupInfo: GroupInfo | null = null;

  constructor(
    private fb: FormBuilder,
    private groupsService: GroupsService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.groupInfoForm = this.fb.group({
      groupName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      isPublic: [false]
    });

    this.loadGroupDetails();
    
    // Auto-trigger delete confirmation if requested
    if (this.triggerDelete) {
      // Use setTimeout to ensure dialog is rendered first
      setTimeout(() => {
        this.showDeleteDialog();
      }, 100);
    }
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
            visibility: response.data.visibility || 'Private',
            memberCount: response.data.memberCount,
            createdAt: response.data.createdAt
          };

          // Populate form with current values
          this.groupInfoForm.patchValue({
            groupName: this.groupInfo.name,
            isPublic: this.groupInfo.visibility === 'Public'
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
    if (this.groupInfoForm.invalid || this.isLoading || !this.groupInfo) {
      return;
    }

    this.isLoading = true;
    const formValue = this.groupInfoForm.value;
    const groupName = formValue.groupName.trim();
    const isPublic = formValue.isPublic;
    const newVisibility = isPublic ? 'Public' : 'Private';

    // Check what changed
    const nameChanged = groupName !== this.groupInfo.name;
    const visibilityChanged = newVisibility !== this.groupInfo.visibility;

    if (!nameChanged && !visibilityChanged) {
      // Nothing to update
      this.isLoading = false;
      this.toastService.showInfo('No changes to save.', 'Info');
      return;
    }

    // Prepare update requests
    const updates = [];
    
    if (nameChanged) {
      updates.push(
        this.groupsService.apiGroupsIdNamePut$Json({
          id: this.groupId,
          body: { name: groupName }
        }).pipe(
          catchError(error => {
            console.error('Name update failed:', error);
            return of({ success: false, message: 'Failed to update name', data: null });
          })
        )
      );
    }

    if (visibilityChanged) {
      updates.push(
        this.groupsService.apiGroupsIdVisibilityPut$Json({
          id: this.groupId,
          body: { visibility: newVisibility }
        }).pipe(
          catchError(error => {
            console.error('Visibility update failed:', error);
            return of({ success: false, message: 'Failed to update visibility', data: null });
          })
        )
      );
    }

    // Execute all updates
    forkJoin(updates).subscribe({
      next: (responses) => {
        this.isLoading = false;
        
        // Check if all updates succeeded
        const allSucceeded = responses.every(r => r.success);
        
        if (allSucceeded) {
          this.toastService.showSuccess('Group information updated.', 'Success');
          this.groupUpdated.emit();
          this.closeDialog();
        } else {
          const failedUpdates = responses
            .filter(r => !r.success)
            .map(r => r.message)
            .join(', ');
          this.toastService.showError(failedUpdates || 'Some updates failed', 'Error');
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

  /**
   * Show delete confirmation dialog
   */
  showDeleteDialog(): void {
    this.showDeleteConfirmation = true;
  }

  /**
   * Cancel delete operation
   */
  cancelDelete(): void {
    this.showDeleteConfirmation = false;
  }

  /**
   * Confirm and execute group deletion
   * 
   * This method:
   * 1. Calls the API to delete the group
   * 2. Shows success/error toast
   * 3. Emits groupDeleted event
   * 4. Closes the dialog
   * 5. Navigates back to chat list
   */
  confirmDelete(): void {
    if (this.isDeleting || !this.groupId) {
      return;
    }

    this.isDeleting = true;

    this.groupsService.apiGroupsIdDelete$Json({ id: this.groupId }).subscribe({
      next: (response) => {
        this.isDeleting = false;
        this.showDeleteConfirmation = false;

        if (response.success) {
          this.toastService.showSuccess(
            'Group and all associated data have been permanently deleted.',
            'Group Deleted'
          );
          
          // Emit event to parent component
          this.groupDeleted.emit(this.groupId);
          
          // Close the dialog
          this.closeDialog();
          
          // Navigate to chat list
          this.router.navigate(['/chat']);
        } else {
          this.toastService.showError(
            response.message || 'Failed to delete group',
            'Delete Failed'
          );
        }
      },
      error: (error) => {
        this.isDeleting = false;
        this.showDeleteConfirmation = false;
        
        const errorMessage = error?.error?.message 
          || error?.message 
          || 'Failed to delete group. Please try again.';
        
        this.toastService.showError(errorMessage, 'Delete Failed');
      }
    });
  }
}
