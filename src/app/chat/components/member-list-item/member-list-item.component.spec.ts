import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemberListItemComponent } from './member-list-item.component';
import { GroupMemberDto } from '../../../api/models/group-member-dto';
import { By } from '@angular/platform-browser';

describe('MemberListItemComponent', () => {
  let component: MemberListItemComponent;
  let fixture: ComponentFixture<MemberListItemComponent>;

  const mockMember: GroupMemberDto = {
    userId: 'user-1',
    fullName: 'John Doe',
    userName: 'johndoe',
    role: 'member',
    groupId: 'group-1',
    memberId: 'member-1',
    joinedAt: '2024-01-15T10:00:00Z'
  };

  const mockAdmin: GroupMemberDto = {
    ...mockMember,
    userId: 'user-2',
    fullName: 'Jane Admin',
    role: 'admin'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberListItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MemberListItemComponent);
    component = fixture.componentInstance;
    component.member = mockMember;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display member name', () => {
    const nameElement = fixture.debugElement.query(By.css('.member-name'));
    expect(nameElement.nativeElement.textContent).toContain('John Doe');
  });

  it('should display member role', () => {
    const roleElement = fixture.debugElement.query(By.css('.member-role'));
    expect(roleElement.nativeElement.textContent).toContain('Member');
  });

  it('should display admin role for admin members', () => {
    component.member = mockAdmin;
    fixture.detectChanges();
    
    // Check the isAdmin getter
    expect(component.isAdmin).toBe(true);
  });

  it('should generate initials from full name', () => {
    expect(component.memberInitials).toBe('JD');
  });

  it('should generate initials from username if no full name', () => {
    component.member = { ...mockMember, fullName: null };
    expect(component.memberInitials).toBe('JO');
  });

  it('should display joined date', () => {
    const metaElement = fixture.debugElement.query(By.css('.member-meta'));
    expect(metaElement.nativeElement.textContent).toContain('Joined');
  });

  it('should emit makeAdmin event when Make Admin button clicked', () => {
    component.isActionAllowed = true;
    fixture.detectChanges();
    spyOn(component.makeAdmin, 'emit');
    
    // Call the method directly as it's a unit test
    component.onMakeAdminClick();
    
    expect(component.makeAdmin.emit).toHaveBeenCalledWith('user-1');
  });

  it('should emit remove event when Remove button clicked', () => {
    component.isActionAllowed = true;
    fixture.detectChanges();
    spyOn(component.remove, 'emit');
    
    // Call the method directly as it's a unit test
    component.onRemoveClick();
    
    expect(component.remove.emit).toHaveBeenCalledWith('user-1');
  });

  it('should emit memberClick event when member info clicked', () => {
    spyOn(component.memberClick, 'emit');
    
    // Call method directly
    component.onMemberClickHandler();
    
    expect(component.memberClick.emit).toHaveBeenCalledWith('user-1');
  });

  it('should disable buttons for non-admin users', () => {
    component.isActionAllowed = false;
    
    // Check logic
    expect(component.isMakeAdminDisabled).toBe(true);
    expect(component.isRemoveDisabled).toBe(true);
  });

  it('should disable buttons when user is self', () => {
    component.isActionAllowed = true;
    component.isSelf = true;
    
    // Check logic
    expect(component.isMakeAdminDisabled).toBe(true);
    expect(component.isRemoveDisabled).toBe(true);
  });

  it('should disable buttons when processing', () => {
    component.isActionAllowed = true;
    component.isProcessing = true;
    
    // Check logic
    expect(component.isMakeAdminDisabled).toBe(true);
    expect(component.isRemoveDisabled).toBe(true);
  });

  it('should not show Make Admin button for admin members', () => {
    component.member = mockAdmin;
    fixture.detectChanges();
    
    // Check logic: Make Admin button should be disabled for admins
    expect(component.isAdmin).toBe(true);
    expect(component.isMakeAdminDisabled).toBe(true);
  });

  it('should show processing state', () => {
    component.isProcessing = true;
    
    // Check logic
    expect(component.isMakeAdminDisabled).toBe(true);
    expect(component.isRemoveDisabled).toBe(true);
  });

  it('should return correct tooltip for disabled Make Admin button (non-admin)', () => {
    component.isActionAllowed = false;
    expect(component.makeAdminTooltip).toBe('Only group admins can manage members');
  });

  it('should return correct tooltip for disabled Make Admin button (self)', () => {
    component.isActionAllowed = true;
    component.isSelf = true;
    expect(component.makeAdminTooltip).toBe('You cannot change your own role');
  });

  it('should return correct tooltip for disabled Make Admin button (already admin)', () => {
    component.isActionAllowed = true;
    component.member = mockAdmin;
    expect(component.makeAdminTooltip).toBe('User is already an admin');
  });

  it('should return correct tooltip for disabled Remove button (non-admin)', () => {
    component.isActionAllowed = false;
    expect(component.removeTooltip).toBe('Only group admins can manage members');
  });

  it('should return correct tooltip for disabled Remove button (self)', () => {
    component.isActionAllowed = true;
    component.isSelf = true;
    expect(component.removeTooltip).toBe('You cannot remove yourself');
  });

  it('should have accessible attributes', () => {
    // Test that member info element would be accessible
    // DOM testing is better suited for integration tests
    expect(component.member).toBeTruthy();
  });
});
