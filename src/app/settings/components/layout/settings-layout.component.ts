import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SettingsMenuItem {
  icon: string;
  label: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings-layout.component.html',
  styleUrls: ['./settings-layout.component.scss']
})
export class SettingsLayoutComponent {
  menuItems: SettingsMenuItem[] = [
    {
      icon: 'bi-person-circle',
      label: 'Profile',
      route: '/settings/profile',
      description: 'Manage your account information and preferences'
    },
    {
      icon: 'bi-palette',
      label: 'Appearance',
      route: '/settings/theme',
      description: 'Customize themes, colors and visual preferences'
    }
  ];
}