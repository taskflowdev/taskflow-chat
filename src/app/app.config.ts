import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { provideRouter, UrlSerializer } from '@angular/router';
import { CustomUrlSerializer } from './core/serializers/custom-url.serializer';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ApiConfiguration } from './api/api-configuration';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import { AppConfigService } from './core/services/app-config.service';
import { appConfigInitializerFactory } from './core/config-initializer';
import { StartupService } from './core/services/startup.service';
import { startupServiceFactory } from './core/startup-service.factory';
import { I18nService, I18nInterceptor, i18nInitializerFactory } from './core/i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    ApiConfiguration,
    AppConfigService,
    StartupService,
    I18nService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: I18nInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: appConfigInitializerFactory,
      deps: [AppConfigService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: startupServiceFactory,
      deps: [StartupService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: i18nInitializerFactory,
      deps: [I18nService],
      multi: true
    },
    { provide: UrlSerializer, useClass: CustomUrlSerializer }
  ]
};
