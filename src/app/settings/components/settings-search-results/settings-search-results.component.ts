import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SettingsSearchService } from '../../services/settings-search.service';
import { RecentSearchesService } from '../../services/recent-searches.service';
import { SettingsSearchResult } from '../../utils/settings-search-index';
import { scrollToSetting } from '../../utils/scroll-to-setting';

/**
 * Search results list component
 * Displays search results with keyboard navigation
 */
@Component({
  selector: 'app-settings-search-results',
  imports: [CommonModule],
  templateUrl: './settings-search-results.component.html',
  styleUrls: ['./settings-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSearchResultsComponent implements OnInit, OnDestroy {
  searchResults: SettingsSearchResult[] = [];
  selectedIndex: number = -1;
  isSearchActive: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private settingsSearchService: SettingsSearchService,
    private recentSearchesService: RecentSearchesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to search results
    this.settingsSearchService.searchResults$
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        this.searchResults = results;
        this.selectedIndex = -1; // Reset selection when results change
        this.cdr.markForCheck();
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
   * Handle clicking a search result
   */
  onResultClick(result: SettingsSearchResult): void {
    this.navigateToSetting(result);
  }

  /**
   * Navigate to a setting and scroll to it
   */
  private async navigateToSetting(result: SettingsSearchResult): Promise<void> {
    // Save to recent searches when user clicks a result
    this.recentSearchesService.addRecentSearch(result);

    // Clear the search to hide search results
    this.settingsSearchService.clearSearch();

    // Navigate to the category page with proper URL
    await this.router.navigate(['/settings', result.categoryKey]);

    // Wait for navigation to complete and DOM to update
    setTimeout(() => {
      // Scroll to the setting (without updating hash to avoid weird URLs)
      scrollToSetting(result.id, {
        behavior: 'smooth',
        block: 'center',
        focusControl: true,
        updateHash: false // Keep URL clean
      });
    }, 300);
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent): void {
    if (!this.isSearchActive || this.searchResults.length === 0) {
      return;
    }

    // Check if focus is in search input or results
    const activeElement = document.activeElement;
    const isInSearchContext =
      activeElement?.closest('.settings-search-container') ||
      activeElement?.closest('.search-results-list');

    if (!isInSearchContext) {
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
