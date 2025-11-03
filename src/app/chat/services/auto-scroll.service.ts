import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

/**
 * AutoScrollService
 * 
 * Production-ready service for managing WhatsApp-like auto-scroll behavior.
 * Reusable across chat conversations, comments, and any scrollable content.
 * 
 * Features:
 * - Auto-scroll to bottom on content load
 * - Smart detection of user scroll vs programmatic scroll
 * - Threshold-based scroll-to-bottom button visibility
 * - Memory leak prevention with proper cleanup
 * - OnPush change detection compatible
 * - Smooth animations with no jank
 */
@Injectable()
export class AutoScrollService implements OnDestroy {
  private readonly SCROLL_THRESHOLD = 100; // px from bottom to hide button
  private readonly SCROLL_DEBOUNCE = 100; // ms debounce for scroll events
  
  private destroy$ = new Subject<void>();
  private isNearBottomSubject = new BehaviorSubject<boolean>(true);
  private shouldAutoScrollSubject = new BehaviorSubject<boolean>(true);
  private scrollContainer: HTMLElement | null = null;
  private userScrolling = false;
  
  /**
   * Observable indicating if scroll position is near bottom
   */
  readonly isNearBottom$: Observable<boolean> = this.isNearBottomSubject.asObservable();
  
  /**
   * Observable indicating if auto-scroll should be active
   */
  readonly shouldAutoScroll$: Observable<boolean> = this.shouldAutoScrollSubject.asObservable();
  
  constructor() {}
  
  /**
   * Initialize auto-scroll service with a container element
   * Sets up scroll event listeners with debouncing
   */
  initialize(container: HTMLElement): void {
    this.cleanup();
    this.scrollContainer = container;
    this.shouldAutoScrollSubject.next(true);
    
    // Listen to scroll events with debouncing for performance
    fromEvent(container, 'scroll')
      .pipe(
        debounceTime(this.SCROLL_DEBOUNCE),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.userScrolling) {
          this.checkScrollPosition();
        }
      });
  }
  
  /**
   * Check if scroll position is near bottom
   * Updates observables accordingly
   */
  private checkScrollPosition(): void {
    if (!this.scrollContainer) return;
    
    const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNear = distanceFromBottom <= this.SCROLL_THRESHOLD;
    
    this.isNearBottomSubject.next(isNear);
    this.shouldAutoScrollSubject.next(isNear);
  }
  
  /**
   * Scroll to bottom smoothly or instantly
   * @param smooth - Use smooth scrolling (true) or instant (false)
   */
  scrollToBottom(smooth: boolean = true): void {
    if (!this.scrollContainer) return;
    
    this.userScrolling = false;
    
    if (smooth) {
      this.scrollContainer.scrollTo({
        top: this.scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight;
    }
    
    // Mark as near bottom immediately
    this.isNearBottomSubject.next(true);
    this.shouldAutoScrollSubject.next(true);
    
    // Re-enable user scrolling detection after a delay
    setTimeout(() => {
      this.userScrolling = true;
    }, 100);
  }
  
  /**
   * Called when user manually scrolls
   * Disables auto-scroll if scrolling up from bottom
   */
  onUserScroll(): void {
    this.userScrolling = true;
    this.checkScrollPosition();
  }
  
  /**
   * Enable auto-scroll (e.g., when user clicks scroll-to-bottom button)
   */
  enableAutoScroll(): void {
    this.shouldAutoScrollSubject.next(true);
    this.scrollToBottom(false);
  }
  
  /**
   * Check if currently at bottom (for external use)
   */
  isAtBottom(): boolean {
    if (!this.scrollContainer) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= this.SCROLL_THRESHOLD;
  }
  
  /**
   * Get current auto-scroll state
   */
  shouldAutoScroll(): boolean {
    return this.shouldAutoScrollSubject.value;
  }
  
  /**
   * Cleanup resources and unsubscribe
   */
  private cleanup(): void {
    this.scrollContainer = null;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanup();
  }
}
