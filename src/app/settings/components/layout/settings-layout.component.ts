import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SettingsSidebarComponent, SettingsMenuItem } from './settings-sidebar.component';

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SettingsSidebarComponent],
  templateUrl: './settings-layout.component.html',
  styleUrls: ['./settings-layout.component.scss']
})
export class SettingsLayoutComponent {
  menuItems: SettingsMenuItem[] = [
    {
      id: 'profile',
      icon: 'bi bi-person-circle',
      label: 'Profile',
      route: '/settings/profile',
      description: 'Manage your account information and preferences'
    },
    {
      id: 'appearance',
      icon: 'bi bi-palette',
      label: 'Appearance',
      route: '/settings/appearance',
      description: 'Customize themes, colors and visual preferences'
    }
  ];
}
