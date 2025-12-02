import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryWithKeys } from '../../../api/models/category-with-keys';
import { CatalogEntryDto } from '../../../api/models/catalog-entry-dto';
import { SettingsRendererComponent } from '../settings-renderer/settings-renderer.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { I18nService } from '../../../core/i18n';

@Component({
  selector: 'app-settings-category',
  imports: [CommonModule, SettingsRendererComponent, SkeletonLoaderComponent],
  templateUrl: './settings-category.component.html',
  styleUrls: ['./settings-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsCategoryComponent implements OnInit {
  category$!: Observable<CategoryWithKeys | undefined>;
  sortedKeys$!: Observable<CatalogEntryDto[]>;
  loading$: Observable<boolean>;
  catalogLoaded$: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private userSettingsService: UserSettingsService,
    private cdr: ChangeDetectorRef,
    private i18n: I18nService
  ) {
    this.loading$ = this.userSettingsService.loading$;
    // Check if catalog has been loaded (catalog$ emits non-null value)
    this.catalogLoaded$ = this.userSettingsService.catalog$.pipe(
      map(catalog => catalog !== null && catalog !== undefined)
    );
  }

  ngOnInit(): void {
    const categoryKey$ = this.route.params.pipe(
      map(params => params['categoryKey'])
    );

    this.category$ = combineLatest([
      categoryKey$,
      this.userSettingsService.catalog$
    ]).pipe(
      map(([key, catalog]) => {
        if (!catalog || !catalog.categories) {
          return undefined;
        }
        return catalog.categories.find(c => c.key === key);
      })
    );

    this.sortedKeys$ = this.category$.pipe(
      map(category => {
        if (!category || !category.keys) {
          return [];
        }
        return [...category.keys].sort((a, b) => {
          const orderA = a.ui?.order ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.ui?.order ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
      })
    );
  }

  /**
   * Get translated category title
   * Uses i18n key from API if available, falls back to displayName
   */
  getCategoryTitle(category: CategoryWithKeys): string {
    // Use i18n key from API response if available
    const i18nKey = category.i18n?.fields?.['displayName'];
    if (i18nKey) {
      const translated = this.i18n.t(i18nKey);
      // Only use translation if it's different from the key (meaning it was found)
      if (translated !== i18nKey) {
        return translated;
      }
    }
    // Fall back to displayName from API
    return category.displayName || category.key || '';
  }

  /**
   * Get translated category description
   * Uses i18n key from API if available, falls back to description
   */
  getCategoryDescription(category: CategoryWithKeys): string {
    // Use i18n key from API response if available
    const i18nKey = category.i18n?.fields?.['description'];
    if (i18nKey) {
      const translated = this.i18n.t(i18nKey);
      // Only use translation if it's different from the key (meaning it was found)
      if (translated !== i18nKey) {
        return translated;
      }
    }
    // Fall back to description from API
    return category.description || '';
  }
}
