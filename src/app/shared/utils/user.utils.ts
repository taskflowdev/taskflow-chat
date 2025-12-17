import { AuthUser } from '../../auth/services/auth.service';

/**
 * Utility functions for user-related operations
 */

/**
 * Get user initials for avatar display
 * @param user - The user object
 * @returns Two-letter initials in uppercase
 */
export function getUserInitials(user: AuthUser | null): string {
  if (!user) {
    return 'U';
  }

  if (user.fullName) {
    const names = user.fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.fullName.substring(0, 2).toUpperCase();
  }
  
  return user.userName?.substring(0, 2).toUpperCase() || 'U';
}
