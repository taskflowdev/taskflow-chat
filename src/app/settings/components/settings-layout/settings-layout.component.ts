import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { SettingsSidebarComponent } from '../settings-sidebar/settings-sidebar.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { SettingsSearchComponent } from '../settings-search/settings-search.component';
import { SettingsSearchResultsComponent } from '../settings-search-results/settings-search-results.component';
import { SettingsSearchService } from '../../services/settings-search.service';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-settings-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    SettingsSidebarComponent,
    SkeletonLoaderComponent,
    SettingsSearchComponent,
    SettingsSearchResultsComponent
  ],
  templateUrl: './settings-layout.component.html',
  styleUrls: ['./settings-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsLayoutComponent implements OnInit, OnDestroy {
  loading$: Observable<boolean>;
  catalogLoaded$: Observable<boolean>;
  isSearchActive$: Observable<boolean>;

  // Sticky search bar state
  showStickySearch: boolean = false;
  private lastScrollTop: number = 0;
  private scrollThreshold: number = 50; // Minimum scroll before showing search
  private hideThreshold: number = 10; // Scroll to top threshold to hide
  private scrollTimeout: any = null;
  private readonly SCROLL_THROTTLE_MS = 100; // Throttle scroll events

  constructor(
    private userSettingsService: UserSettingsService,
    private settingsSearchService: SettingsSearchService,
    private cdr: ChangeDetectorRef
  ) {
    this.loading$ = this.userSettingsService.loading$;

    // Check if catalog has been loaded (catalog$ emits non-null value)
    this.catalogLoaded$ = this.userSettingsService.catalog$.pipe(
      map(catalog => catalog !== null && catalog !== undefined)
    );

    // Check if search is active
    this.isSearchActive$ = this.settingsSearchService.isSearchActive$;
  }

  ngOnInit(): void {
    // Load catalog and user settings on initialization
    this.userSettingsService.loadCatalog().subscribe();
    this.userSettingsService.loadUserSettings().subscribe();
  }

  ngOnDestroy(): void {
    // Clean up throttle timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  /**
   * Handle scroll events on the settings content
   * Implements Apple-style sticky search behavior with throttling
   */
  onScroll(event: Event): void {
    // Throttle scroll events for performance
    if (this.scrollTimeout) {
      return;
    }

    this.scrollTimeout = setTimeout(() => {
      this.scrollTimeout = null;
      this.handleScrollLogic(event);
    }, this.SCROLL_THROTTLE_MS);
  }

  /**
   * Core scroll logic - separated for testability
   */
  private handleScrollLogic(event: Event): void {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;

    // At the very top - hide search bar
    if (scrollTop <= this.hideThreshold) {
      if (this.showStickySearch) {
        this.showStickySearch = false;
        this.cdr.markForCheck();
      }
      this.lastScrollTop = scrollTop;
      return;
    }

    // User has scrolled down past threshold
    if (scrollTop > this.scrollThreshold) {
      // Scrolling up - show sticky search
      if (scrollTop < this.lastScrollTop) {
        if (!this.showStickySearch) {
          this.showStickySearch = true;
          this.cdr.markForCheck();
        }
      }
    }

    this.lastScrollTop = scrollTop;
  }
}
