import { TestBed } from '@angular/core/testing';
import { RichEditorFormattingService } from './rich-editor-formatting.service';

describe('RichEditorFormattingService', () => {
  let service: RichEditorFormattingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RichEditorFormattingService]
    });
    service = TestBed.inject(RichEditorFormattingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sanitizeHTML', () => {
    it('should remove empty tags', () => {
      const html = '<p>Text</p><span></span><p>More text</p>';
      const sanitized = service.sanitizeHTML(html);
      expect(sanitized).not.toContain('<span></span>');
    });

    it('should clean unnecessary spans', () => {
      const html = '<span>Text</span>';
      const sanitized = service.sanitizeHTML(html);
      expect(sanitized).toBe('Text');
    });

    it('should remove inline styles', () => {
      const html = '<p style="color: red;">Text</p>';
      const sanitized = service.sanitizeHTML(html);
      expect(sanitized).not.toContain('style=');
    });

    it('should preserve valid formatting tags', () => {
      const html = '<strong>Bold</strong> and <em>italic</em>';
      const sanitized = service.sanitizeHTML(html);
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<em>');
    });

    it('should normalize whitespace', () => {
      const html = '<p>Text  with   multiple    spaces</p>';
      const sanitized = service.sanitizeHTML(html);
      expect(sanitized).toContain('Text with multiple spaces');
    });
  });

  describe('htmlToPlainText', () => {
    it('should convert HTML to plain text', () => {
      const html = '<strong>Bold</strong> text with <em>italic</em>';
      const plainText = service.htmlToPlainText(html);
      expect(plainText).toBe('Bold text with italic');
    });

    it('should handle nested tags', () => {
      const html = '<div><p><strong>Nested</strong> content</p></div>';
      const plainText = service.htmlToPlainText(html);
      expect(plainText).toBe('Nested content');
    });
  });
});
