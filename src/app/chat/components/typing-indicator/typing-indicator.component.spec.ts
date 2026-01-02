import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TypingIndicatorComponent } from './typing-indicator.component';

describe('TypingIndicatorComponent', () => {
  let component: TypingIndicatorComponent;
  let fixture: ComponentFixture<TypingIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypingIndicatorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TypingIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be visible when no users are typing', () => {
    component.typingUsers = [];
    expect(component.isVisible).toBe(false);
    expect(component.typingText).toBe('');
  });

  it('should display single user typing', () => {
    component.typingUsers = ['John'];
    expect(component.isVisible).toBe(true);
    expect(component.typingText).toBe('John is typing...');
  });

  it('should display two users typing', () => {
    component.typingUsers = ['John', 'Jane'];
    expect(component.isVisible).toBe(true);
    expect(component.typingText).toBe('John and Jane are typing...');
  });

  it('should display multiple users typing', () => {
    component.typingUsers = ['John', 'Jane', 'Bob'];
    expect(component.isVisible).toBe(true);
    expect(component.typingText).toBe('John and 2 others are typing...');
  });
});
