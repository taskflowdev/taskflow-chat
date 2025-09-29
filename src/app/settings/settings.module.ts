import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeSettingsPageComponent } from './components/theme-settings/theme-settings-page.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', redirectTo: 'theme', pathMatch: 'full' },
      { path: 'theme', component: ThemeSettingsPageComponent }
    ])
  ],
  exports: [RouterModule]
})
export class SettingsModule { }