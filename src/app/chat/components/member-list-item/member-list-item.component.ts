import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupMemberDto } from '../../../api/models/group-member-dto';
import { CommonTooltipDirective, TooltipPosition } from '../../../shared/components/common-tooltip/common-tooltip.component';
import { TranslatePipe, I18nService } from '../../../core/i18n';
import { DateTimeFormatService } from '../../../core/services/datetime-format.service';

/**
 * Member list item component for displaying individual group members
 *
 * Features:
 * - Displays member avatar, name, role
 * - Admin management actions (Make Admin, Remove)
 * - Permission-based button states
 * - Tooltips for disabled actions
 * - OnPush change detection
 * - Accessible markup
 *
 * @example
 * ```typescript
 * <app-member-list-item
 *   [member]="member"
 *   [isActionAllowed]="isAdmin"
 *   [isSelf]="member.userId === currentUserId"
 *   [isProcessing]="loadingMemberId === member.userId"
 *   (makeAdmin)="onMakeAdmin(member.userId)"
 *   (remove)="onRemove(member.userId)"
 *   (memberClick)="onMemberClick(member.userId)">
 * </app-member-list-item>
 * ```
 */
@Component({
  selector: 'app-member-list-item',
  standalone: true,
  imports: [CommonModule, CommonTooltipDirective, TranslatePipe],
  templateUrl: './member-list-item.component.html',
  styleUrls: ['./member-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberListItemComponent {
  /**
   * Member data
   */
  @Input() member!: GroupMemberDto;

  /**
   * Whether the current user has permission to manage members
   */
  @Input() isActionAllowed: boolean = false;

  /**
   * Whether this member is the current user
   */
  @Input() isSelf: boolean = false;

  /**
   * Whether an action is currently being processed for this member
   */
  @Input() isProcessing: boolean = false;

  /**
   * Emitted when Make Admin button is clicked
   */
  @Output() makeAdmin = new EventEmitter<string>();

  /**
   * Emitted when Remove button is clicked
   */
  @Output() remove = new EventEmitter<string>();

  /**
   * Emitted when member name/avatar is clicked
   */
  @Output() memberClick = new EventEmitter<string>();

  // Expose TooltipPosition enum to template
  readonly TooltipPosition = TooltipPosition;

  constructor(
    private i18n: I18nService,
    private dateTimeFormatService: DateTimeFormatService
  ) {}

  /**
   * Check if member is an admin
   */
  get isAdmin(): boolean {
    return this.member.role === 'admin';
  }

  /**
   * Check if Make Admin button should be disabled
   */
  get isMakeAdminDisabled(): boolean {
    return !this.isActionAllowed || this.isSelf || this.isAdmin || this.isProcessing;
  }

  /**
   * Check if Remove button should be disabled
   */
  get isRemoveDisabled(): boolean {
    return !this.isActionAllowed || this.isSelf || this.isProcessing;
  }

  /**
   * Get tooltip for Make Admin button
   */
  get makeAdminTooltip(): string {
    if (!this.isActionAllowed) {
      return this.i18n.t('dialogs.group-information.tabs.members.actions.promote-button.tooltip.member.disabled');
    }
    if (this.isSelf) {
      // Same message as admin disabled - cannot change own role
      return this.i18n.t('dialogs.group-information.tabs.members.actions.promote-button.tooltip.admin.disabled');
    }
    if (this.isAdmin) {
      // User is already an admin - use member enabled tooltip as fallback
      return this.i18n.t('dialogs.group-information.tabs.members.actions.promote-button.tooltip.member.enabled');
    }
    if (this.isProcessing) {
      return this.i18n.t('dialogs.group-information.tabs.members.actions.promote-button.loading-label');
    }
    return this.i18n.t('dialogs.group-information.tabs.members.actions.promote-button.tooltip.admin.enabled');
  }

  /**
   * Get tooltip for Remove button
   */
  get removeTooltip(): string {
    if (!this.isActionAllowed) {
      return this.i18n.t('dialogs.group-information.tabs.members.actions.remove-button.tooltip.member.disabled');
    }
    if (this.isSelf) {
      return this.i18n.t('dialogs.group-information.tabs.members.actions.remove-button.tooltip.admin.disabled');
    }
    if (this.isProcessing) {
      return this.i18n.t('dialogs.group-information.tabs.members.actions.remove-button.loading-label');
    }
    return this.i18n.t('dialogs.group-information.tabs.members.actions.remove-button.tooltip.admin.enabled');
  }

  /**
   * Get translated role label
   */
  get roleLabel(): string {
    return this.isAdmin 
      ? this.i18n.t('dialogs.group-information.tabs.members.roles.admin')
      : this.i18n.t('dialogs.group-information.tabs.members.roles.member');
  }

  /**
   * Get member initials for avatar
   */
  get memberInitials(): string {
    if (this.member.fullName) {
      const names = this.member.fullName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return this.member.fullName[0].toUpperCase();
    }
    if (this.member.userName) {
      return this.member.userName.substring(0, 2).toUpperCase();
    }
    return '??';
  }

  /**
   * Handle Make Admin button click
   */
  onMakeAdminClick(): void {
    if (!this.isMakeAdminDisabled && this.member.userId) {
      this.makeAdmin.emit(this.member.userId);
    }
  }

  /**
   * Handle Remove button click
   */
  onRemoveClick(): void {
    if (!this.isRemoveDisabled && this.member.userId) {
      this.remove.emit(this.member.userId);
    }
  }

  /**
   * Handle member click (avatar or name)
   */
  onMemberClickHandler(): void {
    if (this.member.userId) {
      this.memberClick.emit(this.member.userId);
    }
  }

  /**
   * Formats a given date-time string into a professional tooltip with user's time format
   *
   * @param {string} [timeString] - The ISO 8601 date-time string (e.g., "2025-10-29T14:30:00").
   *                                If no string is provided, returns an empty string.
   *
   * @returns {string} A formatted string for display in a tooltip.
   *                   Example: "2 January 2025, 2:30 PM" (12h format)
   *                            "2 January 2025, 14:30" (24h format)
   */
  getDateTimeTooltip(timeString?: string): string {
    if (!timeString) return '';
    return this.dateTimeFormatService.formatDateTimeTooltip(timeString);
  }
}
