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
    fixture.detectChanges();
    expect(component.typingText).toBe('');
    const element = fixture.nativeElement.querySelector('.typing-indicator');
    expect(element).toBeFalsy();
  });

  it('should display single user typing', () => {
    component.typingUsers = ['John'];
    fixture.detectChanges();
    expect(component.typingText).toBe('John is typing...');
  });

  it('should display two users typing', () => {
    component.typingUsers = ['John', 'Jane'];
    fixture.detectChanges();
    expect(component.typingText).toBe('John and Jane are typing...');
  });

  it('should display multiple users typing', () => {
    component.typingUsers = ['John', 'Jane', 'Bob'];
    fixture.detectChanges();
    expect(component.typingText).toBe('John and 2 others are typing...');
  });
});
