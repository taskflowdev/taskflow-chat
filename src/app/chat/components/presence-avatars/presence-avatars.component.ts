import { Component, Input, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupsService } from '../../../api/services/groups.service';
import { PresenceDto } from '../../../api/models/presence-dto';
import { PresenceDtoIEnumerableApiResponse } from '../../../api/models/presence-dto-i-enumerable-api-response';
import { interval, Subscription, Observable, Subject } from 'rxjs';
import { switchMap, catchError, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-presence-avatars',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presence-avatars.component.html',
  styleUrls: ['./presence-avatars.component.scss']
})
export class PresenceAvatarsComponent implements OnInit, OnDestroy {
  @Input() groupId: string | null = null;
  @Input() maxVisible: number = 5; // Maximum number of avatars to show before showing "+N"

  presenceList: PresenceDto[] = [];
  showDropdown = false;
  hoveredUser: PresenceDto | null = null;
  profileCardPosition = { top: 0, left: 0 };
  
  private presenceSubscription?: Subscription;
  private refreshInterval = 10000; // 10 seconds
  private destroy$ = new Subject<void>();
  private dropdownCloseTimeout: NodeJS.Timeout | null = null;
  
  private readonly PROFILE_CARD_WIDTH = 280; // Must match CSS .profile-hover-card width

  constructor(
    private groupsService: GroupsService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    if (this.groupId) {
      this.loadPresence();
      this.startPresenceRefresh();
    }
  }

  ngOnDestroy(): void {
    this.presenceSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    if (this.dropdownCloseTimeout) {
      clearTimeout(this.dropdownCloseTimeout);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.showDropdown = false;
      this.hoveredUser = null;
    }
  }

  private loadPresence(): void {
    this.fetchPresence()
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.presenceList = response.data || [];
      });
  }

  private startPresenceRefresh(): void {
    this.presenceSubscription = interval(this.refreshInterval)
      .pipe(
        switchMap(() => this.fetchPresence()),
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        this.presenceList = response.data || [];
      });
  }

  private fetchPresence(): Observable<PresenceDtoIEnumerableApiResponse> {
    if (!this.groupId) {
      return of({ data: [] });
    }

    return this.groupsService.apiGroupsIdPresenceGet$Json({ id: this.groupId })
      .pipe(
        catchError(error => {
          console.error('Error loading presence:', error);
          return of({ data: [] });
        })
      );
  }

  /**
   * Get the initials from a user's name
   */
  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Get only online members
   */
  get onlineMembers(): PresenceDto[] {
    return this.presenceList.filter(p => p.isOnline);
  }

  /**
   * Get the list of online members to display (limited by maxVisible)
   */
  get visibleMembers(): PresenceDto[] {
    return this.onlineMembers.slice(0, this.maxVisible);
  }

  /**
   * Get the count of remaining online members not displayed
   */
  get remainingCount(): number {
    return Math.max(0, this.onlineMembers.length - this.maxVisible);
  }

  /**
   * Get online members count
   */
  get onlineCount(): number {
    return this.onlineMembers.length;
  }

  /**
   * Toggle dropdown visibility
   */
  onAvatarStackHover(): void {
    if (this.dropdownCloseTimeout) {
      clearTimeout(this.dropdownCloseTimeout);
    }
    this.showDropdown = true;
  }

  onAvatarStackLeave(): void {
    this.dropdownCloseTimeout = setTimeout(() => {
      this.showDropdown = false;
    }, 300);
  }

  onDropdownEnter(): void {
    if (this.dropdownCloseTimeout) {
      clearTimeout(this.dropdownCloseTimeout);
    }
  }

  onDropdownLeave(): void {
    this.showDropdown = false;
  }

  /**
   * Show profile card on avatar hover
   */
  onAvatarHover(event: MouseEvent, member: PresenceDto): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Position card to the left of the avatar
    this.profileCardPosition = {
      top: rect.top + window.scrollY,
      left: rect.left - this.PROFILE_CARD_WIDTH - 10 // Card width + spacing
    };
    
    this.hoveredUser = member;
  }

  onAvatarLeave(): void {
    this.hoveredUser = null;
  }

  /**
   * Get user email or fallback to username
   * Note: Since PresenceDto doesn't include email, we return just the username.
   * In a production environment, this should fetch from a user profile service.
   */
  getUserEmail(member: PresenceDto): string {
    // TODO: Integrate with user profile service to get actual email
    return member.userName || member.userId || 'user@domain.com';
  }

  /**
   * Get tooltip text for a member
   */
  getMemberTooltip(member: PresenceDto): string {
    const status = member.isOnline ? 'Online' : 'Offline';
    return `${member.userName} - ${status}`;
  }
}
