import { AuthUser } from '../../auth/services/auth.service';

/**
 * Utility functions for user-related operations
 */

/**
 * Get initials from a display name.
 * @param name - Full name or username
 * @param fallback - Fallback value when name is empty
 * @returns Two-letter initials in uppercase
 */
export function getInitialsFromName(name: string | null | undefined, fallback: string = 'U'): string {
  if (!name || name.trim().length === 0) {
    return fallback;
  }

  const names = name.trim().split(/\s+/);
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  return names[0].substring(0, 2).toUpperCase();
}

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
    return getInitialsFromName(user.fullName, 'U');
  }

  return getInitialsFromName(user.userName, 'U');
}
