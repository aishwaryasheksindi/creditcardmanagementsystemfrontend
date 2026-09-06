import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Placeholder user state structure ready for Spring Boot JWT integration
  private currentUserSubject = new BehaviorSubject<UserProfile | null>({
    username: 'alex.morgan',
    fullName: 'Alex Morgan',
    email: 'alex.morgan@cardnest.bank',
    role: 'Risk Analyst'
  });

  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  public get currentUserValue(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    // Structural placeholder - to be connected with real auth in future module
    return true;
  }

  public logout(): void {
    // Placeholder for future session invalidation
    this.currentUserSubject.next(null);
  }
}
