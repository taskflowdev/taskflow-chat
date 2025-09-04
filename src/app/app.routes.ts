import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { MainChatComponent } from './chat/components/main-chat/main-chat.component';
import { LoginComponent } from './auth/components/login/login.component';
import { SignupComponent } from './auth/components/signup/signup.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', redirectTo: '/login' }, // Placeholder
  { 
    path: 'chat', 
    component: MainChatComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/login' }
];
