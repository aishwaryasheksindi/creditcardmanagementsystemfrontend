import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Customer } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly baseUrl = environment.apiBaseUrl;
  private currentCustomerSubject = new BehaviorSubject<Customer | null>(null);
  public currentCustomer$ = this.currentCustomerSubject.asObservable();

  constructor(private http: HttpClient) {}

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