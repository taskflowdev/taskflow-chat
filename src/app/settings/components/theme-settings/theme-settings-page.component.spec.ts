import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ThemeSettingsPageComponent } from './theme-settings-page.component';
import { ThemeModeSelectorsComponent } from './theme-mode-selector.component';
import { ThemePanelComponent } from './theme-panel.component';
import { ThemePreviewComponent } from './theme-preview.component';

describe('ThemeSettingsPageComponent', () => {
  let component: ThemeSettingsPageComponent;
  let fixture: ComponentFixture<ThemeSettingsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ 
        ThemeSettingsPageComponent,
        ThemeModeSelectorsComponent,
        ThemePanelComponent,
        ThemePreviewComponent
      ],
      imports: [HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThemeSettingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});