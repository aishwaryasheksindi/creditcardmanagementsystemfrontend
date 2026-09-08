import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Customer } from '../models/customer.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly baseUrl = environment.apiBaseUrl;
  private currentCustomerSubject = new BehaviorSubject<Customer | null>(null);
  public currentCustomer$ = this.currentCustomerSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Automatically invalidate cached customer data on logout or user switch
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.clearCachedCustomer();
      }
    });
  }

  public get currentCustomer(): Customer | null {
    return this.currentCustomerSubject.value;
  }

  public getMyProfile(forceRefresh: boolean = false): Observable<Customer> {
    if (!forceRefresh && this.currentCustomerSubject.value) {
      return of(this.currentCustomerSubject.value);
    }
    return this.http.get<Customer>(`${this.baseUrl}/customers/me`).pipe(
      tap((customer) => {
        this.currentCustomerSubject.next(customer);
      }),
      shareReplay(1)
    );
  }

  public clearCachedCustomer(): void {
    this.currentCustomerSubject.next(null);
  }
}