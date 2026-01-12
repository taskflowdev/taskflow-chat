import { Routes } from '@angular/router';
import { SettingsLayoutComponent } from './components/settings-layout/settings-layout.component';
import { SettingsCategoryComponent } from './components/settings-category/settings-category.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsSearchPageComponent } from './components/settings-search-page/settings-search-page.component';

export const settingsRoutes: Routes = [
  {
    path: '',
    component: SettingsLayoutComponent,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileComponent },
      { path: 'search', component: SettingsSearchPageComponent },
      { path: ':categoryKey', component: SettingsCategoryComponent }
    ]
  }
];
