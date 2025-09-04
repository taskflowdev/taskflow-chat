import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainChatComponent } from './components/main-chat/main-chat.component';

const routes: Routes = [
  { path: '', component: MainChatComponent },
  // Future chat routes can be added here
  // { path: 'room/:id', component: ChatRoomComponent },
  // { path: 'settings', component: ChatSettingsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatRoutingModule { }