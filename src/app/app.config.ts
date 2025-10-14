import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ApiConfiguration } from './api/api-configuration';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import { AuthService } from './auth/services/auth.service';
import { appInitializerFactory } from './core/app-initializer';
import { AppConfigService } from './core/services/app-config.service';
import { appConfigInitializerFactory } from './core/config-initializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptorsFromDi()),
    ApiConfiguration,
    AppConfigService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: appConfigInitializerFactory,
      deps: [AppConfigService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [AuthService, PLATFORM_ID],
      multi: true
    }
  ]
};
