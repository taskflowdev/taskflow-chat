import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getInitialsFromName } from '../../utils/user.utils';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarTone = 'profile' | 'sidebar' | 'subtle';
export type AvatarPresence = 'online' | 'offline' | null;

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent {
  @Input() name: string | null | undefined = null;
  @Input() textOverride: string | null | undefined = null;
  @Input() ariaLabel: string | null | undefined = null;
  @Input() size: AvatarSize = 'md';
  @Input() tone: AvatarTone = 'profile';
  @Input() presence: AvatarPresence = null;

  get displayText(): string {
    if (this.textOverride && this.textOverride.trim().length > 0) {
      return this.textOverride.trim();
    }

    return getInitialsFromName(this.name, '??');
  }

  get computedAriaLabel(): string {
    if (this.ariaLabel && this.ariaLabel.trim().length > 0) {
      return this.ariaLabel.trim();
    }

    if (this.name && this.name.trim().length > 0) {
      return `Avatar for ${this.name}`;
    }

    return 'Avatar';
  }
}
