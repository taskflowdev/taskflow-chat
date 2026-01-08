import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SettingsSearchService } from '../../services/settings-search.service';
import { SettingsSearchResult } from '../../utils/settings-search-index';
import { scrollToSetting } from '../../utils/scroll-to-setting';

/**
 * Settings search dialog component
 * Modal dialog for searching settings with animations
 */
@Component({
  selector: 'app-settings-search-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-search-dialog.component.html',
  styleUrls: ['./settings-search-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSearchDialogComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;

  searchQuery: string = '';
  searchResults: SettingsSearchResult[] = [];
  selectedIndex: number = -1;
  resultCount: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private settingsSearchService: SettingsSearchService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Auto-focus search input after animation
    setTimeout(() => {
      this.focusInput();
    }, 300);

    // Subscribe to search results
    this.settingsSearchService.searchResults$
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        this.searchResults = results;
        this.resultCount = results.length;
        this.selectedIndex = -1; // Reset selection when results change
        this.cdr.markForCheck();
      });

    // Subscribe to search query
    this.settingsSearchService.searchQuery$
      .pipe(takeUntil(this.destroy$))
      .subscribe(query => {
        this.searchQuery = query;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle search input change
   */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.settingsSearchService.setSearchQuery(input.value);
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.settingsSearchService.clearSearch();
    this.focusInput();
  }

  /**
   * Focus the search input
   */
  focusInput(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  /**
   * Close dialog
   */
  onClose(): void {
    // Clear search state
    this.settingsSearchService.clearSearch();
    
    // Remove fragment from URL
    this.router.navigate([], {
      fragment: undefined,
      queryParamsHandling: 'preserve'
    });
  }

  /**
   * Close dialog when clicking on overlay
   */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.onClose();
    }
  }

  /**
   * Handle clicking a search result
   */
  onResultClick(result: SettingsSearchResult): void {
    this.navigateToSetting(result);
  }

  /**
   * Navigate to a setting and scroll to it
   */
  private async navigateToSetting(result: SettingsSearchResult): Promise<void> {
    // Close the dialog first
    this.router.navigate([], {
      fragment: undefined,
      queryParamsHandling: 'preserve'
    });

    // Clear search
    this.settingsSearchService.clearSearch();

    // Navigate to the category page
    await this.router.navigate(['/settings', result.categoryKey]);

    // Wait for navigation to complete and DOM to update
    setTimeout(() => {
      // Scroll to the setting
      scrollToSetting(result.id, {
        behavior: 'smooth',
        block: 'center',
        focusControl: true,
        updateHash: false
      });
    }, 300);
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent): void {
    // Close on Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onClose();
      return;
    }

    if (this.searchResults.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectPrevious();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.searchResults.length) {
          this.navigateToSetting(this.searchResults[this.selectedIndex]);
        }
        break;
    }
  }

  /**
   * Select next result
   */
  private selectNext(): void {
    if (this.searchResults.length === 0) {
      return;
    }

    this.selectedIndex = Math.min(this.selectedIndex + 1, this.searchResults.length - 1);
    this.scrollToSelected();
    this.cdr.markForCheck();
  }

  /**
   * Select previous result
   */
  private selectPrevious(): void {
    if (this.searchResults.length === 0) {
      return;
    }

    this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
    this.scrollToSelected();
    this.cdr.markForCheck();
  }

  /**
   * Scroll to selected result
   */
  private scrollToSelected(): void {
    if (this.selectedIndex < 0) {
      return;
    }

    const selectedElement = document.querySelector(
      `.search-result-item[data-result-index="${this.selectedIndex}"]`
    );

    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Check if result is selected
   */
  isSelected(index: number): boolean {
    return index === this.selectedIndex;
  }

  /**
   * Get status badges for a result
   */
  getStatusBadges(result: SettingsSearchResult): string[] {
    const badges: string[] = [];

    if (result.disabled) {
      badges.push('Disabled');
    }

    if (result.adminOnly) {
      badges.push('Admin Only');
    }

    if (result.deprecated) {
      badges.push('Deprecated');
    }

    return badges;
  }

  /**
   * Track by function for ngFor
   */
  trackByResultId(index: number, result: SettingsSearchResult): string {
    return result.id;
  }
}
