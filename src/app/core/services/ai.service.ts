import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnomalyDetectionResponse, AiFraudRiskResponse, ChatResponse } from '../models/ai.model';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  public getAnomalies(customerId: string): Observable<AnomalyDetectionResponse> {
    return this.http.get<AnomalyDetectionResponse>(`${this.baseUrl}/ai/anomaly-detection/${customerId}`);
  }

  public getFraudRisk(transactionId: string): Observable<AiFraudRiskResponse> {
    return this.http.get<AiFraudRiskResponse>(`${this.baseUrl}/ai/fraud-risk/${transactionId}`);
  }

  public getSpendingAnalysis(customerId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ai/spending-analysis/${customerId}`);
  }

  public chat(message: string, sessionId?: string, customerId?: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/ai/chat`, {
      message,
      sessionId: sessionId || 'session-' + Date.now(),
      customerId: customerId || 'CUST2176'
    });
  }
}
