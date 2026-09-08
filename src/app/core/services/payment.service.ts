import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, PaymentRequest } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly baseUrl = `${environment.apiBaseUrl}/payments`;

  constructor(private http: HttpClient) {}

  public addPayment(request: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.baseUrl, request);
  }

  public getPaymentById(paymentId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${paymentId}`);
  }

  public getAllPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.baseUrl);
  }

  public getPaymentsByCustomerId(customerId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  public getPaymentsByCardId(cardId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/card/${cardId}`);
  }
}
