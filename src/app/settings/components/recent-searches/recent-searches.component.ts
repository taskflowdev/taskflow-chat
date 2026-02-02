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
import { I18nService } from '../../../core/i18n';

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
    private cdr: ChangeDetectorRef,
    private i18n: I18nService
  ) { }

  ngOnInit(): void {
    // Subscribe to recent searches changes
    this.recentSearchesService.recentSearches$
      .pipe(takeUntil(this.destroy$))
      .subscribe(searches => {
        this.recentSearches = searches;
        this.cdr.markForCheck();
      });

    // Subscribe to language changes to trigger change detection
    this.i18n.languageChanged$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
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
   * Get translated value using i18n key or fallback
   * @param i18nKey Translation key from API
   * @param fallback Fallback value if translation not found
   * @returns Translated string or fallback
   */
  private getTranslatedValue(i18nKey: string | undefined, fallback: string): string {
    if (i18nKey) {
      const translated = this.i18n.t(i18nKey);
      // Only use translation if it's different from the key (meaning it was found)
      if (translated !== i18nKey) {
        return translated;
      }
    }
    return fallback;
  }

  /**
   * Get translated label for a recent search item
   * Uses i18n key if available, falls back to label
   */
  getItemLabel(item: RecentSearchItem): string {
    return this.getTranslatedValue(item.labelI18nKey, item.label);
  }

  /**
   * Get translated summary for a recent search item
   * Uses i18n key if available, falls back to summary
   */
  getItemSummary(item: RecentSearchItem): string {
    return this.getTranslatedValue(item.summaryI18nKey, item.summary || '');
  }

  /**
   * Get translated description for a recent search item
   * Uses i18n key if available, falls back to description
   */
  getItemDescription(item: RecentSearchItem): string {
    return this.getTranslatedValue(item.descriptionI18nKey, item.description || '');
  }

  /**
   * Get translated category label for a recent search item
   * Uses i18n key if available, falls back to category label
   */
  getItemCategoryLabel(item: RecentSearchItem): string {
    return this.getTranslatedValue(item.categoryI18nKey, item.categoryLabel);
  }

  /**
   * Track by function for ngFor
   */
  trackById(index: number, item: RecentSearchItem): string {
    return item.id;
  }
}
