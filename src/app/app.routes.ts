import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { ThemeGuard } from './shared/guards/theme.guard';
import { MainLayoutComponent } from './shared/components/layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    canActivate: [ThemeGuard]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard, ThemeGuard],
    children: [
      {
        path: 'chats',
        loadChildren: () => import('./chat/chat.module').then(m => m.ChatModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule)
      },
      // Future protected routes can be added here
      // { path: 'dashboard', component: DashboardComponent },
    ]
  },
  { path: '**', redirectTo: '/auth/login' }
];
