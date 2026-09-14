import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisputesRoutingModule } from './disputes-routing.module';
import { DisputesComponent } from './disputes.component';
import { SharedModule } from '../../shared/shared.module';

import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [DisputesComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DisputesRoutingModule,
    SharedModule
  ]
})
export class DisputesModule { }
