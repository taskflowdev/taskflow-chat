import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupsService } from '../../../api/services/groups.service';
import { PresenceDto } from '../../../api/models/presence-dto';
import { interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
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
  @Input() maxVisible: number = 3; // Maximum number of avatars to show before showing "+N"

  presenceList: PresenceDto[] = [];
  private presenceSubscription?: Subscription;
  private refreshInterval = 10000; // 10 seconds

  constructor(private groupsService: GroupsService) {}

  ngOnInit(): void {
    if (this.groupId) {
      this.loadPresence();
      this.startPresenceRefresh();
    }
  }

  ngOnDestroy(): void {
    this.presenceSubscription?.unsubscribe();
  }

  private loadPresence(): void {
    if (!this.groupId) return;

    this.groupsService.apiGroupsIdPresenceGet$Json({ id: this.groupId })
      .pipe(
        catchError(error => {
          console.error('Error loading presence:', error);
          return of({ data: [] });
        })
      )
      .subscribe(response => {
        this.presenceList = response.data || [];
      });
  }

  private startPresenceRefresh(): void {
    this.presenceSubscription = interval(this.refreshInterval)
      .pipe(
        switchMap(() => {
          if (!this.groupId) return of({ data: [] });
          return this.groupsService.apiGroupsIdPresenceGet$Json({ id: this.groupId })
            .pipe(
              catchError(error => {
                console.error('Error refreshing presence:', error);
                return of({ data: [] });
              })
            );
        })
      )
      .subscribe(response => {
        this.presenceList = response.data || [];
      });
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
   * Get the list of members to display (limited by maxVisible)
   */
  get visibleMembers(): PresenceDto[] {
    return this.presenceList.slice(0, this.maxVisible);
  }

  /**
   * Get the count of remaining members not displayed
   */
  get remainingCount(): number {
    return Math.max(0, this.presenceList.length - this.maxVisible);
  }

  /**
   * Get online members count
   */
  get onlineCount(): number {
    return this.presenceList.filter(p => p.isOnline).length;
  }

  /**
   * Get tooltip text for a member
   */
  getMemberTooltip(member: PresenceDto): string {
    const status = member.isOnline ? 'Online' : 'Offline';
    return `${member.userName} - ${status}`;
  }
}
