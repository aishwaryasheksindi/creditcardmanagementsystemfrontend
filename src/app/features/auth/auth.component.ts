import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: false
})
export class AuthComponent {
  constructor(private router: Router) {}

  onEnterApp(): void {
    this.router.navigate(['/app/dashboard']);
  }
}
