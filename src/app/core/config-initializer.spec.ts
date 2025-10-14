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

  it('should handle loadConfig errors gracefully', async () => {
    spyOn(appConfigService, 'loadConfig').and.returnValue(Promise.reject(new Error('Config load failed')));

    const initializerFn = appConfigInitializerFactory(appConfigService);

    // Should not throw even if loadConfig fails
    await expectAsync(initializerFn()).toBeRejected();
  });
});
