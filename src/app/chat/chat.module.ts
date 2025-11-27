import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatRoutingModule } from './chat-routing.module';
import { MainChatComponent } from './components/main-chat/main-chat.component';
import { TranslocoModule } from '@jsverse/transloco';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ChatRoutingModule,
    TranslocoModule
  ]
})
export class ChatModule { }