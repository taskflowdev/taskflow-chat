import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ChatSkeletonComponent } from './components/chat-skeleton/chat-skeleton.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SkeletonLoaderComponent,
    LoadingSpinnerComponent,
    ChatSkeletonComponent
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SkeletonLoaderComponent,
    LoadingSpinnerComponent,
    ChatSkeletonComponent
  ]
})
export class SharedModule { }