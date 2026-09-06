import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
  standalone: false
})
export class AccessDeniedComponent {
  constructor(private router: Router) {}

  onReturn(): void {
    this.router.navigate(['/app/dashboard']);
  }
}
