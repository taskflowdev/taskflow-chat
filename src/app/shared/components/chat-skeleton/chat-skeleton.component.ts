import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-chat-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <!-- Chat List Skeleton -->
    <div *ngIf="type === 'chat-list'" class="chat-list-skeleton">
      <div *ngFor="let item of getSkeletonArray(count)" class="chat-item-skeleton">
        <app-skeleton-loader [config]="{ className: 'avatar' }"></app-skeleton-loader>
        <div class="chat-item-content">
          <div class="chat-item-header">
            <app-skeleton-loader [config]="{ width: '70%', height: '16px' }"></app-skeleton-loader>
            <app-skeleton-loader [config]="{ width: '40px', height: '12px' }"></app-skeleton-loader>
          </div>
          <app-skeleton-loader [config]="{ width: '85%', height: '14px' }"></app-skeleton-loader>
        </div>
      </div>
    </div>

    <!-- Message List Skeleton -->
    <div *ngIf="type === 'message-list'" class="message-list-skeleton">
      <div *ngFor="let item of getSkeletonArray(count); let i = index" 
           class="message-skeleton"
           [class.own]="i % 3 === 0">
        <app-skeleton-loader 
          *ngIf="i % 3 !== 0" 
          [config]="{ className: 'avatar-sm' }">
        </app-skeleton-loader>
        <div class="message-content">
          <app-skeleton-loader 
            *ngIf="i % 3 !== 0" 
            [config]="{ width: '80px', height: '12px' }">
          </app-skeleton-loader>
          <app-skeleton-loader 
            [config]="{ 
              width: getRandomWidth(), 
              height: '16px', 
              borderRadius: '12px',
              className: 'rounded' 
            }">
          </app-skeleton-loader>
        </div>
      </div>
    </div>

    <!-- Single Chat Item Skeleton -->
    <div *ngIf="type === 'chat-item'" class="chat-item-skeleton">
      <app-skeleton-loader [config]="{ className: 'avatar' }"></app-skeleton-loader>
      <div class="chat-item-content">
        <div class="chat-item-header">
          <app-skeleton-loader [config]="{ width: '70%', height: '16px' }"></app-skeleton-loader>
          <app-skeleton-loader [config]="{ width: '40px', height: '12px' }"></app-skeleton-loader>
        </div>
        <app-skeleton-loader [config]="{ width: '85%', height: '14px' }"></app-skeleton-loader>
      </div>
    </div>

    <!-- Single Message Skeleton -->
    <div *ngIf="type === 'message'" class="message-skeleton" [class.own]="ownMessage">
      <app-skeleton-loader 
        *ngIf="!ownMessage" 
        [config]="{ className: 'avatar-sm' }">
      </app-skeleton-loader>
      <div class="message-content">
        <app-skeleton-loader 
          *ngIf="!ownMessage" 
          [config]="{ width: '80px', height: '12px' }">
        </app-skeleton-loader>
        <app-skeleton-loader 
          [config]="{ 
            width: '60%', 
            height: '16px', 
            borderRadius: '12px',
            className: 'rounded' 
          }">
        </app-skeleton-loader>
      </div>
    </div>
  `,
  styles: [`
    .chat-list-skeleton {
      padding: 0.5rem;
    }

    .chat-item-skeleton {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.02);
    }

    .chat-item-content {
      flex: 1;
      min-width: 0;
    }

    .chat-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .message-list-skeleton {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message-skeleton {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .message-skeleton.own {
      flex-direction: row-reverse;
      text-align: right;
    }

    .message-skeleton.own .message-content {
      align-items: flex-end;
    }

    .message-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-width: 70%;
    }

    .message-skeleton:not(.own) .message-content {
      align-items: flex-start;
    }

    @media (max-width: 768px) {
      .chat-item-skeleton {
        padding: 0.5rem;
      }

      .message-list-skeleton {
        padding: 0.5rem;
        gap: 0.75rem;
      }

      .message-content {
        max-width: 85%;
      }
    }
  `]
})
export class ChatSkeletonComponent {
  @Input() type: 'chat-list' | 'message-list' | 'chat-item' | 'message' = 'chat-list';
  @Input() count: number = 5;
  @Input() ownMessage: boolean = false;

  private readonly widthOptions = ['45%', '60%', '75%', '50%', '80%'];

  getSkeletonArray(count: number): any[] {
    return new Array(count);
  }

  getRandomWidth(): string {
    return this.widthOptions[Math.floor(Math.random() * this.widthOptions.length)];
  }
}