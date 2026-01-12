import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecentSearchesService, RecentSearchItem } from '../../services/recent-searches.service';
import { SettingsSearchService } from '../../services/settings-search.service';
import { scrollToSetting } from '../../utils/scroll-to-setting';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Recent searches component
 * Displays recently clicked search results
 */
@Component({
  selector: 'app-recent-searches',
  imports: [CommonModule],
  templateUrl: './recent-searches.component.html',
  styleUrls: ['./recent-searches.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentSearchesComponent implements OnInit, OnDestroy {
  recentSearches: RecentSearchItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private recentSearchesService: RecentSearchesService,
    private settingsSearchService: SettingsSearchService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Subscribe to recent searches changes
    this.recentSearchesService.recentSearches$
      .pipe(takeUntil(this.destroy$))
      .subscribe(searches => {
        this.recentSearches = searches;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle clicking a recent search item
   */
  onRecentSearchClick(item: RecentSearchItem): void {
    this.navigateToSetting(item);
  }

  /**
   * Navigate to a setting and scroll to it
   */
  private async navigateToSetting(item: RecentSearchItem): Promise<void> {
    // Clear the search to hide search results
    this.settingsSearchService.clearSearch();

    // Navigate to the category page with proper URL
    await this.router.navigate(['/settings', item.categoryKey]);

    // Wait for navigation to complete and DOM to update
    setTimeout(() => {
      scrollToSetting(item.id, {
        behavior: 'smooth',
        block: 'center',
        focusControl: true,
        updateHash: false
      });
    }, 300);
  }

  /**
   * Clear all recent searches
   */
  clearAll(): void {
    this.recentSearchesService.clearRecentSearches();
  }

  /**
   * Track by function for ngFor
   */
  trackById(index: number, item: RecentSearchItem): string {
    return item.id;
  }
}
