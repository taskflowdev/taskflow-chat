import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactionPickerComponent } from './reaction-picker.component';
import { ThemeService } from '../../../core/services/theme.service';
import { of } from 'rxjs';

describe('ReactionPickerComponent', () => {
  let component: ReactionPickerComponent;
  let fixture: ComponentFixture<ReactionPickerComponent>;
  let themeService: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', [], {
      currentTheme$: of('light')
    });

    await TestBed.configureTestingModule({
      imports: [ReactionPickerComponent],
      providers: [
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();

    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    fixture = TestBed.createComponent(ReactionPickerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with light theme', () => {
    component.ngOnInit();
    expect(component.isDarkMode).toBe(false);
  });

  it('should detect dark mode from theme service', () => {
    Object.defineProperty(themeService, 'currentTheme$', {
      value: of('dark')
    });
    
    const newFixture = TestBed.createComponent(ReactionPickerComponent);
    const newComponent = newFixture.componentInstance;
    newComponent.ngOnInit();
    
    expect(newComponent.isDarkMode).toBe(true);
  });

  it('should emit emojiSelected when emoji is selected', () => {
    spyOn(component.emojiSelected, 'emit');
    
    const mockEvent = {
      emoji: {
        id: 'thumbsup',
        name: 'Thumbs Up',
        native: '👍',
        unified: '1F44D',
      }
    };

    component.onEmojiSelect(mockEvent);
    
    expect(component.emojiSelected.emit).toHaveBeenCalledWith('👍');
  });

  it('should emit closed when overlay is clicked', () => {
    spyOn(component.closed, 'emit');
    
    component.onOverlayClick();
    
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should emit closed when ESC key is pressed', () => {
    spyOn(component.closed, 'emit');
    
    component.onEscapeKey();
    
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should adjust picker size for mobile screens', () => {
    spyOn(window, 'innerWidth').and.returnValue(400);
    
    component.onResize();
    
    expect(component.perLine).toBe(6);
    expect(component.emojiSize).toBe(20);
  });

  it('should adjust picker size for tablet screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 700
    });
    
    component.onResize();
    
    expect(component.perLine).toBe(7);
    expect(component.emojiSize).toBe(22);
  });

  it('should use default picker size for desktop screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    
    component.onResize();
    
    expect(component.perLine).toBe(8);
    expect(component.emojiSize).toBe(24);
  });

  it('should cleanup on destroy', () => {
    component.ngOnInit();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should handle position prop correctly', () => {
    component.position = { top: '100px', left: '50px' };
    fixture.detectChanges();
    
    const container = fixture.nativeElement.querySelector('.reaction-picker-container');
    expect(container).toBeTruthy();
  });

  it('should not emit emojiSelected for invalid event', () => {
    spyOn(component.emojiSelected, 'emit');
    
    component.onEmojiSelect({} as any);
    
    expect(component.emojiSelected.emit).not.toHaveBeenCalled();
  });
});
