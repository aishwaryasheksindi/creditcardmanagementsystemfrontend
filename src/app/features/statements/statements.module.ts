import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatementsRoutingModule } from './statements-routing.module';
import { StatementsComponent } from './statements.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [StatementsComponent],
  imports: [
    CommonModule,
    StatementsRoutingModule,
    SharedModule
  ]
})
export class StatementsModule { }
