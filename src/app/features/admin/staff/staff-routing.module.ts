import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StaffListComponent } from './staff-list/staff-list.component';
import { StaffCreateComponent } from './staff-create/staff-create.component';

const routes: Routes = [
  { path: '', component: StaffListComponent },
  { path: 'create', component: StaffCreateComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffRoutingModule {}
