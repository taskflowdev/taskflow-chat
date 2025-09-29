import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsPageComponent } from './components/settings-page/settings-page.component';
import { ThemeSettingsPageComponent } from './components/theme/theme-settings-page/theme-settings-page.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsPageComponent,
    children: [
      {
        path: '',
        redirectTo: 'theme',
        pathMatch: 'full'
      },
      {
        path: 'theme',
        component: ThemeSettingsPageComponent,
        title: 'Theme Settings'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }