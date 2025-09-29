import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SettingsLayoutComponent } from './components/layout/settings-layout.component';
import { ThemeSettingsPageComponent } from './components/theme-settings/theme-settings-page.component';
import { ProfileSettingsComponent } from './components/profile/profile-settings.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: SettingsLayoutComponent,
        children: [
          { path: '', redirectTo: 'theme', pathMatch: 'full' },
          { path: 'theme', component: ThemeSettingsPageComponent },
          { path: 'profile', component: ProfileSettingsComponent }
        ]
      }
    ])
  ],
  exports: [RouterModule]
})
export class SettingsModule { }