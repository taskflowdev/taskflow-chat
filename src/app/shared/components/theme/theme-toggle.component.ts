import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="theme-toggle-btn" 
      (click)="toggleTheme()"
      [attr.aria-label]="(isDark$ | async) ? 'Switch to light mode' : 'Switch to dark mode'"
      title="{{ (isDark$ | async) ? 'Switch to light mode' : 'Switch to dark mode' }}">
      <i class="bi" [ngClass]="(isDark$ | async) ? 'bi-sun-fill' : 'bi-moon-fill'"></i>
    </button>
  `,
  styles: [`
    .theme-toggle-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
      color: var(--TextColor, #0f172a);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .theme-toggle-btn:hover {
      background: var(--SecondaryBackgroundColor, rgba(0, 0, 0, 0.05));
    }

    .theme-toggle-btn i {
      font-size: 1.25rem;
    }
  `]
})
export class ThemeToggleComponent implements OnInit {
  isDark$!: Observable<boolean>;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.isDark$ = this.themeService.themeState$.pipe(
      map(state => state.isDark)
    );
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }
}
