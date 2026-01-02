import { TestBed } from '@angular/core/testing';
import { TypingIndicatorSettingsService } from './typing-indicator-settings.service';

describe('TypingIndicatorSettingsService', () => {
  let service: TypingIndicatorSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypingIndicatorSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default enabled state as true', () => {
    expect(service.isEnabled()).toBe(true);
  });

  it('should update enabled state', () => {
    service.setEnabled(false);
    expect(service.isEnabled()).toBe(false);

    service.setEnabled(true);
    expect(service.isEnabled()).toBe(true);
  });

  it('should emit enabled state changes via observable', (done) => {
    const states: boolean[] = [];
    
    service.isEnabled$().subscribe(enabled => {
      states.push(enabled);
      
      if (states.length === 3) {
        expect(states).toEqual([true, false, true]);
        done();
      }
    });

    service.setEnabled(false);
    service.setEnabled(true);
  });
});
