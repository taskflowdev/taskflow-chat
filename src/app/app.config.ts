import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ApiConfiguration } from './api/api-configuration';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import { AppConfigService } from './core/services/app-config.service';
import { appConfigInitializerFactory } from './core/config-initializer';
import { AppInitService } from './core/services/app-init.service';
import { appInitServiceFactory } from './core/app-init-service.factory';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    ApiConfiguration,
    AppConfigService,
    AppInitService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: appConfigInitializerFactory,
      deps: [AppConfigService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitServiceFactory,
      deps: [AppInitService],
      multi: true
    }
  ]
};
