import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { RecentSearchesService, RecentSearchItem } from '../../services/recent-searches.service';
import { scrollToSetting } from '../../utils/scroll-to-setting';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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
    // Navigate to the category page with proper URL
    await this.router.navigate(['/settings', item.categoryKey]);

    // Wait for navigation to complete using router events
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Small delay to ensure DOM is updated after navigation
        setTimeout(() => {
          scrollToSetting(item.id, {
            behavior: 'smooth',
            block: 'center',
            focusControl: true,
            updateHash: false
          });
        }, 100);
      });
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
