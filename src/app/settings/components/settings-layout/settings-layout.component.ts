import { Component } from '@angular/core';

interface SettingsNavItem {
  path: string;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-settings-layout',
  templateUrl: './settings-layout.component.html',
  styleUrls: ['./settings-layout.component.scss']
})
export class SettingsLayoutComponent {
  
  settingsNavItems: SettingsNavItem[] = [
    {
      path: '/settings/theme',
      label: 'Theme',
      icon: 'bi-palette',
      description: 'Personalize your interface with custom themes'
    }
    // Add more settings sections here as needed
  ];
}