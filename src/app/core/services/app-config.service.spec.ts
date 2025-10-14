import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { AppConfigService, AppConfig } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // Clear sessionStorage before each test
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AppConfigService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(AppConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load configuration from config.json', async () => {
    const mockConfig: AppConfig = {
      apiUrl: 'https://api.example.com',
      encryptionKey: 'test-key-123',
      production: true
    };

    const loadPromise = service.loadConfig();

    const req = httpMock.expectOne('/config.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);

    await loadPromise;

    expect(service.getApiUrl()).toBe('https://api.example.com');
    expect(service.getEncryptionKey()).toBe('test-key-123');
    expect(service.isProduction()).toBe(true);
    expect(service.isConfigLoaded()).toBe(true);
    expect(service.getConfigState()).toBe('LOADED');
  });

  it('should cache config in sessionStorage after successful load', async () => {
    const mockConfig: AppConfig = {
      apiUrl: 'https://api.example.com',
      encryptionKey: 'test-key-123',
      production: true
    };

    const loadPromise = service.loadConfig();
    const req = httpMock.expectOne('/config.json');
    req.flush(mockConfig);
    await loadPromise;

    // Check sessionStorage
    const cached = sessionStorage.getItem('taskflow_app_config');
    expect(cached).toBeTruthy();
    const parsedCached = JSON.parse(cached!);
    expect(parsedCached.apiUrl).toBe('https://api.example.com');
  });

  it('should restore config from sessionStorage if available', async () => {
    // Pre-populate sessionStorage
    const cachedConfig: AppConfig = {
      apiUrl: 'https://cached.example.com',
      encryptionKey: 'cached-key',
      production: false
    };
    sessionStorage.setItem('taskflow_app_config', JSON.stringify(cachedConfig));

    // Create new service instance (should restore from cache)
    const newService = TestBed.inject(AppConfigService);
    
    await newService.loadConfig();
    
    // Should not make HTTP request since config was restored from cache
    httpMock.expectNone('/config.json');
    
    expect(newService.getApiUrl()).toBe('https://cached.example.com');
    expect(newService.getEncryptionKey()).toBe('cached-key');
  });

  it('should retry loading config on failure', async () => {
    const mockConfig: AppConfig = {
      apiUrl: 'https://api.retry.com',
      encryptionKey: 'retry-key',
      production: false
    };

    const loadPromise = service.loadConfig();

    // Wait a bit for the first request
    await new Promise(resolve => setTimeout(resolve, 10));

    // First attempt fails
    const req1 = httpMock.expectOne('/config.json');
    req1.error(new ProgressEvent('error'));

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // Second attempt fails
    const req2 = httpMock.expectOne('/config.json');
    req2.error(new ProgressEvent('error'));

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, 250));

    // Third attempt succeeds
    const req3 = httpMock.expectOne('/config.json');
    req3.flush(mockConfig);

    await loadPromise;

    expect(service.getApiUrl()).toBe('https://api.retry.com');
    expect(service.isConfigLoaded()).toBe(true);
  });

  it('should use default values when all retry attempts fail', async () => {
    const loadPromise = service.loadConfig();

    // Wait for first request
    await new Promise(resolve => setTimeout(resolve, 10));

    // First attempt fails
    const req1 = httpMock.expectOne('/config.json');
    req1.error(new ProgressEvent('error'));

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // Second attempt fails
    const req2 = httpMock.expectOne('/config.json');
    req2.error(new ProgressEvent('error'));

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, 250));

    // Third attempt fails
    const req3 = httpMock.expectOne('/config.json');
    req3.error(new ProgressEvent('error'));

    await loadPromise;

    expect(service.getApiUrl()).toBe('https://localhost:44347');
    expect(service.getEncryptionKey()).toBe('default-key-change-me');
    expect(service.isProduction()).toBe(false);
    expect(service.getConfigState()).toBe('FAILED');
  });

  it('should use default values when config is missing required fields', async () => {
    const incompleteConfig = {
      apiUrl: '',
      encryptionKey: '',
      production: false
    };

    const loadPromise = service.loadConfig();

    // Will retry 3 times due to validation failure, wait for each attempt
    await new Promise(resolve => setTimeout(resolve, 10));
    const req1 = httpMock.expectOne('/config.json');
    req1.flush(incompleteConfig);

    await new Promise(resolve => setTimeout(resolve, 150));
    const req2 = httpMock.expectOne('/config.json');
    req2.flush(incompleteConfig);

    await new Promise(resolve => setTimeout(resolve, 250));
    const req3 = httpMock.expectOne('/config.json');
    req3.flush(incompleteConfig);

    await loadPromise;

    expect(service.getApiUrl()).toBe('https://localhost:44347');
    expect(service.getEncryptionKey()).toBe('default-key-change-me');
  });

  it('should validate config structure before accepting', async () => {
    const invalidConfig = {
      apiUrl: 'https://api.test.com',
      // Missing encryptionKey
      production: false
    };

    const loadPromise = service.loadConfig();

    // Will retry 3 times due to validation failure, with delays between attempts
    await new Promise(resolve => setTimeout(resolve, 10));
    const req1 = httpMock.expectOne('/config.json');
    req1.flush(invalidConfig);

    await new Promise(resolve => setTimeout(resolve, 150));
    const req2 = httpMock.expectOne('/config.json');
    req2.flush(invalidConfig);

    await new Promise(resolve => setTimeout(resolve, 250));
    const req3 = httpMock.expectOne('/config.json');
    req3.flush(invalidConfig);

    await loadPromise;

    // Should fall back to defaults
    expect(service.getApiUrl()).toBe('https://localhost:44347');
    expect(service.getConfigState()).toBe('FAILED');
  });

  it('should return entire config object', async () => {
    const mockConfig: AppConfig = {
      apiUrl: 'https://api.test.com',
      encryptionKey: 'test-key',
      production: false
    };

    const loadPromise = service.loadConfig();

    const req = httpMock.expectOne('/config.json');
    req.flush(mockConfig);

    await loadPromise;

    const config = service.getConfig();
    expect(config.apiUrl).toBe('https://api.test.com');
    expect(config.encryptionKey).toBe('test-key');
    expect(config.production).toBe(false);
  });

  it('should return a copy of config to prevent mutations', async () => {
    const mockConfig: AppConfig = {
      apiUrl: 'https://api.test.com',
      encryptionKey: 'test-key',
      production: false
    };

    const loadPromise = service.loadConfig();
    const req = httpMock.expectOne('/config.json');
    req.flush(mockConfig);
    await loadPromise;

    const config1 = service.getConfig();
    config1.apiUrl = 'https://modified.com';

    const config2 = service.getConfig();
    expect(config2.apiUrl).toBe('https://api.test.com'); // Not modified
  });

  it('should not reload if already loaded', async () => {
    const mockConfig: AppConfig = {
      apiUrl: 'https://api.test.com',
      encryptionKey: 'test-key',
      production: false
    };

    // First load
    const loadPromise1 = service.loadConfig();
    const req = httpMock.expectOne('/config.json');
    req.flush(mockConfig);
    await loadPromise1;

    // Second load - should not make HTTP request
    await service.loadConfig();
    httpMock.expectNone('/config.json');

    expect(service.getApiUrl()).toBe('https://api.test.com');
  });

  it('should provide health status for debugging', async () => {
    const mockConfig: AppConfig = {
      apiUrl: 'https://api.test.com',
      encryptionKey: 'test-key',
      production: true
    };

    const loadPromise = service.loadConfig();
    const req = httpMock.expectOne('/config.json');
    req.flush(mockConfig);
    await loadPromise;

    const health = service.getHealthStatus();
    expect(health.state).toBe('LOADED');
    expect(health.hasConfig).toBe(true);
    expect(health.configSource).toBe('loaded');
    expect(health.config.apiUrl).toBe('https://api.test.com');
  });

  it('should allow force reload of config', async () => {
    const mockConfig1: AppConfig = {
      apiUrl: 'https://api1.test.com',
      encryptionKey: 'key1',
      production: false
    };

    const mockConfig2: AppConfig = {
      apiUrl: 'https://api2.test.com',
      encryptionKey: 'key2',
      production: true
    };

    // First load
    const loadPromise1 = service.loadConfig();
    const req1 = httpMock.expectOne('/config.json');
    req1.flush(mockConfig1);
    await loadPromise1;

    expect(service.getApiUrl()).toBe('https://api1.test.com');

    // Clear sessionStorage before reload to ensure fresh load
    sessionStorage.clear();

    // Force reload
    const reloadPromise = service.reloadConfig();
    const req2 = httpMock.expectOne('/config.json');
    req2.flush(mockConfig2);
    await reloadPromise;

    expect(service.getApiUrl()).toBe('https://api2.test.com');
    expect(service.isProduction()).toBe(true);
  });

  it('should always return valid values even before config is loaded', () => {
    // Before loading config
    expect(service.getApiUrl()).toBe('https://localhost:44347');
    expect(service.getEncryptionKey()).toBe('default-key-change-me');
    expect(service.isProduction()).toBe(false);
    
    const config = service.getConfig();
    expect(config.apiUrl).toBeTruthy();
    expect(config.encryptionKey).toBeTruthy();
  });
});

describe('AppConfigService (SSR)', () => {
  let service: AppConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AppConfigService,
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    service = TestBed.inject(AppConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should use default config during SSR without making HTTP request', async () => {
    await service.loadConfig();

    // Should not make any HTTP requests during SSR
    httpMock.expectNone('/config.json');

    expect(service.getApiUrl()).toBe('https://localhost:44347');
    expect(service.getEncryptionKey()).toBe('default-key-change-me');
    expect(service.isProduction()).toBe(false);
    expect(service.isConfigLoaded()).toBe(true);
    expect(service.getConfigState()).toBe('LOADED');
  });
});
