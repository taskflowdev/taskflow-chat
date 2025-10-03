import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupsService } from '../../../api/services/groups.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-create-group-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-group-dialog.component.html',
  styleUrls: ['./create-group-dialog.component.scss']
})
export class CreateGroupDialogComponent implements OnInit {
  createGroupForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private groupsService: GroupsService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.createGroupForm = this.fb.group({
      groupName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]]
    });
  }

  getFieldError(fieldName: string): boolean {
    const field = this.createGroupForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.createGroupForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const groupName = this.createGroupForm.value.groupName.trim();

    this.groupsService.apiGroupsPost$Json({
      body: {
        name: groupName,
        isPublic: false
      }
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.toastService.showSuccess('Group created successfully!', 'Success');
          this.closeDialog();
          // Optionally navigate to the new group or refresh the list
          window.location.reload();
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
