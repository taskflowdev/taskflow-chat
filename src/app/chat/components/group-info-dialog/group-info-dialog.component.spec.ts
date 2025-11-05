import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupInfoDialogComponent } from './group-info-dialog.component';
import { GroupsService } from '../../../api/services/groups.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { GroupDto } from '../../../api/models/group-dto';
import { GroupMemberDto } from '../../../api/models/group-member-dto';
import { By } from '@angular/platform-browser';

describe('GroupInfoDialogComponent', () => {
  let component: GroupInfoDialogComponent;
  let fixture: ComponentFixture<GroupInfoDialogComponent>;
  let mockGroupsService: jasmine.SpyObj<GroupsService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockGroup: GroupDto = {
    groupId: 'group-1',
    name: 'Test Group',
    isPublic: false,
    memberCount: 3,
    createdAt: '2024-01-15T10:00:00Z',
    createdBy: 'user-1'
  };

  const mockMembers: GroupMemberDto[] = [
    {
      userId: 'user-1',
      fullName: 'Admin User',
      userName: 'admin',
      role: 'admin',
      groupId: 'group-1',
      memberId: 'member-1',
      joinedAt: '2024-01-15T10:00:00Z'
    },
    {
      userId: 'user-2',
      fullName: 'Regular User',
      userName: 'user',
      role: 'member',
      groupId: 'group-1',
      memberId: 'member-2',
      joinedAt: '2024-01-16T10:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockGroupsService = jasmine.createSpyObj('GroupsService', [
      'apiGroupsIdGet$Json',
      'apiGroupsIdMembersGet$Json',
      'apiGroupsIdNamePut$Json',
      'apiGroupsIdMembersUserIdMakeAdminPost$Json',
      'apiGroupsIdDelete$Json',
      'apiGroupsIdLeavePost$Json',
      'apiGroupsIdVisibilityPut$Json'
    ]);

    mockToastService = jasmine.createSpyObj('ToastService', [
      'showSuccess',
      'showError'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [GroupInfoDialogComponent, ReactiveFormsModule],
      providers: [
        { provide: GroupsService, useValue: mockGroupsService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    mockGroupsService.apiGroupsIdGet$Json.and.returnValue(
      of({ success: true, data: mockGroup, message: '' })
    );

    mockGroupsService.apiGroupsIdMembersGet$Json.and.returnValue(
      of({ success: true, data: mockMembers, message: '' })
    );

    fixture = TestBed.createComponent(GroupInfoDialogComponent);
    component = fixture.componentInstance;
    component.groupId = 'group-1';
    component.currentUserId = 'user-1';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load group details on init', () => {
    fixture.detectChanges();
    
    expect(mockGroupsService.apiGroupsIdGet$Json).toHaveBeenCalledWith({ id: 'group-1' });
    expect(component.group).toEqual(mockGroup);
    expect(component.groupInfoForm.get('groupName')?.value).toBe('Test Group');
  });

  it('should render all three tabs', () => {
    fixture.detectChanges();
    expect(component.tabs.length).toBe(3);
    expect(component.tabs[0].id).toBe('general');
    expect(component.tabs[1].id).toBe('members');
    expect(component.tabs[2].id).toBe('settings');
  });

  it('should start with General tab active', () => {
    fixture.detectChanges();
    expect(component.activeTab).toBe('general');
  });

  it('should load members when switching to Members tab', () => {
    fixture.detectChanges();
    component.onTabChange('members');
    
    expect(mockGroupsService.apiGroupsIdMembersGet$Json).toHaveBeenCalledWith({ id: 'group-1' });
    expect(component.members).toEqual(mockMembers);
  });

  it('should not reload members if already loaded', () => {
    fixture.detectChanges();
    component.onTabChange('members');
    mockGroupsService.apiGroupsIdMembersGet$Json.calls.reset();
    component.onTabChange('general');
    component.onTabChange('members');
    
    expect(mockGroupsService.apiGroupsIdMembersGet$Json).not.toHaveBeenCalled();
  });

  it('should determine admin status correctly', () => {
    fixture.detectChanges();
    component.members = mockMembers;
    component.currentUserId = 'user-1';
    
    expect(component.isAdmin).toBe(true);
  });

  it('should determine non-admin status correctly', () => {
    fixture.detectChanges();
    component.members = mockMembers;
    component.currentUserId = 'user-2';
    fixture.detectChanges();
    
    expect(component.isAdmin).toBe(false);
  });

  it('should update group name successfully', () => {
    mockGroupsService.apiGroupsIdNamePut$Json.and.returnValue(
      of({ success: true, data: null, message: '' })
    );
    
    fixture.detectChanges();
    component.groupInfoForm.patchValue({ groupName: 'Updated Group' });
    component.onSubmit();
    
    expect(mockGroupsService.apiGroupsIdNamePut$Json).toHaveBeenCalledWith({
      id: 'group-1',
      body: { name: 'Updated Group' }
    });
    expect(mockToastService.showSuccess).toHaveBeenCalled();
  });

  it('should not submit if form is invalid', () => {
    fixture.detectChanges();
    component.groupInfoForm.patchValue({ groupName: '' }); // Invalid: required
    component.onSubmit();
    
    expect(mockGroupsService.apiGroupsIdNamePut$Json).not.toHaveBeenCalled();
  });

  it('should not submit if form is pristine', () => {
    fixture.detectChanges();
    component.groupInfoForm.markAsPristine();
    const spy = spyOn(component, 'onSubmit').and.callThrough();
    component.onSubmit();
    
    // Should return early, not call the API
    expect(mockGroupsService.apiGroupsIdNamePut$Json).not.toHaveBeenCalled();
  });

  it('should promote member to admin successfully', () => {
    mockGroupsService.apiGroupsIdMembersUserIdMakeAdminPost$Json.and.returnValue(
      of({ success: true, data: null, message: '' })
    );
    
    fixture.detectChanges();
    component.members = mockMembers;
    component.currentUserId = 'user-1'; // Admin
    component.onMakeAdmin('user-2');
    
    expect(mockGroupsService.apiGroupsIdMembersUserIdMakeAdminPost$Json).toHaveBeenCalledWith({
      id: 'group-1',
      userId: 'user-2'
    });
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(component.members[1].role).toBe('admin');
  });

  it('should not allow non-admin to promote members', () => {
    fixture.detectChanges();
    component.members = mockMembers;
    component.currentUserId = 'user-2'; // Not admin
    
    // Check that isAdmin returns false
    expect(component.isAdmin).toBe(false);
    
    // Try to call onMakeAdmin - it should return early
    component.onMakeAdmin('user-1');
    
    expect(mockGroupsService.apiGroupsIdMembersUserIdMakeAdminPost$Json).not.toHaveBeenCalled();
  });

  it('should show remove member confirmation', () => {
    fixture.detectChanges();
    component.members = mockMembers;
    component.onRemoveMember('user-2');
    
    expect(component.showRemoveMemberConfirmation).toBe(true);
    expect(component.memberToRemove?.userId).toBe('user-2');
  });

  it('should cancel remove member confirmation', () => {
    fixture.detectChanges();
    component.showRemoveMemberConfirmation = true;
    component.memberToRemove = mockMembers[1];
    component.cancelRemoveMember();
    
    expect(component.showRemoveMemberConfirmation).toBe(false);
    expect(component.memberToRemove).toBeNull();
  });

  it('should show delete group confirmation', () => {
    fixture.detectChanges();
    component.showDeleteDialog();
    
    expect(component.showDeleteConfirmation).toBe(true);
  });

  it('should cancel delete group confirmation', () => {
    fixture.detectChanges();
    component.showDeleteConfirmation = true;
    component.cancelDelete();
    
    expect(component.showDeleteConfirmation).toBe(false);
  });

  it('should delete group successfully', () => {
    mockGroupsService.apiGroupsIdDelete$Json.and.returnValue(
      of({ success: true, data: null, message: '' })
    );
    
    fixture.detectChanges();
    spyOn(component.deleted, 'emit');
    spyOn(component.closed, 'emit');
    
    component.confirmDelete();
    
    expect(mockGroupsService.apiGroupsIdDelete$Json).toHaveBeenCalledWith({ id: 'group-1' });
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(component.deleted.emit).toHaveBeenCalledWith('group-1');
    expect(component.closed.emit).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/chat']);
  });

  it('should handle group load error', () => {
    mockGroupsService.apiGroupsIdGet$Json.and.returnValue(
      throwError(() => ({ error: { message: 'Load failed' } }))
    );
    
    fixture.detectChanges();
    
    expect(mockToastService.showError).toHaveBeenCalledWith('Load failed', 'Error');
  });

  it('should handle update error', () => {
    mockGroupsService.apiGroupsIdNamePut$Json.and.returnValue(
      throwError(() => ({ error: { message: 'Update failed' } }))
    );
    
    fixture.detectChanges();
    component.groupInfoForm.patchValue({ groupName: 'New Name' });
    component.onSubmit();
    
    expect(mockToastService.showError).toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    mockGroupsService.apiGroupsIdDelete$Json.and.returnValue(
      throwError(() => ({ error: { message: 'Delete failed' } }))
    );
    
    fixture.detectChanges();
    component.confirmDelete();
    
    expect(mockToastService.showError).toHaveBeenCalled();
  });

  it('should emit closed event when close dialog is called', () => {
    spyOn(component.closed, 'emit');
    component.closeDialog();
    
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should validate group name required', () => {
    fixture.detectChanges();
    const groupNameControl = component.groupInfoForm.get('groupName');
    groupNameControl?.setValue('');
    groupNameControl?.markAsTouched();
    
    expect(component.getFieldError('groupName')).toBe(true);
    expect(component.getErrorMessage('groupName')).toBe('Group name is required');
  });

  it('should validate group name min length', () => {
    fixture.detectChanges();
    const groupNameControl = component.groupInfoForm.get('groupName');
    groupNameControl?.setValue('AB');
    groupNameControl?.markAsTouched();
    
    expect(component.getFieldError('groupName')).toBe(true);
    expect(component.getErrorMessage('groupName')).toBe('Group name must be at least 3 characters');
  });

  it('should validate group name max length', () => {
    fixture.detectChanges();
    const groupNameControl = component.groupInfoForm.get('groupName');
    groupNameControl?.setValue('A'.repeat(51));
    groupNameControl?.markAsTouched();
    
    expect(component.getFieldError('groupName')).toBe(true);
    expect(component.getErrorMessage('groupName')).toBe('Group name must not exceed 50 characters');
  });

  it('should auto-trigger delete confirmation if triggerDelete is true', (done) => {
    component.triggerDelete = true;
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(component.showDeleteConfirmation).toBe(true);
      done();
    }, 150);
  });

  it('should emit updated event on successful group update', () => {
    mockGroupsService.apiGroupsIdNamePut$Json.and.returnValue(
      of({ success: true, data: null, message: '' })
    );
    
    fixture.detectChanges();
    spyOn(component.updated, 'emit');
    component.groupInfoForm.patchValue({ groupName: 'Updated Name' });
    component.onSubmit();
    
    expect(component.updated.emit).toHaveBeenCalled();
  });

  it('should emit membershipChange event on successful promotion', () => {
    mockGroupsService.apiGroupsIdMembersUserIdMakeAdminPost$Json.and.returnValue(
      of({ success: true, data: null, message: '' })
    );
    
    fixture.detectChanges();
    component.members = mockMembers;
    component.currentUserId = 'user-1';
    spyOn(component.membershipChange, 'emit');
    
    component.onMakeAdmin('user-2');
    
    expect(component.membershipChange.emit).toHaveBeenCalledWith({
      userId: 'user-2',
      action: 'makeAdmin'
    });
  });

  // Leave Group Tests
  it('should show leave group confirmation', () => {
    fixture.detectChanges();
    component.showLeaveDialog();
    
    expect(component.showLeaveConfirmation).toBe(true);
  });

  it('should cancel leave group confirmation', () => {
    fixture.detectChanges();
    component.showLeaveConfirmation = true;
    component.cancelLeave();
    
    expect(component.showLeaveConfirmation).toBe(false);
  });

  it('should leave group successfully', () => {
    mockGroupsService.apiGroupsIdLeavePost$Json.and.returnValue(
      of({ success: true, data: null, message: '' })
    );
    
    fixture.detectChanges();
    component.members = mockMembers;
    component.currentUserId = 'user-2'; // Regular member (not last admin)
    spyOn(component.leftGroup, 'emit');
    spyOn(component.closed, 'emit');
    
    component.confirmLeave();
    
    expect(mockGroupsService.apiGroupsIdLeavePost$Json).toHaveBeenCalledWith({ id: 'group-1' });
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(component.leftGroup.emit).toHaveBeenCalledWith('group-1');
    expect(component.closed.emit).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/chat']);
  });

  it('should not allow last admin to leave group', () => {
    fixture.detectChanges();
    // Set up scenario where current user is the only admin
    const singleAdminMembers: GroupMemberDto[] = [
      {
        userId: 'user-1',
        fullName: 'Admin User',
        userName: 'admin',
        role: 'admin',
        groupId: 'group-1',
        memberId: 'member-1',
        joinedAt: '2024-01-15T10:00:00Z'
      },
      {
        userId: 'user-2',
        fullName: 'Regular User',
        userName: 'user',
        role: 'member',
        groupId: 'group-1',
        memberId: 'member-2',
        joinedAt: '2024-01-16T10:00:00Z'
      }
    ];
    
    component.members = singleAdminMembers;
    component.currentUserId = 'user-1';
    
    expect(component.isLastAdmin).toBe(true);
    
    // Try to leave - should be prevented
    component.onLeaveClick();
    
    expect(mockGroupsService.apiGroupsIdLeavePost$Json).not.toHaveBeenCalled();
  });

  it('should determine last admin status correctly', () => {
    fixture.detectChanges();
    
    // Test with multiple admins
    const multipleAdmins: GroupMemberDto[] = [
      {
        userId: 'user-1',
        fullName: 'Admin User 1',
        userName: 'admin1',
        role: 'admin',
        groupId: 'group-1',
        memberId: 'member-1',
        joinedAt: '2024-01-15T10:00:00Z'
      },
      {
        userId: 'user-2',
        fullName: 'Admin User 2',
        userName: 'admin2',
        role: 'admin',
        groupId: 'group-1',
        memberId: 'member-2',
        joinedAt: '2024-01-16T10:00:00Z'
      }
    ];
    
    component.members = multipleAdmins;
    component.currentUserId = 'user-1';
    
    expect(component.isLastAdmin).toBe(false);
  });

  it('should handle leave group error', () => {
    mockGroupsService.apiGroupsIdLeavePost$Json.and.returnValue(
      throwError(() => ({ error: { message: 'Leave failed' } }))
    );
    
    fixture.detectChanges();
    component.members = mockMembers;
    component.currentUserId = 'user-2';
    component.confirmLeave();
    
    expect(mockToastService.showError).toHaveBeenCalled();
  });

  it('should emit leftGroup event on successful leave', () => {
    mockGroupsService.apiGroupsIdLeavePost$Json.and.returnValue(
      of({ success: true, data: null, message: '' })
    );
    
    fixture.detectChanges();
    component.members = mockMembers;
    component.currentUserId = 'user-2';
    spyOn(component.leftGroup, 'emit');
    
    component.confirmLeave();
    
    expect(component.leftGroup.emit).toHaveBeenCalledWith('group-1');
  });

  // Change Visibility Tests
  it('should show change visibility confirmation', () => {
    fixture.detectChanges();
    component.group = mockGroup;
    component.showVisibilityDialog();
    
    expect(component.showVisibilityConfirmation).toBe(true);
  });

  it('should cancel change visibility confirmation', () => {
    fixture.detectChanges();
    component.showVisibilityConfirmation = true;
    component.pendingVisibilityValue = true;
    component.cancelVisibilityChange();
    
    expect(component.showVisibilityConfirmation).toBe(false);
    expect(component.pendingVisibilityValue).toBeNull();
  });

  it('should change visibility successfully', () => {
    mockGroupsService.apiGroupsIdVisibilityPut$Json.and.returnValue(
      of({ success: true, data: { ...mockGroup, isPublic: true }, message: '' })
    );
    
    fixture.detectChanges();
    component.group = mockGroup;
    component.members = mockMembers;
    component.currentUserId = 'user-1'; // Admin
    component.pendingVisibilityValue = true;
    spyOn(component.updated, 'emit');
    
    component.confirmVisibilityChange();
    
    expect(mockGroupsService.apiGroupsIdVisibilityPut$Json).toHaveBeenCalledWith({
      id: 'group-1',
      body: { isPublic: true }
    });
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(component.group.isPublic).toBe(true);
    expect(component.updated.emit).toHaveBeenCalled();
  });

  it('should not allow non-admin to change visibility', () => {
    fixture.detectChanges();
    component.group = mockGroup;
    component.members = mockMembers;
    component.currentUserId = 'user-2'; // Not admin
    
    expect(component.isAdmin).toBe(false);
    
    component.onVisibilityToggle();
    
    expect(mockGroupsService.apiGroupsIdVisibilityPut$Json).not.toHaveBeenCalled();
  });

  it('should handle change visibility error', () => {
    mockGroupsService.apiGroupsIdVisibilityPut$Json.and.returnValue(
      throwError(() => ({ error: { message: 'Visibility change failed' } }))
    );
    
    fixture.detectChanges();
    component.group = mockGroup;
    component.members = mockMembers;
    component.currentUserId = 'user-1'; // Admin
    component.pendingVisibilityValue = true;
    component.confirmVisibilityChange();
    
    expect(mockToastService.showError).toHaveBeenCalled();
  });

  it('should set pending visibility value on toggle', () => {
    fixture.detectChanges();
    component.group = mockGroup;
    component.members = mockMembers;
    component.currentUserId = 'user-1'; // Admin
    
    component.onVisibilityToggle();
    
    expect(component.pendingVisibilityValue).toBe(!mockGroup.isPublic);
    expect(component.showVisibilityConfirmation).toBe(true);
  });
});
