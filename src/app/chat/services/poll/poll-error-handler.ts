/**
 * Centralized error handling for poll operations
 * Maps backend error codes to user-friendly messages
 *
 * @remarks
 * Production-grade error handling that:
 * - Never exposes raw API errors to users
 * - Provides actionable feedback
 * - Supports internationalization (future)
 * - Logs errors for debugging
 */

/**
 * Known poll error codes from backend
 */
export enum PollErrorCode {
  INVALID_POLL_OPTION = 'INVALID_POLL_OPTION',
  MULTIPLE_VOTES_NOT_ALLOWED = 'MULTIPLE_VOTES_NOT_ALLOWED',
  NOT_MEMBER = 'NOT_MEMBER',
  POLL_NOT_FOUND = 'POLL_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<PollErrorCode, string> = {
  [PollErrorCode.INVALID_POLL_OPTION]: 'The selected poll option is no longer valid. Please refresh and try again.',
  [PollErrorCode.MULTIPLE_VOTES_NOT_ALLOWED]: 'This poll only allows one vote. Please unselect your current choice first.',
  [PollErrorCode.NOT_MEMBER]: 'You must be a member of this group to vote in polls.',
  [PollErrorCode.POLL_NOT_FOUND]: 'This poll could not be found. It may have been deleted.',
  [PollErrorCode.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [PollErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [PollErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again later.'
};

/**
 * Structured error response
 */
export interface PollError {
  code: PollErrorCode;
  message: string;
  originalError?: unknown;
}

/**
 * Maps HTTP status codes and error responses to PollErrorCode
 */
function mapErrorCode(error: unknown): PollErrorCode {
  // Handle HTTP errors
  if (error && typeof error === 'object') {
    const httpError = error as { status?: number; error?: { code?: string } };
    
    // Check for backend error code first
    if (httpError.error?.code) {
      const code = httpError.error.code.toUpperCase();
      if (Object.values(PollErrorCode).includes(code as PollErrorCode)) {
        return code as PollErrorCode;
      }
    }
    
    // Map HTTP status codes
    switch (httpError.status) {
      case 400:
        return PollErrorCode.INVALID_POLL_OPTION;
      case 401:
      case 403:
        return PollErrorCode.UNAUTHORIZED;
      case 404:
        return PollErrorCode.POLL_NOT_FOUND;
      case 0:
      case 504:
        return PollErrorCode.NETWORK_ERROR;
    }
  }
  
  return PollErrorCode.UNKNOWN_ERROR;
}

/**
 * Handles and formats poll errors for display
 *
 * @param error - The error to handle (from HTTP, SignalR, or other sources)
 * @returns Structured PollError with user-friendly message
 *
 * @example
 * ```typescript
 * try {
 *   await this.pollApi.vote(...);
 * } catch (error) {
 *   const pollError = handlePollError(error);
 *   this.showError(pollError.message);
 * }
 * ```
 */
export function handlePollError(error: unknown): PollError {
  const code = mapErrorCode(error);
  const message = ERROR_MESSAGES[code];
  
  // Log for debugging (in production, this would go to a logging service)
  console.error('[PollErrorHandler]', { code, error });
  
  return {
    code,
    message,
    originalError: error
  };
}

/**
 * Type guard to check if an error is a PollError
 */
export function isPollError(error: unknown): error is PollError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error
  );
}
