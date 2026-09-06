import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DisputesComponent } from './disputes.component';

const routes: Routes = [
  { path: '', component: DisputesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DisputesRoutingModule { }
