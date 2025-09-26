import { Routes } from '@angular/router';
import { SettingsLayoutComponent } from './components/settings-layout/settings-layout.component';
import { ThemeSettingsPageComponent } from './components/theme-settings-page/theme-settings-page.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsLayoutComponent,
    children: [
      { path: '', redirectTo: 'theme', pathMatch: 'full' },
      { path: 'theme', component: ThemeSettingsPageComponent }
    ]
  }
];

export default routes;