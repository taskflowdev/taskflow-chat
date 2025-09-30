import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeSettingsComponent } from './theme-settings.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ThemeSettingsComponent],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1>Settings</h1>
        <p class="text-muted">Manage your account settings and preferences</p>
      </div>

      <div class="settings-content">
        <nav class="settings-nav">
          <button class="settings-nav-item active">
            <i class="bi bi-palette-fill"></i>
            <span>Appearance</span>
          </button>
          <!-- Future settings tabs can be added here -->
        </nav>

        <div class="settings-main">
          <app-theme-settings></app-theme-settings>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .settings-header {
      margin-bottom: 2rem;
    }

    .settings-header h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--TextColor, #0f172a);
    }

    .settings-header .text-muted {
      color: var(--TextMutedColor, #64748b);
      font-size: 1rem;
    }

    .settings-content {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
    }

    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .settings-nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--TextColor, #0f172a);
      font-size: 1rem;
      text-align: left;
    }

    .settings-nav-item:hover {
      background: var(--SecondaryBackgroundColor, rgba(0, 0, 0, 0.05));
    }

    .settings-nav-item.active {
      background: var(--ButtonPrimary, #22c55e);
      color: white;
    }

    .settings-nav-item i {
      font-size: 1.25rem;
    }

    .settings-main {
      background: var(--BackgroundColor, #fff);
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid var(--SecondaryBackgroundColor, #e5e7eb);
    }

    @media (max-width: 768px) {
      .settings-content {
        grid-template-columns: 1fr;
      }

      .settings-nav {
        flex-direction: row;
        overflow-x: auto;
      }

      .settings-nav-item span {
        display: none;
      }
    }
  `]
})
export class SettingsComponent { }
