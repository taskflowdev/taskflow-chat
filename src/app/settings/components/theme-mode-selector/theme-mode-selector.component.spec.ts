import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ThemeModeSelector } from './theme-mode-selector.component';
import { ThemeMode } from '../../services/theme.service';

describe('ThemeModeSelector', () => {
  let component: ThemeModeSelector;
  let fixture: ComponentFixture<ThemeModeSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeModeSelector, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeModeSelector);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit sync toggle event', () => {
    spyOn(component.syncToggle, 'emit');
    
    const mockEvent = {
      target: { checked: true }
    } as any;

    component.onSyncToggle(mockEvent);
    expect(component.syncToggle.emit).toHaveBeenCalledWith(true);
  });

  it('should display correct mode for system sync', () => {
    const mockMode: ThemeMode = {
      mode: 'system',
      isDarkTheme: true,
      effectiveTheme: null
    };
    
    component.currentMode = mockMode;
    expect(component.currentModeDisplay).toBe('System (Dark)');
  });

  it('should display correct mode for light theme', () => {
    const mockMode: ThemeMode = {
      mode: 'light',
      isDarkTheme: false,
      effectiveTheme: null
    };
    
    component.currentMode = mockMode;
    expect(component.currentModeDisplay).toBe('Light');
  });

  it('should return correct icon for dark mode', () => {
    const mockMode: ThemeMode = {
      mode: 'system',
      isDarkTheme: true,
      effectiveTheme: null
    };
    
    component.currentMode = mockMode;
    expect(component.currentModeIcon).toBe('bi-moon');
  });

  it('should return correct icon for light mode', () => {
    const mockMode: ThemeMode = {
      mode: 'system',
      isDarkTheme: false,
      effectiveTheme: null
    };
    
    component.currentMode = mockMode;
    expect(component.currentModeIcon).toBe('bi-sun');
  });
});