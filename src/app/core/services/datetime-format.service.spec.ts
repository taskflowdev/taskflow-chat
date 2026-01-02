import { TestBed } from '@angular/core/testing';
import { DateTimeFormatService, TimeFormat } from './datetime-format.service';

describe('DateTimeFormatService', () => {
  let service: DateTimeFormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateTimeFormatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Time Format Management', () => {
    it('should have default time format as 12h', () => {
      expect(service.getTimeFormat()).toBe('12h');
    });

    it('should update time format', () => {
      service.setTimeFormat('24h');
      expect(service.getTimeFormat()).toBe('24h');

      service.setTimeFormat('12h');
      expect(service.getTimeFormat()).toBe('12h');
    });

    it('should emit time format changes via observable', (done) => {
      const formats: TimeFormat[] = [];
      
      service.getTimeFormat$().subscribe(format => {
        formats.push(format);
        
        if (formats.length === 3) {
          expect(formats).toEqual(['12h', '24h', '12h']);
          done();
        }
      });

      service.setTimeFormat('24h');
      service.setTimeFormat('12h');
    });
  });

  describe('formatTime', () => {
    it('should format time in 12-hour format', () => {
      service.setTimeFormat('12h');
      
      const result = service.formatTime('2025-01-02T14:30:00');
      expect(result).toContain('2:30');
      expect(result).toContain('PM');
    });

    it('should format time in 24-hour format', () => {
      service.setTimeFormat('24h');
      
      const result = service.formatTime('2025-01-02T14:30:00');
      expect(result).toBe('14:30');
    });

    it('should format morning time in 12-hour format', () => {
      service.setTimeFormat('12h');
      
      const result = service.formatTime('2025-01-02T09:15:00');
      expect(result).toContain('9:15');
      expect(result).toContain('AM');
    });

    it('should format morning time in 24-hour format', () => {
      service.setTimeFormat('24h');
      
      const result = service.formatTime('2025-01-02T09:15:00');
      expect(result).toBe('09:15');
    });

    it('should handle format override parameter', () => {
      service.setTimeFormat('12h'); // Set default to 12h
      
      const result24h = service.formatTime('2025-01-02T14:30:00', '24h');
      expect(result24h).toBe('14:30');
      
      const result12h = service.formatTime('2025-01-02T14:30:00', '12h');
      expect(result12h).toContain('PM');
    });

    it('should return empty string for invalid date', () => {
      const result = service.formatTime('invalid-date');
      expect(result).toBe('');
    });

    it('should return empty string for empty input', () => {
      const result = service.formatTime('');
      expect(result).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should return "Today" for current date', () => {
      const today = new Date().toISOString();
      const result = service.formatDate(today);
      expect(result).toBe('Today');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = service.formatDate(yesterday.toISOString());
      expect(result).toBe('Yesterday');
    });

    it('should return formatted date for older dates', () => {
      const result = service.formatDate('2024-12-25T14:30:00');
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2024');
    });

    it('should return empty string for invalid date', () => {
      const result = service.formatDate('invalid-date');
      expect(result).toBe('');
    });

    it('should return empty string for empty input', () => {
      const result = service.formatDate('');
      expect(result).toBe('');
    });
  });

  describe('formatChatTime', () => {
    it('should return time for recent messages (< 24h)', () => {
      const recentTime = new Date();
      recentTime.setHours(recentTime.getHours() - 2);
      
      service.setTimeFormat('12h');
      const result = service.formatChatTime(recentTime.toISOString());
      
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should return date for older messages (> 24h)', () => {
      const olderTime = new Date();
      olderTime.setDate(olderTime.getDate() - 5);
      
      const result = service.formatChatTime(olderTime.toISOString());
      
      expect(result).toMatch(/[A-Z][a-z]+\s\d{1,2}/);
    });

    it('should use format override for recent messages', () => {
      const recentTime = new Date();
      recentTime.setHours(recentTime.getHours() - 2);
      
      service.setTimeFormat('12h');
      const result24h = service.formatChatTime(recentTime.toISOString(), '24h');
      
      expect(result24h).toMatch(/\d{2}:\d{2}/);
      expect(result24h).not.toContain('AM');
      expect(result24h).not.toContain('PM');
    });

    it('should return empty string for invalid date', () => {
      const result = service.formatChatTime('invalid-date');
      expect(result).toBe('');
    });
  });

  describe('formatDateTimeTooltip', () => {
    it('should format full datetime with 12-hour format', () => {
      service.setTimeFormat('12h');
      
      const result = service.formatDateTimeTooltip('2025-01-02T14:30:00');
      
      expect(result).toContain('2025');
      expect(result).toContain('at');
      expect(result).toContain('PM');
    });

    it('should format full datetime with 24-hour format', () => {
      service.setTimeFormat('24h');
      
      const result = service.formatDateTimeTooltip('2025-01-02T14:30:00');
      
      expect(result).toContain('2025');
      expect(result).toContain('at');
      expect(result).toContain('14:30');
      expect(result).not.toContain('PM');
    });

    it('should use format override parameter', () => {
      service.setTimeFormat('12h');
      
      const result = service.formatDateTimeTooltip('2025-01-02T14:30:00', '24h');
      
      expect(result).toContain('14:30');
      expect(result).not.toContain('PM');
    });

    it('should return empty string for invalid date', () => {
      const result = service.formatDateTimeTooltip('invalid-date');
      expect(result).toBe('');
    });

    it('should return empty string for empty input', () => {
      const result = service.formatDateTimeTooltip('');
      expect(result).toBe('');
    });
  });

  describe('formatFullDate', () => {
    it('should format full date for profile display', () => {
      const result = service.formatFullDate('2025-01-02T14:30:00');
      
      expect(result).toContain('January');
      expect(result).toContain('2');
      expect(result).toContain('2025');
    });

    it('should handle date-only strings', () => {
      const result = service.formatFullDate('2025-01-02');
      
      expect(result).toContain('January');
      expect(result).toContain('2');
      expect(result).toContain('2025');
    });

    it('should return N/A for undefined input', () => {
      const result = service.formatFullDate(undefined);
      expect(result).toBe('N/A');
    });

    it('should return N/A for invalid date', () => {
      const result = service.formatFullDate('invalid-date');
      expect(result).toBe('N/A');
    });

    it('should return N/A for empty string', () => {
      const result = service.formatFullDate('');
      expect(result).toBe('N/A');
    });
  });

  describe('Error Handling', () => {
    it('should handle null gracefully', () => {
      expect(service.formatTime(null as any)).toBe('');
      expect(service.formatDate(null as any)).toBe('');
      expect(service.formatChatTime(null as any)).toBe('');
      expect(service.formatDateTimeTooltip(null as any)).toBe('');
    });

    it('should handle undefined gracefully', () => {
      expect(service.formatTime(undefined as any)).toBe('');
      expect(service.formatDate(undefined as any)).toBe('');
      expect(service.formatChatTime(undefined as any)).toBe('');
      expect(service.formatDateTimeTooltip(undefined as any)).toBe('');
    });

    it('should handle malformed date strings', () => {
      expect(service.formatTime('not-a-date')).toBe('');
      expect(service.formatDate('not-a-date')).toBe('');
      expect(service.formatChatTime('not-a-date')).toBe('');
      expect(service.formatDateTimeTooltip('not-a-date')).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle midnight correctly in 12h format', () => {
      service.setTimeFormat('12h');
      const result = service.formatTime('2025-01-02T00:00:00');
      expect(result).toContain('12:00');
      expect(result).toContain('AM');
    });

    it('should handle midnight correctly in 24h format', () => {
      service.setTimeFormat('24h');
      const result = service.formatTime('2025-01-02T00:00:00');
      expect(result).toBe('00:00');
    });

    it('should handle noon correctly in 12h format', () => {
      service.setTimeFormat('12h');
      const result = service.formatTime('2025-01-02T12:00:00');
      expect(result).toContain('12:00');
      expect(result).toContain('PM');
    });

    it('should handle noon correctly in 24h format', () => {
      service.setTimeFormat('24h');
      const result = service.formatTime('2025-01-02T12:00:00');
      expect(result).toBe('12:00');
    });
  });
});
