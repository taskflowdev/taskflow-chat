import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe, RtlDirective } from '../core/i18n';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // i18n standalone components
    TranslatePipe,
    RtlDirective
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // i18n exports
    TranslatePipe,
    RtlDirective
  ]
})
export class SharedModule { }