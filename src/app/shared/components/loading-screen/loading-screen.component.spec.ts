import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingScreenComponent } from './loading-screen.component';

describe('LoadingScreenComponent', () => {
  let component: LoadingScreenComponent;
  let fixture: ComponentFixture<LoadingScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingScreenComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render full-screen loading splash with correct styles', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const loadingScreen = compiled.querySelector('.loading-screen');
    
    expect(loadingScreen).toBeTruthy();
    expect(loadingScreen?.getAttribute('role')).toBe('status');
    expect(loadingScreen?.getAttribute('aria-live')).toBe('polite');
  });

  it('should display app logo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector('.app-logo');
    
    expect(logo).toBeTruthy();
  });

  it('should display spinner', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('.spinner');
    
    expect(spinner).toBeTruthy();
  });

  it('should have visually hidden accessibility text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const accessibilityText = compiled.querySelector('.visually-hidden');
    
    expect(accessibilityText).toBeTruthy();
    expect(accessibilityText?.textContent).toContain('Loading');
  });
});
