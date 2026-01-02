import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Typing Indicator Settings Service
 * 
 * Manages the showTypingIndicator user preference.
 * Provides reactive updates when the setting changes.
 * 
 * Features:
 * - Reactive preference updates via RxJS
 * - Default enabled state
 * - Integrated with user settings system
 * 
 * @example
 * ```typescript
 * constructor(private typingIndicatorSettings: TypingIndicatorSettingsService) {}
 * 
 * // Check if typing indicator should be shown
 * const shouldShow = this.typingIndicatorSettings.isEnabled();
 * 
 * // Subscribe to changes
 * this.typingIndicatorSettings.isEnabled$().subscribe(enabled => {
 *   console.log('Typing indicator enabled:', enabled);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class TypingIndicatorSettingsService {
  private readonly DEFAULT_ENABLED = true;
  
  private enabledSubject = new BehaviorSubject<boolean>(this.DEFAULT_ENABLED);
  public enabled$: Observable<boolean> = this.enabledSubject.asObservable();

  constructor() {}

  /**
   * Set whether typing indicator should be shown
   * @param enabled - True to show typing indicator, false to hide
   */
  setEnabled(enabled: boolean): void {
    this.enabledSubject.next(enabled);
  }

  /**
   * Get current enabled state
   * @returns Current enabled state
   */
  isEnabled(): boolean {
    return this.enabledSubject.value;
  }

  /**
   * Get observable for reactive updates
   * @returns Observable that emits when setting changes
   */
  isEnabled$(): Observable<boolean> {
    return this.enabled$;
  }
}
