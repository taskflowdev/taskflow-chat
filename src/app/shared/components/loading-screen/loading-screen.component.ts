import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * LoadingScreenComponent provides a full-screen loading splash screen
 * with the app logo (Bootstrap chat-quote icon) centered and a spinner below it.
 * This is shown during app initialization and critical loading operations.
 */
@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-screen" role="status" aria-live="polite" aria-label="Loading application">
      <div class="loading-content">
        <div class="logo-container">
          <!-- App logo using Bootstrap icon bi-chat-quote -->
          <i class="bi bi-chat-quote app-logo"></i>
        </div>
        <div class="spinner-container">
          <div class="spinner"></div>
        </div>
        <span class="visually-hidden">Loading, please wait...</span>
      </div>
    </div>
  `,
  styles: [`
    .loading-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: #000;
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
      gap: 2rem;
    }

    .logo-container {
      animation: pulse 2s ease-in-out infinite;
    }

    .app-logo {
      font-size: 120px;
      color: white;
      filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
    }

    .spinner-container {
      width: 48px;
      height: 48px;
      position: relative;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(0.98);
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
export class LoadingScreenComponent {}
