import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmiComponent } from './emi.component';

const routes: Routes = [
  { path: '', component: EmiComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmiRoutingModule { }
