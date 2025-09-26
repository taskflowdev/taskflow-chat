import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  template: `
    <div class="skeleton-wrapper" [attr.aria-label]="ariaLabel">
      <div 
        class="skeleton" 
        [class]="skeletonClass"
        [style.width]="width"
        [style.height]="height"
        [style.border-radius]="borderRadius">
      </div>
    </div>
  `,
  styleUrls: ['./loading-skeleton.component.scss']
})
export class LoadingSkeletonComponent {
  @Input() width: string = '100%';
  @Input() height: string = '1rem';
  @Input() borderRadius: string = '0.25rem';
  @Input() skeletonClass: string = '';
  @Input() ariaLabel: string = 'Loading content';
}