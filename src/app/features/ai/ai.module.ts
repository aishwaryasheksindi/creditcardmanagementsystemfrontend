import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiRoutingModule } from './ai-routing.module';
import { AiComponent } from './ai.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [AiComponent],
  imports: [
    CommonModule,
    AiRoutingModule,
    SharedModule
  ]
})
export class AiModule { }
