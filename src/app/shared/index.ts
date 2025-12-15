export * from './shared.module';

// Layout Components
export * from './components/layout/main-layout.component';
export * from './components/navbar/navbar.component';
export * from './components/footer/footer.component';

// Other Shared Components
export * from './components/toast-container.component';
export * from './components/skeleton-loader/skeleton-loader.component';
export * from './components/loading-screen/loading-screen.component';
export * from './components/sync-indicator';

// Directives
export * from './directives/keyboard-shortcut.directive';

// Services
export * from './services/keyboard-shortcut.service';
export * from './services/shortcut-handler.service';
export * from './services/shortcut-registry.service';

// i18n (re-exported from core for convenience)
export { I18nService, TranslatePipe, RtlDirective } from '../core/i18n';
