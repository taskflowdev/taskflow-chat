import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { SettingsSidebarComponent } from '../settings-sidebar/settings-sidebar.component';

@Component({
  selector: 'app-settings-layout',
  imports: [RouterOutlet, SettingsSidebarComponent],
  templateUrl: './settings-layout.component.html',
  styleUrls: ['./settings-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsLayoutComponent implements OnInit {

  constructor(private userSettingsService: UserSettingsService) { }

  ngOnInit(): void {
    // Load catalog and user settings on initialization
    this.userSettingsService.loadCatalog().subscribe();
    this.userSettingsService.loadUserSettings().subscribe();
  }
}
