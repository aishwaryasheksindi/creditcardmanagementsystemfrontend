import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Card, CardBlockRequest, CardActivationOtpResponse, CardActivationRequest } from '../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  public getAllCards(): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.baseUrl}/cards`);
  }

  public getCardsByCustomer(customerId: string): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.baseUrl}/cards/customer/${customerId}`);
  }

  public getCardById(cardId: string): Observable<Card> {
    return this.http.get<Card>(`${this.baseUrl}/cards/${cardId}`);
  }

  public requestActivationOtp(cardId: string): Observable<CardActivationOtpResponse> {
    return this.http.post<CardActivationOtpResponse>(`${this.baseUrl}/cards/${cardId}/request-activation-otp`, {});
  }

  public activateCard(cardId: string, otp: string): Observable<Card> {
    const request: CardActivationRequest = { otp };
    return this.http.post<Card>(`${this.baseUrl}/cards/${cardId}/activate`, request);
  }

  public blockCard(cardId: string, reason: string): Observable<Card> {
    const request: CardBlockRequest = {
      targetStatus: 'BLOCKED',
      reason: reason
    };
    return this.http.post<Card>(`${this.baseUrl}/cards/${cardId}/block`, request);
  }

  public unblockCard(cardId: string, reason: string): Observable<Card> {
    return this.http.post<Card>(`${this.baseUrl}/cards/${cardId}/unblock`, { reason });
  }

  public replaceCard(cardId: string, reason: string): Observable<Card> {
    return this.http.post<Card>(`${this.baseUrl}/cards/${cardId}/replace`, { reason });
  }

  public issueCard(request: import('../models/card.model').CardIssueRequest): Observable<Card> {
    return this.http.post<Card>(`${this.baseUrl}/cards`, request);
  }

  public setPin(cardId: string, pin: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/cards/${cardId}/set-pin`, { pin });
  }

  public verifyPin(cardId: string, pin: string): Observable<{ verified: boolean }> {
    return this.http.post<{ verified: boolean }>(`${this.baseUrl}/cards/${cardId}/verify-pin`, { pin });
  }

  public getCardTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/card-types`);
  }
}