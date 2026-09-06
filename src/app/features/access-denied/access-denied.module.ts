import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AccessDeniedComponent } from './access-denied.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: AccessDeniedComponent }
];

@NgModule({
  declarations: [AccessDeniedComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class AccessDeniedModule { }
