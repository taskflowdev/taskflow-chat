import { Directive, Input, HostListener, ElementRef, Renderer2, OnDestroy, TemplateRef } from '@angular/core';

/**
 * Enum for tooltip position
 */
export enum TooltipPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  AUTO = 'auto' // Automatically determines best position
}

/**
 * Enterprise-level tooltip directive
 * 
 * Features:
 * - Supports text and HTML content
 * - Configurable positioning with enum
 * - AUTO positioning - intelligently determines best position
 * - Dark theme styling matching app design
 * - Smooth animations
 * - Auto-positioning to stay within viewport
 * - Accessible with ARIA attributes
 * 
 * Usage:
 * ```html
 * <!-- Simple text tooltip -->
 * <button [appCommonTooltip]="'Click to create group'" [tooltipPosition]="TooltipPosition.TOP">
 *   Create
 * </button>
 * 
 * <!-- HTML content tooltip -->
 * <button [appCommonTooltip]="htmlContent" [tooltipPosition]="TooltipPosition.BOTTOM">
 *   Info
 * </button>
 * <ng-template #htmlContent>
 *   <strong>Group Info</strong>
 *   <p>Click to view details</p>
 * </ng-template>
 * 
 * <!-- Auto-positioning tooltip -->
 * <button [appCommonTooltip]="'Smart positioning'" [tooltipPosition]="TooltipPosition.AUTO">
 *   Auto
 * </button>
 * ```
 */
@Directive({
  selector: '[appCommonTooltip]',
  standalone: true
})
export class CommonTooltipDirective implements OnDestroy {
  @Input('appCommonTooltip') tooltipContent: string | TemplateRef<any> = '';
  @Input() tooltipPosition: TooltipPosition = TooltipPosition.TOP;
  @Input() tooltipDelay: number = 200; // Delay in milliseconds before showing tooltip
  @Input() tooltipDisabled: boolean = false;

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: any;
  private hideTimeout: any;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.tooltipDisabled || !this.tooltipContent) {
      return;
    }

    // Clear any existing hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Show tooltip after delay
    this.showTimeout = setTimeout(() => {
      this.showTooltip();
    }, this.tooltipDelay);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    // Clear show timeout
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    // Hide tooltip with slight delay for smoother UX
    this.hideTimeout = setTimeout(() => {
      this.hideTooltip();
    }, 100);
  }

  @HostListener('click')
  onClick(): void {
    // Hide tooltip on click
    this.hideTooltip();
  }

  private showTooltip(): void {
    if (this.tooltipElement) {
      return; // Tooltip already visible
    }

    // Create tooltip element
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'common-tooltip');
    this.renderer.addClass(this.tooltipElement, `tooltip-${this.tooltipPosition}`);
    
    // Set ARIA attributes for accessibility
    this.renderer.setAttribute(this.tooltipElement, 'role', 'tooltip');
    this.renderer.setAttribute(this.tooltipElement, 'aria-hidden', 'false');

    // Set tooltip content
    if (typeof this.tooltipContent === 'string') {
      // Simple text content
      this.renderer.setProperty(this.tooltipElement, 'textContent', this.tooltipContent);
    } else {
      // HTML template content
      const view = this.tooltipContent.createEmbeddedView(null);
      view.rootNodes.forEach(node => {
        this.renderer.appendChild(this.tooltipElement, node);
      });
    }

    // Add tooltip to body
    this.renderer.appendChild(document.body, this.tooltipElement);

    // Position tooltip
    this.positionTooltip();

    // Trigger animation
    setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.addClass(this.tooltipElement, 'show');
      }
    }, 10);
  }

  private hideTooltip(): void {
    if (!this.tooltipElement) {
      return;
    }

    // Remove show class for fade-out animation
    this.renderer.removeClass(this.tooltipElement, 'show');

    // Remove tooltip after animation
    setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.removeChild(document.body, this.tooltipElement);
        this.tooltipElement = null;
      }
    }, 200);
  }

  private positionTooltip(): void {
    if (!this.tooltipElement) {
      return;
    }

    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const offset = 8; // Gap between element and tooltip
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let position = this.tooltipPosition;

    // AUTO positioning - determine best position based on available space
    if (this.tooltipPosition === TooltipPosition.AUTO) {
      const spaceTop = hostRect.top;
      const spaceBottom = viewportHeight - hostRect.bottom;
      const spaceLeft = hostRect.left;
      const spaceRight = viewportWidth - hostRect.right;

      // Calculate which side has most space
      const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);

      if (maxSpace === spaceBottom && spaceBottom >= tooltipRect.height + offset) {
        position = TooltipPosition.BOTTOM;
      } else if (maxSpace === spaceTop && spaceTop >= tooltipRect.height + offset) {
        position = TooltipPosition.TOP;
      } else if (maxSpace === spaceRight && spaceRight >= tooltipRect.width + offset) {
        position = TooltipPosition.RIGHT;
      } else if (maxSpace === spaceLeft && spaceLeft >= tooltipRect.width + offset) {
        position = TooltipPosition.LEFT;
      } else {
        // Default to bottom if no clear winner
        position = TooltipPosition.BOTTOM;
      }
    }

    let top = 0;
    let left = 0;

    switch (position) {
      case TooltipPosition.TOP:
        top = hostRect.top - tooltipRect.height - offset;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;

      case TooltipPosition.BOTTOM:
        top = hostRect.bottom + offset;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;

      case TooltipPosition.LEFT:
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - offset;
        break;

      case TooltipPosition.RIGHT:
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + offset;
        break;

      case TooltipPosition.TOP_LEFT:
        top = hostRect.top - tooltipRect.height - offset;
        left = hostRect.left;
        break;

      case TooltipPosition.TOP_RIGHT:
        top = hostRect.top - tooltipRect.height - offset;
        left = hostRect.right - tooltipRect.width;
        break;

      case TooltipPosition.BOTTOM_LEFT:
        top = hostRect.bottom + offset;
        left = hostRect.left;
        break;

      case TooltipPosition.BOTTOM_RIGHT:
        top = hostRect.bottom + offset;
        left = hostRect.right - tooltipRect.width;
        break;

      default:
        top = hostRect.top - tooltipRect.height - offset;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
    }

    // Adjust position to stay within viewport
    // Keep tooltip within horizontal bounds
    if (left < scrollX) {
      left = scrollX + 5;
    } else if (left + tooltipRect.width > scrollX + viewportWidth) {
      left = scrollX + viewportWidth - tooltipRect.width - 5;
    }

    // Keep tooltip within vertical bounds
    if (top < scrollY) {
      top = scrollY + 5;
    } else if (top + tooltipRect.height > scrollY + viewportHeight) {
      top = scrollY + viewportHeight - tooltipRect.height - 5;
    }

    // Update tooltip class to match final position (for arrow styling)
    this.renderer.removeClass(this.tooltipElement, `tooltip-${this.tooltipPosition}`);
    this.renderer.addClass(this.tooltipElement, `tooltip-${position}`);

    // Apply position
    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }

  ngOnDestroy(): void {
    // Clean up timeouts
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // Remove tooltip if still visible
    this.hideTooltip();
  }
}
