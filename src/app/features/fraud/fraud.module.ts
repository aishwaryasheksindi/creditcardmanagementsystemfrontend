import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FraudRoutingModule } from './fraud-routing.module';
import { FraudComponent } from './fraud.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [FraudComponent],
  imports: [
    CommonModule,
    FraudRoutingModule,
    SharedModule
  ]
})
export class FraudModule { }
