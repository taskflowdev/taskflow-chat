import { Component, Input, HostListener, ElementRef, Renderer2, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  BOTTOM_RIGHT = 'bottom-right'
}

/**
 * Enterprise-level tooltip directive component
 * 
 * Features:
 * - Supports text and HTML content
 * - Configurable positioning with enum
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
 * ```
 */
@Component({
  selector: '[appCommonTooltip]',
  standalone: true,
  imports: [CommonModule],
  template: '',
  styles: []
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

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
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
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

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
