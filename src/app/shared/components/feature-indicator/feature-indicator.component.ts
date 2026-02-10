import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * FeatureIndicatorComponent
 * A reusable component that displays a visual indicator (dot) for new or important features.
 * Can be positioned around elements and customized with various styles.
 */
@Component({
    selector: 'app-feature-indicator',
    templateUrl: './feature-indicator.component.html',
    styleUrls: ['./feature-indicator.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class FeatureIndicatorComponent {
    /**
     * Position of the indicator relative to parent element
     * Options: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
     * @default 'top-right'
     */
    @Input() position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';

    /**
     * Size of the indicator dot in pixels
     * @default 12
     */
    @Input() size: number = 12;

    /**
     * Color of the indicator dot (CSS color value)
     * Can use theme tokens or hex colors
     * @default 'var(--taskflow-color-indicator-color)'
     */
    @Input() color: string = 'var(--taskflow-color-indicator-color)';

    /**
     * Color of the pulse ring (CSS color value)
     * @default 'var(--taskflow-color-indicator-bg)'
     */
    @Input() pulseColor: string = 'var(--taskflow-color-indicator-bg)';

    /**
     * Animation type for the indicator
     * Options: 'pulse', 'blink', 'none'
     * @default 'pulse'
     */
    @Input() animation: 'pulse' | 'blink' | 'none' = 'pulse';

    /**
     * Duration of the animation in seconds
     * @default 2
     */
    @Input() animationDuration: number = 2;

    /**
     * Border color of the indicator
     * Usually matches the background color of parent element
     * @default 'var(--taskflow-color-chat-sidebar-bg)'
     */
    @Input() borderColor: string = 'var(--taskflow-color-chat-sidebar-bg)';

    /**
     * Offset from edge in pixels (horizontal and vertical)
     * @default 4
     */
    @Input() offset: number = 4;

    /**
     * Custom CSS class for additional styling
     */
    @Input() customClass: string = '';

    /**
     * Show or hide the indicator
     * @default true
     */
    @Input() visible: boolean = true;

    /**
     * Get the positioning styles based on the position input
     */
    get positionStyles(): Record<string, string> {
        const offset = -this.offset;
        const styles: Record<string, string> = {};

        switch (this.position) {
            case 'top-right':
                styles['top'] = `${offset}px`;
                styles['right'] = `${offset}px`;
                break;
            case 'top-left':
                styles['top'] = `${offset}px`;
                styles['left'] = `${offset}px`;
                break;
            case 'bottom-right':
                styles['bottom'] = `${offset}px`;
                styles['right'] = `${offset}px`;
                break;
            case 'bottom-left':
                styles['bottom'] = `${offset}px`;
                styles['left'] = `${offset}px`;
                break;
        }

        return styles;
    }

    /**
     * Get the dimension styles for the indicator dot
     */
    get dimensionStyles(): Record<string, string> {
        const sizeInPx = `${this.size}px`;
        return {
            'width': sizeInPx,
            'height': sizeInPx,
        };
    }

    /**
     * Get the animation class based on the animation type
     */
    get animationClass(): string {
        return `animation-${this.animation}`;
    }

    /**
     * Get CSS variables for colors and animation duration
     */
    get customStyles(): Record<string, string> {
        return {
            '--indicator-color': this.color,
            '--indicator-pulse-color': this.pulseColor,
            '--indicator-border-color': this.borderColor,
            '--indicator-animation-duration': `${this.animationDuration}s`,
        };
    }

    /**
     * Merge all styles (position, dimension, and custom) into one object for template binding
     */
    get allStyles(): Record<string, string> {
        return {
            ...this.positionStyles,
            ...this.dimensionStyles,
            ...this.customStyles,
        };
    }
}
