import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { MainLayoutComponent } from './shared/components/layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'chats',
        loadChildren: () => import('./chat/chat.module').then(m => m.ChatModule)
      },
      // Future protected routes can be added here
      // { path: 'dashboard', component: DashboardComponent },
      // { path: 'settings', component: SettingsComponent },
    ]
  },
  { path: '**', redirectTo: '/auth/login' }
];
