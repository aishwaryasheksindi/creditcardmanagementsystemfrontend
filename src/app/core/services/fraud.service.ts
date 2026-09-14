import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FraudAlert, RiskScore } from '../models/fraud.model';

@Injectable({
  providedIn: 'root'
})
export class FraudService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  public getAllFraudAlerts(status?: string): Observable<FraudAlert[]> {
    const url = status ? `${this.baseUrl}/fraud-alerts?status=${status}` : `${this.baseUrl}/fraud-alerts`;
    return this.http.get<FraudAlert[]>(url);
  }

  public getFraudAlertById(id: string): Observable<FraudAlert> {
    return this.http.get<FraudAlert>(`${this.baseUrl}/fraud-alerts/${id}`);
  }

  public updateFraudAlert(id: string, data: any): Observable<FraudAlert> {
    return this.http.put<FraudAlert>(`${this.baseUrl}/fraud-alerts/${id}`, data);
  }

  public getAllRiskScores(riskLevel?: string): Observable<RiskScore[]> {
    const url = riskLevel ? `${this.baseUrl}/risk-scores?riskLevel=${riskLevel}` : `${this.baseUrl}/risk-scores`;
    return this.http.get<RiskScore[]>(url);
  }

  public getRiskScoreById(id: string): Observable<RiskScore> {
    return this.http.get<RiskScore>(`${this.baseUrl}/risk-scores/${id}`);
  }
}
