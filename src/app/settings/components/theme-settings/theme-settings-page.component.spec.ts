import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';

import { ThemeSettingsPageComponent } from './theme-settings-page.component';

describe('ThemeSettingsPageComponent', () => {
  let component: ThemeSettingsPageComponent;
  let fixture: ComponentFixture<ThemeSettingsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ThemeSettingsPageComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThemeSettingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter light themes correctly', () => {
    component.themeService.availableThemes.set([
      {
        id: '1',
        name: 'Light',
        mode: 'light',
        isBuiltIn: true,
        tokens: {},
        variants: []
      },
      {
        id: '2',
        name: 'Dark',
        mode: 'dark',
        isBuiltIn: true,
        tokens: {},
        variants: []
      }
    ]);

    const lightThemes = component.lightThemes;
    expect(lightThemes.length).toBe(1);
    expect(lightThemes[0].mode).toBe('light');
  });

  it('should filter dark themes correctly', () => {
    component.themeService.availableThemes.set([
      {
        id: '1',
        name: 'Light',
        mode: 'light',
        isBuiltIn: true,
        tokens: {},
        variants: []
      },
      {
        id: '2',
        name: 'Dark',
        mode: 'dark',
        isBuiltIn: true,
        tokens: {},
        variants: []
      }
    ]);

    const darkThemes = component.darkThemes;
    expect(darkThemes.length).toBe(1);
    expect(darkThemes[0].mode).toBe('dark');
  });
});