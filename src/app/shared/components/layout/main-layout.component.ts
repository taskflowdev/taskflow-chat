import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { UserSettingsService } from '../../../core/services/user-settings.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <div class="app-layout">
      <!-- Global Navigation Bar -->
      <app-navbar (showKeyboardShortcuts)="onShowKeyboardShortcuts()"></app-navbar>

      <!-- Main Content Area -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Global Footer -->
      <!-- <app-footer></app-footer> -->
    </div>
  `,
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  constructor(
    private router: Router,
    private userSettingsService: UserSettingsService
  ) { }

  ngOnInit(): void {
    // Settings are loaded during app initialization (APP_INITIALIZER).
    // Avoid re-loading here to prevent a late re-application of theme tokens.
  }

  /**
   * Handle keyboard shortcuts dialog request from navbar
   */
  onShowKeyboardShortcuts(): void {
    // Navigate with fragment to show keyboard shortcuts
    this.router.navigate([], {
      fragment: 'keyboard-shortcuts',
      queryParamsHandling: 'preserve'
    });
  }
}
