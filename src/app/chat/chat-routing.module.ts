import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainChatComponent } from './components/main-chat/main-chat.component';

const routes: Routes = [
  // Single route with optional groupId parameter to prevent component recreation
  { path: '', component: MainChatComponent },
  { path: 'group/:groupId', component: MainChatComponent, 
    // Reuse component instance when only parameters change
    runGuardsAndResolvers: 'paramsOrQueryParamsChange' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatRoutingModule { }