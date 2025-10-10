import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Full-screen loading splash screen with app logo and elegant white bar loader
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
        <div class="loader"></div>
        <span class="visually-hidden">Loading, please wait...</span>
      </div>
    </div>
  `,
  styles: [`
    .loading-screen {
      position: fixed;
      inset: 0;
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
      // animation: pulse 2s ease-in-out infinite;
    }

    .app-logo {
      font-size: 80px;
      color: #fff;
      // filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
    }

    /* Loader bar */
    .loader {
      display: block;
      --height-of-loader: 4.5px;
      --loader-color: #fff;
      width: 120px;
      height: var(--height-of-loader);
      border-radius: 30px;
      background-color: rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }

    .loader::before {
      content: "";
      position: absolute;
      background: var(--loader-color);
      top: 0;
      left: 0;
      width: 0%;
      height: 100%;
      border-radius: 30px;
      animation: moving 1.2s ease-in-out infinite;
    }

    @keyframes moving {
      50% {
        width: 100%;
      }
      100% {
        width: 0;
        right: 0;
        left: unset;
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
export class LoadingScreenComponent { }
