import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Time format types supported by the application
 */
export type TimeFormat = '12h' | '24h';

/**
 * Enterprise-grade DateTime Formatting Service
 * 
 * Provides centralized, reusable datetime formatting functionality
 * with support for user-configurable time formats (12h/24h).
 * 
 * Features:
 * - Centralized datetime formatting logic
 * - Support for 12h and 24h time formats
 * - Reactive time format updates via RxJS
 * - Relative time display (Today, Yesterday)
 * - Consistent AM/PM formatting
 * - Tooltip-friendly full datetime display
 * - Production-ready error handling
 * 
 * @example
 * ```typescript
 * constructor(private dateTimeFormat: DateTimeFormatService) {}
 * 
 * // Format time based on user's setting
 * const time = this.dateTimeFormat.formatTime('2025-01-02T14:30:00');
 * 
 * // Format date with relative labels
 * const date = this.dateTimeFormat.formatDate('2025-01-02T14:30:00');
 * 
 * // Get full datetime for tooltip
 * const tooltip = this.dateTimeFormat.formatDateTimeTooltip('2025-01-02T14:30:00');
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class DateTimeFormatService {
  private readonly DEFAULT_TIME_FORMAT: TimeFormat = '12h';
  
  private timeFormatSubject = new BehaviorSubject<TimeFormat>(this.DEFAULT_TIME_FORMAT);
  public timeFormat$: Observable<TimeFormat> = this.timeFormatSubject.asObservable();

  constructor() {}

  /**
   * Set the time format preference
   * @param format - Time format ('12h' or '24h')
   */
  setTimeFormat(format: TimeFormat): void {
    this.timeFormatSubject.next(format);
  }

  /**
   * Get the current time format
   * @returns Current time format setting
   */
  getTimeFormat(): TimeFormat {
    return this.timeFormatSubject.value;
  }

  /**
   * Format time string to display format (HH:MM AM/PM or HH:MM)
   * 
   * @param timeString - ISO 8601 date-time string
   * @param format - Optional override for time format
   * @returns Formatted time string (e.g., "2:30 PM" or "14:30")
   * 
   * @example
   * formatTime('2025-01-02T14:30:00', '12h') // "2:30 PM"
   * formatTime('2025-01-02T14:30:00', '24h') // "14:30"
   */
  formatTime(timeString: string, format?: TimeFormat): string {
    if (!timeString) return '';

    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string provided to formatTime:', timeString);
        return '';
      }

      const timeFormat = format || this.getTimeFormat();

      if (timeFormat === '24h') {
        return this.format24Hour(date);
      } else {
        return this.format12Hour(date);
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  }

  /**
   * Format date with relative labels (Today, Yesterday) or date string
   * 
   * @param timeString - ISO 8601 date-time string
   * @returns Formatted date string (e.g., "Today", "Yesterday", "Jan 2, 2025")
   * 
   * @example
   * formatDate('2025-01-02T14:30:00') // "Today" (if today)
   * formatDate('2025-01-01T14:30:00') // "Yesterday" (if yesterday)
   * formatDate('2024-12-25T14:30:00') // "Dec 25, 2024"
   */
  formatDate(timeString: string): string {
    if (!timeString) return '';

    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string provided to formatDate:', timeString);
        return '';
      }

      const now = new Date();
      
      // Compare dates at midnight to avoid timezone issues
      const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const nowAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const diffInDays = Math.floor((nowAtMidnight.getTime() - dateAtMidnight.getTime()) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        return 'Today';
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  /**
   * Format time display for chat list (time if < 24h, date otherwise)
   * 
   * @param timeString - ISO 8601 date-time string
   * @param format - Optional override for time format
   * @returns Formatted string (e.g., "2:30 PM" or "January 2")
   * 
   * @example
   * formatChatTime('2025-01-02T14:30:00') // "2:30 PM" (if within 24 hours)
   * formatChatTime('2024-12-25T14:30:00') // "December 25"
   */
  formatChatTime(timeString: string, format?: TimeFormat): string {
    if (!timeString) return '';

    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string provided to formatChatTime:', timeString);
        return '';
      }

      const now = new Date();
      
      // Compare using date objects at midnight to avoid DST issues
      const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const nowAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysDiff = Math.floor((nowAtMidnight.getTime() - dateAtMidnight.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, show time
        return this.formatTime(timeString, format);
      } else {
        // Different day, show date
        return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting chat time:', error);
      return '';
    }
  }

  /**
   * Format full datetime for tooltips with user's time format preference
   * 
   * @param timeString - ISO 8601 date-time string
   * @param format - Optional override for time format
   * @returns Formatted tooltip string (e.g., "Wednesday 2 January 2025 at 2:30 PM")
   * 
   * @example
   * formatDateTimeTooltip('2025-01-02T14:30:00', '12h')
   * // "Wednesday 2 January 2025 at 2:30 PM"
   * 
   * formatDateTimeTooltip('2025-01-02T14:30:00', '24h')
   * // "Wednesday 2 January 2025 at 14:30"
   */
  formatDateTimeTooltip(timeString: string, format?: TimeFormat): string {
    if (!timeString) return '';

    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string provided to formatDateTimeTooltip:', timeString);
        return '';
      }

      const weekday = date.toLocaleString([], { weekday: 'long' });
      const day = date.getDate();
      const month = date.toLocaleString([], { month: 'long' });
      const year = date.getFullYear();

      const timeFormat = format || this.getTimeFormat();
      const time = timeFormat === '24h' 
        ? this.format24Hour(date) 
        : this.format12Hour(date);

      return `${weekday} ${day} ${month} ${year} at ${time}`;
    } catch (error) {
      console.error('Error formatting datetime tooltip:', error);
      return '';
    }
  }

  /**
   * Format date for profile display (full date)
   * 
   * @param dateString - ISO 8601 date string or date-time string
   * @returns Formatted date string (e.g., "January 2, 2025")
   * 
   * @example
   * formatFullDate('2025-01-02T14:30:00') // "January 2, 2025"
   * formatFullDate('2025-01-02') // "January 2, 2025"
   */
  formatFullDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string provided to formatFullDate:', dateString);
        return 'N/A';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting full date:', error);
      return 'N/A';
    }
  }

  /**
   * Get observable for reactive time format updates
   * Components can subscribe to this to react to time format changes
   * 
   * @returns Observable that emits when time format changes
   * 
   * @example
   * this.dateTimeFormat.getTimeFormat$().subscribe(format => {
   *   console.log('Time format changed to:', format);
   * });
   */
  getTimeFormat$(): Observable<TimeFormat> {
    return this.timeFormat$;
  }

  /**
   * Format time in 12-hour format with AM/PM
   * @param date - Date object
   * @returns Formatted time string (e.g., "2:30 PM")
   */
  private format12Hour(date: Date): string {
    const formatted = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // Ensure consistent AM/PM capitalization using regex with word boundaries
    // This prevents incorrect replacements in locales that might have 'am' or 'pm' as substrings
    return formatted.replace(/\bam\b/gi, 'AM').replace(/\bpm\b/gi, 'PM');
  }

  /**
   * Format time in 24-hour format
   * @param date - Date object
   * @returns Formatted time string (e.g., "14:30")
   */
  private format24Hour(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
