import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeCardComponent } from './theme-card.component';
import { ThemePreviewComponent } from '../theme-preview/theme-preview.component';
import { ThemeDto } from '../../../api/models';

describe('ThemeCardComponent', () => {
  let component: ThemeCardComponent;
  let fixture: ComponentFixture<ThemeCardComponent>;

  const mockTheme: ThemeDto = {
    id: '1',
    name: 'Test Theme',
    isDarkTheme: false,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    isBuiltIn: true,
    highlightColor: '#22c55e',
    borderColor: '#e2e8f0'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeCardComponent, ThemePreviewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display theme name', () => {
    component.theme = mockTheme;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.theme-name')?.textContent).toContain('Test Theme');
  });

  it('should show built-in badge for built-in themes', () => {
    component.theme = mockTheme;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.built-in-badge')).toBeTruthy();
  });

  it('should emit themeClick event on click', () => {
    spyOn(component.themeClick, 'emit');
    component.theme = mockTheme;
    fixture.detectChanges();

    component.onClick();
    expect(component.themeClick.emit).toHaveBeenCalled();
  });

  it('should handle keyboard navigation', () => {
    spyOn(component.themeClick, 'emit');
    component.theme = mockTheme;

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(enterEvent, 'preventDefault');
    
    component.onKeyPress(enterEvent);
    
    expect(enterEvent.preventDefault).toHaveBeenCalled();
    expect(component.themeClick.emit).toHaveBeenCalled();
  });

  it('should apply correct CSS classes', () => {
    component.theme = mockTheme;
    component.selected = true;

    const classes = component.cardClasses;
    expect(classes).toContain('theme-card');
    expect(classes).toContain('theme-card--selected');
  });

  it('should apply dark theme class for dark themes', () => {
    component.theme = { ...mockTheme, isDarkTheme: true };

    const classes = component.cardClasses;
    expect(classes).toContain('theme-card--dark');
  });
});