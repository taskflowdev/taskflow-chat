/**
 * Theme Toggle Component
 * 
 * Enterprise-grade accessible theme switcher component.
 * 
 * Features:
 * - Keyboard accessible (Space/Enter to toggle)
 * - ARIA labels for screen readers
 * - Smooth icon transitions
 * - Focus ring for keyboard navigation
 * - Visual feedback on interaction
 * 
 * Can be placed anywhere in the UI - typically in navbar.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../../core/theme/theme.service';
import { Theme } from '../../../core/theme/theme.types';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="theme-toggle"
      [attr.aria-label]="currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
      [attr.aria-pressed]="currentTheme === 'light'"
      (click)="toggleTheme()"
      (keydown.space)="onKeydown($event)"
      (keydown.enter)="onKeydown($event)"
      title="{{ currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme' }}"
    >
      <i 
        class="bi"
        [class.bi-moon-fill]="currentTheme === 'dark'"
        [class.bi-sun-fill]="currentTheme === 'light'"
        aria-hidden="true"
      ></i>
    </button>
  `,
  styles: [`
    .theme-toggle {
      background: transparent;
      border: 1px solid var(--color-border-primary);
      color: var(--color-text-primary);
      border-radius: var(--radius-sm);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast) var(--ease-in-out);
      position: relative;
      overflow: hidden;
      
      i {
        font-size: 1.1rem;
        transition: transform var(--transition-normal) var(--ease-in-out);
      }
      
      &:hover {
        background: var(--color-bg-hover);
        border-color: var(--color-border-focus);
        
        i {
          transform: scale(1.1) rotate(10deg);
        }
      }
      
      &:active {
        transform: scale(0.95);
        
        i {
          transform: scale(0.9) rotate(-10deg);
        }
      }
      
      // Focus ring for keyboard navigation
      &:focus-visible {
        outline: var(--focus-ring-width) solid var(--focus-ring-color);
        outline-offset: var(--focus-ring-offset);
        border-color: var(--color-border-focus);
      }
      
      // Remove default focus outline
      &:focus {
        outline: none;
      }
      
      // Pressed state animation
      &[aria-pressed="true"] i {
        animation: iconPop 0.3s var(--ease-out);
      }
    }
    
    @keyframes iconPop {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.2) rotate(180deg);
      }
      100% {
        transform: scale(1) rotate(360deg);
      }
    }
    
    // Reduced motion support
    @media (prefers-reduced-motion: reduce) {
      .theme-toggle {
        i {
          transition: none;
        }
        
        &:hover i,
        &:active i {
          transform: none;
        }
        
        &[aria-pressed="true"] i {
          animation: none;
        }
      }
      
      @keyframes iconPop {
        0%, 100% {
          transform: scale(1);
        }
      }
    }
  `]
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  currentTheme: Theme = Theme.DARK;
  private themeSubscription: Subscription | null = null;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.currentTheme$.subscribe(
      theme => {
        this.currentTheme = theme;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  /**
   * Toggle theme between light and dark
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Handle keyboard events
   */
  onKeydown(event: KeyboardEvent): void {
    // Prevent default scroll behavior for space key
    if (event.key === ' ') {
      event.preventDefault();
    }
    
    this.toggleTheme();
  }
}
