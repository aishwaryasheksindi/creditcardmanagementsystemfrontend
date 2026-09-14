import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Dispute,
  DisputeRequest,
  DisputeClassificationRequest,
  DisputeClassificationResponse
} from '../models/dispute.model';

@Injectable({
  providedIn: 'root'
})
export class DisputeService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  public getDisputesByCustomer(customerId: string): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(`${this.baseUrl}/disputes?customerId=${customerId}`);
  }

  public getDisputeById(disputeId: string): Observable<Dispute> {
    return this.http.get<Dispute>(`${this.baseUrl}/disputes/${disputeId}`);
  }

  public raiseDispute(request: DisputeRequest): Observable<Dispute> {
    return this.http.post<Dispute>(`${this.baseUrl}/disputes`, request);
  }

  public getAllDisputes(): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(`${this.baseUrl}/disputes`);
  }

  public updateDispute(disputeId: string, updateDto: { status?: string; resolutionNotes?: string; resolvedByStaffId?: string }): Observable<Dispute> {
    return this.http.put<Dispute>(`${this.baseUrl}/disputes/${disputeId}`, updateDto);
  }

  public classifyDispute(request: DisputeClassificationRequest): Observable<DisputeClassificationResponse> {
    return this.http.post<DisputeClassificationResponse>(`${this.baseUrl}/ai/dispute-classification`, { description: request.description });
  }
}
