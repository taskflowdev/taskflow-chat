import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Main settings container page with navigation
 * Provides layout for settings modules
 */
@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="settings-container">
      <div class="row g-0">
        <!-- Settings Navigation -->
        <div class="col-md-3 col-lg-2">
          <div class="settings-nav">
            <div class="nav nav-pills flex-column">
              <a 
                class="nav-link" 
                routerLink="/settings/theme" 
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }">
                <i class="bi bi-palette me-2"></i>
                Theme
              </a>
              <!-- Future settings sections can be added here -->
              <!-- 
              <a class="nav-link" routerLink="/settings/profile" routerLinkActive="active">
                <i class="bi bi-person me-2"></i>
                Profile
              </a>
              <a class="nav-link" routerLink="/settings/notifications" routerLinkActive="active">
                <i class="bi bi-bell me-2"></i>
                Notifications
              </a>
              -->
            </div>
          </div>
        </div>

        <!-- Settings Content -->
        <div class="col-md-9 col-lg-10">
          <div class="settings-content">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./settings-page.component.scss']
})
export class SettingsPageComponent {

}