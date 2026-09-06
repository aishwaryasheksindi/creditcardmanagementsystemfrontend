import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardsRoutingModule } from './cards-routing.module';
import { CardsComponent } from './cards.component';
import { CardDetailsComponent } from './card-details/card-details.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    CardsComponent,
    CardDetailsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardsRoutingModule,
    SharedModule
  ]
})
export class CardsModule { }