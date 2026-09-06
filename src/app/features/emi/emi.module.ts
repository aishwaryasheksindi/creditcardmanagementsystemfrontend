import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmiRoutingModule } from './emi-routing.module';
import { EmiComponent } from './emi.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [EmiComponent],
  imports: [
    CommonModule,
    EmiRoutingModule,
    SharedModule
  ]
})
export class EmiModule { }
