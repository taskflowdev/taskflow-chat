import { Routes } from '@angular/router';
import { SettingsLayoutComponent } from './components/settings-layout/settings-layout.component';
import { SettingsCategoryComponent } from './components/settings-category/settings-category.component';

export const settingsRoutes: Routes = [
  {
    path: '',
    component: SettingsLayoutComponent,
    children: [
      { path: '', redirectTo: 'accessibility', pathMatch: 'full' },
      { path: ':categoryKey', component: SettingsCategoryComponent }
    ]
  }
];
