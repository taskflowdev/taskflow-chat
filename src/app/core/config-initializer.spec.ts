import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { AppConfigService } from './services/app-config.service';
import { appConfigInitializerFactory } from './config-initializer';

describe('appConfigInitializerFactory', () => {
  let appConfigService: AppConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AppConfigService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    appConfigService = TestBed.inject(AppConfigService);
  });

  it('should return a function that calls loadConfig', async () => {
    const loadConfigSpy = spyOn(appConfigService, 'loadConfig').and.returnValue(Promise.resolve());

    const initializerFn = appConfigInitializerFactory(appConfigService);
    
    expect(typeof initializerFn).toBe('function');

    await initializerFn();

    expect(loadConfigSpy).toHaveBeenCalled();
  });

  it('should handle loadConfig errors gracefully and not throw', async () => {
    // Even if loadConfig rejects, the initializer should resolve
    spyOn(appConfigService, 'loadConfig').and.returnValue(Promise.reject(new Error('Config load failed')));

    const initializerFn = appConfigInitializerFactory(appConfigService);

    // Should resolve successfully even if loadConfig fails
    await expectAsync(initializerFn()).toBeResolved();
  });

  it('should log health status after successful load', async () => {
    const mockHealth = {
      state: 'LOADED',
      hasConfig: true,
      configSource: 'loaded',
      config: {
        apiUrl: 'https://api.test.com',
        encryptionKey: 'test-key',
        production: false
      }
    };

    spyOn(appConfigService, 'loadConfig').and.returnValue(Promise.resolve());
    spyOn(appConfigService, 'getHealthStatus').and.returnValue(mockHealth);
    spyOn(console, 'log');

    const initializerFn = appConfigInitializerFactory(appConfigService);
    await initializerFn();

    expect(appConfigService.getHealthStatus).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });

  it('should always resolve to allow app to start', async () => {
    // Test with successful load
    let loadConfigSpy = spyOn(appConfigService, 'loadConfig').and.returnValue(Promise.resolve());
    const initializerFn1 = appConfigInitializerFactory(appConfigService);
    await expectAsync(initializerFn1()).toBeResolved();

    // Reset for second test
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AppConfigService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    const newAppConfigService = TestBed.inject(AppConfigService);

    // Test with failed load (loadConfig handles errors internally)
    const loadConfigSpy2 = spyOn(newAppConfigService, 'loadConfig');
    loadConfigSpy2.and.returnValue(Promise.reject(new Error('Unexpected error')));
    
    const initializerFn2 = appConfigInitializerFactory(newAppConfigService);
    await expectAsync(initializerFn2()).toBeResolved();
  });
});
