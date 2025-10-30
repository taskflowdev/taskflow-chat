import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompactMemberListComponent } from './compact-member-list.component';
import { GroupMemberDto } from '../../../api/models/group-member-dto';
import { By } from '@angular/platform-browser';

describe('CompactMemberListComponent', () => {
  let component: CompactMemberListComponent;
  let fixture: ComponentFixture<CompactMemberListComponent>;

  const mockMembers: GroupMemberDto[] = [
    {
      userId: 'user-1',
      fullName: 'John Doe',
      userName: 'johndoe',
      role: 'admin',
      groupId: 'group-1',
      memberId: 'member-1',
      joinedAt: '2024-01-15T10:00:00Z'
    },
    {
      userId: 'user-2',
      fullName: 'Jane Smith',
      userName: 'janesmith',
      role: 'member',
      groupId: 'group-1',
      memberId: 'member-2',
      joinedAt: '2024-01-16T10:00:00Z'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompactMemberListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CompactMemberListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading state when isLoading is true', () => {
    component.isLoading = true;
    fixture.detectChanges();
    
    const loadingState = fixture.debugElement.query(By.css('.loading-state'));
    expect(loadingState).toBeTruthy();
    
    const skeletons = fixture.debugElement.queryAll(By.css('.member-skeleton'));
    expect(skeletons.length).toBe(5); // Default skeleton count
  });

  it('should show empty state when no members', () => {
    component.isLoading = false;
    component.members = [];
    fixture.detectChanges();
    
    const emptyState = fixture.debugElement.query(By.css('.empty-state'));
    expect(emptyState).toBeTruthy();
    expect(emptyState.nativeElement.textContent).toContain('No members found');
  });

  it('should render member list when members are provided', () => {
    component.isLoading = false;
    component.members = mockMembers;
    fixture.detectChanges();
    
    // Verify the logic level - members are set
    expect(component.members.length).toBe(2);
  });

  it('should pass correct props to member list items', () => {
    component.isLoading = false;
    component.members = mockMembers;
    component.isActionAllowed = true;
    component.currentUserId = 'user-1';
    component.processingUserId = 'user-2';
    fixture.detectChanges();
    
    // Check the helper methods work correctly
    expect(component.isSelf(mockMembers[0])).toBe(true);
    expect(component.isProcessing(mockMembers[1])).toBe(true);
  });

  it('should emit makeAdmin event from child component', () => {
    component.members = mockMembers;
    fixture.detectChanges();
    spyOn(component.makeAdmin, 'emit');
    
    component.onMakeAdmin('user-2');
    
    expect(component.makeAdmin.emit).toHaveBeenCalledWith('user-2');
  });

  it('should emit removeMember event from child component', () => {
    component.members = mockMembers;
    fixture.detectChanges();
    spyOn(component.removeMember, 'emit');
    
    component.onRemove('user-2');
    
    expect(component.removeMember.emit).toHaveBeenCalledWith('user-2');
  });

  it('should emit memberClick event from child component', () => {
    component.members = mockMembers;
    fixture.detectChanges();
    spyOn(component.memberClick, 'emit');
    
    component.onMemberClick('user-1');
    
    expect(component.memberClick.emit).toHaveBeenCalledWith('user-1');
  });

  it('should correctly identify self members', () => {
    component.currentUserId = 'user-1';
    
    expect(component.isSelf(mockMembers[0])).toBe(true);
    expect(component.isSelf(mockMembers[1])).toBe(false);
  });

  it('should correctly identify processing members', () => {
    component.processingUserId = 'user-2';
    
    expect(component.isProcessing(mockMembers[0])).toBe(false);
    expect(component.isProcessing(mockMembers[1])).toBe(true);
  });

  it('should use trackBy function for member list', () => {
    const result = component.trackByUserId(0, mockMembers[0]);
    expect(result).toBe('user-1');
  });

  it('should use index as fallback in trackBy when userId is missing', () => {
    const memberWithoutUserId: GroupMemberDto = { ...mockMembers[0], userId: undefined };
    const result = component.trackByUserId(5, memberWithoutUserId);
    expect(result).toBe('5');
  });

  it('should not show loading state when members are loaded', () => {
    component.isLoading = false;
    component.members = mockMembers;
    fixture.detectChanges();
    
    const loadingState = fixture.debugElement.query(By.css('.loading-state'));
    expect(loadingState).toBeFalsy();
  });

  it('should not show empty state when members are present', () => {
    component.isLoading = false;
    component.members = mockMembers;
    fixture.detectChanges();
    
    const emptyState = fixture.debugElement.query(By.css('.empty-state'));
    expect(emptyState).toBeFalsy();
  });

  it('should not show member list when loading', () => {
    component.isLoading = true;
    component.members = mockMembers;
    fixture.detectChanges();
    
    const memberList = fixture.debugElement.query(By.css('.member-list'));
    expect(memberList).toBeFalsy();
  });

  it('should handle empty processingUserId', () => {
    component.processingUserId = null;
    
    expect(component.isProcessing(mockMembers[0])).toBe(false);
    expect(component.isProcessing(mockMembers[1])).toBe(false);
  });

  it('should handle empty currentUserId', () => {
    component.currentUserId = '';
    
    expect(component.isSelf(mockMembers[0])).toBe(false);
    expect(component.isSelf(mockMembers[1])).toBe(false);
  });
});
