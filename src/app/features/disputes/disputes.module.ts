import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisputesRoutingModule } from './disputes-routing.module';
import { DisputesComponent } from './disputes.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [DisputesComponent],
  imports: [
    CommonModule,
    DisputesRoutingModule,
    SharedModule
  ]
})
export class DisputesModule { }
