import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
export class SettingsLayoutComponent implements OnInit {
  loading$: Observable<boolean>;
  catalogLoaded$: Observable<boolean>;
  isSearchActive$: Observable<boolean>;

  constructor(
    private userSettingsService: UserSettingsService,
    private settingsSearchService: SettingsSearchService
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
}
