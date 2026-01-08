import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SettingsSearchService } from '../../services/settings-search.service';
import { SettingsSearchOverlayService } from '../../services/settings-search-overlay.service';
import { SettingsSearchComponent } from '../settings-search/settings-search.component';
import { SettingsSearchResultsComponent } from '../settings-search-results/settings-search-results.component';

/**
 * Global settings search overlay component
 * Displays search UI in a centered modal above all settings pages
 */
@Component({
  selector: 'app-settings-search-overlay',
  imports: [CommonModule, SettingsSearchComponent, SettingsSearchResultsComponent],
  templateUrl: './settings-search-overlay.component.html',
  styleUrls: ['./settings-search-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSearchOverlayComponent implements OnInit, OnDestroy {
  @ViewChild('overlayContainer', { static: false }) overlayContainer!: ElementRef<HTMLDivElement>;
  @ViewChild(SettingsSearchComponent, { static: false }) searchComponent!: SettingsSearchComponent;

  isVisible: boolean = false;
  isSearchActive: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private settingsSearchService: SettingsSearchService,
    private overlayService: SettingsSearchOverlayService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to overlay state
    this.overlayService.isOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOpen => {
        if (isOpen && !this.isVisible) {
          this.show();
        } else if (!isOpen && this.isVisible) {
          this.hide();
        }
      });

    // Subscribe to search active state
    this.settingsSearchService.isSearchActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isActive => {
        this.isSearchActive = isActive;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Show the overlay
   */
  show(): void {
    this.isVisible = true;
    this.cdr.markForCheck();

    // Focus the search input after a small delay to ensure it's rendered
    setTimeout(() => {
      if (this.searchComponent) {
        this.searchComponent.focusInput();
      }
    }, 100);

    // Prevent body scroll when overlay is open
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide the overlay
   */
  hide(): void {
    this.isVisible = false;
    this.settingsSearchService.clearSearch();
    this.overlayService.close();
    this.cdr.markForCheck();

    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Handle overlay click (close on backdrop click)
   */
  onOverlayClick(event: MouseEvent): void {
    // Close if clicking on the overlay itself (not the container)
    if (event.target === event.currentTarget) {
      this.hide();
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Open overlay on '/' key or Cmd/Ctrl+K (only if not in an input/textarea and overlay is not open)
    if (!this.isVisible) {
      const isSlash = event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName);
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key === 'k';

      if (isSlash || isCmdK) {
        event.preventDefault();
        this.overlayService.open();
      }
    }

    // Close overlay on Escape
    if (event.key === 'Escape' && this.isVisible) {
      event.preventDefault();
      this.hide();
    }
  }

  /**
   * Check if we should trap focus
   */
  @HostListener('keydown', ['$event'])
  trapFocus(event: KeyboardEvent): void {
    if (!this.isVisible || event.key !== 'Tab') {
      return;
    }

    const container = this.overlayContainer?.nativeElement;
    if (!container) {
      return;
    }

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Trap focus within the overlay
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        event.preventDefault();
      }
    }
  }
}
