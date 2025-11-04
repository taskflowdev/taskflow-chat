/**
 * DTO for group membership change events
 * Emitted when a user joins, leaves, or is removed from a group
 */
export interface GroupMembershipChangedDto {
  /**
   * Group ID where the membership changed
   */
  groupId: string;

  /**
   * User ID whose membership changed
   */
  userId: string;

  /**
   * User display name
   */
  userName: string;

  /**
   * Type of membership change
   */
  changeType: 'added' | 'removed' | 'left' | 'roleChanged';

  /**
   * New role (only for roleChanged type)
   */
  newRole?: 'member' | 'admin';

  /**
   * Timestamp of the change
   */
  timestamp: string;

  /**
   * ID of the user who made the change (admin who removed/added)
   */
  changedBy?: string;
}
