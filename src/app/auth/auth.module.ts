import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing.module';
import { SigninComponent } from './components/signin/signin.component';
import { SignupComponent } from './components/signup/signup.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    SigninComponent,
    SignupComponent,
    ForgotPasswordComponent
  ]
})
export class AuthModule { }