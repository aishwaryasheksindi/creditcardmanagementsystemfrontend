import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-container',
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.scss'],
  standalone: false
})
export class CardContainerComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() borderAccent: boolean = false;
}
