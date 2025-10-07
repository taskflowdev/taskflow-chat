import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainChatComponent } from './components/main-chat/main-chat.component';

const routes: Routes = [
  { path: '', component: MainChatComponent },
  { path: 'group/:groupId', component: MainChatComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatRoutingModule { }