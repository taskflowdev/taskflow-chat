import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RichEditorComponent } from './rich-editor.component';
import { RichEditorFormattingService } from './rich-editor-formatting.service';

describe('RichEditorComponent', () => {
  let component: RichEditorComponent;
  let fixture: ComponentFixture<RichEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichEditorComponent],
      providers: [RichEditorFormattingService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RichEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a contenteditable div', () => {
    const compiled = fixture.nativeElement;
    const editableDiv = compiled.querySelector('[contenteditable="true"]');
    expect(editableDiv).toBeTruthy();
  });

  it('should show placeholder when empty', () => {
    const compiled = fixture.nativeElement;
    const editableDiv = compiled.querySelector('.editor-content');
    expect(editableDiv.classList.contains('empty')).toBeTruthy();
  });

  it('should emit enterPressed event when Enter is pressed', (done) => {
    component.enterPressed.subscribe(() => {
      done();
    });

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onKeyDown(event);
  });

  it('should clear content when clear() is called', () => {
    component.writeValue('<p>Test content</p>');
    fixture.detectChanges();
    
    component.clear();
    fixture.detectChanges();
    
    expect(component.getText()).toBe('');
  });

  it('should sanitize HTML on writeValue', () => {
    const maliciousHTML = '<script>alert("XSS")</script><p>Safe content</p>';
    component.writeValue(maliciousHTML);
    fixture.detectChanges();
    
    const html = component.getHTML();
    expect(html).not.toContain('<script>');
  });

  it('should return plain text when getText() is called', () => {
    component.writeValue('<strong>Bold</strong> text');
    fixture.detectChanges();
    
    const text = component.getText();
    expect(text).toBe('Bold text');
  });
});
