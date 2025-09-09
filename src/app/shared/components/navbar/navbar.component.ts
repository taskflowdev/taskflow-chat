import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { NavLinksComponent, NavLink } from './components/nav-links/nav-links.component';
import { UserDropdownComponent, DropdownItem } from './components/user-dropdown/user-dropdown.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NavLinksComponent, 
    UserDropdownComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  user: AuthUser | null = null;
  private userSubscription: Subscription | null = null;

  // Configuration for nav links
  navLinks: NavLink[] = [
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

  // Configuration for user dropdown
  userDropdownItems: DropdownItem[] = [
    {
      label: 'Profile',
      icon: 'bi-person',
      href: '#'
    },
    {
      label: 'Settings',
      icon: 'bi-gear',
      href: '#'
    },
    {
      divider: true,
      label: '',
      icon: ''
    },
    {
      label: 'Logout',
      icon: 'bi-box-arrow-right',
      action: 'logout'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to current user
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => this.user = user
    );
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   * Handle user dropdown item clicks
   */
  onDropdownItemClick(item: DropdownItem): void {
    switch (item.action) {
      case 'logout':
        this.onLogout();
        break;
      default:
        // Handle other actions as needed
        break;
    }
  }

  /**
   * Handle user logout
   */
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Check if current route is active (legacy method, kept for compatibility)
   */
  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }
}