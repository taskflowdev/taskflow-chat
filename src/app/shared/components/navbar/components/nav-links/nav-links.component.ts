import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

export interface NavLink {
  path: string;
  label: string;
  icon: string;
  title: string;
}

/**
 * Reusable navigation links component for navbar
 * Follows MNC-level coding standards with single responsibility principle
 */
@Component({
  selector: 'app-nav-links',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="nav-links">
      <a 
        *ngFor="let link of navLinks; trackBy: trackByPath" 
        [routerLink]="link.path" 
        class="nav-link" 
        [class.active]="isActiveRoute(link.path)" 
        [title]="link.title">
        <i class="bi" [ngClass]="link.icon"></i>
        <span class="nav-text">{{ link.label }}</span>
      </a>
    </nav>
  `,
  styleUrls: ['./nav-links.component.scss']
})
export class NavLinksComponent {
  @Input() navLinks: NavLink[] = [
    {
      path: '/chat',
      label: 'Chat',
      icon: 'bi-chat-quote',
      title: 'Chat'
    },
    {
      path: '/dashboard',
      label: 'Settings',
      icon: 'bi-gear',
      title: 'Dashboard'
    }
  ];

  constructor(private router: Router) {}

  /**
   * Check if the current route is active
   */
  isActiveRoute(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  /**
   * Track function for ngFor optimization
   */
  trackByPath(index: number, link: NavLink): string {
    return link.path;
  }
}