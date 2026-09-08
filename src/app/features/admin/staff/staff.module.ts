import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { StaffRoutingModule } from './staff-routing.module';
import { StaffListComponent } from './staff-list/staff-list.component';
import { StaffCreateComponent } from './staff-create/staff-create.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [
    StaffListComponent,
    StaffCreateComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    StaffRoutingModule
  ]
})
export class StaffModule {}
