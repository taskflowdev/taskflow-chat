import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecentSearchesService, RecentSearchItem } from '../../services/recent-searches.service';
import { scrollToSetting } from '../../utils/scroll-to-setting';

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
export class RecentSearchesComponent implements OnInit {
  recentSearches: RecentSearchItem[] = [];

  constructor(
    private recentSearchesService: RecentSearchesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRecentSearches();
  }

  /**
   * Load recent searches from localStorage
   */
  loadRecentSearches(): void {
    this.recentSearches = this.recentSearchesService.getRecentSearches();
    this.cdr.markForCheck();
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

    // Wait for navigation to complete and DOM to update
    setTimeout(() => {
      // Scroll to the setting (without updating hash to avoid weird URLs)
      scrollToSetting(item.id, {
        behavior: 'smooth',
        block: 'center',
        focusControl: true,
        updateHash: false // Keep URL clean
      });
    }, 300);
  }

  /**
   * Clear all recent searches
   */
  clearAll(): void {
    this.recentSearchesService.clearRecentSearches();
    this.loadRecentSearches();
  }

  /**
   * Track by function for ngFor
   */
  trackById(index: number, item: RecentSearchItem): string {
    return item.id;
  }
}
