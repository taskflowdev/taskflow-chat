import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Full-screen loading splash screen with app logo and elegant gradient text
 * Matches the design used in index.html for consistent user experience
 * Supports dynamic loading messages for different contexts
 */
@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-screen" role="status" aria-live="polite" aria-label="Loading application">
      <div class="loading-content">
        <div class="logo-container">
          <i class="bi bi-chat-quote app-logo"></i>
        </div>
        <p class="loading-text">{{ message }}</p>
        <span class="visually-hidden">Loading, please wait...</span>
      </div>
    </div>
  `,
  styles: [`
    /* Loading screen - matches index.html design exactly */
    .loading-screen {
      position: fixed;
      inset: 0;
      background-color: var(--taskflow-color-loading-screen-bg, var(--taskflow-color-startup-loading-screen-bg, #000000));
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      pointer-events: all;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      animation: fadeIn var(--taskflow-color-loading-fade-duration, var(--taskflow-color-startup-loading-fade-duration, 0.3s)) ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .logo-container {
      /* Container for logo */
    }

    .app-logo {
      font-size: 5rem;
      color: var(--taskflow-color-loading-logo, var(--taskflow-color-startup-loading-logo, #ffffff));
    }

    /* Elegant gradient text animation - matches index.html exactly */
    .loading-text {
      position: relative;
      display: inline-block;
      background: linear-gradient(90deg,
        var(--taskflow-color-loading-gradient-one, var(--taskflow-color-startup-loading-gradient-one, rgba(0, 0, 0))),
        var(--taskflow-color-loading-gradient-two, var(--taskflow-color-startup-loading-gradient-two, rgba(0, 0, 0))),
        var(--taskflow-color-loading-gradient-three, var(--taskflow-color-startup-loading-gradient-three, rgb(77, 77, 77))),
        var(--taskflow-color-loading-gradient-four, var(--taskflow-color-startup-loading-gradient-four, rgb(255, 255, 255))),
        var(--taskflow-color-loading-gradient-five, var(--taskflow-color-startup-loading-gradient-five, rgb(255, 255, 255)))
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 16px;
      font-weight: 400;
      letter-spacing: 0.3px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      animation:
        textFadeIn 0.6s ease-out forwards,
        shine var(--taskflow-color-loading-shine-duration, var(--taskflow-color-startup-loading-shine-duration, 2.5s)) linear infinite;
    }

    @keyframes textFadeIn {
      0% {
        opacity: 0;
        transform: translateY(6px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes shine {
      0% {
        background-position: 200% center;
      }
      100% {
        background-position: -200% center;
      }
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `]
})
export class LoadingScreenComponent {
  /**
   * Loading message to display
   * Default: "Setting things up for you…"
   */
  @Input() message: string = 'Setting things up for you…';
}
