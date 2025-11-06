import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
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

  @Output() showKeyboardShortcuts = new EventEmitter<void>();

  // Configuration for nav links
  navLinks: NavLink[] = [
    {
      path: '/chats',
      label: 'Chats',
      icon: 'bi-chat-quote',
      title: 'Chats'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: 'bi-gear',
      title: 'Settings'
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
      label: 'Keyboard Shortcuts',
      icon: 'bi-keyboard',
      action: 'keyboard-shortcuts',
      shortcutKey: 'Shift + ?'
    },
    {
      divider: true,
      label: '',
      icon: ''
    },
    {
      label: 'Logout',
      icon: 'bi-box-arrow-right',
      action: 'logout',
      isBold: true
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
      case 'keyboard-shortcuts':
        this.showKeyboardShortcuts.emit();
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
