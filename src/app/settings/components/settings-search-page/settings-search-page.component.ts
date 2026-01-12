import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsSearchComponent } from '../settings-search/settings-search.component';
import { SettingsSearchResultsComponent } from '../settings-search-results/settings-search-results.component';
import { RecentSearchesComponent } from '../recent-searches/recent-searches.component';
import { SettingsSearchService } from '../../services/settings-search.service';
import { RecentSearchesService } from '../../services/recent-searches.service';
import { Observable } from 'rxjs';

/**
 * Dedicated search page component for settings
 * Contains search input and results display
 * Shows recent searches when search is inactive
 */
@Component({
  selector: 'app-settings-search-page',
  imports: [
    CommonModule,
    SettingsSearchComponent,
    SettingsSearchResultsComponent,
    RecentSearchesComponent
  ],
  templateUrl: './settings-search-page.component.html',
  styleUrls: ['./settings-search-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSearchPageComponent implements OnInit {
  isSearchActive$: Observable<boolean>;
  hasRecentSearches: boolean = false;

  constructor(
    private settingsSearchService: SettingsSearchService,
    private recentSearchesService: RecentSearchesService,
    private cdr: ChangeDetectorRef
  ) {
    this.isSearchActive$ = this.settingsSearchService.isSearchActive$;
  }

  ngOnInit(): void {
    this.checkRecentSearches();
  }

  /**
   * Check if there are recent searches available
   */
  private checkRecentSearches(): void {
    const recentSearches = this.recentSearchesService.getRecentSearches();
    this.hasRecentSearches = recentSearches.length > 0;
    this.cdr.markForCheck();
  }
}
