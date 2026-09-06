import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RewardsRoutingModule } from './rewards-routing.module';
import { RewardsComponent } from './rewards.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [RewardsComponent],
  imports: [
    CommonModule,
    RewardsRoutingModule,
    SharedModule
  ]
})
export class RewardsModule { }
