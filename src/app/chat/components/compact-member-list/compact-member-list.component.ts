import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupMemberDto } from '../../../api/models/group-member-dto';
import { MemberListItemComponent } from '../member-list-item/member-list-item.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

/**
 * Compact member list component for displaying group members
 * 
 * Features:
 * - Displays list of members with MemberListItemComponent
 * - Loading state with skeleton loaders
 * - Empty state messaging
 * - Supports virtual scrolling (for future implementation with >50 members)
 * - OnPush change detection
 * 
 * @example
 * ```typescript
 * <app-compact-member-list
 *   [members]="members"
 *   [isLoading]="isLoadingMembers"
 *   [isActionAllowed]="isAdmin"
 *   [currentUserId]="currentUserId"
 *   [processingUserId]="loadingMemberId"
 *   (makeAdmin)="onMakeAdmin($event)"
 *   (removeMember)="onRemoveMember($event)"
 *   (memberClick)="onMemberClick($event)">
 * </app-compact-member-list>
 * ```
 */
@Component({
  selector: 'app-compact-member-list',
  standalone: true,
  imports: [CommonModule, MemberListItemComponent, SkeletonLoaderComponent],
  templateUrl: './compact-member-list.component.html',
  styleUrls: ['./compact-member-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompactMemberListComponent {
  /**
   * Array of group members
   */
  @Input() members: GroupMemberDto[] = [];

  /**
   * Loading state
   */
  @Input() isLoading: boolean = false;

  /**
   * Whether the current user has permission to manage members
   */
  @Input() isActionAllowed: boolean = false;

  /**
   * Current user ID
   */
  @Input() currentUserId: string = '';

  /**
   * User ID of member currently being processed (for loading state)
   */
  @Input() processingUserId: string | null = null;

  /**
   * Emitted when Make Admin button is clicked
   */
  @Output() makeAdmin = new EventEmitter<string>();

  /**
   * Emitted when Remove button is clicked
   */
  @Output() removeMember = new EventEmitter<string>();

  /**
   * Emitted when a member is clicked
   */
  @Output() memberClick = new EventEmitter<string>();

  /**
   * Check if a member is the current user
   */
  isSelf(member: GroupMemberDto): boolean {
    return member.userId === this.currentUserId;
  }

  /**
   * Check if a member is being processed
   */
  isProcessing(member: GroupMemberDto): boolean {
    return this.processingUserId === member.userId;
  }

  /**
   * Handle Make Admin event
   */
  onMakeAdmin(userId: string): void {
    this.makeAdmin.emit(userId);
  }

  /**
   * Handle Remove event
   */
  onRemove(userId: string): void {
    this.removeMember.emit(userId);
  }

  /**
   * Handle member click event
   */
  onMemberClick(userId: string): void {
    this.memberClick.emit(userId);
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByUserId(index: number, member: GroupMemberDto): string {
    return member.userId || index.toString();
  }
}
