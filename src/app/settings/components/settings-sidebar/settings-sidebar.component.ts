import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { Observable, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { CatalogResponse } from '../../../api/models/catalog-response';
import { CategoryWithKeys } from '../../../api/models/category-with-keys';
import { TranslatePipe, I18nService } from '../../../core/i18n';

@Component({
  selector: 'app-settings-sidebar',
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './settings-sidebar.component.html',
  styleUrls: ['./settings-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSidebarComponent implements OnDestroy {
  catalog$: Observable<CatalogResponse | null>;
  sortedCategories$: Observable<CategoryWithKeys[]>;
  currentRoute$: Observable<string>;
  private langSubscription?: Subscription;

  constructor(
    private userSettingsService: UserSettingsService,
    private router: Router,
    private i18n: I18nService
  ) {
    this.catalog$ = this.userSettingsService.catalog$;
    
    this.sortedCategories$ = this.catalog$.pipe(
      map(catalog => {
        if (!catalog || !catalog.categories) {
          return [];
        }
        return [...catalog.categories].sort((a, b) => {
          const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
      })
    );

    this.currentRoute$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        const urlSegments = this.router.url.split('/');
        return urlSegments[urlSegments.length - 1] || '';
      })
    );
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
  }

  isActive(categoryKey: string | undefined): boolean {
    if (!categoryKey) return false;
    const urlSegments = this.router.url.split('/');
    const currentCategory = urlSegments[urlSegments.length - 1];
    return currentCategory === categoryKey;
  }

  getIconClass(category: CategoryWithKeys, isActive: boolean): string {
    if (isActive && category.iconSelected) {
      return 'bi-' + category.iconSelected;
    }
    return 'bi-' + (category.icon || 'box');
  }
}
