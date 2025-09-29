import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SettingsMenuItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-settings-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="settings-sidebar">
      <nav class="sidebar-nav">
        <a
          *ngFor="let item of menuItems"
          [routerLink]="item.route"
          routerLinkActive="active"
          class="nav-item">
          <div class="nav-icon">
            <i [class]="item.icon"></i>
          </div>
          <div class="nav-content">
            <div class="nav-label">{{ item.label }}</div>
            <div class="nav-description">{{ item.description }}</div>
          </div>
        </a>
      </nav>
    </div>
  `,
  styleUrl: './settings-sidebar.component.scss'
})
export class SettingsSidebarComponent {
  @Input() menuItems: SettingsMenuItem[] = [];
}