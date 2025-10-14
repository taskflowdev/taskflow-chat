import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { AppConfigService, AppConfig } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
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
  });

  it('should use default values when config.json fails to load', async () => {
    const loadPromise = service.loadConfig();

    const req = httpMock.expectOne('/config.json');
    req.error(new ProgressEvent('error'));

    await loadPromise;

    expect(service.getApiUrl()).toBe('https://localhost:44347');
    expect(service.getEncryptionKey()).toBe('default-key-change-me');
    expect(service.isProduction()).toBe(false);
  });

  it('should use default values when config is missing required fields', async () => {
    const incompleteConfig = {
      apiUrl: '',
      encryptionKey: '',
      production: false
    };

    const loadPromise = service.loadConfig();

    const req = httpMock.expectOne('/config.json');
    req.flush(incompleteConfig);

    await loadPromise;

    expect(service.getApiUrl()).toBe('https://localhost:44347');
    expect(service.getEncryptionKey()).toBe('default-key-change-me');
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
  });
});
