import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { GuestGuard } from './auth/guards/guest.guard';
import { MainLayoutComponent } from './shared/components/layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/signin', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [GuestGuard],
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
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings-routing.module').then(m => m.settingsRoutes)
      },
      // Future protected routes can be added here
      // { path: 'dashboard', component: DashboardComponent },
    ]
  },
  { path: '**', redirectTo: '/auth/signin' }
];
